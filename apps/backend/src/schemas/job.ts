import { EmploymentType, JobSource, WorkMode, Seniority, UrlKind } from "@/lib/generated";
import { z } from "zod";

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  companyId: z.string().nullish(),
  location: z.string().nullish(),
  employmentType: z.enum(EmploymentType),
  workMode: z.enum(WorkMode),
  seniority: z.enum(Seniority).default(Seniority.UNKNOWN),
  urlKind: z.enum(UrlKind).default(UrlKind.IRRELEVANT),
  salary: z.string().nullish(),
  tags: z.array(z.string()).default([]),
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
