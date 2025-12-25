import type { JobCreateInput, ScrapeOutput } from "@/scraping/types";

export async function normalizeScrapeResults(
  _output: ScrapeOutput,
): Promise<JobCreateInput[]> {
  // TODO: map provider-specific schema to JobCreateInput.
  return [];
}
