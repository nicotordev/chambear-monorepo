import { InterviewMode, InterviewStatus } from "@/types";
import z from "zod";

export const createInterviewSessionInput = z.object({
  profileId: z.string(),
  jobId: z.string(),
  mode: z.enum(InterviewMode),
  status: z.enum(InterviewStatus),
  scheduledFor: z.date().optional(),
  meetLink: z.string().optional(),
  durationMinutes: z.number().optional(),
  notes: z.string().optional(),
  aiFeedback: z.any().optional(),
});

export const updateInterviewSessionInput = createInterviewSessionInput
  .partial()
  .extend({
    id: z.string(),
  });

export const deleteInterviewSessionInput = z.object({
  id: z.string(),
});

export type CreateInterviewSessionInput = z.infer<
  typeof createInterviewSessionInput
>;
export type UpdateInterviewSessionInput = z.infer<
  typeof updateInterviewSessionInput
>;
export type DeleteInterviewSessionInput = z.infer<
  typeof deleteInterviewSessionInput
>;
