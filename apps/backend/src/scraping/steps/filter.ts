import { jobLlmClient } from "@/scraping/clients/ai";
import type { CandidateUrl, FilteredUrl } from "@/scraping/types";

export async function filterUrlsWithAI(
  candidates: CandidateUrl[],
): Promise<FilteredUrl[]> {
  if (candidates.length === 0) return [];
  
  const urls = candidates.map(c => c.url);
  const result = await jobLlmClient.scoreUrls({ urls });
  
  return result.items.map(item => ({
      url: item.url,
      score: item.score,
      kind: item.kind,
      reason: item.reason,
      source: "google_dorks" // Default source for filtered URLs in this step
  }));
}
