import {
  ApplicationStatus,
  InterviewMode,
  InterviewStatus,
} from "@/lib/generated";
import { z } from "zod";

export const ApplicationUpsertSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.SAVED),
  notes: z.string().optional(),
  appliedAt: z.coerce.date().optional(),
  resumeDocumentId: z.string().optional(),
  coverLetterId: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof ApplicationUpsertSchema>;

export const FitScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  rationale: z.any().optional(),
});

export type FitScoreInput = z.infer<typeof FitScoreSchema>;

export const ApplicationSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  profileId: z.string(),
  jobId: z.string(),
  status: z.enum(ApplicationStatus),
  appliedAt: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  resumeDocumentId: z.string().nullable(),
  coverLetterId: z.string().nullable(),
  followUpAt: z.coerce.date().nullable(),
});

export const CreateInterviewSchema = z.object({
  mode: z.enum(InterviewMode).default(InterviewMode.VIRTUAL),
  status: z.enum(InterviewStatus).default(InterviewStatus.PLANNING),
  scheduledFor: z.coerce.date().optional(),
  meetLink: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  notes: z.string().optional(),
});

export const InterviewSessionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  jobId: z.string(),
  mode: z.enum(InterviewMode),
  status: z.enum(InterviewStatus),
  scheduledFor: z.coerce.date().nullable(),
  meetLink: z.string().nullable(),
  durationMinutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  aiFeedback: z.any().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
