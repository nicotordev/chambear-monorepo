import { z } from "@hono/zod-openapi";

export const MetaSchema = z
  .object({
    ok: z.boolean(),
    status: z.number(),
    message: z.string(),
  })
  .openapi("ResponseMeta");

export function createSuccessResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T
) {
  return z.object({
    data: dataSchema,
    meta: MetaSchema,
  });
}

export const ErrorResponseSchema = z
  .object({
    error: z
      .array(
        z.object({
          message: z.string(),
          code: z.string(),
          path: z.array(z.string()),
        })
      )
      .optional(),
    meta: MetaSchema,
  })
  .openapi("ErrorResponse");
