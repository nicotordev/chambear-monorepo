import { randomUUID } from "node:crypto";
import {
  JobSource,
  Prisma,
  UrlKind,
  type EmploymentType,
  type WorkMode,
} from "../lib/generated";
import { prisma } from "../lib/prisma";
import { generateEmbedding } from "../lib/utils/ai";
import {
  mapEmploymentType,
  mapWorkMode,
  mapSeniority,
} from "../lib/utils/mapping";
import {
  brightdataClient,
  jobLlmClient,
  pineconeJobsClient,
} from "../scraping/clients";
import { env } from "../scraping/config";
import type { JobPosting } from "../types/ai";

import jobsService from "./jobs.service";

const MIN_RECENT_JOBS = 5;
const RECENT_DAYS = 30;
const RANK_LIMIT = 20;
const PINECONE_TOP_K = 50;
const LOG_PREFIX = "[RecommendationService]";

type RetrievedJob = Readonly<{
  job: JobPosting;
  retrievalScore: number;
}>;

const workModeToAiRemote = (wm: WorkMode): WorkMode => {
  switch (wm) {
    case "REMOTE":
      return "REMOTE";
    case "HYBRID":
      return "HYBRID";
    case "ONSITE":
      return "ONSITE";
    case "UNKNOWN":
      return "UNKNOWN";
    default: {
      const _exhaustive: never = wm;
      return _exhaustive;
    }
  }
};

const employmentTypeToAi = (et: EmploymentType): EmploymentType => {
  const mapped = mapEmploymentType(et);
  return mapped;
};

const toPrismaJsonValue = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  const seen = new Set<unknown>();

  const normalize = (v: unknown): Prisma.InputJsonValue | null => {
    if (v === null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number") return Number.isFinite(v) ? v : String(v);
    if (typeof v === "boolean") return v;

    if (Array.isArray(v)) {
      return v.map((x) => normalize(x));
    }

    if (typeof v === "object") {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);

      const obj = v as Record<string, unknown>;
      const out: Record<string, Prisma.InputJsonValue | null> = {};
      for (const [k, val] of Object.entries(obj)) {
        out[k] = normalize(val);
      }
      return out;
    }

    return String(v);
  };

  const result = normalize(value);
  if (result === null) return Prisma.JsonNull;
  return result;
};

const dedupeBySourceUrl = (jobs: readonly JobPosting[]): JobPosting[] => {
  const map = new Map<string, JobPosting>();
  for (const j of jobs) {
    const key = j.sourceUrl.trim();
    if (!key) continue;
    if (!map.has(key)) map.set(key, j);
  }
  return Array.from(map.values());
};

const recommendationService = {
  async scanJobs(profileId: string) {
    console.time(`${LOG_PREFIX} scanJobs total`);
    console.info(`${LOG_PREFIX} Starting scan for profileId: ${profileId}`);

    /* ────────────────────────────────
     * 1) User context
     * ──────────────────────────────── */
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: { user: true, skills: { include: { skill: true } } },
    });
    const user = profile.user;
    if (!profile) {
      console.error(`${LOG_PREFIX} User profile not found: ${profileId}`);
      throw new Error("User profile not found");
    }

    const userContext = `
User: ${user.name} (${user.email})
Role: ${profile.targetRoles.join(", ")}
Experience: ${profile.yearsExperience ?? 0} years
Location: ${profile.location ?? "Unknown"}
Skills: ${profile.skills.map((s) => s.skill.name).join(", ")}
Headline: ${profile.headline ?? ""}
Summary: ${profile.summary ?? ""}
`.trim();

    console.debug(`${LOG_PREFIX} User context built for: ${user.email}`);

    /* ────────────────────────────────
     * 2) Load recent DB jobs
     * ──────────────────────────────── */
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RECENT_DAYS);

    const recentJobs = await prisma.job.findMany({
      where: { createdAt: { gte: cutoffDate } },
      include: { jobSkills: { include: { skill: true } } },
    });

    const mappedDbJobsAll: JobPosting[] = recentJobs.map((j) => ({
      title: j.title,
      company: j.companyName,
      location: j.location ?? undefined,
      remote: workModeToAiRemote(j.workMode),
      employmentType: employmentTypeToAi(j.employmentType),
      sourceUrl: j.externalUrl ?? "",
      descriptionMarkdown: j.description ?? "",
      pageKind: j.urlKind,
    }));

    // Evita mandar “jobs” sin URL a Pinecone (no index/lookup/dedupe posible)
    const mappedDbJobs = mappedDbJobsAll.filter(
      (j) => j.sourceUrl.trim().length > 0
    );

    console.info(
      `${LOG_PREFIX} Loaded ${mappedDbJobs.length} valid recent jobs from DB (raw: ${recentJobs.length})`
    );

    /* ────────────────────────────────
     * 3) Pinecone relevance filtering
     * ──────────────────────────────── */
    let relevantJobs: readonly RetrievedJob[] = [];

    if (mappedDbJobs.length > 0) {
      console.time(`${LOG_PREFIX} Pinecone retrieval`);
      relevantJobs = await pineconeJobsClient.retrieveRelevantJobs({
        jobs: mappedDbJobs,
        userContext,
        embed: generateEmbedding,
        topK: PINECONE_TOP_K,
      });
      console.timeEnd(`${LOG_PREFIX} Pinecone retrieval`);
      console.info(
        `${LOG_PREFIX} Pinecone returned ${relevantJobs.length} relevant jobs`
      );
    } else {
      console.warn(`${LOG_PREFIX} No DB jobs to filter via Pinecone.`);
    }

    /* ────────────────────────────────
     * 4) Scrape if insufficient
     * ──────────────────────────────── */
    if (relevantJobs.length < MIN_RECENT_JOBS) {
      console.info(
        `${LOG_PREFIX} Insufficient relevant jobs (${relevantJobs.length} < ${MIN_RECENT_JOBS}). Initiating scrape...`
      );

      console.time(`${LOG_PREFIX} Full Scraping Flow`);
      const queries = await jobLlmClient.generateSearchDorks(userContext, 3);
      console.debug(
        `${LOG_PREFIX} Generated ${queries.length} search queries.`
      );

      const scrapedJobs: JobPosting[] = [];

      for (const q of queries) {
        console.debug(`${LOG_PREFIX} Executing search query: "${q.query}"`);
        try {
          const result = await brightdataClient.runSync({
            zone: env.brightDataSerpZone,
            url: q.query,
            country: "us",
          });

          if (result.kind === "raw" && result.body) {
            const urls = await jobLlmClient.extractUrlsFromSearchMarkdown(
              String(result.body)
            );
            console.debug(
              `${LOG_PREFIX} Found ${urls.length} URLs in search result.`
            );

            const extracted = await jobLlmClient.scoreThenFetchThenExtractJobs({
              urls: urls.map((u) => u.url),
              fetchMarkdown: async (url: string) => {
                console.debug(`${LOG_PREFIX} Fetching markdown for: ${url}`);
                const [res] = await brightdataClient.runSyncScrape(
                  env.brightDataZone,
                  [url]
                );
                return res;
              },
              userContext,
              maxToScrape: 5,
            });

            console.info(
              `${LOG_PREFIX} Extracted ${extracted.jobs.length} jobs from this batch.`
            );
            scrapedJobs.push(...extracted.jobs);
          } else {
            console.warn(
              `${LOG_PREFIX} Search returned no raw body for query: ${q.query}`
            );
          }
        } catch (err) {
          console.error(
            `${LOG_PREFIX} Scraping failed for query "${q.query}"`,
            err
          );
        }
      }

      const scrapedUnique = dedupeBySourceUrl(scrapedJobs);
      console.info(
        `${LOG_PREFIX} Total unique scraped jobs: ${scrapedUnique.length}`
      );

      if (scrapedUnique.length > 0) {
        console.debug(`${LOG_PREFIX} Upserting scraped jobs to DB...`);
        await Promise.all(
          scrapedUnique.map((job) =>
            jobsService.upsertJob({
              id: randomUUID(),
              title: job.title,
              companyName: job.company ?? "Unknown",
              location: job.location,
              employmentType: mapEmploymentType(job.employmentType),
              workMode: mapWorkMode(job.remote),
              seniority: mapSeniority(job.seniority),
              description: job.descriptionMarkdown,
              salary: job.compensation,
              tags: [
                ...(job.requirements || []),
                ...(job.niceToHave || []),
              ].slice(0, 10), // Limit to avoid massive arrays
              urlKind: job.pageKind ?? UrlKind.IRRELEVANT,
              source: JobSource.EXTERNAL_API,
              externalUrl: job.sourceUrl,
              createdAt: new Date(),
              jobSkills: (job.skills || []).map((skillName) => ({
                skill: {
                  id: randomUUID(),
                  name: skillName,
                },
              })),
            })
          )
        );
        console.debug(`${LOG_PREFIX} Upsert complete.`);
      }

      relevantJobs = relevantJobs.concat(
        scrapedUnique.map((job) => ({
          job,
          retrievalScore: 1.0,
        }))
      );

      console.timeEnd(`${LOG_PREFIX} Full Scraping Flow`);
    } else {
      console.info(
        `${LOG_PREFIX} Sufficient jobs found (${relevantJobs.length}). Skipping scrape.`
      );
    }

    /* ────────────────────────────────
     * 5) Rank jobs
     * ──────────────────────────────── */
    console.info(`${LOG_PREFIX} Ranking ${relevantJobs.length} candidates...`);
    console.time(`${LOG_PREFIX} LLM Ranking`);

    const ranked = await jobLlmClient.rankJobs({
      jobs: relevantJobs.map((r) => r.job),
      userContext,
      topK: RANK_LIMIT,
    });

    console.timeEnd(`${LOG_PREFIX} LLM Ranking`);
    console.info(`${LOG_PREFIX} Returned ${ranked.items.length} ranked items.`);

    /* ────────────────────────────────
     * 6) Persist fit scores (no N+1)
     * ──────────────────────────────── */
    const urls = ranked.items
      .map((it) => it.job.sourceUrl.trim())
      .filter((u) => u.length > 0);

    const uniqueUrls = Array.from(new Set(urls));

    console.debug(
      `${LOG_PREFIX} Matching ${uniqueUrls.length} ranked URLs to DB IDs...`
    );

    const dbJobs = uniqueUrls.length
      ? await prisma.job.findMany({
          where: { externalUrl: { in: uniqueUrls } },
          select: { id: true, externalUrl: true },
        })
      : [];

    const byExternalUrl = new Map<string, string>();
    for (const j of dbJobs) {
      if (j.externalUrl) byExternalUrl.set(j.externalUrl, j.id);
    }

    console.debug(
      `${LOG_PREFIX} Persisting FitScores for ${ranked.items.length} items...`
    );
    let persistedCount = 0;

    await Promise.all(
      ranked.items.map(async (item) => {
        const url = item.job.sourceUrl.trim();
        if (!url) return;

        const jobId = byExternalUrl.get(url);
        if (!jobId) {
          console.warn(
            `${LOG_PREFIX} Job ID not found for URL during fitScore save: ${url}`
          );
          return;
        }

        await prisma.fitScore.upsert({
          where: {
            profileId_jobId: {
              profileId: profile.id,
              jobId,
            },
          },
          create: {
            profileId: profile.id,
            jobId,
            score: item.fitScore,
            rationale: toPrismaJsonValue(item.rationale),
          },
          update: {
            score: item.fitScore,
            rationale: toPrismaJsonValue(item.rationale),
          },
        });
        persistedCount++;
      })
    );

    console.info(
      `${LOG_PREFIX} Successfully persisted ${persistedCount} FitScores.`
    );
    console.timeEnd(`${LOG_PREFIX} scanJobs total`);

    return ranked.items;
  },
};

export default recommendationService;
