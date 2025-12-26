import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import healthController from "@/controllers/health.controller";
import { HealthResponseSchema } from "@/schemas/health";
import { createSuccessResponseSchema } from "@/schemas/response";

const HealthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      description: "Health check",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(HealthResponseSchema),
        },
      },
    },
  },
});

const app = new OpenAPIHono();

app.openapi(HealthRoute, (c) => healthController.getHealth(c));

export default app;
