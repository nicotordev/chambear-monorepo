import type { Context, Env } from "hono";
import { getAuth } from "@hono/clerk-auth";
import response from "../lib/utils/response";

export default async function authenticateRequest(
  c: Context<Env, "*">,
  next: () => Promise<void>
) {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(response.unauthorized("You are not logged in."));
  }

  return await next();
}
