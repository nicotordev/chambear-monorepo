import { z } from "zod";
import { ReminderType } from "@/lib/generated";

export const CreateReminderSchema = z.object({
  type: z.nativeEnum(ReminderType),
  dueAt: z.coerce.date(),
  message: z.string().optional(),
  jobId: z.string().optional(),
  applicationId: z.string().optional(),
});

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
