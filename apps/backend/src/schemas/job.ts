import {
  EmploymentType,
  JobSource,
  Seniority,
  UrlKind,
  WorkMode,
} from "@/lib/generated";
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
  fit: z.number().optional(),
  jobSkills: z.array(
    z.object({
      skill: z.object({
        id: z.string(),
        name: z.string(),
      }),
    })
  ),
});

export const JobUpsertSchema = JobSchema.extend({
  id: z.string().optional(),
  jobSkills: z
    .array(
      z.object({
        skill: z.object({
          id: z.string().optional(),
          name: z.string(),
        }),
      })
    )
    .optional(),
});

export type JobUpsertInput = z.infer<typeof JobUpsertSchema>;

export const JobPostingSchema = z
  .object({
    title: z.string(),
    company: z.string().optional(),
    location: z.string().optional(),
    remote: z.enum(WorkMode).optional(),
    employmentType: z.enum(EmploymentType).optional(),
    seniority: z.enum(Seniority).optional(),
    team: z.string().optional(),
    descriptionMarkdown: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    niceToHave: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    compensation: z.string().optional(),
    applyUrl: z.string().optional(),
    sourceUrl: z.string(),
    pageKind: z.enum(UrlKind).optional(),
  })
  .readonly();

export const RankedJobSchema = z
  .object({
    job: JobPostingSchema,
    fitScore: z.number(),
    rationale: z.union([
      z.string(),
      z
        .object({
          match: z.array(z.string()).readonly(),
          missing: z.array(z.string()).readonly(),
          reason: z.string().optional(),
        })
        .readonly(),
    ]),
  })
  .readonly();

export type JobInput = z.infer<typeof JobSchema>;

export const Pagination = z.object({
  cursor: z.string().optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
});

export type Pagination = z.infer<typeof Pagination>;
