import { SkillLevel } from "@/lib/generated";
import { z } from "zod";

export const ExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  current: z.boolean().default(false),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  location: z.string().optional(),
  id: z.string().optional(),
});

export const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  field: z.string().optional(), // Added to match frontend
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  id: z.string().optional(),
});

export const ProfileSkillSchema = z.object({
  skillName: z.string().min(1),
  level: z.enum(SkillLevel).optional(),
});

export const CreateProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(), // Added to match frontend
  headline: z.string().optional(),
  avatar: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  targetRoles: z.array(z.string()).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  educations: z.array(EducationSchema).default([]),
  skills: z.array(ProfileSkillSchema).default([]),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
