import { prisma } from "../lib/prisma";
import {
  CreateReminderSchema,
  type CreateReminderInput,
} from "@/schemas/reminder";

const reminderService = {
  async createReminder(userId: string, data: CreateReminderInput) {
    const validated = CreateReminderSchema.parse(data);

    return prisma.reminder.create({
      data: {
        userId,
        ...validated,
      },
    });
  },

  async getDueReminders(userId: string, beforeDate: Date = new Date()) {
    return prisma.reminder.findMany({
      where: {
        userId,
        dueAt: {
          lte: beforeDate,
        },
        completedAt: null,
      },
      include: {
        job: { select: { title: true, companyName: true } },
        application: { select: { status: true } },
      },
      orderBy: { dueAt: "asc" },
    });
  },

  async completeReminder(userId: string, reminderId: string) {
    // Ensure ownership
    const rem = await prisma.reminder.findUnique({ where: { id: reminderId }});
    if (!rem || rem.userId !== userId) {
         throw new Error("Reminder not found or access denied");
    }

    return prisma.reminder.update({
        where: { id: reminderId },
        data: { completedAt: new Date() }
    });
  }
};

export default reminderService;
