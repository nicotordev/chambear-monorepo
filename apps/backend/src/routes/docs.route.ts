import { OpenAPIHono } from "@hono/zod-openapi";
import docsController from "@/controllers/docs.controller";

const app = new OpenAPIHono();

app.get("/docs", docsController.swaggerUiHandler);

export default app;
