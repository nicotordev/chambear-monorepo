import applicationsRoute from "@/lib/routes/applications.route";
import billingRoute from "@/lib/routes/billing.route";
import documentRoute from "@/lib/routes/documents.route";
import jobsRoute from "@/lib/routes/jobs.route";
import remindersRoute from "@/lib/routes/reminders.route";
import userRoute from "@/lib/routes/user.route";
import webhooksRoute from "@/lib/routes/webhooks.route";
import aiActionRoute from "@/lib/routes/ai-action.route";
import { clerkMiddleware } from "@hono/clerk-auth";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

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

app.use("*", async (c, next) => {
  console.log(`🚀 [API Request] ${c.req.method?.toUpperCase()} ${c.req.url}`);
  return await next();
});

app.use("*", clerkMiddleware());

app.route("/api/v1", jobsRoute);
app.route("/api/v1", applicationsRoute);
app.route("/api/v1", userRoute);
app.route("/api/v1", documentRoute);
app.route("/api/v1", remindersRoute);
app.route("/api/v1/billing", billingRoute);
app.route("/api/v1/webhooks", webhooksRoute);
app.route("/api/v1", aiActionRoute);

export default app;
