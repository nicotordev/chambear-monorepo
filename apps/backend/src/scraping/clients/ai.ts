import { Pinecone } from "@pinecone-database/pinecone";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

/** You can replace this with your own requireEnv helper */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("rate limit") ||
    m.includes("429") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("500") ||
    m.includes("connection") ||
    m.includes("network")
  );
}

type RetryOptions = Readonly<{
  maxRetries: number;
  retryBaseDelayMs: number;
}>;

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  let last: unknown = undefined;
  for (let i = 0; i <= opts.maxRetries; i += 1) {
    try {
      return await fn();
    } catch (e: unknown) {
      last = e;
      const canRetry = i < opts.maxRetries && isRetryable(e);
      if (!canRetry) throw e;
      const delay = Math.round(opts.retryBaseDelayMs * Math.pow(2, i));
      await sleep(delay);
    }
  }
  throw last instanceof Error ? last : new Error("Unknown error after retries");
}

/* =========================================================
 * Types (keep your app types outside; this client is general)
 * ========================================================= */

export type UrlKind =
  | "job_listing"
  | "jobs_index"
  | "careers"
  | "login_or_gate"
  | "blog_or_news"
  | "company_about"
  | "irrelevant";

export type ScoredUrl = Readonly<{
  url: string;
  score: number; // 0..100
  kind: UrlKind;
  reason: string;
}>;

export type ScoreUrlsInput = Readonly<{
  urls: readonly string[];
  userContext?: string;
  batchSize?: number; // default 25
}>;

export type ScoreUrlsOutput = Readonly<{
  items: readonly ScoredUrl[];
}>;

export type FetchMarkdown = (url: string) => Promise<string>;

export type ExtractJobsInput = Readonly<{
  url: string;
  markdown: string;
  userContext?: string;
  /**
   * If true, the model will try to include as many postings as present on the page.
   * If false, it can be more selective.
   */
  exhaustive?: boolean;
}>;

export type JobPosting = Readonly<{
  title: string;
  company?: string;
  location?: string;
  remote?: "remote" | "hybrid" | "on_site" | "unknown";
  employmentType?:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship"
    | "temporary"
    | "unknown";
  seniority?:
    | "junior"
    | "mid"
    | "senior"
    | "staff"
    | "lead"
    | "principal"
    | "unknown";
  team?: string;
  descriptionMarkdown?: string;
  responsibilities?: readonly string[];
  requirements?: readonly string[];
  niceToHave?: readonly string[];
  compensation?: string;
  applyUrl?: string;
  sourceUrl: string;
}>;

export type ExtractJobsOutput = Readonly<{
  pageIsJobRelated: boolean;
  pageKind: UrlKind;
  pageReason: string;
  jobs: readonly JobPosting[];
}>;

export type RankJobsInput = Readonly<{
  jobs: readonly JobPosting[];
  userContext: string;
  topK?: number; // default 10
}>;

export type RankedJob = Readonly<{
  job: JobPosting;
  fitScore: number; // 0..100
  rationale: string;
}>;

export type RankJobsOutput = Readonly<{
  items: readonly RankedJob[];
}>;

export type JobLlmClientOptions = Readonly<{
  apiKey?: string;
  model?: string; // default gpt-4.1-mini
  temperature?: number; // default 0.2
  maxRetries?: number; // default 3
  retryBaseDelayMs?: number; // default 400
}>;

/* =========================
 * Zod schemas for strict parsing
 * ========================= */

const UrlKindSchema = z.enum([
  "job_listing",
  "jobs_index",
  "careers",
  "login_or_gate",
  "blog_or_news",
  "company_about",
  "irrelevant",
]);

const ScoredUrlSchema = z.object({
  url: z.string().url(),
  score: z.number().min(0).max(100),
  kind: UrlKindSchema,
  reason: z.string().min(1),
});

const ScoreUrlsResponseSchema = z.object({
  items: z.array(ScoredUrlSchema),
});

const RemoteSchema = z.enum(["remote", "hybrid", "on_site", "unknown"]);
const EmploymentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "unknown",
]);
const SenioritySchema = z.enum([
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "principal",
  "unknown",
]);

const JobPostingSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  remote: RemoteSchema.optional(),
  employmentType: EmploymentTypeSchema.optional(),
  seniority: SenioritySchema.optional(),
  team: z.string().min(1).optional(),
  descriptionMarkdown: z.string().min(1).optional(),
  responsibilities: z.array(z.string().min(1)).optional(),
  requirements: z.array(z.string().min(1)).optional(),
  niceToHave: z.array(z.string().min(1)).optional(),
  compensation: z.string().min(1).optional(),
  applyUrl: z.string().url().optional(),
  sourceUrl: z.string().url(),
});

const ExtractJobsResponseSchema = z.object({
  pageIsJobRelated: z.boolean(),
  pageKind: UrlKindSchema,
  pageReason: z.string().min(1),
  jobs: z.array(JobPostingSchema),
});

const RankedJobSchema = z.object({
  job: JobPostingSchema,
  fitScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
});

const RankJobsResponseSchema = z.object({
  items: z.array(RankedJobSchema),
});

const SearchDorkQuerySchema = z.object({
  query: z.string().min(1),
  site: z.string().optional(),
  location: z.string().optional(),
});

const GenerateSearchDorksResponseSchema = z.object({
  queries: z.array(SearchDorkQuerySchema),
});

/* =========================
 * Pinecone retrieval types
 * ========================= */

export type EmbedFn = (text: string) => Promise<number[]>;

export type PineconeJobsClientOptions = Readonly<{
  apiKey?: string;
  indexName?: string;
  namespace?: string;
}>;

export type PineconeJobMetadata = Readonly<{
  title: string;
  company?: string;
  location?: string;
  remote: NonNullable<JobPosting["remote"]>;
  employmentType: NonNullable<JobPosting["employmentType"]>;
  seniority: NonNullable<JobPosting["seniority"]>;
  sourceUrl: string;
  applyUrl?: string;
}>;

export type PineconeJobVector = Readonly<{
  id: string;
  values: readonly number[];
  metadata?: PineconeJobMetadata;
}>;

export type PineconeQueryMatch = Readonly<{
  id: string;
  score: number;
  metadata?: PineconeJobMetadata;
}>;

export type RetrievedJob = Readonly<{
  job: JobPosting;
  retrievalScore: number;
}>;

function renderList(items?: readonly string[]): string {
  if (!items || items.length === 0) return "";
  return `- ${items.join("\n- ")}`;
}

export function jobToEmbeddingText(job: JobPosting): string {
  return `
Title: ${job.title}
Company: ${job.company ?? ""}
Location: ${job.location ?? ""}
Remote: ${job.remote ?? "unknown"}
EmploymentType: ${job.employmentType ?? "unknown"}
Seniority: ${job.seniority ?? "unknown"}
Team: ${job.team ?? ""}

Responsibilities:
${renderList(job.responsibilities)}

Requirements:
${renderList(job.requirements)}

NiceToHave:
${renderList(job.niceToHave)}

Compensation: ${job.compensation ?? ""}

ApplyUrl: ${job.applyUrl ?? ""}
SourceUrl: ${job.sourceUrl}

DescriptionMarkdown:
${job.descriptionMarkdown ?? ""}
`.trim();
}

export function jobStableId(
  job: Readonly<{
    sourceUrl: string;
    applyUrl?: string;
    title: string;
  }>
): string {
  const base = `${job.sourceUrl}::${job.applyUrl ?? ""}::${job.title}`;
  return createHash("sha256").update(base, "utf8").digest("hex");
}

export class PineconeJobsClient {
  private readonly pc: Pinecone;
  private readonly indexName: string;
  private readonly namespace: string;

  public constructor(opts: PineconeJobsClientOptions = {}) {
    this.pc = new Pinecone({
      apiKey: opts.apiKey ?? requireEnv("PINECONE_API_KEY"),
    });
    this.indexName = opts.indexName ?? requireEnv("PINECONE_INDEX");
    this.namespace =
      opts.namespace ?? process.env.PINECONE_NAMESPACE ?? "jobs-v1";
  }

  private index() {
    return this.pc
      .index<PineconeJobMetadata>(this.indexName)
      .namespace(this.namespace);
  }

  public async upsert(vectors: readonly PineconeJobVector[]): Promise<void> {
    if (vectors.length === 0) return;
    await this.index().upsert(
      vectors.map((v) => ({
        id: v.id,
        values: [...v.values],
        metadata: v.metadata ? { ...v.metadata } : undefined,
      }))
    );
  }

  public async query(
    params: Readonly<{
      vector: readonly number[];
      topK: number;
      filter?: Readonly<Record<string, unknown>>;
      includeMetadata?: boolean;
    }>
  ): Promise<readonly PineconeQueryMatch[]> {
    const res = await this.index().query({
      vector: [...params.vector],
      topK: params.topK,
      filter: params.filter ? { ...params.filter } : undefined,
      includeMetadata: params.includeMetadata ?? true,
    });

    const matches = res.matches ?? [];
    const out: PineconeQueryMatch[] = [];

    for (const m of matches) {
      if (typeof m.id !== "string") continue;
      if (typeof m.score !== "number") continue;
      out.push({
        id: m.id,
        score: m.score,
        metadata: m.metadata
          ? { ...(m.metadata as PineconeJobMetadata) }
          : undefined,
      });
    }

    return out;
  }
}

/* =========================
 * OpenAI embeddings client
 * (kept minimal; uses the OpenAI SDK you already import)
 * ========================= */

export type OpenAiEmbedClientOptions = Readonly<{
  apiKey?: string;
  model?: string; // default text-embedding-3-large
  maxRetries?: number;
  retryBaseDelayMs?: number;
}>;

export class OpenAiEmbedClient {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly dimensions?: number;
  private readonly retry: RetryOptions;

  public constructor(opts: OpenAiEmbedClientOptions = {}) {
    const apiKey = opts.apiKey ?? requireEnv("OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey });
    this.model =
      opts.model ??
      process.env.OPENAI_EMBEDDING_MODEL ??
      "text-embedding-3-large";
    this.dimensions = process.env.OPENAI_EMBEDDING_DIMENSIONS
      ? Number.parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS, 10)
      : undefined;
    this.retry = {
      maxRetries: opts.maxRetries ?? 3,
      retryBaseDelayMs: opts.retryBaseDelayMs ?? 400,
    };
  }

  public async embed(text: string): Promise<number[]> {
    const run = async (): Promise<number[]> => {
      const res = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });

      const item = res.data?.[0];
      if (!item || !Array.isArray(item.embedding)) {
        throw new Error("OpenAI embeddings: missing embedding array");
      }

      const embedding = item.embedding;
      // runtime guard: ensure numbers
      for (const x of embedding) {
        if (typeof x !== "number") {
          throw new Error("OpenAI embeddings: non-number in embedding");
        }
      }
      return embedding;
    };

    return withRetry(run, this.retry);
  }
}

/* =========================
 * Pinecone indexing + retrieval helpers
 * ========================= */

export async function indexJobsToPinecone(
  params: Readonly<{
    jobs: readonly JobPosting[];
    embed: EmbedFn;
    pinecone: PineconeJobsClient;
  }>
): Promise<void> {
  const vectors: PineconeJobVector[] = [];

  for (const job of params.jobs) {
    const id = jobStableId({
      sourceUrl: job.sourceUrl,
      applyUrl: job.applyUrl,
      title: job.title,
    });
    const text = jobToEmbeddingText(job);
    const values = await params.embed(text);

    vectors.push({
      id,
      values,
      metadata: {
        title: job.title,
        company: job.company,
        location: job.location,
        remote: job.remote ?? "unknown",
        employmentType: job.employmentType ?? "unknown",
        seniority: job.seniority ?? "unknown",
        sourceUrl: job.sourceUrl,
        applyUrl: job.applyUrl,
      },
    });
  }

  await params.pinecone.upsert(vectors);
}

export async function retrieveRelevantJobs(
  params: Readonly<{
    jobs: readonly JobPosting[];
    userContext: string;
    embed: EmbedFn;
    pinecone: PineconeJobsClient;
    topK?: number;
    filter?: Readonly<Record<string, unknown>>;
  }>
): Promise<readonly RetrievedJob[]> {
  const rawTopK = params.topK ?? 50;
  const topK = Math.min(Math.max(rawTopK, 1), params.jobs.length);
  if (topK === 0) return [];

  const byId = new Map<string, JobPosting>();
  for (const job of params.jobs) {
    const id = jobStableId({
      sourceUrl: job.sourceUrl,
      applyUrl: job.applyUrl,
      title: job.title,
    });
    byId.set(id, job);
  }

  const queryVector = await params.embed(params.userContext);

  const matches = await params.pinecone.query({
    vector: queryVector,
    topK,
    filter: params.filter,
    includeMetadata: true,
  });

  const out: RetrievedJob[] = [];
  for (const m of matches) {
    const job = byId.get(m.id);
    if (!job) continue;
    out.push({ job, retrievalScore: m.score });
  }

  return out;
}

/* =========================
 * Client class (LLM)
 * ========================= */

export class JobLlmClient {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly retry: RetryOptions;

  public constructor(opts: JobLlmClientOptions = {}) {
    const apiKey = opts.apiKey ?? requireEnv("OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey });
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
    const results = await Promise.all(batches.map(async (b) => {
      try {
        const resp = await this.callJson(
          system,
          { urls: b },
          ScoreUrlsResponseSchema
        );

        if (resp.items.length !== b.length) {
           console.warn(`[AI Client] Expected ${b.length} items, got ${resp.items.length}. Some items might be missing.`);
        }
        
        return resp.items.map(it => ({
          url: it.url,
          score: clamp(it.score, 0, 100),
          kind: it.kind,
          reason: it.reason,
        }));
      } catch (error) {
        console.error("[AI Client] Batch scoring failed", error);
        return [];
      }
    }));

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
      platforms: ["greenhouse.io", "lever.co", "ashbyhq.com", "workday.com", "icims.com", "smartrecruiters.com"],
    };

    const resp = await this.callJson(system, user, GenerateSearchDorksResponseSchema);
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
      results: z.array(z.object({
        url: z.string().url(),
        title: z.string().min(1)
      }))
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
  public async recommendJobsWithPinecone(
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

    await indexJobsToPinecone({
      jobs: params.jobs,
      embed: params.embed,
      pinecone,
    });

    const retrieved = await retrieveRelevantJobs({
      jobs: params.jobs,
      userContext: params.userContext,
      embed: params.embed,
      pinecone,
      topK: params.retrieveTopK ?? 50,
      filter: params.filter,
    });

    console.log(`[AI Client] Retrieved ${retrieved.length} jobs from Pinecone for reranking.`);

    return this.rankJobs({
      jobs: retrieved.map((r) => r.job),
      userContext: params.userContext,
      topK: params.finalTopK ?? 10,
    });
  }
}

/* =========================
 * Default singletons
 * ========================= */

export const jobLlmClient = new JobLlmClient();
export const openAiEmbedClient = new OpenAiEmbedClient();
