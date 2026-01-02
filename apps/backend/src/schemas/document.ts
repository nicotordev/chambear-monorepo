import { DocumentType } from "@/lib/generated";
import { z } from "@hono/zod-openapi";

export const CreateDocumentSchema = z.object({
  type: z.enum(Object.values(DocumentType)),
  label: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().nullable().optional(),
  jobId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = CreateDocumentSchema.partial();
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

export const DocumentSchema = CreateDocumentSchema.extend({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  url: z.string().nullable().optional(),
  version: z.number().int().optional(),
}).openapi("Document");

export type Document = z.infer<typeof DocumentSchema>;
