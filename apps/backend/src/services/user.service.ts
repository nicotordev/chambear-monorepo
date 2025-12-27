import { Role } from "@/lib/generated";
import { uploadFileToR2 } from "@/lib/storage";
import { CreateProfileSchema, type CreateProfileInput } from "@/schemas/user";
import { createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma";

const userService = {
  /**
   * Get user profile with all relations
   */
  /**
   * Get current user with all profiles
   */
  async getMe(clerkId: string) {
    if (!clerkId) throw new Error("clerkId is required");

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: {
          include: {
            experiences: { orderBy: { startDate: "desc" } },
            educations: { orderBy: { startDate: "desc" } },
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!user) {
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      });
      const clerkUserData = await clerkClient.users.getUser(clerkId);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: clerkUserData.emailAddresses[0].emailAddress,
          name: clerkUserData.firstName,
          role: Role.EMPLOYEE,
        },
        include: {
          profile: {
            include: {
              experiences: { orderBy: { startDate: "desc" } },
              educations: { orderBy: { startDate: "desc" } },
              skills: { include: { skill: true } },
            },
          },
        },
      });
    }

    return user;
  },

  /**
   * Create or update a user profile.
   */
  async upsertProfile(
    clerkId: string,
    data: CreateProfileInput & { id?: string }
  ) {
    const validated = CreateProfileSchema.parse(data);

    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      throw new Error("User not found");
    }

    const profileId = data.id;

    return prisma.$transaction(async (tx) => {
      let profile;

      if (profileId) {
        // Update existing profile
        profile = await tx.profile.update({
          where: { id: profileId },
          data: {
            headline: validated.headline,
            summary: validated.summary,
            location: validated.location,
            avatar: validated.avatar,
            yearsExperience: validated.yearsExperience,
            targetRoles: validated.targetRoles,
          },
        });
      } else {
        // Create new profile
        profile = await tx.profile.create({
          data: {
            userId: user.id,
            headline: validated.headline,
            summary: validated.summary,
            location: validated.location,
            avatar: validated.avatar,
            yearsExperience: validated.yearsExperience,
            targetRoles: validated.targetRoles,
          },
        });
      }

      // Mark onboarding as completed
      if (!user.onboardingCompleted) {
        await tx.user.update({
          where: { id: user.id },
          data: { onboardingCompleted: true },
        });

        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
          publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        });

        await clerkClient.users.updateUserMetadata(clerkId, {
          privateMetadata: {
            onboardingCompleted: true,
          },
        });
      }

      // Handle nested relations (Experience, Education, Skills)
      // Note: This logic replaces all relations for the profile.
      // If we want partial updates, we need more complex logic.

      // Experiences
      await tx.experience.deleteMany({ where: { profileId: profile.id } });
      if (validated.experiences.length > 0) {
        await tx.experience.createMany({
          data: validated.experiences.map((exp) => ({
            profileId: profile.id,
            ...exp,
          })),
        });
      }

      // Education
      await tx.education.deleteMany({ where: { profileId: profile.id } });
      if (validated.educations.length > 0) {
        await tx.education.createMany({
          data: validated.educations.map((edu) => ({
            profileId: profile.id,
            ...edu,
          })),
        });
      }

      // Skills
      await tx.profileSkill.deleteMany({ where: { profileId: profile.id } });
      for (const s of validated.skills) {
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

  async uploadAvatar(file: File, clerkId: string) {
    try {
      if (!file || !(file instanceof File)) {
        throw new Error("No file provided or invalid file");
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size exceeds 5MB limit");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      const fileExtension = file.name.split(".").pop();

      const url = await uploadFileToR2(
        new Uint8Array(await file.arrayBuffer()),
        clerkId,
        `avatar.${fileExtension}`,
        file.type
      );

      // Return URL only, do not update DB
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  async transformResume(file: File) {
    try {
      const buffer = await file.arrayBuffer();
    } catch (error) {
      console.error("Resume transformation error:", error);
      throw error;
    }
  },
};

export default userService;
