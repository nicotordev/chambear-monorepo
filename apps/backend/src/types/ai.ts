import { EmploymentType, WorkMode, Seniority, UrlKind } from "../lib/generated";

/* =========================================================
 * Retry / Client options
 * ========================================================= */

export type RetryOptions = Readonly<{
  maxRetries: number;
  retryBaseDelayMs: number;
}>;

export type JobLlmClientOptions = Readonly<{
  model?: string; // default gpt-5.2
  temperature?: number; // default 0.2
  retry?: Partial<RetryOptions>; // default { maxRetries: 3, retryBaseDelayMs: 400 }
}>;

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

/* =========================================================
 * Fetch / Extract
 * ========================================================= */

/**
 * Keep as-is if you want a simple fetcher.
 * If you later need richer info, introduce another type and widen here.
 */
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
/**
 * “Raw” job postings from extraction may omit some fields.
 * Note: You currently allow both undefined and "unknown" for some.
 * Keeping that for compatibility, but see NormalizedJobPosting below.
 */
export type JobPosting = Readonly<{
  title: string;
  company?: string;
  location?: string;

  // Compatibility: allow undefined or explicit "unknown"
  remote?: WorkMode;

  employmentType?: EmploymentType;
  seniority?: Seniority;

  team?: string;
  descriptionMarkdown?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  skills?: string[];
  compensation?: string;
  applyUrl?: string;

  sourceUrl: string;
  pageKind?: UrlKind;
}>;

export type ExtractJobsOutput = Readonly<{
  pageIsJobRelated: boolean;
  pageKind: UrlKind;
  pageReason: string;
  jobs: readonly JobPosting[];
}>;

/* =========================================================
 * Ranking
 * ========================================================= */

export type RankJobsInput = Readonly<{
  jobs: readonly JobPosting[];
  userContext: string;
  topK?: number; // default 10
}>;

export type Rationale = Readonly<{
  match: readonly string[];
  missing: readonly string[];
  reason?: string;
}>;

export type RankedJob = Readonly<{
  job: JobPosting;
  fitScore: number; // 0..100
  rationale: Rationale | string;
}>;

export type RankJobsOutput = Readonly<{
  items: readonly RankedJob[];
}>;

/* =========================================================
 * Pinecone retrieval types
 * ========================================================= */

export type EmbedFn = (text: string) => Promise<readonly number[]>;

export type PineconeJobsClientOptions = Readonly<{
  indexName?: string;
  namespace?: string;
}>;

export type PineconeJobMetadata = Readonly<{
  title: string;
  company?: string;
  location?: string;
  remote: WorkMode; // non-null, normalized
  employmentType: EmploymentType; // non-null, normalized
  seniority: Seniority; // non-null, normalized
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

/* =========================================================
 * Normalization helpers (strongly recommended)
 * ========================================================= */

export type NormalizedJobPosting = Readonly<
  Omit<JobPosting, "remote" | "employmentType" | "seniority"> & {
    remote: WorkMode;
    employmentType: EmploymentType;
    seniority: Seniority;
  }
>;
