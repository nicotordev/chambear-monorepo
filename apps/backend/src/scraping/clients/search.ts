import brightdataClient from "@/scraping/clients/brightdata";
import { jobLlmClient } from "@/scraping/clients/ai";
import type { CandidateUrl, SearchDorkQuery } from "@/scraping/types";

function buildGoogleUrl(query: SearchDorkQuery): string {
  const parts = [query.query];
  if (query.site) parts.push(`site:${query.site}`);
  if (query.location) parts.push(query.location);

  const q = encodeURIComponent(parts.join(" "));
  return `https://www.google.com/search?q=${q}&num=10&hl=en`;
}

export async function searchDorkQueries(
  queries: SearchDorkQuery[],
): Promise<CandidateUrl[]> {
  const results: CandidateUrl[] = [];
  const CONCURRENCY = 3;

  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    const batch = queries.slice(i, i + CONCURRENCY);
    console.log(`[Search] Processing batch ${i / CONCURRENCY + 1} of ${Math.ceil(queries.length / CONCURRENCY)}`);

    await Promise.all(batch.map(async (q) => {
      try {
        const url = buildGoogleUrl(q);
        console.log(`[Search] Fetching SERP (JSON): ${url}`);

        const response = await brightdataClient.runSync({
          zone: "serp_api4",
          url,
          format: "json", // Request JSON directly
          timeout_ms: 30000,
        });

        if (response.kind === "json" && response.body) {
           // Parse Bright Data SERP JSON structure
           // Typically: { organic: [ { link: "...", title: "..." }, ... ] }
           const body = response.body as any;
           const organic = body.organic || [];

           console.log(`[Search] Found ${organic.length} organic links for: ${q.query}`);

           for (const item of organic) {
              if (item.link) {
                  results.push({
                      url: item.link,
                      query: q.query,
                      source: "google_dorks"
                  });
              }
           }
        } else if (response.kind === "raw") {
            // Fallback if JSON fails or returns raw for some reason (rare with serp_api4 if configured)
            console.warn("[Search] Received raw response instead of JSON. Skipping.");
        }
      } catch (error) {
        console.error(`[Search] Failed for query ${JSON.stringify(q)}:`, error);
      }
    }));
  }

  return results;
}
