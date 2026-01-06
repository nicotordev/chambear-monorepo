"use client";

import axios, { type AxiosInstance } from "axios";
import type { CalculateFitInput, ParseResumeInput } from "@/schemas/ai-action";
import type { ApplicationUpsertInput } from "@/schemas/application";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/schemas/document";
import type { CreateInterviewSessionInput } from "@/schemas/interview";
import type { JobUpsertInput } from "@/schemas/job";
import type { CreateReminderInput } from "@/schemas/reminder";
import type { CreateProfileInput } from "@/schemas/user";
import type {
  Application,
  Document,
  DocumentType,
  FitScore,
  InterviewSession,
  Job,
  ParsedProfile,
  Plan,
  Reminder,
  ScanStatus,
  Subscription,
  User,
} from "@/types";
import "client-only";

class Api {
  private static instance: Api;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1`,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      console.log(
        `🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`,
      );
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `✅ [API Response] ${response.status} ${response.config.url}`,
        );
        return response;
      },
      (error) => {
        console.error(
          `❌ [API Error] ${error.response?.status || "Network Error"} ${
            error.config?.url
          }`,
          error.response?.data || error.message,
        );
        return Promise.reject(error);
      },
    );
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  public get instance(): AxiosInstance {
    return this.axiosInstance;
  }

  public async getJobs(query?: string): Promise<Job[]> {
    const res = await this.instance.get("/jobs", {
      params: { search: query },
    });
    return res.data.data;
  }

  public async getJobById(id: string): Promise<Job> {
    const res = await this.instance.get(`/jobs/${id}`);
    return res.data.data;
  }

  public async getUser(token?: string): Promise<User> {
    const res = await this.instance.get(
      "/user/me",
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );
    if (!("data" in res.data)) {
      throw new Error("Invalid response format");
    }
    return res.data.data;
  }

  public async upsertUser(
    data: CreateProfileInput,
    profileId?: string,
  ): Promise<User> {
    const res = await this.instance.post("/user/me", data, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async completeOnboarding(): Promise<{ message: string }> {
    const res = await this.instance.post("/user/complete-onboarding");
    return res.data.data;
  }

  public async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await this.instance.post("/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  }

  public async getDocuments(profileId: string): Promise<Document[]> {
    try {
      const res = await this.instance.get("/documents", {
        params: { profileId },
      });
      return res.data.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async getDocumentById(
    id: string,
    profileId: string,
  ): Promise<Document> {
    const res = await this.instance.get(`/documents/${id}`, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async createDocument(
    data: CreateDocumentInput,
    profileId: string,
  ): Promise<Document> {
    const res = await this.instance.post("/documents", data, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async updateDocument(
    id: string,
    data: UpdateDocumentInput,
    profileId: string,
  ): Promise<Document> {
    const res = await this.instance.put(`/documents/${id}`, data, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async deleteDocument(
    id: string,
    profileId: string,
  ): Promise<Document> {
    const res = await this.instance.delete(`/documents/${id}`, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async uploadFile(
    file: File,
    profileId: string,
    label?: string,
    type?: DocumentType,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    if (label) formData.append("label", label);
    if (type) formData.append("type", type as string);

    const res = await this.instance.post("/documents/upload", formData, {
      params: { profileId },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  }

  public async scanJobs(profileId: string): Promise<void> {
    try {
      await this.instance.get("/ai/scan", {
        params: { profileId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async getScanStatus(profileId: string): Promise<ScanStatus> {
    const res = await this.instance.get("/ai/scan/status", {
      params: { profileId },
    });
    return res.data.data;
  }

  public async createJob(data: JobUpsertInput): Promise<Job> {
    const res = await this.instance.post("/jobs", data);
    return res.data.data;
  }

  public async upsertApplication(
    profileId: string,
    jobId: string,
    data: ApplicationUpsertInput,
  ): Promise<Application> {
    const res = await this.instance.post(
      "/applications",
      { ...data, jobId },
      {
        params: { profileId },
      },
    );
    return res.data.data;
  }

  public async createInterviewSession(
    profileId: string,
    applicationId: string,
    data: CreateInterviewSessionInput,
  ): Promise<InterviewSession> {
    const res = await this.instance.post(
      `/applications/${applicationId}/interview`,
      data,
      {
        params: { profileId },
      },
    );
    return res.data.data;
  }

  public async createReminder(data: CreateReminderInput): Promise<Reminder> {
    const res = await this.instance.post("/reminders", data);
    return res.data.data;
  }

  // --- Billing ---

  public async getPlans(): Promise<Plan[]> {
    const res = await this.instance.get("/billing/plans");
    return res.data.data;
  }

  public async getMySubscription(): Promise<{
    subscription: Subscription | null;
    balance: number;
  }> {
    const res = await this.instance.get("/billing/me");
    return res.data.data;
  }

  public async topup(amount: number): Promise<{ url: string }> {
    const res = await this.instance.post("/billing/topup", { amount });
    return res.data.data;
  }

  public async createCheckout(tier: string): Promise<{ url: string }> {
    const res = await this.instance.post("/billing/checkout", { tier });
    return res.data.data;
  }

  public async customerPortal(): Promise<{ url: string }> {
    const res = await this.instance.post("/billing/portal");
    return res.data.data;
  }

  // --- AI Actions ---

  public async optimizeCv(jobId: string, profileId: string): Promise<Document> {
    const res = await this.instance.post(
      "/ai/optimize-cv",
      { jobId },
      { params: { profileId } },
    );
    return res.data.data;
  }

  public async generateCoverLetter(
    jobId: string,
    profileId: string,
  ): Promise<Document> {
    const res = await this.instance.post(
      "/ai/generate-cover-letter",
      { jobId },
      { params: { profileId } },
    );
    return res.data.data;
  }

  public async calculateFit(
    jobId: string,
    profileId: string,
  ): Promise<FitScore> {
    const res = await this.instance.post(
      "/ai/calculate-fit",
      { jobId },
      { params: { profileId } },
    );
    return res.data.data;
  }

  public async parseResume(
    profileId: string,
    data: ParseResumeInput,
  ): Promise<ParsedProfile> {
    const res = await this.instance.post("/ai/parse-resume", data, {
      params: { profileId },
    });
    return res.data.data;
  }

  // --- Job Preferences ---
  public async upsertJobPreference(
    jobId: string,
    profileId: string,
    liked: boolean,
  ): Promise<{ id: string; liked: boolean }> {
    const res = await this.instance.post(
      `/job-preferences/${jobId}`,
      { liked },
      { params: { profileId } },
    );
    return res.data.data;
  }

  public async getJobPreference(
    jobId: string,
    profileId: string,
  ): Promise<{ seen: boolean; liked: boolean | null }> {
    const res = await this.instance.get(`/job-preferences/${jobId}`, {
      params: { profileId },
    });
    return res.data.data;
  }
}

export default Api.getInstance();
