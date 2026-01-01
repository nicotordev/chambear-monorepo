import { z } from "zod";

export const OptimizeCvSchema = z.object({
  jobId: z.string(),
  baseDocumentId: z.string().optional(), // Optional: base existing CV to start from
});

export const GenerateCoverLetterSchema = z.object({
  jobId: z.string(),
});

export const CalculateFitSchema = z.object({
  jobId: z.string(),
});

export type OptimizeCvInput = z.infer<typeof OptimizeCvSchema>;
export type GenerateCoverLetterInput = z.infer<
  typeof GenerateCoverLetterSchema
>;
export type CalculateFitInput = z.infer<typeof CalculateFitSchema>;
