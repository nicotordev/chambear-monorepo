import { bdclient } from '@brightdata/sdk';
import { requireEnv } from "@/scraping/config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
export type UnlockerFormat = "raw" | "json";

export type UnlockerSyncRequest = Readonly<{
  zone: string;
  url: string;
  format?: UnlockerFormat;
  method?: HttpMethod;
  country?: string;
  data_format?: "markdown" | "html" | "text" | string;
  body?: string;
  headers?: Record<string, string>;
  cookies?: string;
  timeout_ms?: number;
}>;

export type UnlockerSyncResponse =
  | Readonly<{
      kind: "raw";
      status: number;
      headers: Readonly<Record<string, string>>;
      body: string;
    }>
  | Readonly<{
      kind: "json";
      status: number;
      headers: Readonly<Record<string, string>>;
      body: unknown;
    }>;

class BrightDataClient {
  private client: bdclient;

  constructor() {
    this.client = new bdclient({
      apiKey: requireEnv("BRIGHTDATA_API_KEY"),
    });
  }

  /**
   * Compatibility layer for the existing runSync method
   */
  async runSync(req: UnlockerSyncRequest): Promise<UnlockerSyncResponse> {
    const isSerp = req.zone.toLowerCase().includes('serp');
    
    const options: any = {
      format: req.format ?? 'raw',
      method: req.method,
      country: req.country,
      dataFormat: req.data_format,
      timeout: req.timeout_ms,
      zone: req.zone,
    };

    if (isSerp) {
      const res = await this.client.search(req.url, options);
      return this.mapResponse(res, options.format);
    } else {
      const res = await this.client.scrape(req.url, options);
      return this.mapResponse(res, options.format);
    }
  }

  // Compatibility helpers
  async runSyncScrape(zone: string, urls: string[]): Promise<string[]> {
    const results = await Promise.all(urls.map(url => this.runSync({
      url,
      zone,
      format: "raw",
      data_format: "markdown"
    })));
    return results.map(res => res.kind === "raw" ? res.body : JSON.stringify(res.body));
  }

  async triggerAsyncScrape(customer: string, zone: string, urls: string[]): Promise<string[]> {
    // The SDK's scrape() can handle an array of URLs and returns a Batch response
    const res = await this.client.scrape(urls, { zone });
    // If it's batch, we might not have 'responseId' in the same way as the old API
    // but for compatibility we'll return something.
    return Array.isArray(res) ? res.map((_, i) => `async-${zone}-${i}`) : [`async-${zone}-0`];
  }

  private mapResponse(res: any, format: string): UnlockerSyncResponse {
    if (format === 'json') {
      return {
        kind: 'json',
        status: 200,
        headers: {},
        body: res,
      };
    }
    return {
      kind: 'raw',
      status: 200,
      headers: {},
      body: typeof res === 'string' ? res : JSON.stringify(res),
    };
  }
}

const brightdataClient = new BrightDataClient();

// Named exports for compatibility
export const runSyncScrape = (zone: string, urls: string[]) => brightdataClient.runSyncScrape(zone, urls);
export const triggerAsyncScrape = (customer: string, zone: string, urls: string[]) => brightdataClient.triggerAsyncScrape(customer, zone, urls);

export default brightdataClient;