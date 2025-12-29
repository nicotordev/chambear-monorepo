import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { headers } from "next/headers";
import type { CreateProfileInput } from "@/schemas/user";
import type { InterviewSession, Job, User } from "@/types";

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
};

// 4. Definición limpia del SDK
export const backend = {
  jobs: {
    list: (): Promise<Job[]> => fetcher.get<Job[]>("/jobs"),

    recommendations: (): Promise<Job[]> =>
      fetcher.get<Job[]>("/jobs/recommendations"),

    getById: (id: string): Promise<Job> => fetcher.get<Job>(`/jobs/${id}`),

    scan: (body?: any, profileId?: string): Promise<void> =>
      fetcher.post<void>(`/jobs/scan?profileId=${profileId}`, body),
  },

  user: {
    getMe: (): Promise<User> => fetcher.get<User>("/user/me"),

    upsertProfile: (data: CreateProfileInput): Promise<User> =>
      fetcher.put<User>("/user/me", data),

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
};

export default backend;
