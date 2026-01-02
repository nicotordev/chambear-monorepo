import { z } from "zod";
/* =========================
 * Zod schemas for strict parsing
 * ========================= */

export const UrlKindSchema = z.enum([
  "job_listing",
  "jobs_index",
  "careers",
  "login_or_gate",
  "blog_or_news",
  "company_about",
  "irrelevant",
]);

export const ScoredUrlSchema = z.object({
  url: z.string().url(),
  score: z.number().min(0).max(100),
  kind: UrlKindSchema,
  reason: z.string().min(1),
});

export const ScoreUrlsResponseSchema = z.object({
  items: z.array(ScoredUrlSchema),
});

export const RemoteSchema = z.enum(["remote", "hybrid", "on_site", "unknown"]);
export const EmploymentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "unknown",
]);
export const SenioritySchema = z.enum([
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "principal",
  "unknown",
]);

export const JobPostingSchema = z.object({
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
  skills: z.array(z.string().min(1)).optional(),
  compensation: z.string().min(1).optional(),
  applyUrl: z.string().optional(),
  sourceUrl: z.string(),
});

export const ExtractJobsResponseSchema = z.object({
  pageIsJobRelated: z.boolean(),
  pageKind: UrlKindSchema,
  pageReason: z.string().min(1),
  jobs: z.array(JobPostingSchema),
});

export const RankedJobSchema = z.object({
  job: JobPostingSchema,
  fitScore: z.number().min(0).max(100),
  rationale: z.object({
    match: z.array(z.string()),
    missing: z.array(z.string()),
    reason: z.string().optional(),
  }),
  reject: z.boolean().optional(),
});

export const RankJobsResponseSchema = z.object({
  items: z.array(RankedJobSchema),
});

export const SearchDorkQuerySchema = z.object({
  query: z.string().min(1),
  site: z.string().optional(),
  location: z.string().optional(),
});

export const GenerateSearchDorksResponseSchema = z.object({
  queries: z.array(SearchDorkQuerySchema),
});
