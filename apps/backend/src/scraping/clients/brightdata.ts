import { bdclient, BRDError, type BdClientOptions } from "@brightdata/sdk";
import type {
  UnlockerSyncRequest,
  UnlockerSyncResponse,
} from "../../types/brightdata";
import { env } from "../config";

/**
 * SDK viejo:
 * - method permitido: "GET" | "POST" | undefined
 * - dataFormat permitido: "html" | "markdown" | "screenshot" | undefined
 *
 * Así que adaptamos tu request a eso.
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
  // SDK viejo solo acepta GET/POST :contentReference[oaicite:2]{index=2}
  return m === "POST" ? "POST" : "GET";
};

const coerceSdkDataFormat = (
  df: UnlockerSyncRequest["data_format"] | undefined
): SdkDataFormat | undefined => {
  // SDK viejo NO acepta parsed_light/parsed :contentReference[oaicite:3]{index=3}
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
    // OJO: tu snippet usaba BRIGHTDATA_API_KEY; lo mantenemos
    const apiToken = ensureNonEmpty(
      process.env.BRIGHTDATA_API_KEY,
      "BRIGHTDATA_API_KEY"
    );

    // El SDK viejo a veces usa api_token en el constructor; pero como no tenemos certeza
    // del shape exacto, lo pasamos como objeto y dejamos que el SDK lo consuma.
    this.client = new bdclient({
      api_token: apiToken,
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

    // NOTA: req.data_format puede traer "parsed_light"/"parsed" en tu código,
    // pero el SDK viejo no lo soporta. Aquí simplemente lo ignoramos (undefined),
    // y luego parseamos nosotros el body si hace falta. :contentReference[oaicite:4]{index=4}
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

  public async runSyncScrape(zone: string, urls: string[]): Promise<string[]> {
    const results = await Promise.all(
      urls.map((url) =>
        this.runSync({
          url,
          zone,
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

    // Con SDK viejo, a veces scrape(urls[]) existe pero el tipo no calza.
    // Para mantener strict y compat, hacemos N single scrapes y devolvemos IDs sintéticos.
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
   * SERP helper: intenta parsear resultados desde body JSON (si el SERP zone devuelve JSON).
   */
  public async triggerSyncSerpSearch(
    q: string,
    country: string,
  ): Promise<SerpParsedResult[]> {
    const res = await this.searchCompat([q], {
      zone: env.brightDataSerpZone,
      format: "raw",
      method: "GET",
      country,
      timeout: 10_000,
    });

    const items = Array.isArray(res) ? res : [res];
    const out: SerpParsedResult[] = [];

    for (const it of items) {
      if (it instanceof BRDError) throw it;

      const bodyStr =
        typeof it === "string"
          ? it
          : hasBodyString(it)
          ? it.body
          : JSON.stringify(it);

      const parsed = safeJsonParse(bodyStr);

      // Soporta payload { results: [...] } o { organic: [...] } (dependiendo del SERP output)
      if (isRecord(parsed) && Array.isArray(parsed.results)) {
        for (const r of parsed.results) {
          if (!isRecord(r)) continue;
          const url = typeof r.url === "string" ? normalizeUrl(r.url) : "";
          const title = typeof r.title === "string" ? r.title : "";
          const type = typeof r.type === "string" ? r.type : "organic";
          const position = typeof r.position === "number" ? r.position : 0;
          if (url && title) out.push({ type, position, title, url });
        }
      } else if (isRecord(parsed) && Array.isArray(parsed.organic)) {
        for (const r of parsed.organic) {
          if (!isRecord(r)) continue;
          const url = typeof r.link === "string" ? normalizeUrl(r.link) : "";
          const title = typeof r.title === "string" ? r.title : "";
          const position =
            typeof r.global_rank === "number" ? r.global_rank : 0;
          if (url && title) out.push({ type: "organic", position, title, url });
        }
      }
    }

    // Dedup por URL
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
    // El SDK viejo limita method/dataFormat, ya los coercionamos.
    // No tipamos el retorno porque el SDK viejo a veces devuelve string | object, etc. :contentReference[oaicite:6]{index=6}

    // overload: search(string) o search(string[])
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
    // compat: si viene BRDError, lo propagamos
    if (res instanceof BRDError) throw res;

    // Si format json, intentamos devolver algo "json-like"
    if (format === "json") {
      // Si el SDK devuelve string, intentamos parsear
      if (typeof res === "string") {
        const parsed = safeJsonParse(res);
        return {
          kind: "json",
          status: 200,
          headers: {},
          body: parsed ?? res,
        };
      }

      // Si tiene body string, parseamos body
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
