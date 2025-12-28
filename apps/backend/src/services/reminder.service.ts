import { prisma } from "../lib/prisma";
import {
  CreateReminderSchema,
  type CreateReminderInput,
  type UpdateReminderInput,
} from "@/schemas/reminder";

const reminderService = {
  async createReminder(profileId: string, data: CreateReminderInput) {
    const validated = CreateReminderSchema.parse(data);

    return prisma.reminder.create({
      data: {
        profileId,
        ...validated,
      },
    });
  },

  async getAllReminders(profileId: string) {
    return prisma.reminder.findMany({
      where: { profileId },
      orderBy: { dueAt: "asc" },
    });
  },

  async getReminderById(profileId: string, id: string) {
    return prisma.reminder.findFirst({
      where: { id, profileId },
    });
  },

  async updateReminder(
    profileId: string,
    id: string,
    data: UpdateReminderInput
  ) {
    const existing = await prisma.reminder.findFirst({
      where: { id, profileId },
    });
    if (!existing) return null;

    return prisma.reminder.update({
      where: { id },
      data,
    });
  },

  async deleteReminder(profileId: string, id: string) {
    const existing = await prisma.reminder.findFirst({ where: { id, profileId } });
    if (!existing) return null;

    return prisma.reminder.delete({
      where: { id },
    });
  },

  async getDueReminders(profileId: string, beforeDate: Date = new Date()) {
    return prisma.reminder.findMany({
      where: {
        profileId,
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
