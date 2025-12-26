import { EmploymentType, JobSource, WorkMode } from "@/lib/generated";
import { z } from "zod";

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  location: z.string().nullish(),
  employmentType: z.enum(EmploymentType),
  workMode: z.enum(WorkMode),
  description: z.string().nullish(),
  source: z.enum(JobSource),
  externalUrl: z.string().nullish(),
  postedAt: z.coerce.date().nullish(),
  expiresAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
  jobSkills: z.array(
    z.object({
      skill: z.object({
        id: z.string(),
        name: z.string(),
      }),
    })
  ),
});

export const JobPostingSchema = z.object({
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  remote: z.enum(WorkMode).optional(),
  employmentType: z.enum(EmploymentType).optional(),
  sourceUrl: z.string(),
  descriptionMarkdown: z.string().optional(),
});

export const RankedJobSchema = z.object({
  job: JobPostingSchema,
  fitScore: z.number(),
  rationale: z.string(),
});

export type JobInput = z.infer<typeof JobSchema>;
