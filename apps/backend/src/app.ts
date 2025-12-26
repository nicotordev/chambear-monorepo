import { OpenAPIHono } from "@hono/zod-openapi";
import docsRoutes from "@/routes/docs.route";
import healthRoutes from "@/routes/health.route";

export const app = new OpenAPIHono();

docsRoutes.registerDocsRoutes(app);
healthRoutes.registerHealthRoutes(app);

app.onError((err, c) => {
  console.error("Unhandled error", err);
  return c.json({ error: "Internal Server Error" }, 500);
});
