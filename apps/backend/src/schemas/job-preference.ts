import { z } from "zod";

export const JobPreferenceUpsertSchema = z.object({
  liked: z.boolean(),
});

export type JobPreferenceUpsertInput = z.infer<
  typeof JobPreferenceUpsertSchema
>;

export const JobPreferenceSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  jobId: z.string(),
  liked: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const JobPreferenceStatusSchema = z.object({
  jobId: z.string(),
  seen: z.boolean(),
  liked: z.boolean().nullable(),
});