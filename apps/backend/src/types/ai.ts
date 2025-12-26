export type RetryOptions = Readonly<{
  maxRetries: number;
  retryBaseDelayMs: number;
}>;

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
  model?: string; // default gpt-5.2
  temperature?: number; // default 0.2
  maxRetries?: number; // default 3
  retryBaseDelayMs?: number; // default 400
}>;

/* =========================
 * Pinecone retrieval types
 * ========================= */

export type EmbedFn = (text: string) => Promise<number[]>;

export type PineconeJobsClientOptions = Readonly<{
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
