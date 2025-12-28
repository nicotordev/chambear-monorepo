import type { Context } from "hono";
import { getAuth } from "@hono/clerk-auth";
import reminderService from "@/services/reminder.service";
import response from "@/lib/utils/response";

const remindersController = {
  async createReminder(c: Context) {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json(response.unauthorized(), 401);

    try {
      const data = await c.req.json();
      const reminder = await reminderService.createReminder(auth.userId, data);
      return c.json(response.success(reminder), 200);
    } catch (error) {
      return c.json(response.error("Invalid input"), 400);
    }
  },

  async getAllReminders(c: Context) {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json(response.unauthorized(), 401);

    const reminders = await reminderService.getAllReminders(auth.userId);
    return c.json(response.success(reminders), 200);
  },

  async getReminderById(c: Context) {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json(response.unauthorized(), 401);

    const id = c.req.param("id");
    const reminder = await reminderService.getReminderById(auth.userId, id);

    if (!reminder) {
      return c.json(response.notFound("Reminder not found"), 404);
    }

    return c.json(response.success(reminder), 200);
  },

  async updateReminder(c: Context) {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json(response.unauthorized(), 401);

    const id = c.req.param("id");
    try {
      const data = await c.req.json();
      const updated = await reminderService.updateReminder(
        auth.userId,
        id,
        data
      );
      if (!updated) {
        return c.json(response.notFound("Reminder not found"), 404);
      }
      return c.json(response.success(updated), 200);
    } catch (error) {
      return c.json(response.error("Invalid input"), 400);
    }
  },

  async deleteReminder(c: Context) {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json(response.unauthorized(), 401);

    const id = c.req.param("id");
    const deleted = await reminderService.deleteReminder(auth.userId, id);

    if (!deleted) {
      return c.json(response.notFound("Reminder not found"), 404);
    }

    return c.json(response.success({ success: true }), 200);
  },
};

export default remindersController;
