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

export type JobInput = z.infer<typeof JobSchema>;
