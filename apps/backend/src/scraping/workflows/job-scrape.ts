import { filterUrlsWithAI } from "@/scraping/steps/filter";
import { normalizeScrapeResults } from "@/scraping/steps/normalize";
import { persistJobs } from "@/scraping/steps/persist";
import { runScrape } from "@/scraping/steps/scrape";
import { searchWithDorks } from "@/scraping/steps/search";
import type { JobScrapePipelineInput } from "@/scraping/types";

export async function runJobScrapePipeline(
  input: JobScrapePipelineInput,
): Promise<void> {
  const candidates = await searchWithDorks(input.queries);
  const filtered = await filterUrlsWithAI(candidates);
  const limited =
    typeof input.limit === "number" ? filtered.slice(0, input.limit) : filtered;
  const urls = limited.map((item) => item.url);

  if (urls.length === 0) return;

  const scrapeResult = await runScrape({
    urls,
    zone: input.zone,
    customer: input.customer,
    mode: input.mode,
  });
  const jobs = await normalizeScrapeResults(scrapeResult);
  await persistJobs(jobs);
}
