import { z } from "zod";

export const optimizeCvSchema = z.object({
  jobId: z.string(),
  baseDocumentId: z.string().optional(),
});

export const generateCoverLetterSchema = z.object({
  jobId: z.string(),
});

export const calculateFitSchema = z.object({
  jobId: z.string(),
});

export const parseResumeSchema = z.object({
  documentId: z.string().optional(),
  content: z.string().optional(),
});

export type OptimizeCvInput = z.infer<typeof optimizeCvSchema>;
export type GenerateCoverLetterInput = z.infer<
  typeof generateCoverLetterSchema
>;
export type CalculateFitInput = z.infer<typeof calculateFitSchema>;
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
