import type { SkillLevel } from "./enums";

export interface ParsedProfile {
  name?: string;
  headline?: string;
  summary?: string;
  location?: string;
  yearsExperience?: number;
  targetRoles?: string[];
  skills?: {
    skillName: string;
    level: SkillLevel;
  }[];
  experiences?: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    summary?: string;
  }[];
  educations?: {
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  certifications?: {
    name: string;
    issuingOrganization: string;
    issueDate: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
}

export interface ScanStatus {
  status: string;
  jobId?: string;
}
