import { serve } from "@hono/node-server";
import { app } from "@/app";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const host = process.env.HOST ?? "0.0.0.0";

const bun = (globalThis as { Bun?: typeof Bun }).Bun;
const server = bun?.serve
  ? bun.serve({ fetch: app.fetch, port, hostname: host })
  : serve({ fetch: app.fetch, port, hostname: host });

console.log(`🚀 API ready on http://${host}:${port}`);

const shutdown = () => {
  console.log("Shutting down server...");
  if ("stop" in server) {
    server.stop();
    process.exit(0);
  }
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
