import "dotenv/config";
import app from "@/app";
import { logger } from "@/lib/logger";
import { serve } from "@hono/node-server";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const host = process.env.HOST ?? "0.0.0.0";

const bun = (globalThis as any).Bun;
const server = bun?.serve
  ? bun.serve({ fetch: app.fetch, port, hostname: host })
  : serve({ fetch: app.fetch, port, hostname: host });

logger.info(`🚀 API ready on http://${host}:${port}`);

const shutdown = () => {
  logger.info("Shutting down server...");
  if ("stop" in server) {
    server.stop();
    process.exit(0);
  }
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
