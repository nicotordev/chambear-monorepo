import { PrismaClient } from "../lib/generated/index.js";

export type PrismaClientType = PrismaClient<{
  log: ["warn", "error"];
}>;