import { z } from "zod";
import { DocumentType } from "@/lib/generated";

export const CreateDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  label: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().optional(),
  jobId: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
