import type { OpenAPIHono } from "@hono/zod-openapi";
import docsService from "@/services/docs.service";

const docsController = {
  registerDocs(app: OpenAPIHono) {
    docsService.registerOpenApiDoc(app);
  },
  swaggerUiHandler: docsService.swaggerUiHandler,
};

export default docsController;
