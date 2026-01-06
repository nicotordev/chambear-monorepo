import { z } from "zod";
import {
  EmploymentType,
  JobSource,
  Seniority,
  UrlKind,
  WorkMode,
} from "@/types";

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  companyId: z.string().nullish(),
  location: z.string().nullish(),
  employmentType: z.nativeEnum(EmploymentType),
  workMode: z.nativeEnum(WorkMode),
  seniority: z.nativeEnum(Seniority).default(Seniority.UNKNOWN),
  urlKind: z.nativeEnum(UrlKind).default(UrlKind.IRRELEVANT),
  salary: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  description: z.string().nullish(),
  source: z.nativeEnum(JobSource),
  externalUrl: z.string().nullish(),
  postedAt: z.coerce.date().nullish(),
  expiresAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
  fit: z.number().optional(),
});

export const jobUpsertSchema = jobSchema.extend({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;
export type JobUpsertInput = z.infer<typeof jobUpsertSchema>;
