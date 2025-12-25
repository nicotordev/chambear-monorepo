import { runSyncScrape, triggerAsyncScrape } from "@/scraping/clients/brightdata";
import type { ScrapeInput, ScrapeOutput } from "@/scraping/types";

export async function runScrape(input: ScrapeInput): Promise<ScrapeOutput> {
  if (input.urls.length === 0) {
    return input.mode === "sync" ? { data: [] } : { responseIds: [] };
  }

  if (!input.zone) {
    throw new Error("Missing Bright Data zone for scrape");
  }

  if (input.mode === "sync") {
    const data = await runSyncScrape(input.zone, input.urls);
    return { data };
  }

  if (!input.customer) {
    throw new Error("Missing Bright Data customer for async scrape");
  }

  const responseIds = await triggerAsyncScrape(
    input.customer,
    input.zone,
    input.urls,
  );
  return { responseIds };
}
