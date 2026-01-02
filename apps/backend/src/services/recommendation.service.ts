import { EmploymentType, Prisma, WorkMode } from "@/lib/generated";
import { prisma } from "../lib/prisma";
import { generateEmbedding } from "../lib/utils/ai";
import {
  mapEmploymentType,
  mapSeniority,
  mapWorkMode,
} from "../lib/utils/mapping";
import {
  brightdataClient,
  jobLlmClient,
  pineconeJobsClient,
} from "../scraping/clients";
import type { JobPosting } from "../types/ai";
import jobsService from "./jobs.service";
import { UrlKind } from "@/lib/generated";
import { JobSource } from "@/lib/generated";

const MIN_RECENT_JOBS = 5;
const RECENT_DAYS = 30;

// Funnel knobs
const EMBED_TOP_K = 30; // candidates passed to LLM re-rank
const PINECONE_TOP_K = 80; // upstream retrieval breadth
const RANK_LIMIT = 20;

const LOG_PREFIX = "[RecommendationService]";

type RetrievedJob = Readonly<{
  job: JobPosting;
  retrievalScore: number;
  source: "DB" | "SCRAPED";
}>;

const toPrismaJsonValue = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  const seen = new Set<unknown>();

  const normalize = (v: unknown): Prisma.InputJsonValue | null => {
    if (v === null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number") return Number.isFinite(v) ? v : String(v);
    if (typeof v === "boolean") return v;

    if (Array.isArray(v)) return v.map((x) => normalize(x));

    if (typeof v === "object") {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);

      const obj = v as Record<string, unknown>;
      const out: Record<string, Prisma.InputJsonValue | null> = {};
      for (const [k, val] of Object.entries(obj)) out[k] = normalize(val);
      return out;
    }

    return String(v);
  };

  const result = normalize(value);
  return result === null ? Prisma.JsonNull : result;
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    // strip tracking params
    const paramsToDrop = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gh_src",
      "source",
      "ref",
    ]);
    for (const key of Array.from(u.searchParams.keys())) {
      if (paramsToDrop.has(key)) u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return trimmed;
  }
};

const dedupeBySourceUrl = (jobs: readonly JobPosting[]): JobPosting[] => {
  const map = new Map<string, JobPosting>();
  for (const j of jobs) {
    const key = normalizeUrl(j.sourceUrl);
    if (!key) continue;
    if (!map.has(key)) map.set(key, { ...j, sourceUrl: key });
  }
  return Array.from(map.values());
};

const workModeToAi = (wm: WorkMode): WorkMode => wm;
const employmentTypeToAi = (et: EmploymentType): EmploymentType =>
  mapEmploymentType(et);

// Hard filters: barato + determinístico
const isObviouslyIrrelevantTitle = (title: string): boolean => {
  const t = title.toLowerCase();
  const banned = [
    "counsel",
    "attorney",
    "lawyer",
    "legal",
    "paralegal",
    "recruiter",
    "sales",
    "account executive",
    "marketing",
    "designer",
    "accountant",
    "hr",
    "human resources",
  ];
  return banned.some((b) => t.includes(b));
};

const sortByScoreDesc = <T extends { score: number }>(
  items: readonly T[]
): T[] => [...items].sort((a, b) => b.score - a.score);

function normalizeSkillName(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  // opcional: normalización suave para dedupe (sin matar mayúsculas “SQL”)
  // aquí solo colapsamos espacios internos
  return trimmed.replace(/\s+/g, " ");
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function uniquePairs(pairs: readonly { jobId: string; skillId: string }[]) {
  const seen = new Set<string>();
  const out: { jobId: string; skillId: string }[] = [];
  for (const p of pairs) {
    const key = `${p.jobId}::${p.skillId}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

const recommendationService = {
  async scanJobs(profileId: string) {
    console.time(`${LOG_PREFIX} scanJobs total`);
    console.info(`${LOG_PREFIX} Starting scan for profileId: ${profileId}`);

    /* ────────────────────────────────
     * 1) Load user context
     * ──────────────────────────────── */
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: { user: true, skills: { include: { skill: true } } },
    });

    const user = profile.user;

    const userContext = `
User: ${user.name ?? "Unknown"} (${user.email})
Role: ${profile.targetRoles.join(", ")}
Experience: ${profile.yearsExperience ?? 0} years
Location: ${profile.location ?? "Unknown"}
Skills: ${profile.skills.map((s) => s.skill.name).join(", ")}
Headline: ${profile.headline ?? ""}
Summary: ${profile.summary ?? ""}
`.trim();

    /* ────────────────────────────────
     * 2) Load recent DB jobs (global cache)
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
      remote: workModeToAi(j.workMode),
      employmentType: employmentTypeToAi(j.employmentType),
      sourceUrl: normalizeUrl(j.externalUrl ?? ""),
      descriptionMarkdown: j.description ?? "",
      pageKind: j.urlKind,
      // optional fields if your type supports them:
      // seniority: j.seniority,
    }));

    const mappedDbJobs = mappedDbJobsAll.filter((j) => j.sourceUrl.length > 0);

    console.info(
      `${LOG_PREFIX} Loaded ${mappedDbJobs.length} valid recent jobs from DB (raw: ${recentJobs.length})`
    );

    /* ────────────────────────────────
     * 3) Pinecone retrieval (coarse relevance)
     * ──────────────────────────────── */
    let candidates: RetrievedJob[] = [];

    if (mappedDbJobs.length > 0) {
      console.time(`${LOG_PREFIX} Pinecone retrieval`);
      const relevantFromDb = await pineconeJobsClient.retrieveRelevantJobs({
        jobs: mappedDbJobs,
        userContext,
        embed: generateEmbedding,
        topK: PINECONE_TOP_K,
      });
      console.timeEnd(`${LOG_PREFIX} Pinecone retrieval`);

      candidates = relevantFromDb.map((r) => ({
        job: { ...r.job, sourceUrl: normalizeUrl(r.job.sourceUrl) },
        retrievalScore: r.retrievalScore,
        source: "DB",
      }));

      console.info(
        `${LOG_PREFIX} Pinecone returned ${candidates.length} relevant DB jobs`
      );
    } else {
      console.warn(`${LOG_PREFIX} No DB jobs to filter via Pinecone.`);
    }

    /* ────────────────────────────────
     * 4) Scrape if insufficient (expand recall)
     * ──────────────────────────────── */
    if (candidates.length < MIN_RECENT_JOBS) {
      console.info(
        `${LOG_PREFIX} Insufficient relevant jobs (${candidates.length} < ${MIN_RECENT_JOBS}). Initiating scrape...`
      );
      console.time(`${LOG_PREFIX} Full Scraping Flow`);

      const queries = await jobLlmClient.generateSearchDorks(userContext, 3);
      console.debug(
        `${LOG_PREFIX} Generated ${queries.length} search queries.`
      );

      const scrapedJobs: JobPosting[] = [];

      for (const q of queries) {
        console.debug(`${LOG_PREFIX} Executing search query: "${q.query}"`);
        let attempts = 0;
        const maxAttempts = 2;
        let success = false;

        while (attempts < maxAttempts && !success) {
          attempts++;
          try {
            const result = await brightdataClient.triggerSyncSerpSearch(
              q.query
            );
            console.debug(
              `${LOG_PREFIX} SERP returned ${result.length} results for query "${q.query}"`
            );

            success = true;
            const urls = result.map((r) => r.url);

            const extracted = await jobLlmClient.scoreThenFetchThenExtractJobs({
              urls,
              fetchMarkdown: async (url: string) => {
                const [res] = await brightdataClient.runSyncScrape([url]);
                return res;
              },
              userContext,
              maxToScrape: 5,
              minScoreToScrape: 50,
            });

            scrapedJobs.push(...extracted.jobs);
            console.info(
              `${LOG_PREFIX} Extracted ${extracted.jobs.length} jobs from this batch.`
            );
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
      }

      const scrapedUnique = dedupeBySourceUrl(scrapedJobs)
        .filter((j) => !isObviouslyIrrelevantTitle(j.title))
        .slice(0, 200); // safety cap

      console.info(
        `${LOG_PREFIX} Total unique scraped jobs after hard filters: ${scrapedUnique.length}`
      );

      // ⬇️ bloque “mejorado”
      if (scrapedUnique.length > 0) {
        console.debug(`${LOG_PREFIX} Upserting scraped jobs to DB...`);

        const jobRows = scrapedUnique.map((job) => {
          const normalizedExternalUrl = normalizeUrl(job.sourceUrl);

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
              // OJO: no forzamos id aquí, dejamos que el upsert decida
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

        // 1) Upsert jobs (sin depender del retorno)
        await Promise.all(
          jobRows.map((row) => jobsService.upsertJob(row.payload))
        );

        // 2) Resolver jobIds reales desde DB por externalUrl
        const extUrls = uniqueStrings(
          jobRows
            .map((r) => r.normalizedExternalUrl)
            .filter((u) => u.length > 0)
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
          if (j.externalUrl)
            externalUrlToJobId.set(normalizeUrl(j.externalUrl), j.id);
        }

        // 3) Upsert skills una vez + map name->id
        const allSkillNames = uniqueStrings(
          jobRows.flatMap((r) => r.skillNames)
        );

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
              .filter(
                (x): x is { jobId: string; skillId: string } => x !== null
              );
          });

          const dedupedJobSkillRows = uniquePairs(jobSkillRows);

          if (dedupedJobSkillRows.length > 0) {
            await tx.jobSkill.createMany({
              data: dedupedJobSkillRows,
              skipDuplicates: true,
            });
          }
        });

        console.debug(`${LOG_PREFIX} Upsert complete.`);
        console.debug(
          `${LOG_PREFIX} Jobs (scrapedUnique): ${scrapedUnique.length}, Skills (unique): ${allSkillNames.length}`
        );
      }

      // Add scraped as candidates (retrievalScore is “unknown”)
      candidates = candidates.concat(
        scrapedUnique.map((job) => ({
          job,
          retrievalScore: 0,
          source: "SCRAPED",
        }))
      );

      console.timeEnd(`${LOG_PREFIX} Full Scraping Flow`);
    } else {
      console.info(
        `${LOG_PREFIX} Sufficient jobs found (${candidates.length}). Skipping scrape.`
      );
    }

    /* ────────────────────────────────
     * 5) Funnel: hard filter + embed rank → topK → LLM re-rank
     * ──────────────────────────────── */
    const hardFiltered = candidates
      .map((c) => ({
        ...c,
        job: { ...c.job, sourceUrl: normalizeUrl(c.job.sourceUrl) },
      }))
      .filter((c) => c.job.sourceUrl.length > 0)
      .filter((c) => !isObviouslyIrrelevantTitle(c.job.title));

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

    /* ────────────────────────────────
     * 6) Persist fit scores (safe counting)
     * ──────────────────────────────── */
    const urls = ranked.items
      .map((it) => normalizeUrl(it.job.sourceUrl))
      .filter((u) => u.length > 0);

    const uniqueUrls = Array.from(new Set(urls));

    const dbJobs = uniqueUrls.length
      ? await prisma.job.findMany({
          where: { externalUrl: { in: uniqueUrls } },
          select: { id: true, externalUrl: true },
        })
      : [];

    const byExternalUrl = new Map<string, string>();
    for (const j of dbJobs) {
      if (j.externalUrl) byExternalUrl.set(normalizeUrl(j.externalUrl), j.id);
    }

    const results = await Promise.all(
      ranked.items.map(async (item) => {
        const url = normalizeUrl(item.job.sourceUrl);
        if (!url) return false;

        const jobId = byExternalUrl.get(url);
        if (!jobId) {
          console.warn(`${LOG_PREFIX} Job ID not found for URL: ${url}`);
          return false;
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

        return true;
      })
    );

    const persistedCount = results.filter((x) => x).length;
    console.info(
      `${LOG_PREFIX} Successfully persisted ${persistedCount} FitScores.`
    );
    console.timeEnd(`${LOG_PREFIX} scanJobs total`);

    // TODO: step 7) Cache “view” per user/cluster
    return ranked.items;
  },
};

export default recommendationService;
