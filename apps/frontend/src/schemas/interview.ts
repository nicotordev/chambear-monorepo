import z from "zod";
import { InterviewMode, InterviewStatus, type JSONValue } from "@/types";

export const createInterviewSessionInput = z.object({
  profileId: z.string(),
  jobId: z.string(),
  mode: z.nativeEnum(InterviewMode),
  status: z.nativeEnum(InterviewStatus),
  scheduledFor: z.coerce.date().optional(),
  meetLink: z.string().optional(),
  durationMinutes: z.number().optional(),
  notes: z.string().optional(),
  aiFeedback: z.custom<JSONValue>().optional(),
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
