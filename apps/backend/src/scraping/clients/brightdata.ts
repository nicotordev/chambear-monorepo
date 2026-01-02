import axios, { type AxiosInstance } from "axios";

/* =======================
 * Types
 * ======================= */

type HttpMethod = "GET" | "POST";
type BrightDataFormat = "raw" | "json";
type BrightDataDataFormat = "html" | "markdown" | "json";

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

const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
};

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

  /* =======================
   * Low-level request
   * ======================= */

  private async request(
    req: UnlockerSyncRequest
  ): Promise<UnlockerSyncResponse> {
    const payload: Record<string, unknown> = {
      zone: req.zone,
      url: req.url,
      method: req.method ?? "GET",
      format: req.format ?? "raw",
    };

    if (req.country) payload.country = req.country;
    if (req.timeout_ms) payload.timeout = req.timeout_ms;
    if (req.data_format) payload.data_format = req.data_format;
    if (req.headers) payload.headers = req.headers;

    const res = await this.http.post("/request", payload, {
      timeout: req.timeout_ms ?? 60_000,
    });

    const raw = String(res.data ?? "");
    const parsed = safeJsonParse(raw);

    if (
      isRecord(parsed) &&
      typeof parsed.status_code === "number" &&
      "body" in parsed
    ) {
      const env = parsed as BrightDataEnvelope;

      if ((req.format ?? "raw") === "json") {
        return {
          kind: "json",
          status: env.status_code,
          headers: env.headers,
          body:
            typeof env.body === "string"
              ? safeJsonParse(env.body) ?? env.body
              : env.body,
        };
      }

      return {
        kind: "raw",
        status: env.status_code,
        headers: env.headers,
        body:
          typeof env.body === "string" ? env.body : JSON.stringify(env.body),
      };
    }

    if ((req.format ?? "raw") === "json") {
      return {
        kind: "json",
        status: res.status,
        headers: res.headers as Record<string, string>,
        body: parsed ?? raw,
      };
    }

    return {
      kind: "raw",
      status: res.status,
      headers: res.headers as Record<string, string>,
      body: raw,
    };
  }

  /* =======================
   * SERP → URLs
   * ======================= */

  public async searchGoogle(query: string): Promise<readonly SerpResult[]> {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const res = await this.request({
      url,
      zone: this.serpZone,
      format: "json",
      data_format: "json",
    });

    const data = res.kind === "json" ? res.body : null;
    if (!isRecord(data)) return [];

    const organic =
      (Array.isArray(data.organic) && data.organic) ||
      (isRecord(data.results) &&
        Array.isArray(data.results.organic) &&
        data.results.organic) ||
      [];

    const results: SerpResult[] = [];

    for (const item of organic) {
      if (!isRecord(item)) continue;

      const url = normalizeUrl(String(item.link ?? ""));
      const title = String(item.title ?? "").trim();
      const pos = Number(item.rank ?? item.position ?? 0);
      const snippet =
        typeof item.snippet === "string" ? item.snippet : undefined;

      if (!url || !title) continue;

      results.push({ url, title, position: pos, snippet });
    }

    return results;
  }

  /* =======================
   * Page → Markdown
   * ======================= */

  public async scrapeMarkdown(url: string): Promise<string> {
    const res = await this.request({
      url,
      zone: this.unlockerZone,
      data_format: "markdown",
    });

    return res.kind === "raw" ? res.body : JSON.stringify(res.body);
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
      .map((r) => r.url)
      .filter(Boolean)
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
          const markdown = await this.scrapeMarkdown(url);
          pages.push({ url, markdown });
        }
      });

    await Promise.all(workers);

    return { query, urls, pages };
  }
}
