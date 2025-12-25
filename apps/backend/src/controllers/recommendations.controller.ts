import type { Context } from "hono";
import recommendationsService from "@/services/recommendations.service";
import { UserIdSchema, type UserIdInput } from "@/schemas/recommendations";

const recommendationsController = {
  async getSmartRecommendations(c: Context) {
    let payload: UserIdInput;
    try {
      const body = await c.req.json();
      const parsed = UserIdSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "userId required" }, 400);
      }
      payload = parsed.data;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    try {
      const jobs = await recommendationsService.getSmartRecommendations(
        payload.userId
      );
      return c.json({ count: jobs.length, jobs }, 200);
    } catch (error) {
      console.error("Smart recommendations failed", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  },

  async triggerSearch(c: Context) {
    let payload: UserIdInput;
    try {
      const body = await c.req.json();
      const parsed = UserIdSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "userId required" }, 400);
      }
      payload = parsed.data;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    recommendationsService.triggerSearch(payload.userId);

    return c.json(
      {
        status: "started" as const,
        message: "Search workflow triggered in background",
      },
      200
    );
  },
};

export default recommendationsController;
