import { JobSource, UrlKind } from "@/lib/generated";
import pLimit from "p-limit";
import { DocumentType } from "../lib/generated";
import { prisma } from "../lib/prisma";
import { sortByScoreDesc, uniqueBy, uniqueStrings } from "../lib/utils/common";
import {
  dedupeJobPostings,
  mapEmploymentType,
  mapSeniority,
  mapWorkMode,
  normalizeSkillName,
} from "../lib/utils/mapping";
import { toPrismaJsonValue } from "../lib/utils/prisma";
import { brightdataClient, jobLlmClient } from "../scraping/clients";
import type { JobPosting, RankedJob } from "../types/ai";
import aiContextService from "./aiContext.service";
import billingService from "./billing.service";
import documentService from "./documents.service";
import jobsService from "./jobs.service";

// Funnel knobs
const EMBED_TOP_K = 30; // candidates passed to LLM re-rank
const RANK_LIMIT = 20;

const LOG_PREFIX = "[RecommendationService]";

const aiActionService = {
  async scanJobs(profileId: string) {
    console.time(`${LOG_PREFIX} scanJobs total`);
    console.info(`${LOG_PREFIX} Starting scan for profileId: ${profileId}`);

    /* ────────────────────────────────
     * 1) Load user context
     * ──────────────────────────────── */
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: { user: true },
    });

    const user = profile.user;
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    /* ────────────────────────────────
     * 2) Check & Consume Credits
     * ──────────────────────────────── */
    const canScan = await billingService.canUserAction(user.id, "JOB_SCAN");
    if (!canScan) {
      throw new Error("Insufficient credits for job scan");
    }
    await billingService.consumeCredits(user.id, "JOB_SCAN");

    /* ────────────────────────────────
     * 3) Scrape (Forced Run)
     * ──────────────────────────────── */
    console.info(`${LOG_PREFIX} Initiating forced scrape (Credit charged)...`);
    console.time(`${LOG_PREFIX} Full Scraping Flow`);

    const scrapedJobs = await this.performScraping(userContext);

    const scrapedUnique = dedupeJobPostings(scrapedJobs)
      .filter((j) => j.title)
      .slice(0, 200); // safety cap

    console.info(
      `${LOG_PREFIX} Total unique scraped jobs after hard filters: ${scrapedUnique.length}`
    );

    if (scrapedUnique.length > 0) {
      await this.upsertScrapedJobs(scrapedUnique);
    }

    // Add scraped as candidates (retrievalScore is “unknown”)
    const candidates = scrapedUnique.map((job) => ({
      job,
      retrievalScore: 0,
      source: "SCRAPED",
    }));

    console.timeEnd(`${LOG_PREFIX} Full Scraping Flow`);

    /* ────────────────────────────────
     * 5) Funnel: hard filter + embed rank → topK → LLM re-rank
     * ──────────────────────────────── */
    const hardFiltered = candidates
      .map((c) => ({
        ...c,
        job: { ...c.job, sourceUrl: c.job.sourceUrl },
      }))
      .filter((c) => c.job.sourceUrl.length > 0)
      .filter((c) => c.job.title.length > 0);

    console.info(
      `${LOG_PREFIX} Candidates after hard filters: ${hardFiltered.length}`
    );

    // If Pinecone already returned retrievalScore for DB items, use it.
    // For SCRAPED items with retrievalScore=0, you can (next iteration) compute embedding similarity.
    const embedRanked = sortByScoreDesc(
      hardFiltered.map((c) => ({ ...c, score: c.retrievalScore }))
    );

    const topForLlm = embedRanked.slice(0, EMBED_TOP_K).map((x) => x);

    console.info(
      `${LOG_PREFIX} Passing ${topForLlm.length} candidates to LLM re-rank (topK=${EMBED_TOP_K})`
    );

    console.time(`${LOG_PREFIX} LLM Re-rank`);
    const ranked = await jobLlmClient.rankJobs({
      jobs: topForLlm.map((r) => r.job),
      userContext,
      topK: RANK_LIMIT,
      // NEXT: add model: "gpt-5.2" if your client supports it
    });
    console.timeEnd(`${LOG_PREFIX} LLM Re-rank`);
    console.info(`${LOG_PREFIX} Returned ${ranked.items.length} ranked items.`);

    const persistedCount = await this.persistFitScores(
      profile.id,
      ranked.items
    );

    console.info(
      `${LOG_PREFIX} Successfully persisted ${persistedCount} FitScores.`
    );
    console.timeEnd(`${LOG_PREFIX} scanJobs total`);

    return ranked.items;
  },
  async optimizeCv(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobDescription = `
Title: ${job.title}
Company: ${job.companyName}
Description:
${job.description || "No description available."}
    `.trim();

    // 4. Generate Content
    const optimizedContent = await jobLlmClient.optimizeCv(
      userContext,
      jobDescription
    );

    // 5. Save Document
    const label = `Optimized CV for ${job.companyName}`;
    const doc = await documentService.createDocument(
      profileId,
      {
        type: DocumentType.RESUME,
        label,
        content: optimizedContent,
        jobId: job.id,
        summary: `Optimized for ${job.title} at ${job.companyName}`,
      },
      userId
    );

    return doc;
  },

  async generateCoverLetter(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobDescription = `
Title: ${job.title}
Company: ${job.companyName}
Description:
${job.description || "No description available."}
    `.trim();

    // 4. Generate Content
    const clContent = await jobLlmClient.generateCoverLetter(
      userContext,
      jobDescription
    );

    // 5. Save Document
    const label = `Cover Letter for ${job.companyName}`;
    const doc = await documentService.createDocument(
      profileId,
      {
        type: DocumentType.COVER_LETTER,
        label,
        content: clContent,
        jobId: job.id,
        summary: `Cover Letter for ${job.title} at ${job.companyName}`,
      },
      userId
    );

    return doc;
  },

  async calculateFit(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobPosting = {
      title: job.title,
      company: job.companyName,
      location: job.location || undefined,
      remote: job.workMode as any,
      employmentType: job.employmentType as any,
      sourceUrl: job.externalUrl || `local:${job.id}`,
      descriptionMarkdown: job.description || "",
    };

    // 4. Rank
    const ranked = await jobLlmClient.rankJobs({
      jobs: [jobPosting],
      userContext,
      topK: 1,
    });

    const item = ranked.items[0];
    if (!item) throw new Error("Failed to calculate fit");

    // 5. Update/Create FitScore
    const fitScore = await prisma.fitScore.upsert({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
      create: {
        profileId,
        jobId,
        score: item.fitScore,
        rationale: item.rationale as any,
      },
      update: {
        score: item.fitScore,
        rationale: item.rationale as any,
      },
    });

    return fitScore;
  },

  async performScraping(userContext: string): Promise<JobPosting[]> {
    const queries = await jobLlmClient.generateSearchDorks(userContext, 3);
    console.debug(`${LOG_PREFIX} Generated ${queries.length} search queries.`);

    const limit = pLimit(2); // safe concurrency for external scraping

    const results = await Promise.all(
      queries.map((q) =>
        limit(async () => {
          console.debug(`${LOG_PREFIX} Executing search query: "${q.query}"`);
          let attempts = 0;
          const maxAttempts = 2;

          while (attempts < maxAttempts) {
            attempts++;
            try {
              const result = await brightdataClient.searchGoogle(q.query);
              console.debug(
                `${LOG_PREFIX} SERP returned ${result.length} results for query "${q.query}"`
              );

              const urls = result.map((r) => r.url);

              const extracted =
                await jobLlmClient.scoreThenFetchThenExtractJobs({
                  urls,
                  fetchMarkdown: async (url: string) => {
                    const [res] = await brightdataClient.scrapeMarkdown(url);
                    return res;
                  },
                  userContext,
                  maxToScrape: 5,
                  minScoreToScrape: 40,
                });

              console.info(
                `${LOG_PREFIX} Extracted ${extracted.jobs.length} jobs from this batch.`
              );
              return extracted.jobs;
            } catch (err) {
              if (attempts >= maxAttempts) {
                console.error(
                  `${LOG_PREFIX} Scraping failed for query "${q.query}" after ${attempts} attempts`,
                  err
                );
              } else {
                console.warn(
                  `${LOG_PREFIX} Attempt ${attempts} failed for query "${q.query}". Retrying...`
                );
              }
            }
          }
          return [];
        })
      )
    );

    return results.flat();
  },

  async upsertScrapedJobs(scrapedJobs: JobPosting[]) {
    console.debug(`${LOG_PREFIX} Upserting scraped jobs to DB...`);

    const jobRows = scrapedJobs.map((job) => {
      const normalizedExternalUrl = job.sourceUrl;

      const tags = uniqueStrings([
        ...(job.requirements ?? []),
        ...(job.niceToHave ?? []),
      ])
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      const normalizedSkillNames = uniqueStrings(
        (job.skills ?? [])
          .map((s) => normalizeSkillName(s))
          .filter((s): s is string => s !== null)
      );

      return {
        normalizedExternalUrl,
        payload: {
          title: job.title,
          companyName: job.company ?? "Unknown",
          location: job.location ?? null,
          employmentType: mapEmploymentType(job.employmentType),
          workMode: mapWorkMode(job.remote),
          seniority: mapSeniority(job.seniority),
          description: job.descriptionMarkdown ?? null,
          salary: job.compensation ?? null,
          tags,
          urlKind: job.pageKind ?? UrlKind.IRRELEVANT,
          source: JobSource.EXTERNAL_API,
          externalUrl:
            normalizedExternalUrl.length > 0 ? normalizedExternalUrl : null,
          createdAt: new Date(),
          jobSkills: [],
        },
        skillNames: normalizedSkillNames,
      };
    });

    // 1) Upsert jobs
    const limit = pLimit(10); // reasonable concurrency for DB writes
    await Promise.all(
      jobRows.map((row) => limit(() => jobsService.upsertJob(row.payload)))
    );

    // 2) Resolver jobIds reales desde DB por externalUrl
    const extUrls = uniqueStrings(
      jobRows.map((r) => r.normalizedExternalUrl).filter((u) => u.length > 0)
    );

    const dbJobsByUrl =
      extUrls.length > 0
        ? await prisma.job.findMany({
            where: { externalUrl: { in: extUrls } },
            select: { id: true, externalUrl: true },
          })
        : [];

    const externalUrlToJobId = new Map<string, string>();
    for (const j of dbJobsByUrl) {
      if (j.externalUrl) externalUrlToJobId.set(j.externalUrl, j.id);
    }

    // 3) Upsert skills una vez + map name->id
    const allSkillNames = uniqueStrings(jobRows.flatMap((r) => r.skillNames));
    const skillNameToId = new Map<string, string>();

    await prisma.$transaction(async (tx) => {
      if (allSkillNames.length > 0) {
        await tx.skill.createMany({
          data: allSkillNames.map((name) => ({ name })),
          skipDuplicates: true,
        });

        const skills = await tx.skill.findMany({
          where: { name: { in: allSkillNames } },
          select: { id: true, name: true },
        });

        for (const s of skills) skillNameToId.set(s.name, s.id);
      }

      // 4) Relaciones job<->skill
      const jobSkillRows = jobRows.flatMap((row) => {
        const jobId = externalUrlToJobId.get(row.normalizedExternalUrl);
        if (!jobId) return [];

        return row.skillNames
          .map((skillName) => {
            const skillId = skillNameToId.get(skillName);
            if (!skillId) return null;
            return { jobId, skillId };
          })
          .filter((x): x is { jobId: string; skillId: string } => x !== null);
      });

      const dedupedJobSkillRows = uniqueBy(
        jobSkillRows,
        (p) => `${p.jobId}::${p.skillId}`
      );

      if (dedupedJobSkillRows.length > 0) {
        await tx.jobSkill.createMany({
          data: dedupedJobSkillRows,
          skipDuplicates: true,
        });
      }
    });

    console.debug(`${LOG_PREFIX} Upsert complete.`);
    console.debug(
      `${LOG_PREFIX} Jobs (scraped): ${scrapedJobs.length}, Skills (unique): ${allSkillNames.length}`
    );
  },

  async persistFitScores(
    profileId: string,
    rankedItems: readonly RankedJob[]
  ): Promise<number> {
    const urls = rankedItems
      .map((it) => it.job.sourceUrl)
      .filter((u) => u.length > 0);

    const uniqueUrls = uniqueStrings(urls);

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

    const results = await Promise.all(
      rankedItems.map(async (item) => {
        const url = item.job.sourceUrl;
        if (!url) return false;

        const jobId = byExternalUrl.get(url);
        if (!jobId) {
          console.warn(`${LOG_PREFIX} Job ID not found for URL: ${url}`);
          return false;
        }

        await prisma.fitScore.upsert({
          where: {
            profileId_jobId: {
              profileId,
              jobId,
            },
          },
          create: {
            profileId,
            jobId,
            score: item.fitScore,
            rationale: toPrismaJsonValue(item.rationale),
          },
          update: {
            score: item.fitScore,
            rationale: toPrismaJsonValue(item.rationale),
          },
        });

        return true;
      })
    );

    return results.filter((x) => x).length;
  },
};

export default aiActionService;
