import { prisma } from "../lib/prisma";
import {
  CreateReminderSchema,
  type CreateReminderInput,
  type UpdateReminderInput,
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

  async getAllReminders(userId: string) {
    return prisma.reminder.findMany({
      where: { userId },
      orderBy: { dueAt: "asc" },
    });
  },

  async getReminderById(userId: string, id: string) {
    return prisma.reminder.findFirst({
      where: { id, userId },
    });
  },

  async updateReminder(userId: string, id: string, data: UpdateReminderInput) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.reminder.update({
      where: { id },
      data,
    });
  },

  async deleteReminder(userId: string, id: string) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.reminder.delete({
      where: { id },
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
};

export default reminderService;