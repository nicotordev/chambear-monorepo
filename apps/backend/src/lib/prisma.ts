import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClientType } from "./../types/prisma.js";
import { PrismaClient } from "./generated";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClientType | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
