import { z } from "zod";
import { ApplicationStatus } from "@/types";

export const applicationUpsertSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.SAVED),
  notes: z.string().optional(),
  appliedAt: z.coerce.date().optional(),
  resumeDocumentId: z.string().optional(),
  coverLetterId: z.string().optional(),
});

export type ApplicationUpsertInput = z.infer<typeof applicationUpsertSchema>;

export const applicationSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  profileId: z.string(),
  jobId: z.string(),
  status: z.nativeEnum(ApplicationStatus),
  appliedAt: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  resumeDocumentId: z.string().nullable(),
  coverLetterId: z.string().nullable(),
  followUpAt: z.coerce.date().nullable(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
