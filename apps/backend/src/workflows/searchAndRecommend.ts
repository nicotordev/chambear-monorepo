import { jobLlmClient, JobPosting } from "../scraping/clients/ai";
import brightdataClient from "../scraping/clients/brightdata";
import { searchWithDorks } from "../scraping/steps/search";
import { SearchDorkQuery } from "../scraping/types";
import jobService from "../services/jobs.service";
import userService from "../services/user.service";
import { recommendationWorkflow } from "./recommendation";

// Helper to map loose strings to Prisma Enums
function mapEmploymentType(
  type?: string
):
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "TEMPORARY"
  | "INTERN"
  | "FREELANCE" {
  if (!type) return "FULL_TIME";
  const t = type.toUpperCase().replace("-", "_");
  if (t.includes("FULL")) return "FULL_TIME";
  if (t.includes("PART")) return "PART_TIME";
  if (t.includes("CONTRACT")) return "CONTRACT";
  if (t.includes("TEMP")) return "TEMPORARY";
  if (t.includes("INTERN")) return "INTERN";
  if (t.includes("FREELANCE")) return "FREELANCE";
  return "FULL_TIME";
}

function mapWorkMode(mode?: string): "ONSITE" | "HYBRID" | "REMOTE" {
  if (!mode) return "HYBRID";
  const m = mode.toUpperCase();
  if (m.includes("REMOTE")) return "REMOTE";
  if (m.includes("HYBRID")) return "HYBRID";
  if (m.includes("SITE") || m.includes("OFFICE")) return "ONSITE";
  return "HYBRID";
}

export const searchAndRecommendWorkflow = {
  async runSearchAndRecommend(userId: string) {
    console.log(`[Workflow] Starting Search & Recommend for user ${userId}`);

    // 1. Get User Profile
    const profile = await userService.getProfile(userId);
    if (!profile) throw new Error("User profile not found");

    const userContext = `
      Title: ${profile.headline}
      Skills: ${profile.skills.map((s) => s.skill.name).join(", ")}
      Target Roles: ${profile.targetRoles.join(", ")}
      Location: ${profile.location}
    `;

    // 2. Generate Dorks with LLM + Date Filtering (Freshness)
    // Calculate date 7 days ago for freshness
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateFilter = `after:${oneWeekAgo.toISOString().split("T")[0]}`; // YYYY-MM-DD

    console.log(
      `[Workflow] Generating search dorks for user context (Freshness: ${dateFilter})...`
    );

    const generatedQueries = await jobLlmClient.generateSearchDorks(
      userContext,
      10
    );

    // Append date filter to LLM generated queries
    const queries: SearchDorkQuery[] = generatedQueries.map((q) => ({
      query: `${q.query} ${dateFilter}`,
      site: q.site,
      location: q.location || profile.location || undefined,
    }));

    // Limit queries for demo/safety
    const safeQueries = queries.slice(0, 5);
    console.log(`[Workflow] Generated ${safeQueries.length} search queries.`);

    // 3. Execute Search
    const candidates = await searchWithDorks(safeQueries);
    console.log(`[Workflow] Found ${candidates.length} candidate URLs.`);

    if (candidates.length === 0) {
      console.log("[Workflow] No candidates found. Aborting.");
      return;
    }

    // 4. Filter URLs with AI
    const uniqueUrls = Array.from(new Set(candidates.map((c) => c.url)));

    console.log(`[Workflow] Scoring ${uniqueUrls.length} URLs...`);
    const scoredOutput = await jobLlmClient.scoreUrls({
      urls: uniqueUrls,
      userContext,
      batchSize: 10,
    });

    const validUrls = scoredOutput.items.filter(
      (i) =>
        i.score > 60 && (i.kind === "job_listing" || i.kind === "jobs_index")
    );
    console.log(
      `[Workflow] Filtered down to ${validUrls.length} relevant URLs.`
    );

    // 5. Scrape, Extract AND Persist Immediately
    const validJobs: JobPosting[] = [];
    const concurrency = 3;

    for (let i = 0; i < validUrls.length; i += concurrency) {
      const batch = validUrls.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (item) => {
          try {
            console.log(`[Workflow] Scraping content from: ${item.url}`);
            const res = await brightdataClient.runSync({
              zone: "web_unlocker1",
              url: item.url,
              format: "raw",
              data_format: "markdown",
            });

            if (res.kind === "raw" && res.body) {
              const extraction = await jobLlmClient.extractJobsFromMarkdown({
                url: item.url,
                markdown: res.body,
                userContext,
                exhaustive: false,
              });

              if (extraction.jobs.length > 0) {
                // Immediate Persistence to prevent data loss
                for (const job of extraction.jobs) {
                  try {
                    // We map to JobInput structure used by service
                    await jobService.upsertJob({
                      title: job.title,
                      companyName: job.company || "Unknown",
                      location: job.location,
                      description: job.descriptionMarkdown,
                      source: "EXTERNAL_API", // Enum: EXTERNAL_API
                      externalUrl: job.applyUrl || job.sourceUrl,
                      skills: [
                        ...(job.requirements || []),
                        ...(job.niceToHave || []),
                      ],
                      employmentType: mapEmploymentType(job.employmentType),
                      workMode: mapWorkMode(job.remote),
                      rawData: { ...job },
                    });
                    // Push to validJobs for ranking (must match JobPosting type from ai.ts which uses lowercase)
                    // We map BACK to the AI client's expected format
                    // Handle specific mapping if needed, but toLowerCase usually works for FULL_TIME -> full_time
                    // except CONTRACT -> contract, etc.
                    // Let's be safe:
                    const etMap: Record<string, any> = {
                      FULL_TIME: "full_time",
                      PART_TIME: "part_time",
                      CONTRACT: "contract",
                      TEMPORARY: "temporary",
                      INTERN: "internship",
                      FREELANCE: "contract", // Map freelance to contract for AI schema
                    };

                    const wm = mapWorkMode(job.remote);
                    const remoteMap: Record<string, any> = {
                      REMOTE: "remote",
                      HYBRID: "hybrid",
                      ONSITE: "on_site",
                    };

                    validJobs.push({
                      ...job,
                      employmentType:
                        etMap[mapEmploymentType(job.employmentType)] ||
                        "full_time",
                      remote: remoteMap[wm] || "hybrid",
                    });
                    console.log(`[Workflow] Saved job: ${job.title}`);
                  } catch (dbError) {
                    console.error(
                      `[Workflow] DB Save failed for ${job.title}`,
                      dbError
                    );
                  }
                }
              }
            }
          } catch (e) {
            console.error(`[Workflow] Failed to process URL ${item.url}`, e);
          }
        })
      );
    }

    console.log(
      `[Workflow] Extracted and saved ${validJobs.length} total job postings.`
    );

    if (validJobs.length === 0) return;

    // 6. Rank (Using the already saved jobs for context)
    // We pass the validJobs list to recommendation workflow which will (re)persist but primarily Rank.
    // Since we already upserted, this second upsert is safe/redundant but harmless.
    await recommendationWorkflow.recommendAndPersistJobs({
      userId,
      jobs: validJobs,
      topK: 10,
    });

    console.log("[Workflow] Done.");
    return validJobs;
  },
};
