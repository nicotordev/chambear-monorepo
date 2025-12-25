import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("chambear-backend"),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
