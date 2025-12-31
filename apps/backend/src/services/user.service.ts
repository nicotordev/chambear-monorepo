import { Role } from "@/lib/generated";
import { uploadFileToR2 } from "@/lib/storage";
import { CreateProfileSchema } from "@/schemas/user";
import { createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma";

import { CreateProfileInput } from "@/schemas/user";
import stripe from "@/lib/stripe";

type CreateProfileInputWithOptionalId = CreateProfileInput & {
  /** If true, missing items will be removed (replace-all behavior). Defaults to false (merge). */
  replaceExperiences?: boolean;
  replaceEducations?: boolean;
  replaceSkills?: boolean;
};

type ProfileOnboardingSnapshot = {
  headline: string | null;
  summary: string | null;
  location: string | null;
  avatar: string | null;
  yearsExperience: number | null;
  targetRolesCount: number;
  experiencesCount: number;
  educationsCount: number;
  skillsCount: number;
};

const userService = {
  /**
   * Get current user with all profiles
   */
  async getMe(clerkId: string) {
    if (!clerkId) throw new Error("clerkId is required");

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profiles: {
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
          profiles: {
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
   * Progressive-safe by default: nested relations are merged (upsert) and NOT wiped.
   * Use replaceExperiences/replaceEducations/replaceSkills for replace-all semantics.
   */
  async upsertProfile(clerkId: string, data: CreateProfileInputWithOptionalId) {
    const validated = CreateProfileSchema.parse(data);

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new Error("User not found");

    const replaceExperiences = true;
    const replaceEducations = true;
    const replaceSkills = true;

    const result = await prisma.$transaction(async (tx) => {
      // Use upsert to handle both create and update scenarios safely regarding the unique userId constraint
      const profile = await tx.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          headline: validated.headline,
          summary: validated.summary,
          location: validated.location,
          avatar: validated.avatar,
          yearsExperience: validated.yearsExperience,
          targetRoles: validated.targetRoles,
        },
        update: {
          headline: validated.headline,
          summary: validated.summary,
          location: validated.location,
          avatar: validated.avatar,
          yearsExperience: validated.yearsExperience,
          targetRoles: validated.targetRoles,
        },
      });

      // ---------- Experiences (MERGE by default) ----------
      const keptExperienceIds: string[] = [];
      for (const exp of validated.experiences) {
        if ("id" in exp && exp.id && typeof exp.id === "string") {
          const updated = await tx.experience.update({
            where: { id: exp.id },
            data: {
              profileId: profile.id,
              title: exp.title,
              company: exp.company,
              location: exp.location,
              startDate: exp.startDate,
              endDate: exp.current ? null : exp.endDate,
              current: exp.current,
            },
          });
          keptExperienceIds.push(updated.id);
        } else {
          const created = await tx.experience.create({
            data: {
              profileId: profile.id,
              title: exp.title,
              company: exp.company,
              location: exp.location,
              startDate: exp.startDate,
              endDate: exp.current ? null : exp.endDate,
              current: exp.current,
            },
          });
          keptExperienceIds.push(created.id);
        }
      }

      if (replaceExperiences) {
        // Remove any experiences not included in this payload
        await tx.experience.deleteMany({
          where: {
            profileId: profile.id,
            id: {
              notIn:
                keptExperienceIds.length > 0 ? keptExperienceIds : ["__none__"],
            },
          },
        });
      }

      // ---------- Educations (MERGE by default) ----------
      const keptEducationIds: string[] = [];
      for (const edu of validated.educations) {
        if (edu.id) {
          const updated = await tx.education.update({
            where: { id: edu.id },
            data: {
              profileId: profile.id,
              school: edu.school,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: edu.startDate,
              endDate: edu.current ? null : edu.endDate,
              current: edu.current,
              description: edu.description,
            },
          });
          keptEducationIds.push(updated.id);
        } else {
          const created = await tx.education.create({
            data: {
              profileId: profile.id,
              school: edu.school,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: edu.startDate,
              endDate: edu.current ? null : edu.endDate,
              current: edu.current,
              description: edu.description,
            },
          });
          keptEducationIds.push(created.id);
        }
      }

      if (replaceEducations) {
        await tx.education.deleteMany({
          where: {
            profileId: profile.id,
            id: {
              notIn:
                keptEducationIds.length > 0 ? keptEducationIds : ["__none__"],
            },
          },
        });
      }

      // ---------- Skills (MERGE by default) ----------
      // Assumes you have:
      // - Skill { id, name unique }
      // - ProfileSkill { profileId, skillId, level } with a UNIQUE(profileId, skillId)
      const keptSkillIds: string[] = [];
      for (const s of validated.skills) {
        const skill = await tx.skill.upsert({
          where: { name: s.skillName },
          create: { name: s.skillName },
          update: {},
        });

        keptSkillIds.push(skill.id);

        await tx.profileSkill.upsert({
          where: {
            profileId_skillId: {
              profileId: profile.id,
              skillId: skill.id,
            },
          },
          create: {
            profileId: profile.id,
            skillId: skill.id,
            level: s.level,
          },
          update: {
            level: s.level,
          },
        });
      }

      if (replaceSkills) {
        await tx.profileSkill.deleteMany({
          where: {
            profileId: profile.id,
            skillId: {
              notIn: keptSkillIds.length > 0 ? keptSkillIds : ["__none__"],
            },
          },
        });
      }

      // ---------- Onboarding readiness ----------
      // Decide readiness based on current DB state (post-upserts).
      const [experiencesCount, educationsCount, skillsCount] =
        await Promise.all([
          tx.experience.count({ where: { profileId: profile.id } }),
          tx.education.count({ where: { profileId: profile.id } }),
          tx.profileSkill.count({ where: { profileId: profile.id } }),
        ]);

      const snapshot: ProfileOnboardingSnapshot = {
        headline: profile.headline ?? null,
        summary: profile.summary ?? null,
        location: profile.location ?? null,
        avatar: profile.avatar ?? null,
        yearsExperience: profile.yearsExperience ?? null,
        targetRolesCount: Array.isArray(profile.targetRoles)
          ? profile.targetRoles.length
          : 0,
        experiencesCount,
        educationsCount,
        skillsCount,
      };

      const onboardingReady = isOnboardingReady(snapshot);

      if (onboardingReady) {
        await tx.profile.update({
          where: { id: profile.id },
          data: { onboardingCompleted: onboardingReady },
        });
      }

      return {
        profileId: profile.id,
        onboardingJustCompleted: onboardingReady,
      };
    });

    const fullProfile = await prisma.profile.findUniqueOrThrow({
      where: { id: result.profileId },
      include: {
        experiences: true,
        educations: true,
        skills: { include: { skill: true } },
      },
    });

    // Update Clerk metadata OUTSIDE the transaction.
    if (result.onboardingJustCompleted) {
      const secretKey = process.env.CLERK_SECRET_KEY;
      const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;

      if (!secretKey || !publishableKey) {
        throw new Error("Missing CLERK_SECRET_KEY or CLERK_PUBLISHABLE_KEY");
      }

      const clerkClient = createClerkClient({
        secretKey,
        publishableKey,
      });

      await clerkClient.users.updateUserMetadata(clerkId, {
        privateMetadata: { onboardingCompleted: true },
      });
    }

    return fullProfile;
  },

  async uploadAvatar(file: File, clerkId: string) {
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
    ] as const;
    const isAllowed = (allowedTypes as readonly string[]).includes(file.type);
    if (!isAllowed) {
      throw new Error("Invalid file type. Only images are allowed.");
    }

    const fileExtension = file.name.split(".").pop();
    if (!fileExtension || fileExtension.trim().length === 0) {
      throw new Error("File must have an extension");
    }

    const url = await uploadFileToR2(
      new Uint8Array(await file.arrayBuffer()),
      clerkId,
      `avatar.${fileExtension}`,
      file.type
    );

    // Return URL only, do not update DB
    return url;
  },
};

/**
 * Check if the profile snapshot meets all criteria to be considered "Onboarding Completed".
 */
function isOnboardingReady(snapshot: ProfileOnboardingSnapshot): boolean {
  // Relaxed "mostly complete" criteria
  if (!snapshot.headline || snapshot.headline.length < 5) return false;
  if (!snapshot.summary || snapshot.summary.length < 20) return false;
  if (!snapshot.location || snapshot.location.length < 2) return false;
  if (snapshot.yearsExperience === null || snapshot.yearsExperience < 0)
    return false;
  if (snapshot.targetRolesCount < 1) return false;
  if (snapshot.experiencesCount < 1) return false;
  if (snapshot.educationsCount < 1) return false;
  if (snapshot.skillsCount < 1) return false;

  return true;
}

export default userService;
