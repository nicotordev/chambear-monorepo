import { z } from "@hono/zod-openapi";

export const MetaSchema = z.object({
  ok: z.boolean(),
  status: z.number(),
  message: z.string(),
}).openapi("ResponseMeta");

export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: MetaSchema,
  });
}

export const ErrorResponseSchema = z.object({
  error: z.unknown().optional(),
  meta: MetaSchema,
}).openapi("ErrorResponse");
