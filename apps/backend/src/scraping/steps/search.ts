import { searchDorkQueries } from "@/scraping/clients/search";
import type { CandidateUrl, SearchDorkQuery } from "@/scraping/types";

export async function searchWithDorks(
  queries: SearchDorkQuery[],
): Promise<CandidateUrl[]> {
  if (queries.length === 0) return [];
  return searchDorkQueries(queries);
}
