import { z } from "zod";
import { ApplicationStatus } from "@/lib/generated";

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
