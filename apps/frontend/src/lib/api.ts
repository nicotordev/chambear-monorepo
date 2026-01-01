"use client";

import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/schemas/document";
import { CreateProfileInput } from "@/schemas/user";
import type {
  Application,
  CreditWallet,
  Document,
  InterviewSession,
  Job,
  Plan,
  Reminder,
  Subscription,
  User,
} from "@/types";
import axios, { AxiosInstance } from "axios";
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
        `🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `✅ [API Response] ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error(
          `❌ [API Error] ${error.response?.status || "Network Error"} ${
            error.config?.url
          }`,
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
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

  public async getJobs(): Promise<Job[]> {
    const res = await this.instance.get("/jobs");
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
        : undefined
    );
    if (!("data" in res.data)) {
      throw new Error("Invalid response format");
    }
    return res.data.data;
  }

  public async upsertUser(
    data: CreateProfileInput,
    profileId?: string
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
    profileId: string
  ): Promise<Document> {
    const res = await this.instance.get(`/documents/${id}`, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async createDocument(
    data: CreateDocumentInput,
    profileId: string
  ): Promise<Document> {
    const res = await this.instance.post("/documents", data, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async updateDocument(
    id: string,
    data: UpdateDocumentInput,
    profileId: string
  ): Promise<Document> {
    const res = await this.instance.put(`/documents/${id}`, data, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async deleteDocument(
    id: string,
    profileId: string
  ): Promise<Document> {
    const res = await this.instance.delete(`/documents/${id}`, {
      params: { profileId },
    });
    return res.data.data;
  }

  public async uploadFile(file: File, profileId: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
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
      await this.instance.get("/jobs/scan", {
        params: { profileId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async createJob(data: any): Promise<Job> {
    const res = await this.instance.post("/jobs", data);
    return res.data.data;
  }

  public async upsertApplication(
    profileId: string,
    jobId: string,
    data: any
  ): Promise<Application> {
    const res = await this.instance.post(
      "/applications",
      { ...data, jobId },
      {
        params: { profileId },
      }
    );
    return res.data.data;
  }

  public async createInterviewSession(
    profileId: string,
    applicationId: string,
    data: any
  ): Promise<InterviewSession> {
    const res = await this.instance.post(
      `/applications/${applicationId}/interview`,
      data,
      {
        params: { profileId },
      }
    );
    return res.data.data;
  }

  public async createReminder(data: any): Promise<Reminder> {
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

  public async topup(amount: number): Promise<CreditWallet> {
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
}

export default Api.getInstance();
