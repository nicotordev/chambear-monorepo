import { z } from "zod";
import { SkillLevel } from "@/types";

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

export const CertificationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  issuingOrganization: z.string().min(1, "Issuing Organization is required"),
  issueDate: z.coerce.date(),
  expirationDate: z.coerce.date().nullable().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

export const ProfileSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  level: z.nativeEnum(SkillLevel),
});

export const CreateProfileSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, "Name is required")
    .optional()
    .nullable()
    .or(z.literal("")),
  headline: z
    .string()
    .min(2, "Headline is too short")
    .optional()
    .nullable()
    .or(z.literal("")),
  avatar: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  summary: z
    .string()
    .min(10, "Summary is too short")
    .optional()
    .nullable()
    .or(z.literal("")),
  location: z
    .string()
    .min(2, "Location is required")
    .optional()
    .nullable()
    .or(z.literal("")),
  yearsExperience: z
    .number()
    .int()
    .min(0, "Years of experience cannot be negative")
    .optional()
    .nullable(),
  targetRoles: z.array(z.string().min(2)).optional().default([]),
  experiences: z.array(ExperienceSchema).optional().default([]),
  educations: z.array(EducationSchema).optional().default([]),
  certifications: z.array(CertificationSchema).optional().default([]),
  skills: z.array(ProfileSkillSchema).optional().default([]),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type CreateProfileSchemaInput = z.input<typeof CreateProfileSchema>;
