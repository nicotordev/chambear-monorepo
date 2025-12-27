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
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
});

export const ProfileSkillSchema = z.object({
  skillName: z.string().min(1),
  level: z.enum(Object.values(SkillLevel)).optional(),
});

export const CreateProfileSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  targetRoles: z.array(z.string()),
  experiences: z.array(ExperienceSchema),
  educations: z.array(EducationSchema),
  skills: z.array(ProfileSkillSchema),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type CreateProfileSchemaInput = z.input<typeof CreateProfileSchema>;
