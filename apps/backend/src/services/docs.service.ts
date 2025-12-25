import { swaggerUI } from "@hono/swagger-ui";
import type { OpenAPIHono } from "@hono/zod-openapi";

const registerOpenApiDoc = (app: OpenAPIHono) => {
  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Chambear API",
      version: "1.0.0",
    },
  });
};

const swaggerUiHandler = swaggerUI({ url: "/openapi.json" });

const docsService = { registerOpenApiDoc, swaggerUiHandler };

export default docsService;
