import { ReminderType } from "@/lib/generated";
import { z } from "zod";

export const CreateReminderSchema = z.object({
  type: z.enum(ReminderType),
  dueAt: z.coerce.date(),
  message: z.string().optional(),
  jobId: z.string().optional(),
  applicationId: z.string().optional(),
});

export const UpdateReminderSchema = z.object({
  type: z.enum(ReminderType).optional(),
  dueAt: z.coerce.date().optional(),
  message: z.string().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const ReminderSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  jobId: z.string().nullable(),
  applicationId: z.string().nullable(),
  type: z.enum(ReminderType),
  dueAt: z.coerce.date(),
  sentAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  message: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;
