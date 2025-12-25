/**
 * @file src/types/index.ts
 * Type definitions and interfaces for the application.
 */

import {
  ApplicationStatus,
  EmploymentType,
  InterviewMode,
  InterviewStatus,
  JobSource,
  ReminderType,
  Role,
  WorkMode,
} from "./enums";

export * from "./enums";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  yearsExperience: number | null;
  targetRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  fit: number;
  company: {
    name: string;
    logo?: string;
  };
  location: string | null;
  salary?: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  description: string | null;
  tags: string[];
  source: JobSource;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rawData?: any;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FitScore {
  id: string;
  userId: string;
  jobId: string;
  score: number;
  rationale: any;
  createdAt: Date;
}

export interface InterviewSession {
  id: string;
  userId: string;
  jobId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  scheduledFor: Date | null;
  durationMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  jobId: string | null;
  type: ReminderType;
  dueAt: Date;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}
