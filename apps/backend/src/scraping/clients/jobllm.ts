import { OpenAI } from "openai";
import type { ResponsesModel } from "openai/resources/shared.mjs";
import { z } from "zod";
import { brightdataClient } from ".";
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
import { logger } from "../../lib/logger";
import { chunk, clamp, withRetry } from "../../lib/utils/common";
import { assertNonEmpty, normalizeUrl } from "../../lib/utils/misc-utils";
import {
  ExtractJobsResponseSchema,
  RankJobsResponseSchema,
  ScoreUrlsResponseSchema,
} from "../../schemas/scraping";
import {
  EmbedFn,
  ExtractJobsInput,
  ExtractJobsOutput,
  JobLlmClientOptions,
  JobPosting,
  RankJobsInput,
  RankJobsOutput,
  RetryOptions,
  ScoreUrlsOutput,
  ScoredUrl,
} from "../../types/ai";
import { PineconeJobsClient } from "./ai";
import type { OganicResult } from "./brightdata";

/* =========================
 * Client class (LLM)
 * ========================= */

export class JobLlmClient {
  private _openai: OpenAI | null = null;
  private readonly model: string;
  private readonly temperature: number;
  private readonly retry: RetryOptions;

  public constructor(opts: JobLlmClientOptions = {}) {
    this.model = opts.model ?? "gpt-5.2";
    this.temperature = opts.temperature ?? 0.2;
    this.retry = {
      maxRetries: 3,
      retryBaseDelayMs: 400,
    };
  }

  private get openai(): OpenAI {
    if (!this._openai) {
      const apiKey = assertNonEmpty(
        process.env.OPENAI_API_KEY,
        "OPENAI_API_KEY"
      );
      this._openai = new OpenAI({ apiKey });
    }
    return this._openai;
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

  private normalizeUnicodeEscapes(text: string): string {
    // Fix common model glitches like "\uu2122" while preserving valid escapes.
    let normalized = text.replace(/\\u{2,}([0-9a-fA-F]{4})/g, "\\u$1");
    normalized = normalized.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");
    return normalized;
  }

  private parseJsonStrict<T>(text: string, schema: z.ZodType<T>): T {
    const raw = text.trim();
    const sanitized = this.normalizeUnicodeEscapes(raw);
    let parsed: unknown;

    const tryParse = (s: string): unknown => JSON.parse(s);

    try {
      parsed = tryParse(sanitized);
    } catch {
      // Try to salvage: prefer object, then array
      const objStart = sanitized.indexOf("{");
      const objEnd = sanitized.lastIndexOf("}");
      const arrStart = sanitized.indexOf("[");
      const arrEnd = sanitized.lastIndexOf("]");

      const start =
        objStart !== -1 && (arrStart === -1 || objStart < arrStart)
          ? objStart
          : arrStart;
      const end = objEnd > arrEnd ? objEnd : arrEnd;

      if (start >= 0 && end > start) {
        try {
          parsed = tryParse(sanitized.slice(start, end + 1));
        } catch (innerErr) {
          logger.error(
            { text: raw, err: innerErr },
            "[JobLLM] Failed to salvage JSON"
          );
          throw new Error("Model did not return valid JSON");
        }
      } else {
        throw new Error("Model did not return valid JSON");
      }
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

  private buildParseProfileSystemPrompt(): string {
    return `
    You are a high-precision Resume Parser. Your task is to extract structured information from a candidate's resume text and return it in a strictly defined JSON format.

    Rules:
    - Return ONLY valid JSON.
    - If a field is missing, omit it or use an empty array/string as appropriate for the schema.
    - Dates must be in YYYY-MM-DD format (approximate if only month/year is given).
    - Summary should be a compelling professional overview (at least 20 words).
    - Map skill levels to: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT. Default to INTERMEDIATE.
    - Target roles should be a list of job titles the candidate is qualified for.

    Desired JSON Schema:
    {
      "name": "Full Name",
      "headline": "Professional title/headline",
      "summary": "Professional summary",
      "location": "City, Country",
      "yearsExperience": number,
      "targetRoles": ["string"],
      "skills": [{ "skillName": "string", "level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }],
      "experiences": [{ "title": "string", "company": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "current": boolean, "summary": "string" }],
      "educations": [{ "school": "string", "degree": "string", "field": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "current": boolean, "description": "string" }],
      "certifications": [{ "name": "string", "issuingOrganization": "string", "issueDate": "YYYY-MM-DD", "credentialId": "string", "credentialUrl": "string" }]
    }
    `.trim();
  }

  public async parseProfileFromText(text: string): Promise<any> {
    const system = this.buildParseProfileSystemPrompt();
    const user = { resumeText: text };

    // We can use a simpler schema for the model to follow, but we want the full input
    return this.callJson(system, user, z.any(), "gpt-5.2");
  }

  private buildUrlScoringSystemPrompt(userContext: string): string {
    const base = `
You are a URL classifier for discovering job pages to scrape.

Return JSON ONLY:
{ "items": [ { "url": "...", "score": 0-100, "kind": "...", "reason": "..." } ] }

kind must be one of:
"job_listing" | "jobs_index" | "careers" | "login_or_gate" | "blog_or_news" | "company_about" | "irrelevant"

Rules:
- One output item per input URL, preserve order, do NOT invent URLs.
- Use only URL patterns + domain cues (do not fetch pages).
- Be PERMISSIVE: If a URL looks like it MIGHT lead to a job or a list of jobs, give it a chance with a higher score.

Scoring:
- 90-100: ATS job listing, direct job posting, or high-confidence job page.
- 70-89: Jobs index, search page, or careers landing page likely to have listings.
- 40-69: Potential job-related page, generic careers page, or company page with hiring cues.
- 0-39: Definitely irrelevant (e.g., privacy policy, generic footer links, unrelated blog posts).

Hard negatives (always <= 5):
- Clear login gates, captchas, or password-protected areas.
- Terms of service, privacy policy, cookie settings.
`.trim();

    if (!userContext || userContext.trim().length === 0) return base;

    return (
      `${base}` +
      `

User context (optional; use only as a mild prior):
${userContext.trim()}
`.trim()
    );
  }

  public async scoreUrls(
    data: readonly OganicResult[],
    userContext: string
  ): Promise<ScoreUrlsOutput> {
    logger.debug({ count: data.length }, "Scoring URLs");

    // Unique list only for efficiency; we'll map back later
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const u of data) {
      const link = u.link ?? u.url;
      if (!link) continue;
      if (!seen.has(link)) {
        seen.add(link);
        unique.push(link);
      }
    }

    const system = this.buildUrlScoringSystemPrompt(userContext);
    const batches = chunk(unique, 25);

    const results = await Promise.all(
      batches.map(async (b) => {
        try {
          const resp = await this.callJson(
            system,
            { urls: b },
            ScoreUrlsResponseSchema
          );

          if (resp.items.length !== b.length) {
            logger.warn(
              { expected: b.length, got: resp.items.length },
              "[AI Client] Mismatch in scored items count"
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
          logger.error({ err: error }, "[AI Client] Batch scoring failed");
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
    const items: ScoredUrl[] = data.map((u) => {
      const link = u.link ?? u.url ?? "";
      const hit = byUrl.get(link);
      if (hit) return hit;

      // fallback if model omitted something
      return {
        url: link,
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
    1. **Strict JSON Only**: No markdown formatting (no \`\`\`json blocks), no conversation.
    2. **No Hallucination**: If a field (like salary or team) is not explicitly present in the text, omit it. Do not guess.
    3. **Null Handling**: Do NOT use null. If a field is missing, omit the key entirely from the JSON object.
    4. **Enum Normalization**:
       - **Remote**: Detect "Remote", "Work from home", "Telecommute" -> "remote". Detect "Hybrid" -> "hybrid". Default to "on_site" if a specific office location is mandatory and no remote option is mentioned. Else "unknown".
       - **Seniority**: Map "Sr", "Senior" -> "senior"; "Principal" -> "principal"; "Staff" -> "staff"; "Lead", "Manager" -> "lead"; "Entry Level", "Junior" -> "junior". Default "unknown".
       - **EmploymentType**: Map "Contract", "Contractor" -> "contract"; "Full-time" -> "full_time".
    5. **URLs**:
       - "sourceUrl": Must exactly match the input provided sourceUrl.
       - "applyUrl": Extract the direct application link. If it is a relative URL (e.g. "/jobs/123"), leave it as is; it will be resolved later.

    6. **Content Extraction**:
       - "descriptionMarkdown": Provide a meaningful summary of the role (at least 2-3 paragraphs if possible). Include the company's mission, the team's goals, and the primary focus of the position. DO NOT leave this empty if there is text on the page.
       - "skills": Focus on technical keywords (e.g., "TypeScript", "Node.js", "PostgreSQL").

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
          "descriptionMarkdown": "string (Detailed markdown summary, REQUIRED if possible)",
          "responsibilities": ["string", "string"],
          "requirements": ["string", "string"],
          "niceToHave": ["string", "string"],
          "skills": ["string", "string (Tech stack, tools, languages, frameworks)"],
          "compensation": "string (Optional - raw text e.g. '$100k - $120k')",
          "applyUrl": "string (Optional)",
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
      return (
        `${base}` +
        `

${mode}`.trim()
      );
    }

    return (
      `${base}` +
      `

${mode}` +
      `

User context (optional; DO NOT invent facts to match it):
${userContext.trim()}
`.trim()
    );
  }

  public async extractJobsFromMarkdown(
    input: ExtractJobsInput
  ): Promise<ExtractJobsOutput> {
    logger.debug({ url: input.url }, "Extracting jobs from markdown");
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
        "rationale": {
          "match": ["matched_skill_1", "matched_skill_2"],
          "missing": ["missing_critical_skill_1"],
          "reason": "Short explanation (max 20 words)"
        },
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
  - If reject=true, still include the item but set fitScore <= 10.
  - Prefer jobs whose title + skills overlap with the user's stated stack and role.
  - Populate "match" with skills/requirements the user has.
  - Populate "missing" with critical skills/requirements the user clearly lacks.
  - Penalize "junior" if the user signals mid/senior, and penalize "senior/principal" if the user signals junior.
  - Output exactly topK items AFTER sorting by fitScore descending (but include rejected items only if not enough remain).
  `.trim();
  }

  public async rankJobs(input: RankJobsInput): Promise<RankJobsOutput> {
    const topK = input.topK ?? 10;
    logger.debug({ jobCount: input.jobs.length, topK }, "Ranking jobs");
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
  ): Promise<{ query: string }[]> {
    // 1. One-line clamp (1 to 10)
    const count = Math.min(Math.max(limit, 1), 10);

    // 2. Dynamic date calculation (3 months ago)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const dateStr = threeMonthsAgo.toISOString().split("T")[0];

    logger.info({ count }, "Generating search dorks");

    // 3. Simplified Prompt: Focuses on behavior, not hardcoded keyword lists
    const systemPrompt = `
    You are an expert at Google Dorking for job hunting.
    Generate ${count} distinct, high-recall search queries based on the user's career profile.

    ### PROFILE SUMMARY:
    ${userContext}

    ### RULES:
    1. RECALL IS TOP PRIORITY. Keep queries broad enough to find results.
    2. MAXIMUM 6-8 keywords per query. Do NOT over-specify.
    3. Use operators: site:, intitle:, inurl:, OR.
    4. Mix specific ATS sites (site:greenhouse.io, site:lever.co, etc.) with broad "careers" page searches.
    5. At least one query MUST be broad (e.g., intitle:careers "Software Engineer" "Remote").
    6. Do NOT use job aggregators (LinkedIn, Indeed, Glassdoor).
    7. Include exactly one query using "after:${dateStr}".
    8. Output JSON: { "queries": [ { "query": "..." } ] }

    Example good query: site:lever.co intitle:"Software Engineer" "TypeScript" remote
    Example bad query (too long): site:lever.co intitle:"Full Stack Developer" (TypeScript OR React OR Node.js OR PostgreSQL) (Remote OR "Latin America") -linkedin -indeed
    `;

    // 4. Schema validation
    const schema = z.object({
      queries: z.array(z.object({ query: z.string() })).length(count),
    });

    const resp = await this.callJson(
      systemPrompt,
      userContext,
      schema,
      "gpt-5.2"
    );

    return resp.queries;
  }

  /**
   * End-to-end helper:
   * - you pass candidate urls
   * - it scores
   * - you provide fetchMarkdown
   * - it extracts jobs from top URLs
   */
  public async scoreThenFetchThenExtractJobs(
    data: readonly OganicResult[],
    userContext: string
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
    const maxToScrape = 15; // increased from 10
    const targetJobs = 25;
    const minScoreToScrape = 50; // lowered from 60
    const keepCareers = true;
    const concurrency = 3;

    logger.info(
      { urlCount: data.length, maxToScrape },
      "Starting score -> fetch -> extract pipeline"
    );

    const scoredResp = await this.scoreUrls(data, userContext);

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
        if (it.kind === UrlKind.JOB_LISTING) return it.score >= 40; // More permissive for direct listings
        if (it.kind === UrlKind.JOBS_INDEX) return it.score >= 45;
        if (it.kind === UrlKind.CAREERS) return keepCareers && it.score >= 50;
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
            const md = await brightdataClient.scrapeRequestAsMarkdown(it.url);
            const extraction = await this.extractJobsFromMarkdown({
              url: it.url,
              markdown: md,
              userContext,
              exhaustive: true,
            });
            return {
              url: it.url,
              scored: it,
              markdown: md,
              extraction,
            };
          } catch (err) {
            logger.error(
              { url: it.url, err },
              "[JobLLM] Failed to scrape/extract"
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

    logger.info(
      { count: retrieved.length },
      "[AI Client] Keep-set retrieved from Pinecone for reranking"
    );

    return this.rankJobs({
      jobs: retrieved.map((r) => r.job),
      userContext: params.userContext,
      topK: params.finalTopK ?? 10,
    });
  }

  public async optimizeCv(
    userContext: string,
    jobDescription: string
  ): Promise<string> {
    const system = `
    You are an expert Resume Optimizer (ATS-proof).
    Your goal is to rewrite the user's resume content to better match the target job description.

    Rules:
    - Keep the output in Markdown format.
    - Focus on highlighting relevant skills and experiences.
    - Use strong action verbs.
    - Mirror the language and keywords from the job description (without sounding robotic).
    - Maintain truthfulness (do not invent experiences).

    Return ONLY the optimized resume content in Markdown.
    `.trim();

    const user = {
      userContext,
      jobDescription,
    };

    const run = async (): Promise<string> => {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
      });

      const out = res.choices[0]?.message?.content?.trim() ?? "";
      if (out.length === 0) throw new Error("OpenAI returned empty output");
      return out;
    };

    return withRetry(run, this.retry);
  }

  public async generateCoverLetter(
    userContext: string,
    jobDescription: string
  ): Promise<string> {
    const system = `
    You are an expert Cover Letter Writer.
    Your goal is to write a compelling, personalized cover letter for the user targeting a specific job.

    Rules:
    - Keep the output in Markdown format.
    - Tone: Professional, enthusiastic, and confident.
    - Structure:
        - Hook: Why you are interested.
        - Body: Connect your skills/experience to their needs.
        - Closing: Call to action.
    - Use specific details from the user context and job description.

    Return ONLY the cover letter content in Markdown.
    `.trim();

    const user = {
      userContext,
      jobDescription,
    };

    const run = async (): Promise<string> => {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
      });

      const out = res.choices[0]?.message?.content?.trim() ?? "";
      if (out.length === 0) throw new Error("OpenAI returned empty output");
      return out;
    };

    return withRetry(run, this.retry);
  }
}
