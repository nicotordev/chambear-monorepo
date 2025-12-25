import type { OpenAPIHono } from "@hono/zod-openapi";
import docsController from "@/controllers/docs.controller";

const registerDocsRoutes = (app: OpenAPIHono) => {
  docsController.registerDocs(app);
  app.get("/docs", docsController.swaggerUiHandler);
};

const docsRoutes = { registerDocsRoutes };

export default docsRoutes;
