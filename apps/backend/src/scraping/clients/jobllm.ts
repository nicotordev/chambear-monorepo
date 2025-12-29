import { OpenAI } from "openai";
import { z } from "zod";
import {
  RetryOptions,
  JobLlmClientOptions,
  ScoreUrlsInput,
  ScoreUrlsOutput,
  ScoredUrl,
  ExtractJobsInput,
  ExtractJobsOutput,
  RankJobsInput,
  RankJobsOutput,
  JobPosting,
  EmbedFn,
  FetchMarkdown,
} from "../../types/ai";
import { PineconeJobsClient } from "./ai";
import { withRetry, chunk, clamp } from "../../lib/utils/common";
import {
  ScoreUrlsResponseSchema,
  ExtractJobsResponseSchema,
  RankJobsResponseSchema,
  GenerateSearchDorksResponseSchema,
} from "../../schemas/scraping";
import { UrlKind } from "../../lib/generated";
import {
  URL_KIND_MAP,
  WORK_MODE_MAP,
  EMPLOYMENT_TYPE_MAP,
  SENIORITY_MAP,
} from "../../constants/maps";
import {
  assertNonEmpty,
  mapLimit,
  normalizeUrl,
} from "../../lib/utils/misc-utils";

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
    schema: z.ZodType<T>
  ): Promise<T> {
    const run = async (): Promise<T> => {
      const res = await this.openai.responses.create({
        model: this.model,
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
- 90-100: specific job posting OR job listings/search index
- 70-89: careers page likely linking to jobs
- 40-69: maybe relevant
- 0-39: irrelevant or gated

Heuristics:
- Strong job signals: /jobs, /careers, /job/, /positions, /vacancies, /work-with-us, /join-us
- Platforms: greenhouse.io, lever.co, ashbyhq.com, workday, icims, smartrecruiters => job-related
- Login/captcha/paywall => login_or_gate, low score
- Blog/news/about => not job pages
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

    const resp = await this.callJson(system, user, ExtractJobsResponseSchema);

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
You rank job postings for a candidate based on their preferences.

Return JSON ONLY:
{
  "items": [
    { "job": { ... }, "fitScore": 0-100, "rationale": "short" }
  ]
}

Rules:
- Higher score = better fit.
- Do not hallucinate requirements; use only fields in each job.
- Keep rationale short and specific.
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

    const resp = await this.callJson(system, user, RankJobsResponseSchema);

    const items = resp.items
      .map((it) => ({
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
      }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, topK);

    return { items };
  }

  public async generateSearchDorks(
    userContext: string,
    limit: number = 5
  ): Promise<readonly { query: string; site?: string; location?: string }[]> {
    const system = `
    ### SYSTEM ROLE
    You are an expert Search Logic Engineer specializing in OSINT (Open Source Intelligence) and Recruitment. Your goal is to generate high-precision Google Search Dorks to locate fresh job postings directly on company career pages or ATS (Applicant Tracking Systems) platforms, bypassing low-quality aggregators.

    ### INPUT PROCESSING
    Analyze the user's request to extract:
    1. Target Role: (e.g., "Frontend Developer", "Art Teacher")
    2. Tech Stack/Keywords: (e.g., "React", "TypeScript", "Canvas")
    3. Target Location: (e.g., "Chile", "Remote", "Canada")

    ### SEARCH CONSTRAINT LOGIC
    1. Length & Density: Google Search has a hard limit of ~32 terms.
       * Do NOT use filler words (e.g., "looking for", "best").
       * Concatenate complex "OR" logic using parentheses "()".
    2. Localization & Language:
       * TLD Mapping: If a specific country is targeted, you MUST append "site:.<tld>" (e.g., "site:.cl" for Chile, "site:.ca" for Canada, "site:.de" for Germany).
       * Language Adaptation: Translate the job title and keywords into the primary professional language of the *target* location (e.g., use Spanish terms for a local role in Chile, but English for a global tech role).
    3. Freshness & Exclusion:
       * Always exclude aggregators to find direct listings: "-site:linkedin.com -site:indeed.com -site:glassdoor.com".
       * Exclude purely informational pages: "-intitle:resume -inurl:blog -inurl:news".

    ### OPERATOR STRATEGY
    * ATS Targeting: Use "site:greenhouse.io", "site:lever.co", "site:ashbyhq.com", "site:bamboohr.com" combined with "intitle:<Role>" to find listings not indexed by major boards.
    * URL Patterning: Use "inurl:career", "inurl:jobs", "inurl:vacantes", "inurl:trabaja-con-nosotros" based on the language.

    ### OUTPUT FORMAT
    Return JSON ONLY. Do not output markdown code blocks or conversational text.
    Structure:
    {
      "queries": [
        {
          "query": "The raw search string",
          "strategy": "Brief explanation (e.g., 'Targeting Greenhouse ATS in Canada')",
          "estimated_precision": "High/Medium"
        }
      ]
    }
`.trim();

    const user = {
      userContext,
      limit,
    };

    const resp = await this.callJson(
      system,
      user,
      GenerateSearchDorksResponseSchema
    );
    return resp.queries.slice(0, limit);
  }

  public async extractUrlsFromSearchMarkdown(
    markdown: string
  ): Promise<readonly { url: string; title: string }[]> {
    const system = `
You are an expert at parsing search engine results in Markdown.
Extract all organic search result links.
Ignore ads, internal google links, and navigation links.

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

    const resp = await this.callJson(system, { markdown }, schema);
    return resp.results;
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

    const pages = await mapLimit(filtered, concurrency, async (it) => {
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
    });

    const allJobs: JobPosting[] = [];
    for (const p of pages) {
      const kind = p.extraction.pageKind;
      allJobs.push(
        ...p.extraction.jobs.map((j) => ({
          ...j,
          pageKind: kind,
        }))
      );
    }

    return { scored: scoredResp.items, pages, jobs: allJobs };
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
