import { prisma } from "../lib/prisma";
import {
  CreateProfileSchema,
  type CreateProfileInput,
} from "@/schemas/user";

const userService = {
  /**
   * Get user profile with all relations
   */
  async getProfile(userId: string) {
    if (!userId) throw new Error("userId is required");

    return prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
        skills: {
          include: {
            skill: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Create or update a user profile.
   * Handles nested creates/updates for experiences, education, and skills.
   * Note: For lists (exp, edu), a full replacement strategy is often simplest for "update",
   * but here we will try to preserve IDs if provided (omitted for simplicity in this prompt,
   * we will verify if we should deleteMany then createMany or smart update.
   * Given "upsertProfile" name, we'll assume we want to set the state to match input.)
   */
  async upsertProfile(userId: string, data: CreateProfileInput) {
    const validated = CreateProfileSchema.parse(data);

    return prisma.$transaction(async (tx) => {
      // 1. Upsert the main Profile
      const profile = await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          headline: validated.headline,
          summary: validated.summary,
          location: validated.location,
          yearsExperience: validated.yearsExperience,
          targetRoles: validated.targetRoles,
        },
        update: {
          headline: validated.headline,
          summary: validated.summary,
          location: validated.location,
          yearsExperience: validated.yearsExperience,
          targetRoles: validated.targetRoles,
        },
      });

      // 2. Handle Experiences (Full replacement for simplicity to avoid complex diffing in this step)
      // Delete existing and recreate is a common pattern for "save profile" forms
      await tx.experience.deleteMany({ where: { profileId: profile.id } });
      if (validated.experiences.length > 0) {
        await tx.experience.createMany({
          data: validated.experiences.map((exp) => ({
            profileId: profile.id,
            ...exp,
          })),
        });
      }

      // 3. Handle Education
      await tx.education.deleteMany({ where: { profileId: profile.id } });
      if (validated.educations.length > 0) {
        await tx.education.createMany({
          data: validated.educations.map((edu) => ({
            profileId: profile.id,
            ...edu,
          })),
        });
      }

      // 4. Handle Skills
      // Skills are M-to-N via ProfileSkill. We need to find/create the Skill entity first.
      await tx.profileSkill.deleteMany({ where: { profileId: profile.id } });

      for (const s of validated.skills) {
        // Find or create the skill tag
        const skill = await tx.skill.upsert({
          where: { name: s.skillName },
          create: { name: s.skillName },
          update: {},
        });

        await tx.profileSkill.create({
          data: {
            profileId: profile.id,
            skillId: skill.id,
            level: s.level,
          },
        });
      }

      return tx.profile.findUniqueOrThrow({
        where: { id: profile.id },
        include: {
          experiences: true,
          educations: true,
          skills: { include: { skill: true } },
        },
      });
    });
  },
};

export default userService;
