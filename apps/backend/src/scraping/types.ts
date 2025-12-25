export type SearchDorkQuery = {
  query: string;
  location?: string;
  site?: string;
};

export type CandidateUrl = {
  url: string;
  query: string;
  source: "google_dorks" | "manual";
};

export type FilteredUrl = {
  url: string;
  score: number;
  reason: string;
  source: string;
};

export type ScrapeMode = "sync" | "async";

export type ScrapeInput = {
  urls: string[];
  zone: string;
  customer?: string;
  mode: ScrapeMode;
};

export type ScrapeOutput = {
  responseIds?: string[];
  data?: unknown;
};

export type JobCreateInput = {
  title: string;
  companyName: string;
  location?: string;
  employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "TEMPORARY"
    | "INTERN"
    | "FREELANCE";
  workMode?: "ONSITE" | "HYBRID" | "REMOTE";
  description?: string;
  source?: "MANUAL" | "IMPORT" | "EXTERNAL_API" | "PARTNER";
  externalUrl?: string;
  postedAt?: Date;
  expiresAt?: Date;
  rawData?: unknown;
};

export type JobScrapePipelineInput = {
  queries: SearchDorkQuery[];
  zone: string;
  customer?: string;
  mode: ScrapeMode;
  limit?: number;
};
