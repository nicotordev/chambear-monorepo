import { z } from "zod";

export const SkillLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT",
} as const;

export const ExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  current: z.boolean().default(false),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  location: z.string().optional(),
});

export const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
});

export const ProfileSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  level: z.enum(Object.values(SkillLevel) as [string, ...string[]]),
});

export const CreateProfileSchema = z.object({
  id: z.string().optional(),
  headline: z.string().min(10, "Headline must be at least 10 characters"),
  avatar: z.url("Invalid avatar URL"),
  summary: z.string().min(50, "Profile summary must be at least 50 characters"),
  location: z.string().min(2, "Location is required"),
  yearsExperience: z
    .number()
    .int()
    .min(0, "Years of experience cannot be negative"),
  targetRoles: z
    .array(z.string().min(2))
    .min(1, "At least one target role is required"),
  experiences: z
    .array(ExperienceSchema)
    .min(1, "At least one experience is required"),
  educations: z
    .array(EducationSchema)
    .min(1, "At least one education is required"),
  skills: z.array(ProfileSkillSchema).min(3, "Please add at least 3 skills"),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type CreateProfileSchemaInput = z.input<typeof CreateProfileSchema>;
