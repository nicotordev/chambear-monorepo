import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { headers } from "next/headers";
import type { CreateProfileInput } from "@/schemas/user";
import type {
  Application,
  CreditWallet,
  Document,
  FitScore,
  InterviewSession,
  Job,
  Plan,
  Reminder,
  Subscription,
  User,
} from "@/types";
import "server-only";

import type { CreateInterviewSessionInput } from "@/schemas/interview";

// 1. Instancia base
const api: AxiosInstance = axios.create({
  baseURL: `${process.env.BACKEND_API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Logging Interceptors
api.interceptors.request.use((config) => {
  console.log(
    `[Backend Request] ${config.method?.toUpperCase()} ${config.url}`,
  );
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(
      `[Backend Response] ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - Status: ${response.status}`,
    );
    return response;
  },
  (error) => {
    console.error(
      `[Backend Error] ${error.config?.method?.toUpperCase()} ${
        error.config?.url
      } -`,
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);

// 2. Helper privado para inyectar headers automáticamente
const getAuthHeaders = async () => {
  const headerList = await headers();

  return {
    Authorization: headerList.get("Authorization") ?? "",
    Cookie: headerList.get("Cookie") ?? "",
  };
};

// 3. Wrappers genéricos para manejar la respuesta de Axios (data unpacking)
const fetcher = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.get<T>(url, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data && typeof data === "object" && "data" in data
      ? (data.data as T)
      : (data as T);
  },

  post: async <T>(url: string, body: any, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.post<T>(url, body, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data && typeof data === "object" && "data" in data
      ? (data.data as T)
      : (data as T);
  },

  put: async <T>(url: string, body: any, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.put<T>(url, body, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data && typeof data === "object" && "data" in data
      ? (data.data as T)
      : (data as T);
  },

  patch: async <T>(url: string, body: any, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.patch<T>(url, body, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data && typeof data === "object" && "data" in data
      ? (data.data as T)
      : (data as T);
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.delete<T>(url, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data && typeof data === "object" && "data" in data
      ? (data.data as T)
      : (data as T);
  },
};

// 4. Definición limpia del SDK
export const backend = {
  jobs: {
    list: (query?: string): Promise<Job[]> =>
      fetcher.get<Job[]>(`/jobs${query ? `?search=${query}` : ""}`),

    recommendations: (): Promise<Job[]> =>
      fetcher.get<Job[]>("/jobs/recommendations"),

    getById: (id: string): Promise<Job> => fetcher.get<Job>(`/jobs/${id}`),

    scan: (_body?: any, profileId?: string): Promise<void> =>
      fetcher.get<void>(`/ai/scan?profileId=${profileId}`),

    getScanStatus: (
      profileId: string,
    ): Promise<{ status: string; jobId?: string }> =>
      fetcher.get<{ status: string; jobId?: string }>(
        `/ai/scan/status?profileId=${profileId}`,
      ),
  },

  user: {
    getMe: (token?: string): Promise<User> =>
      fetcher.get<User>(
        "/user/me",
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined,
      ),

    upsertProfile: (data: CreateProfileInput): Promise<User> =>
      fetcher.post<User>("/user/me", data),

    uploadAvatar: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      const data = await fetcher.post<string>("/user/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    completeOnboarding: (): Promise<User> =>
      fetcher.post<User>("/user/complete-onboarding", null),
  },

  documents: {
    list: (profileId: string): Promise<Document[]> =>
      fetcher.get<Document[]>(`/documents?profileId=${profileId}`),
    create: (file: File): Promise<Document> =>
      fetcher.post<Document>("/documents", file),
  },

  interviews: {
    list: (): Promise<InterviewSession[]> =>
      fetcher.get<InterviewSession[]>("/interviews"),
    create: (data: CreateInterviewSessionInput): Promise<InterviewSession> =>
      fetcher.post<InterviewSession>("/interviews", data),
  },

  applications: {
    list: (profileId: string): Promise<Application[]> =>
      fetcher.get<Application[]>(`/applications?profileId=${profileId}`),
    getById: (id: string, profileId: string): Promise<Application> =>
      fetcher.get<Application>(`/applications/${id}?profileId=${profileId}`),
    upsert: (data: any, profileId: string): Promise<Application> =>
      fetcher.post<Application>(`/applications?profileId=${profileId}`, data),
    delete: (id: string, profileId: string): Promise<{ success: boolean }> =>
      fetcher.delete<{ success: boolean }>(
        `/applications/${id}?profileId=${profileId}`,
      ),
    createInterview: (
      id: string,
      data: any,
      profileId: string,
    ): Promise<InterviewSession> =>
      fetcher.post<InterviewSession>(
        `/applications/${id}/interview?profileId=${profileId}`,
        data,
      ),
  },

  reminders: {
    create: (data: any): Promise<Reminder> =>
      fetcher.post<Reminder>("/reminders", data),
    list: (): Promise<Reminder[]> => fetcher.get<Reminder[]>("/reminders"),
    getById: (id: string): Promise<Reminder> =>
      fetcher.get<Reminder>(`/reminders/${id}`),
    update: (id: string, data: any): Promise<Reminder> =>
      fetcher.patch<Reminder>(`/reminders/${id}`, data),
    delete: (id: string): Promise<{ success: boolean }> =>
      fetcher.delete<{ success: boolean }>(`/reminders/${id}`),
  },

  billing: {
    getPlans: (): Promise<Plan[]> => fetcher.get<Plan[]>("/billing/plans"),

    getMySubscription: (): Promise<{
      subscription: Subscription | null;
      balance: number;
    }> =>
      fetcher.get<{ subscription: Subscription | null; balance: number }>(
        "/billing/me",
      ),

    topup: (amount: number): Promise<CreditWallet> =>
      fetcher.post<CreditWallet>("/billing/topup", { amount }),

    createCheckout: (tier: string): Promise<{ url: string }> =>
      fetcher.post<{ url: string }>("/billing/checkout", { tier }),

    customerPortal: (): Promise<{ url: string }> =>
      fetcher.post<{ url: string }>("/billing/portal", {}),
  },

  ai: {
    optimizeCv: (jobId: string, profileId: string): Promise<Document> =>
      fetcher.post<Document>(`/ai/optimize-cv?profileId=${profileId}`, {
        jobId,
      }),
    generateCoverLetter: (
      jobId: string,
      profileId: string,
    ): Promise<Document> =>
      fetcher.post<Document>(
        `/ai/generate-cover-letter?profileId=${profileId}`,
        { jobId },
      ),
    calculateFit: (jobId: string, profileId: string): Promise<FitScore> =>
      fetcher.post<FitScore>(`/ai/calculate-fit?profileId=${profileId}`, {
        jobId,
      }),
  },

  jobPreferences: {
    upsert: (
      jobId: string,
      profileId: string,
      liked: boolean,
    ): Promise<{ id: string; liked: boolean }> =>
      fetcher.post<{ id: string; liked: boolean }>(
        `/job-preferences/${jobId}?profileId=${profileId}`,
        { liked },
      ),
    get: (
      jobId: string,
      profileId: string,
    ): Promise<{ seen: boolean; liked: boolean | null }> =>
      fetcher.get<{ seen: boolean; liked: boolean | null }>(
        `/job-preferences/${jobId}?profileId=${profileId}`,
      ),
  },
};

export default backend;
