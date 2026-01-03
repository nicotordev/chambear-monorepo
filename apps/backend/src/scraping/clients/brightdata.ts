import axios, { type AxiosInstance } from "axios";
import { logger } from "../../lib/logger";

/* =======================
 * Types
 * ======================= */

type HttpMethod = "GET" | "POST";
type BrightDataFormat = "raw" | "json";
type BrightDataDataFormat =
  | "html"
  | "markdown"
  | "json"
  | "parsed"
  | "parsed_light"
  | "text";

export type UnlockerSyncRequest = Readonly<{
  url: string;
  zone: string;
  format?: BrightDataFormat;
  method?: HttpMethod;
  country?: string;
  timeout_ms?: number;
  data_format?: BrightDataDataFormat;
  headers?: Readonly<Record<string, string>>;
}>;

export type UnlockerSyncResponse =
  | Readonly<{
      kind: "raw";
      status: number;
      headers: Readonly<Record<string, string | string[]>>;
      body: string;
    }>
  | Readonly<{
      kind: "json";
      status: number;
      headers: Readonly<Record<string, string | string[]>>;
      body: unknown;
    }>;

type BrightDataEnvelope = Readonly<{
  status_code: number;
  headers: Record<string, string | string[]>;
  body: unknown;
}>;

export type SerpResult = Readonly<{
  title: string;
  url: string;
  position: number;
  snippet?: string;
}>;

export interface OganicResult {
  link?: string;
  url?: string;
  title?: string;
  description?: string;
  snippet?: string;
  extensions?: Array<{
    type: "site_link";
    link: string;
    text: string;
  }>;
  global_rank?: number;
}

/* =======================
 * Helpers
 * ======================= */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const safeJsonParse = (v: string): unknown => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const looksLikeEnvelope = (v: unknown): v is BrightDataEnvelope =>
  isRecord(v) && typeof v.status_code === "number" && "body" in v;

const isOrganicResult = (v: unknown): v is OganicResult =>
  isRecord(v) &&
  (typeof v.link === "string" || typeof v.url === "string") &&
  typeof v.title === "string";

const mustEnv = (key: string): string => {
  const v = process.env[key];
  if (!v || v.trim() === "") {
    throw new Error(`Missing env var ${key}`);
  }
  return v;
};

/* =======================
 * Client
 * ======================= */

export class BrightDataClient {
  private readonly http: AxiosInstance;
  private readonly apiKey = mustEnv("BRIGHTDATA_API_KEY");
  private readonly unlockerZone = mustEnv("BRIGHTDATA_ZONE");
  private readonly serpZone = mustEnv("BRIGHTDATA_SERP_ZONE");

  constructor() {
    this.http = axios.create({
      baseURL: "https://api.brightdata.com",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "text",
      transformResponse: (r) => r,
      validateStatus: () => true,
    });
  }

  private parseEnvelope(raw: unknown): BrightDataEnvelope | null {
    const parsed = typeof raw === "string" ? safeJsonParse(raw) ?? raw : raw;
    return looksLikeEnvelope(parsed) ? parsed : null;
  }

  private parseResponseBody(raw: unknown): unknown {
    const envelope = this.parseEnvelope(raw);
    if (envelope) {
      const body = envelope.body;
      if (typeof body === "string") {
        return safeJsonParse(body) ?? body;
      }
      return body;
    }

    return typeof raw === "string" ? safeJsonParse(raw) ?? raw : raw;
  }

  public async scrapeRequestAsMarkdown(url: string): Promise<string> {
    const res = await this.http.post("/request", {
      zone: this.unlockerZone,
      url,
      format: "raw",
      data_format: "markdown",
    });

    const envelope = this.parseEnvelope(res.data);
    if (envelope && envelope.status_code >= 400) {
      logger.warn(
        { url, status: envelope.status_code, body: envelope.body },
        "[BrightData] Unlocker request failed"
      );
      throw new Error(
        `BrightData unlocker request failed with status ${envelope.status_code}`
      );
    }

    const body = this.parseResponseBody(res.data);
    if (typeof body === "string") return body;

    logger.warn(
      { url, bodyType: typeof body },
      "[BrightData] Expected markdown body but received non-string"
    );
    return JSON.stringify(body ?? "");
  }

  private async serpRequest(query: string): Promise<Array<OganicResult>> {
    const res = await this.http.post("/request", {
      zone: this.serpZone,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      format: "json",
      data_format: "parsed_light",
    });

    const envelope = this.parseEnvelope(res.data);
    if (envelope && envelope.status_code >= 400) {
      logger.warn(
        { query, status: envelope.status_code, body: envelope.body },
        "[BrightData] SERP request failed"
      );
      throw new Error(
        `BrightData SERP request failed with status ${envelope.status_code}`
      );
    }

    const body = this.parseResponseBody(res.data);
    const organic = this.extractOrganicResults(body);

    return organic;
  }

  private extractOrganicResults(body: unknown): Array<OganicResult> {
    if (!body) return [];

    if (Array.isArray(body)) {
      if (body.every(isOrganicResult)) return body;
      return body.flatMap((item) => this.extractOrganicResults(item));
    }

    if (!isRecord(body)) return [];

    if (Array.isArray(body.organic)) {
      return body.organic as Array<OganicResult>;
    }

    if (Array.isArray(body.organic_results)) {
      return body.organic_results as Array<OganicResult>;
    }

    if (isRecord(body.data)) {
      if (Array.isArray(body.data.organic)) {
        return body.data.organic as Array<OganicResult>;
      }

      if (Array.isArray(body.data.organic_results)) {
        return body.data.organic_results as Array<OganicResult>;
      }
    }

    return [];
  }

  /* =======================
   * SERP → URLs
   * ======================= */

  public async searchGoogle(query: string): Promise<readonly OganicResult[]> {
    const organic = await this.serpRequest(query);

    if (organic.length === 0) {
      logger.info(
        {
          query,
          hasResults: organic.length > 0,
          resultCount: organic.length,
        },
        "[BrightData] No organic results found in SERP response"
      );
    }

    const normalized: OganicResult[] = [];

    for (const item of organic) {
      const link =
        typeof item.link === "string"
          ? item.link
          : typeof item.url === "string"
          ? item.url
          : "";

      if (!link) continue;

      normalized.push({
        ...item,
        link,
        description: item.description ?? item.snippet,
      });
    }

    return normalized;
  }

  /* =======================
   * Full pipeline
   * ======================= */

  public async searchThenScrape(
    query: string,
    maxUrls = 10,
    concurrency = 4
  ): Promise<
    Readonly<{
      query: string;
      urls: readonly string[];
      pages: readonly { url: string; markdown: string }[];
    }>
  > {
    const serp = await this.searchGoogle(query);
    const urls = serp
      .filter((u): u is OganicResult & { link: string } => Boolean(u.link))
      .slice(0, maxUrls);

    const pages: { url: string; markdown: string }[] = [];
    let i = 0;

    const workers = new Array(Math.min(concurrency, urls.length))
      .fill(0)
      .map(async () => {
        while (true) {
          const idx = i++;
          if (idx >= urls.length) return;

          const url = urls[idx];
          const markdown = await this.scrapeRequestAsMarkdown(url.link);
          pages.push({ url: url.link, markdown });
        }
      });

    await Promise.all(workers);

    return { query, urls: urls.map((u) => u.link), pages };
  }
}
