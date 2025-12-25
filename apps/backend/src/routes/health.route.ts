import { createRoute } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";
import healthController from "@/controllers/health.controller";
import { HealthResponseSchema } from "@/schemas/health";

const HealthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      description: "Health check",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

const registerHealthRoutes = (app: OpenAPIHono) => {
  app.openapi(HealthRoute, (c) => healthController.getHealth(c));
};

const healthRoutes = { registerHealthRoutes };

export default healthRoutes;
