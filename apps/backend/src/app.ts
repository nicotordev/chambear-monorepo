import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { clerkMiddleware } from "@hono/clerk-auth";

const app = new OpenAPIHono();

// Configure CORS to allow requests from frontend
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://frontend-production-23e0.up.railway.app",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization", "Cache-Control"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("*", clerkMiddleware());

export default app;
