import { z } from "zod";
import { DocumentType } from "@/types";

export const CreateDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  label: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().nullable().optional(),
  jobId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = CreateDocumentSchema.extend({
  id: z.string(),
}).partial();

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

export const DocumentSchema = CreateDocumentSchema.extend({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  url: z.string().nullable().optional(),
  version: z.number().int().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;
