import response from "@/lib/utils/response";
import { CreateProfileSchema } from "@/schemas/user";
import userService from "@/services/user.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";

const userController = {
  async upsertProfile(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const data = await c.req.json();
    // Validate manually or rely on route validation.
    // Usually controller should be thin, but assuming safe to parse here if route doesn't pass parsed body directly.
    const validated = CreateProfileSchema.parse(data);

    try {
      const profile = await userService.upsertProfile(userId, validated);
      return c.json(response.success(profile), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to upsert profile"), 500);
    }
  },

  async getMe(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      // Need to implement getProfile in userService or assuming getProfile(userId) works.
      // userService.getProfile(userId) exists in the file I read.
      const profile = await userService.getProfile(userId);
      if (!profile) {
        return c.json(response.notFound("User not found"), 404); // Or return empty?
      }
      return c.json(response.success(profile), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to get profile"), 500);
    }
  },
};

export default userController;
