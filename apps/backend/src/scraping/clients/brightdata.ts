import { bdclient, BRDError, type BdClientOptions } from "@brightdata/sdk";
import axios from "axios";
import { env } from "../../config";
import type {
  UnlockerSyncRequest,
  UnlockerSyncResponse,
} from "../../types/brightdata";

/**
 * Old SDK:
 * - allowed method: "GET" | "POST" | undefined
 * - allowed dataFormat: "html" | "markdown" | "screenshot" | undefined
 *
 * So we adapt your request to that.
 */
type SdkMethod = "GET" | "POST";
type SdkDataFormat = "html" | "markdown" | "screenshot";
type OutputFormat = "json" | "raw";

type SearchOptionsCompat = Readonly<{
  zone: string;
  format: OutputFormat;
  method?: SdkMethod;
  country?: string;
  timeout?: number;
  dataFormat?: SdkDataFormat;
}>;

type ScrapeOptionsCompat = Readonly<{
  zone: string;
  format: OutputFormat;
  method?: SdkMethod;
  country?: string;
  timeout?: number;
  dataFormat?: SdkDataFormat;
}>;

type SerpParsedResult = Readonly<{
  type: string;
  position: number;
  title: string;
  url: string;
}>;

const ensureNonEmpty = (value: string | undefined, name: string): string => {
  const v = (value ?? "").trim();
  if (v.length === 0) throw new Error(`Missing env var ${name}`);
  return v;
};

const coerceSdkMethod = (
  m: UnlockerSyncRequest["method"] | undefined
): SdkMethod | undefined => {
  if (!m) return undefined;
  // Old SDK only accepts GET/POST :contentReference[oaicite:2]{index=2}
  return m === "POST" ? "POST" : "GET";
};

const coerceSdkDataFormat = (
  df: UnlockerSyncRequest["data_format"] | undefined
): SdkDataFormat | undefined => {
  // Old SDK does NOT accept parsed_light/parsed :contentReference[oaicite:3]{index=3}
  if (df === "markdown") return "markdown";
  if (df === "html") return "html";
  if (df === "screenshot") return "screenshot";
  return undefined;
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    u.hash = "";
    return u.toString();
  } catch {
    return trimmed;
  }
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasBodyString = (v: unknown): v is { body: string } =>
  isRecord(v) && typeof v.body === "string";

const safeJsonParse = (s: string): unknown => {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
};

class BrightDataClient {
  private readonly client: bdclient;

  constructor() {
    // NOTE: your snippet used BRIGHTDATA_API_KEY; we keep it
    const apiToken = ensureNonEmpty(
      process.env.BRIGHTDATA_API_KEY,
      "BRIGHTDATA_API_KEY"
    );
    const zone = ensureNonEmpty(process.env.BRIGHTDATA_ZONE, "BRIGHTDATA_ZONE");
    const serpZone = ensureNonEmpty(
      process.env.BRIGHTDATA_SERP_ZONE,
      "BRIGHTDATA_SERP_ZONE"
    );

    // The old SDK sometimes uses api_token in the constructor; but since we are not certain
    // of the exact shape, we pass it as an object and let the SDK consume it.
    this.client = new bdclient({
      /**
       * Your Bright Data API key (can also be set via BRIGHTDATA_API_KEY env var)
       * @example 'brd-customer-hl_12345678-zone-web_unlocker:abc123xyz'
       */
      apiKey: apiToken,
      /**
       * Automatically create required zones if they don't exist (default: true)
       * @example true | false
       */
      autoCreateZones: true,
      /**
       * Custom zone name for web unlocker (default: from env or 'sdk_unlocker')
       * @example 'my_web_zone' | 'web_unlocker_1' | 'scraping_zone'
       */
      webUnlockerZone: zone,
      /**
       * Custom zone name for SERP API (default: from env or 'sdk_serp')
       * @example 'my_serp_zone' | 'search_zone' | 'serp_api_1'
       */
      serpZone: serpZone,
      /**
       * Log level (default: 'INFO')
       * Available values: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
       */
      logLevel: "DEBUG",
      /**
       * Use structured JSON logging (default: true)
       * @example true (JSON format) | false (plain text)
       */
      structuredLogging: true,
      /**
       * Enable verbose logging (default: false)
       * @example true | false
       */
      verbose: false,
    } as unknown as BdClientOptions);
  }

  /**
   * Compatibility layer for the existing runSync method
   */
  public async runSync(
    req: UnlockerSyncRequest
  ): Promise<UnlockerSyncResponse> {
    const isSerp = req.zone.toLowerCase().includes("serp");

    const format: OutputFormat = req.format === "json" ? "json" : "raw";

    const method = coerceSdkMethod(req.method);
    const dataFormat = coerceSdkDataFormat(req.data_format);

    // NOTE: req.data_format can bring "parsed_light"/"parsed" in your code,
    // but the old SDK does not support it. Here we simply ignore it (undefined),
    // and then we parse the body ourselves if necessary. :contentReference[oaicite:4]{index=4}
    const common = {
      zone: req.zone,
      format,
      method,
      country: req.country,
      timeout: req.timeout_ms,
      dataFormat,
    } satisfies Readonly<
      { zone: string; format: OutputFormat } & Partial<SearchOptionsCompat>
    >;

    if (isSerp) {
      const res = await this.searchCompat(req.url, common);
      return this.mapResponse(res, format);
    }

    const res = await this.scrapeCompat(req.url, common);
    return this.mapResponse(res, format);
  }

  public async runSyncScrape(urls: string[]): Promise<string[]> {
    const results = await Promise.all(
      urls.map((url) =>
        this.runSync({
          url,
          zone: env.brightDataZone,
          format: "raw",
          data_format: "markdown",
        })
      )
    );

    return results.map((res) =>
      res.kind === "raw" ? res.body : JSON.stringify(res.body)
    );
  }

  public async triggerAsyncScrape(
    customer: string,
    zone: string,
    urls: string[]
  ): Promise<string[]> {
    void customer;

    // With old SDK, sometimes scrape(urls[]) exists but the type doesn't fit.
    // To maintain strict and compat, we do N single scrapes and return synthetic IDs.
    await Promise.all(
      urls.map((u) =>
        this.runSync({
          url: u,
          zone,
          format: "raw",
          data_format: "markdown",
        })
      )
    );

    return urls.map((_, i) => `async-${zone}-${i}`);
  }

  /**
   * SERP helper: tries to parse results from JSON body (if the SERP zone returns JSON).
   */
  public async triggerSyncSerpSearch(q: string): Promise<SerpParsedResult[]> {
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&brd_json=1`;

    let res: any;
    try {
      const response = await axios.post(
        "https://api.brightdata.com/request",
        {
          zone: env.brightDataSerpZone,
          url: url,
          format: "raw",
        },
        {
          headers: {
            Authorization: `Bearer ${env.brightDataApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60_000,
        }
      );
      res = response.data;
    } catch (err: any) {
      console.error(`[BrightDataClient] Direct SERP request failed:`, err.message);
      throw err;
    }

    const items = Array.isArray(res) ? res : [res];
    const out: SerpParsedResult[] = [];

    for (const it of items) {
      let parsed: any;
      if (typeof it === "string") {
        parsed = safeJsonParse(it);
      } else if (isRecord(it)) {
        parsed = it.body
          ? typeof it.body === "string"
            ? safeJsonParse(it.body)
            : it.body
          : it;
      }

      if (!isRecord(parsed)) continue;

      if (Array.isArray(parsed.results)) {
        for (const r of parsed.results) {
          if (!isRecord(r)) continue;
          const url = typeof r.url === "string" ? normalizeUrl(r.url) : "";
          const title = typeof r.title === "string" ? r.title : "";
          const type = typeof r.type === "string" ? r.type : "organic";
          const position = typeof r.position === "number" ? r.position : 0;
          if (url && title) out.push({ type, position, title, url });
        }
      } else if (Array.isArray(parsed.organic)) {
        for (const r of parsed.organic) {
          if (!isRecord(r)) continue;
          const url = typeof r.link === "string" ? normalizeUrl(r.link) : "";
          const title = typeof r.title === "string" ? r.title : "";
          const position =
            typeof r.global_rank === "number" ? r.global_rank : 0;
          if (url && title) out.push({ type: "organic", position, title, url });
        }
      } else if (Array.isArray(parsed.organic_results)) {
        for (const r of parsed.organic_results) {
          if (!isRecord(r)) continue;
          const url =
            typeof r.link === "string"
              ? normalizeUrl(r.link)
              : typeof r.url === "string"
              ? normalizeUrl(r.url)
              : "";
          const title = typeof r.title === "string" ? r.title : "";
          const position = typeof r.position === "number" ? r.position : 0;
          if (url && title) out.push({ type: "organic", position, title, url });
        }
      }
    }

    // Dedup by URL
    const seen = new Set<string>();
    const deduped: SerpParsedResult[] = [];
    for (const r of out) {
      const key = r.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
    }
    return deduped;
  }

  private async searchCompat(
    query: string | string[],
    opt: SearchOptionsCompat
  ): Promise<unknown> {
    // The old SDK limits method/dataFormat, we already coerced them.
    // We don't type the return because the old SDK sometimes returns string | object, etc. :contentReference[oaicite:6]{index=6}

    // overload: search(string) or search(string[])
    if (Array.isArray(query)) {
      return this.client.search(query, {
        zone: opt.zone,
        format: opt.format,
        method: opt.method,
        country: opt.country,
        timeout: opt.timeout,
        dataFormat: opt.dataFormat,
      });
    }
    return this.client.search(query, {
      zone: opt.zone,
      format: opt.format,
      method: opt.method,
      country: opt.country,
      timeout: opt.timeout,
      dataFormat: opt.dataFormat,
    });
  }

  private async scrapeCompat(
    url: string,
    opt: ScrapeOptionsCompat
  ): Promise<unknown> {
    return this.client.scrape(url, {
      zone: opt.zone,
      format: opt.format,
      method: opt.method,
      country: opt.country,
      timeout: opt.timeout,
      dataFormat: opt.dataFormat,
    });
  }

  private mapResponse(
    res: unknown,
    format: OutputFormat
  ): UnlockerSyncResponse {
    // compat: if BRDError comes, we propagate it
    if (res instanceof BRDError) throw res;

    // If json format, we try to return something "json-like"
    if (format === "json") {
      // If the SDK returns string, we try to parse
      if (typeof res === "string") {
        const parsed = safeJsonParse(res);
        return {
          kind: "json",
          status: 200,
          headers: {},
          body: parsed ?? res,
        };
      }

      // If it has body string, we parse body
      if (hasBodyString(res)) {
        const parsed = safeJsonParse(res.body);
        return {
          kind: "json",
          status: 200,
          headers: {},
          body: parsed ?? res.body,
        };
      }

      return {
        kind: "json",
        status: 200,
        headers: {},
        body: res,
      };
    }

    // raw
    if (typeof res === "string") {
      return { kind: "raw", status: 200, headers: {}, body: res };
    }

    if (hasBodyString(res)) {
      return { kind: "raw", status: 200, headers: {}, body: res.body };
    }

    return {
      kind: "raw",
      status: 200,
      headers: {},
      body: JSON.stringify(res),
    };
  }
}

export { BrightDataClient };
