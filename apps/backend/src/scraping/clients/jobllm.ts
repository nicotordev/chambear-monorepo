import { OpenAI } from "openai";
import type { ResponsesModel } from "openai/resources/shared.mjs";
import { z } from "zod";
import {
  EMPLOYMENT_TYPE_MAP,
  SENIORITY_MAP,
  URL_KIND_MAP,
  WORK_MODE_MAP,
} from "../../constants/maps";
import {
  canonicalizeJobs,
  dedupeCanonicalJobs,
} from "../../domain/jobs/canonicalization";
import { UrlKind } from "../../lib/generated";
import { chunk, clamp, withRetry } from "../../lib/utils/common";
import { assertNonEmpty, normalizeUrl } from "../../lib/utils/misc-utils";
import {
  ExtractJobsResponseSchema,
  GenerateSearchDorksResponseSchema,
  RankJobsResponseSchema,
  ScoreUrlsResponseSchema,
} from "../../schemas/scraping";
import {
  EmbedFn,
  ExtractJobsInput,
  ExtractJobsOutput,
  FetchMarkdown,
  JobLlmClientOptions,
  JobPosting,
  RankJobsInput,
  RankJobsOutput,
  RetryOptions,
  ScoreUrlsInput,
  ScoreUrlsOutput,
  ScoredUrl,
} from "../../types/ai";
import { PineconeJobsClient } from "./ai";

/* =========================
 * Client class (LLM)
 * ========================= */

export class JobLlmClient {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly retry: RetryOptions;

  public constructor(opts: JobLlmClientOptions = {}) {
    const apiKey = assertNonEmpty(process.env.OPENAI_API_KEY, "OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey });

    this.model = opts.model ?? "gpt-4.1-mini";
    this.temperature = opts.temperature ?? 0.2;
    this.retry = {
      maxRetries: 3,
      retryBaseDelayMs: 400,
    };
  }

  private removeNulls(obj: unknown): unknown {
    if (obj === null) return undefined;
    if (Array.isArray(obj)) {
      return obj.map((v) => this.removeNulls(v));
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.removeNulls(v)])
      );
    }
    return obj;
  }

  private parseJsonStrict<T>(text: string, schema: z.ZodType<T>): T {
    const raw = text.trim();
    let parsed: unknown;

    const tryParse = (s: string): unknown => JSON.parse(s);

    try {
      parsed = tryParse(raw);
    } catch {
      // Try to salvage: prefer object, then array
      const objStart = raw.indexOf("{");
      const objEnd = raw.lastIndexOf("}");
      if (objStart >= 0 && objEnd > objStart) {
        parsed = tryParse(raw.slice(objStart, objEnd + 1));
        parsed = this.removeNulls(parsed);
        return schema.parse(parsed);
      }

      const arrStart = raw.indexOf("[");
      const arrEnd = raw.lastIndexOf("]");
      if (arrStart >= 0 && arrEnd > arrStart) {
        parsed = tryParse(raw.slice(arrStart, arrEnd + 1));
        parsed = this.removeNulls(parsed);
        return schema.parse(parsed);
      }

      throw new Error("Model did not return valid JSON");
    }

    parsed = this.removeNulls(parsed);
    return schema.parse(parsed);
  }

  private async callJson<T>(
    system: string,
    user: unknown,
    schema: z.ZodType<T>,
    overrideModel?: ResponsesModel
  ): Promise<T> {
    const run = async (): Promise<T> => {
      const res = await this.openai.responses.create({
        model: overrideModel ?? this.model,
        temperature: this.temperature,
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
      });

      const out = (res.output_text ?? "").trim();
      if (out.length === 0)
        throw new Error("OpenAI returned empty output_text");

      return this.parseJsonStrict(out, schema);
    };

    return withRetry(run, this.retry);
  }

  private buildUrlScoringSystemPrompt(userContext?: string): string {
    const base = `
You are a URL classifier for discovering job pages to scrape.

Return JSON ONLY:
{ "items": [ { "url": "...", "score": 0-100, "kind": "...", "reason": "..." } ] }

kind must be one of:
"job_listing" | "jobs_index" | "careers" | "login_or_gate" | "blog_or_news" | "company_about" | "irrelevant"

Rules:
- One output item per input URL, preserve order, do NOT invent URLs.
- Use only URL patterns + domain cues (do not fetch pages).

Scoring:
- 95-100: ATS job listing OR direct job posting page
- 80-94: ATS jobs index / search page listing multiple jobs
- 65-79: careers landing page that likely links to listings
- 0-64: everything else (do not waste scraping budget)

Hard negatives (always <= 10):
- Blog/news/articles, press, about pages
- Anything requiring login/captcha to view job content
- Generic company pages unrelated to hiring

`.trim();

    if (!userContext || userContext.trim().length === 0) return base;

    return `${base}

User context (optional; use only as a mild prior):
${userContext.trim()}
`.trim();
  }

  public async scoreUrls(input: ScoreUrlsInput): Promise<ScoreUrlsOutput> {
    const batchSize = input.batchSize ?? 25;

    // Keep original order (and duplicates) for output contract
    const original = input.urls.map(normalizeUrl).filter((u) => u.length > 0);
    if (original.length === 0) return { items: [] };

    // Unique list only for efficiency; we'll map back later
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const u of original) {
      if (!seen.has(u)) {
        seen.add(u);
        unique.push(u);
      }
    }

    const system = this.buildUrlScoringSystemPrompt(input.userContext);
    const batches = chunk(unique, batchSize);

    const results = await Promise.all(
      batches.map(async (b) => {
        try {
          const resp = await this.callJson(
            system,
            { urls: b },
            ScoreUrlsResponseSchema
          );

          if (resp.items.length !== b.length) {
            console.warn(
              `[AI Client] Expected ${b.length} items, got ${resp.items.length}. Some items might be missing.`
            );
          }

          const normalized: ScoredUrl[] = resp.items.map((it) => ({
            url: it.url,
            score: clamp(it.score, 0, 100),
            kind: URL_KIND_MAP[it.kind] ?? UrlKind.IRRELEVANT,
            reason: it.reason,
          }));

          return normalized;
        } catch (error) {
          console.error("[AI Client] Batch scoring failed", error);
          return [] as ScoredUrl[];
        }
      })
    );

    const byUrl = new Map<string, ScoredUrl>();
    for (const batch of results) {
      for (const it of batch) {
        const key = normalizeUrl(it.url);
        // preserve first answer for that URL (stable)
        if (!byUrl.has(key)) byUrl.set(key, it);
      }
    }

    // Rebuild outputs exactly aligned to original list (including duplicates)
    const items: ScoredUrl[] = original.map((u) => {
      const hit = byUrl.get(u);
      if (hit) return hit;

      // fallback if model omitted something
      return {
        url: u,
        score: 0,
        kind: UrlKind.IRRELEVANT,
        reason: "Missing model output for this URL; defaulting to irrelevant.",
      };
    });

    return { items };
  }

  private buildExtractJobsSystemPrompt(
    userContext?: string,
    exhaustive?: boolean
  ): string {
    const base = `
    ### SYSTEM ROLE
    You are a precision Data Extraction Engine. Your specific task is to parse a raw Markdown representation of a webpage and extract structured job data into a strict JSON format.

    ### INPUT DATA
    You will receive:
    1. "sourceUrl": The URL where the content originated.
    2. "markdown": The raw content of the page.

    ### CLASSIFICATION LOGIC
    First, analyze the "pageKind":
    - "job_listing": A detailed page for a specific single role.
    - "jobs_index": A list/board containing multiple job summaries/links.
    - "careers": A general "Work with us" landing page (often has no specific listings, just culture info).
    - "login_or_gate": Page requires auth or is an ATS login screen.
    - "blog_or_news": Article talking about jobs/company, not a listing.
    - "irrelevant": No hiring intent found.

    ### EXTRACTION RULES
    1. **Strict JSON Only**: No markdown formatting, no conversation.
    2. **No Hallucination**: If a field (like salary or team) is not explicitly present in the text, omit it. Do not guess.
    3. **Null Handling**: Do NOT use null. If a field is missing, omit the key entirely from the JSON object.
    4. **Enum Normalization**:
       - **Remote**: Detect "Remote", "Work from home", "Telecommute" -> "remote". Detect "Hybrid" -> "hybrid". Default to "on_site" if a specific office location is mandatory and no remote option is mentioned. Else "unknown".
       - **Seniority**: Map "Sr", "Senior" -> "senior"; "Principal" -> "principal"; "Staff" -> "staff"; "Lead", "Manager" -> "lead"; "Entry Level", "Junior" -> "junior". Default "unknown".
       - **EmploymentType**: Map "Contract", "Contractor" -> "contract"; "Full-time" -> "full_time".
    5. **Source URL**: The output "sourceUrl" field must exactly match the input provided sourceUrl.

    ### OUTPUT SCHEMA
    Return this JSON structure:
    {
      "pageIsJobRelated": boolean,
      "pageKind": "job_listing" | "jobs_index" | "careers" | "login_or_gate" | "blog_or_news" | "company_about" | "irrelevant",
      "pageReason": "Brief reasoning for classification",
      "jobs": [
        {
          "title": "string (Required)",
          "company": "string (Optional)",
          "location": "string (Optional)",
          "remote": "remote" | "hybrid" | "on_site" | "unknown",
          "employmentType": "full_time" | "part_time" | "contract" | "internship" | "temporary" | "unknown",
          "seniority": "junior" | "mid" | "senior" | "staff" | "lead" | "principal" | "unknown",
          "team": "string (Optional)",
          "descriptionMarkdown": "string (Compact markdown summary, Optional)",
          "responsibilities": ["string", "string"],
          "requirements": ["string", "string"],
          "niceToHave": ["string", "string"],
          "skills": ["string", "string (Tech stack, tools, languages, frameworks - e.g. 'React', 'TypeScript', 'AWS')"],
          "compensation": "string (Optional - raw text e.g. '$100k - $120k')",
          "applyUrl": "string (Valid Absolute URL only, Optional)",
          "sourceUrl": "string (Required, strictly copy from input)"
        }
      ]
    }
`.trim();

    const mode =
      exhaustive === true
        ? "Extraction mode: EXHAUSTIVE (capture as many postings as present)."
        : "Extraction mode: SELECTIVE (capture only clear postings).";

    if (!userContext || userContext.trim().length === 0) {
      return `${base}\n\n${mode}`.trim();
    }

    return `${base}

${mode}

User context (optional; DO NOT invent facts to match it):
${userContext.trim()}
`.trim();
  }

  public async extractJobsFromMarkdown(
    input: ExtractJobsInput
  ): Promise<ExtractJobsOutput> {
    const system = this.buildExtractJobsSystemPrompt(
      input.userContext,
      input.exhaustive
    );
    const user = {
      sourceUrl: input.url,
      markdown: input.markdown,
    };

    const resp = await this.callJson(
      system,
      user,
      ExtractJobsResponseSchema,
      "gpt-5.2"
    );

    // hard guarantee: every job must point to the same source url we provided
    const jobs = resp.jobs.map((j) => ({
      ...j,
      remote: j.remote ? WORK_MODE_MAP[j.remote] : undefined,
      employmentType: j.employmentType
        ? EMPLOYMENT_TYPE_MAP[j.employmentType]
        : undefined,
      seniority: j.seniority ? SENIORITY_MAP[j.seniority] : undefined,
      sourceUrl: input.url,
    }));

    return {
      pageIsJobRelated: resp.pageIsJobRelated,
      pageKind: URL_KIND_MAP[resp.pageKind] ?? UrlKind.IRRELEVANT,
      pageReason: resp.pageReason,
      jobs,
    };
  }

  private buildRankJobsSystemPrompt(): string {
    return `
  You are a strict job recommender.

  You must BOTH:
  1) Filter out clearly incompatible jobs (reject them).
  2) Rank the remaining jobs by best fit.

  Return JSON ONLY:
  {
    "items": [
      {
        "job": { ... },
        "fitScore": 0-100,
        "rationale": "short",
        "reject": false
      }
    ]
  }

  Rules:
  - Use ONLY the provided job fields. Do NOT hallucinate.
  - "reject": true if ANY is true:
    - Non-software roles (legal/counsel/hr/sales/marketing/accounting/etc.)
    - Location restriction incompatible with the user (e.g. "US only" when user is not US)
    - Requires onsite in a different country and no remote/hybrid option
  - If reject=true, still include the item but set fitScore <= 10 and rationale = a short reject reason.
  - Prefer jobs whose title + skills overlap with the user's stated stack and role.
  - Penalize "junior" if the user signals mid/senior, and penalize "senior/principal" if the user signals junior.
  - Keep rationale under 20 words.

  Output exactly topK items AFTER sorting by fitScore descending (but include rejected items only if not enough remain).
  `.trim();
  }

  public async rankJobs(input: RankJobsInput): Promise<RankJobsOutput> {
    const topK = input.topK ?? 10;
    const system = this.buildRankJobsSystemPrompt();
    const user = {
      userContext: input.userContext,
      jobs: input.jobs,
      topK,
    };

    const resp = await this.callJson(
      system,
      user,
      RankJobsResponseSchema,
      "gpt-5.2"
    );

    const normalized = resp.items.map((it) => ({
      job: {
        ...it.job,
        remote: it.job.remote ? WORK_MODE_MAP[it.job.remote] : undefined,
        employmentType: it.job.employmentType
          ? EMPLOYMENT_TYPE_MAP[it.job.employmentType]
          : undefined,
        seniority: it.job.seniority
          ? SENIORITY_MAP[it.job.seniority]
          : undefined,
      },
      fitScore: clamp(it.fitScore, 0, 100),
      rationale: it.rationale,
      reject: it.reject === true,
    }));

    const sorted = normalized.sort((a, b) => b.fitScore - a.fitScore);

    // If we have enough non-rejected, drop rejected completely
    const nonRejected = sorted.filter((x) => !x.reject);
    const picked =
      nonRejected.length >= topK
        ? nonRejected.slice(0, topK)
        : sorted.slice(0, topK);

    return { items: picked.map(({ reject: _r, ...rest }) => rest) };
  }

  public async generateSearchDorks(
    userContext: string,
    limit: number = 5
  ): Promise<readonly { query: string; site?: string; location?: string }[]> {
    const clampLimit = (n: number): number => {
      const x = Number.isFinite(n) ? Math.floor(n) : 5;
      return Math.max(1, Math.min(10, x));
    };

    const formatIsoDate = (d: Date): string => {
      const pad2 = (v: number): string => String(v).padStart(2, "0");
      const year = d.getUTCFullYear();
      const month = pad2(d.getUTCMonth() + 1);
      const day = pad2(d.getUTCDate());
      return `${year}-${month}-${day}`;
    };

    const daysAgoUtc = (days: number): string => {
      const now = new Date();
      const ms = days * 24 * 60 * 60 * 1000;
      return formatIsoDate(new Date(now.getTime() - ms));
    };

    const safeLimit = clampLimit(limit);
    const afterDateIso = daysAgoUtc(30);

    const system = `
  ### SYSTEM ROLE
  You are an expert Search Logic Engineer specializing in OSINT and Recruitment.
  Your goal is to generate high-precision Google Search Dorks to locate fresh job postings
  directly on company career pages or ATS platforms, bypassing aggregators.

  ### INPUT PROCESSING
  Extract:
  1) Target Role
  2) Tech Stack/Keywords
  3) Target Location / Remote preference
  4) Contractor vs Employee preference (if stated)

  ### HARD CONSTRAINTS (IMPORTANT)
  - Return EXACTLY ${safeLimit} queries.
  - Use ONLY these 4 templates (pick the best ones; do not invent new templates):
    T1) site:{ATS_DOMAIN} intitle:({ROLE_OR}) ({TECH_OR}) (remote OR "work from home")
    T2) site:{ATS_DOMAIN} ("{ROLE_PHRASE}") ({TECH_OR}) (remote OR "work from home")
    T3) (inurl:careers OR inurl:jobs OR inurl:vacantes OR inurl:trabaja-con-nosotros) intitle:({ROLE_OR}) ({TECH_OR})
    T4) site:{TLD} (inurl:careers OR inurl:jobs OR inurl:vacantes OR inurl:trabaja-con-nosotros) intitle:({ROLE_OR}) ({TECH_OR})

  - Each query MUST:
    1) include EXACTLY ONE of:
       - ATS target: site:greenhouse.io OR site:lever.co OR site:ashbyhq.com OR site:bamboohr.com
       - OR URL-pattern target: inurl:careers/jobs/vacantes/trabaja-con-nosotros (+ optional site:.tld)
    2) include at most 3 tech keywords total (keep it broad).
    3) include aggregator exclusions:
       -site:linkedin.com -site:indeed.com -site:glassdoor.com
    4) include info exclusions:
       -inurl:blog -inurl:news -intitle:resume -intitle:cv
    5) include freshness token:
       after:${afterDateIso}
  - If user prefers contractor/freelance, include ONE of:
    (contract OR contractor OR freelance)

  ### LOCALIZATION & LANGUAGE
  - If target is local to a country, add site:.<tld> (e.g., site:.cl).
  - If role is global/remote, keep English role tokens.
  - Keep queries under ~32 terms.

  ### OUTPUT FORMAT
  Return JSON ONLY:
  {
    "queries": [
      { "query": "The raw search string", "strategy": "Brief explanation", "estimated_precision": "High|Medium" }
    ]
  }
  `.trim();

    const user = {
      userContext,
      limit: safeLimit,
      afterDateIso,
    };

    const resp = await this.callJson(
      system,
      user,
      GenerateSearchDorksResponseSchema,
      "gpt-5.2"
    );

    // Normalize to your existing return type (query/site/location)
    return resp.queries.slice(0, safeLimit).map((q) => ({
      query: q.query,
      site: q.site,
      location: q.location,
    }));
  }

  public async extractUrlsFromSearchMarkdown(
    markdown: string
  ): Promise<readonly { url: string; title: string }[]> {
    const system = `
You parse SERP results represented as Markdown.

Extract ONLY external organic results that are likely to be job-related pages.

Exclude:
- Ads / sponsored results
- Aggregators and boards: linkedin.com, indeed.com, glassdoor.com, monster.com, ziprecruiter.com, talent.com, jooble.org
- Google internal links and redirects unless you can recover the final URL
- Social: twitter/x.com, facebook, instagram
- Non-job content: blog/news/about pages unless the URL strongly indicates jobs/careers

Prefer:
- ATS domains: greenhouse.io, lever.co, ashbyhq.com, bamboohr.com, workday, icims, smartrecruiters
- URLs containing: /jobs, /careers, /job/, /positions, /vacancies, /join-us, /work-with-us

Return JSON ONLY:
{
  "results": [
    { "url": "...", "title": "..." }
  ]
}
`.trim();

    const schema = z.object({
      results: z.array(
        z.object({
          url: z.string().url(),
          title: z.string().min(1),
        })
      ),
    });

    const resp = await this.callJson(system, { markdown }, schema, "gpt-5.2");

    // cheap dedupe + normalize
    const seen = new Set<string>();
    const out: Array<{ url: string; title: string }> = [];

    for (const r of resp.results) {
      const u = normalizeUrl(r.url);
      if (!u) continue;
      const key = u.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ url: u, title: r.title.trim() });
    }

    return out;
  }

  /**
   * End-to-end helper:
   * - you pass candidate urls
   * - it scores
   * - you provide fetchMarkdown
   * - it extracts jobs from top URLs
   */
  public async scoreThenFetchThenExtractJobs(
    params: Readonly<{
      urls: readonly string[];
      fetchMarkdown: FetchMarkdown;
      userContext?: string;
      batchSize?: number;
      maxToScrape?: number; // default 10
      targetJobs?: number; // default 25
      minScoreToScrape?: number; // default 60
      keepCareers?: boolean; // default true
      exhaustiveExtraction?: boolean; // default true
      concurrency?: number; // default 3
    }>
  ): Promise<
    Readonly<{
      scored: readonly ScoredUrl[];
      pages: readonly Readonly<{
        url: string;
        scored: ScoredUrl;
        markdown: string;
        extraction: ExtractJobsOutput;
      }>[];
      jobs: readonly JobPosting[];
    }>
  > {
    const maxToScrape = params.maxToScrape ?? 10;
    const targetJobs = params.targetJobs ?? 25;
    const minScoreToScrape = params.minScoreToScrape ?? 60;
    const keepCareers = params.keepCareers ?? true;
    const concurrency = params.concurrency ?? 3;

    const scoredResp = await this.scoreUrls({
      urls: params.urls,
      userContext: params.userContext,
      batchSize: params.batchSize,
    });

    // Deduplicate pages by URL for scraping (scoreUrls may contain duplicates)
    const bestByUrl = new Map<string, ScoredUrl>();
    for (const it of scoredResp.items) {
      const key = normalizeUrl(it.url);
      const prev = bestByUrl.get(key);
      if (!prev || it.score > prev.score) bestByUrl.set(key, it);
    }

    const candidates = Array.from(bestByUrl.values());

    const filtered = candidates
      .filter((it) => {
        if (it.kind === UrlKind.JOB_LISTING)
          return it.score >= Math.max(55, minScoreToScrape);
        if (it.kind === UrlKind.JOBS_INDEX)
          return it.score >= Math.max(60, minScoreToScrape);
        if (it.kind === UrlKind.CAREERS)
          return keepCareers && it.score >= Math.max(65, minScoreToScrape);
        return false;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxToScrape);

    const pages: Array<{
      url: string;
      scored: ScoredUrl;
      markdown: string;
      extraction: ExtractJobsOutput;
    }> = [];

    const allJobs: JobPosting[] = [];

    // Chunking logic for controlled concurrency loop
    const chunk = <T>(arr: T[], size: number): T[][] =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    const batches = chunk(filtered, concurrency);

    for (const batch of batches) {
      if (allJobs.length >= targetJobs) break;

      const results = await Promise.all(
        batch.map(async (it) => {
          try {
            const md = await params.fetchMarkdown(it.url);
            const extraction = await this.extractJobsFromMarkdown({
              url: it.url,
              markdown: md,
              userContext: params.userContext,
              exhaustive: params.exhaustiveExtraction ?? true,
            });
            return {
              url: it.url,
              scored: it,
              markdown: md,
              extraction,
            };
          } catch (err) {
            console.error(
              `[JobLLM] Failed to scrape/extract from ${it.url}`,
              err
            );
            return null;
          }
        })
      );

      for (const res of results) {
        if (!res) continue;
        pages.push(res);
        const kind = res.extraction.pageKind;
        const newJobs = res.extraction.jobs.map((j) => ({
          ...j,
          pageKind: kind,
        }));
        allJobs.push(...newJobs);
      }
    }

    const canonicalized = canonicalizeJobs(allJobs);
    const deduped = dedupeCanonicalJobs(canonicalized).map((x) => x.job);

    return { scored: scoredResp.items, pages, jobs: deduped };
  }

  /**
   * Pinecone retrieve + LLM rerank end-to-end
   */
  public async indexAndRankJobs(
    params: Readonly<{
      jobs: readonly JobPosting[];
      userContext: string;
      embed: EmbedFn;
      pinecone?: PineconeJobsClient;
      retrieveTopK?: number; // default 50
      finalTopK?: number; // default 10
      filter?: Readonly<Record<string, unknown>>;
    }>
  ): Promise<RankJobsOutput> {
    const pinecone = params.pinecone ?? new PineconeJobsClient();

    await pinecone.indexJobsToPinecone({
      jobs: params.jobs,
      embed: params.embed,
    });

    const retrieved = await pinecone.retrieveRelevantJobs({
      jobs: params.jobs,
      userContext: params.userContext,
      embed: params.embed,
      topK: params.retrieveTopK ?? 50,
      filter: params.filter,
    });

    console.log(
      `[AI Client] Retrieved ${retrieved.length} jobs from Pinecone for reranking.`
    );

    return this.rankJobs({
      jobs: retrieved.map((r) => r.job),
      userContext: params.userContext,
      topK: params.finalTopK ?? 10,
    });
  }
}
