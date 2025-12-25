import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({
  error: z.string(),
});

export const UserIdSchema = z.object({
  userId: z.string().min(1),
});

export type UserIdInput = z.infer<typeof UserIdSchema>;

const EmploymentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "INTERN",
  "FREELANCE",
]);

const WorkModeSchema = z.enum(["ONSITE", "HYBRID", "REMOTE"]);

const JobSourceSchema = z.enum(["MANUAL", "IMPORT", "EXTERNAL_API", "PARTNER"]);

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  location: z.string().nullable().optional(),
  employmentType: EmploymentTypeSchema,
  workMode: WorkModeSchema,
  description: z.string().nullable().optional(),
  source: JobSourceSchema,
  externalUrl: z.string().url().nullable().optional(),
  postedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  rawData: z.unknown().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SmartRecommendationsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  jobs: z.array(JobSchema),
});

export type SmartRecommendationsResponse = z.infer<
  typeof SmartRecommendationsResponseSchema
>;

export const TriggerSearchResponseSchema = z.object({
  status: z.literal("started"),
  message: z.string(),
});

export type TriggerSearchResponse = z.infer<typeof TriggerSearchResponseSchema>;
