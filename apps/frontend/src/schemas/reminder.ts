import { z } from "zod";
import { ReminderType } from "@/types";

export const createReminderSchema = z.object({
  type: z.nativeEnum(ReminderType),
  dueAt: z.coerce.date(),
  message: z.string().optional(),
  jobId: z.string().optional(),
  applicationId: z.string().optional(),
});

export const updateReminderSchema = z.object({
  type: z.nativeEnum(ReminderType).optional(),
  dueAt: z.coerce.date().optional(),
  message: z.string().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
