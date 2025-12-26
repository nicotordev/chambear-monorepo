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
/* =========================
 * Client class (LLM)
 * ========================= */

export class JobLlmClient {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly retry: RetryOptions;

  public constructor(opts: JobLlmClientOptions = {}) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    this.model = opts.model ?? "gpt-4.1-mini";
    this.temperature = opts.temperature ?? 0.2;
    this.retry = {
      maxRetries: opts.maxRetries ?? 3,
      retryBaseDelayMs: opts.retryBaseDelayMs ?? 400,
    };
  }

  private parseJsonStrict<T>(text: string, schema: z.ZodType<T>): T {
    const raw = text.trim();
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start < 0 || end < 0 || end <= start) {
        throw new Error("Model did not return valid JSON");
      }
      parsed = JSON.parse(raw.slice(start, end + 1));
    }

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
    const urls = input.urls.map((u) => u.trim()).filter((u) => u.length > 0);

    const deduped = Array.from(new Set(urls));
    if (deduped.length === 0) return { items: [] };

    const system = this.buildUrlScoringSystemPrompt(input.userContext);
    const batches = chunk(deduped, batchSize);

    const all: ScoredUrl[] = [];

    // Process batches in parallel
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

          return resp.items.map((it) => ({
            url: it.url,
            score: clamp(it.score, 0, 100),
            kind: it.kind,
            reason: it.reason,
          }));
        } catch (error) {
          console.error("[AI Client] Batch scoring failed", error);
          return [];
        }
      })
    );

    for (const batchResult of results) {
      all.push(...batchResult);
    }

    return { items: all };
  }

  private buildExtractJobsSystemPrompt(
    userContext?: string,
    exhaustive?: boolean
  ): string {
    const base = `
You extract job postings from a SINGLE web page converted to Markdown.

Return JSON ONLY:
{
  "pageIsJobRelated": true/false,
  "pageKind": "job_listing" | "jobs_index" | "careers" | "login_or_gate" | "blog_or_news" | "company_about" | "irrelevant",
  "pageReason": "short explanation",
  "jobs": [ { jobPosting } ]
}

jobPosting fields:
- title (required)
- company, location (optional)
- remote: "remote" | "hybrid" | "on_site" | "unknown"
- employmentType: "full_time" | "part_time" | "contract" | "internship" | "temporary" | "unknown"
- seniority: "junior" | "mid" | "senior" | "staff" | "lead" | "principal" | "unknown"
- team (optional)
- descriptionMarkdown (optional, keep it compact)
- responsibilities, requirements, niceToHave: arrays of strings (optional)
- compensation (optional)
- applyUrl (optional, must be a URL)
- sourceUrl (required; must equal the provided source url)

Rules:
- Use ONLY the provided markdown content
- If page is not job-related, set pageIsJobRelated=false and jobs=[]
- If multiple jobs exist, extract as many as are clearly present
- Do not hallucinate missing details
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
      sourceUrl: input.url,
    }));

    return {
      pageIsJobRelated: resp.pageIsJobRelated,
      pageKind: resp.pageKind,
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

    // normalize + enforce topK
    const items = resp.items
      .map((it) => ({
        job: it.job,
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
You are an expert at generating Google Search Dorks for finding specific job postings.
Based on the user's profile, generate advanced search queries to find relevant job listings.

Use operators like: site:, intitle:, inurl:, "exact phrase", AND, OR.
Focus on finding FRESH content (e.g. using date filters is handled by the caller, but you can suggest structure).

Return JSON ONLY:
{
  "queries": [
    { "query": "intitle:software engineer ...", "site": "greenhouse.io", "location": "Remote" }
  ]
}
`.trim();

    const user = {
      userContext,
      limit,
      platforms: [
        "greenhouse.io",
        "lever.co",
        "ashbyhq.com",
        "workday.com",
        "icims.com",
        "smartrecruiters.com",
      ],
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
   * End-to-end helper (optional):
   * - you pass candidates urls
   * - it scores
   * - you provide fetchMarkdown (BrightData client wrapper)
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

    const scoredResp = await this.scoreUrls({
      urls: params.urls,
      userContext: params.userContext,
      batchSize: params.batchSize,
    });

    const filtered = scoredResp.items
      .filter((it) => {
        if (it.kind === "job_listing")
          return it.score >= Math.max(55, minScoreToScrape);
        if (it.kind === "jobs_index")
          return it.score >= Math.max(60, minScoreToScrape);
        if (it.kind === "careers")
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

    for (const it of filtered) {
      const md = await params.fetchMarkdown(it.url);

      const extraction = await this.extractJobsFromMarkdown({
        url: it.url,
        markdown: md,
        userContext: params.userContext,
        exhaustive: params.exhaustiveExtraction ?? true,
      });

      pages.push({ url: it.url, scored: it, markdown: md, extraction });
      allJobs.push(...extraction.jobs);
    }

    return { scored: scoredResp.items, pages, jobs: allJobs };
  }

  /**
   * NEW: Pinecone retrieve + LLM rerank end-to-end
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
