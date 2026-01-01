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
      const user = await userService.getMe(userId);
      return c.json(response.success(user), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to get profile"), 500);
    }
  },

  async uploadAvatar(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const data = await c.req.parseBody();

    const file = data.file;

    if (!file || !(file instanceof File)) {
      return c.json(response.badRequest("No file provided"), 400);
    }

    try {
      const finalURL = await userService.uploadAvatar(file, userId);
      return c.json(response.success({ url: finalURL }), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to upload avatar"), 500);
    }
  },

  async completeOnboarding(c: Context) {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    try {
      await userService.completeOnboarding(userId);
      return c.json(response.success({ message: "Onboarding completed" }), 200);
    } catch (error: any) {
      console.error(error);
      return c.json(response.badRequest(error.message || "Failed to complete onboarding"), 400);
    }
  },
};

export default userController;
