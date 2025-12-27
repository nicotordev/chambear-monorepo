import { SuccessResponse } from "@/lib/response";
import { CreateProfileInput } from "@/schemas/user";
import type { Job, User } from "@/types";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { headers } from "next/headers";
import "server-only";

// 1. Instancia base
const api: AxiosInstance = axios.create({
  baseURL: `${process.env.BACKEND_API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Logging Interceptors
api.interceptors.request.use((config) => {
  console.log(`[Backend Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(
      `[Backend Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`
    );
    return response;
  },
  (error) => {
    console.error(
      `[Backend Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} -`,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
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
    return data;
  },

  post: async <T>(url: string, body: any, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.post<T>(url, body, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data;
  },

  put: async <T>(url: string, body: any, config?: AxiosRequestConfig) => {
    const authHeaders = await getAuthHeaders();
    const { data } = await api.put<T>(url, body, {
      ...config,
      headers: { ...authHeaders, ...config?.headers },
    });
    return data;
  },
};

// 4. Definición limpia del SDK
export const backend = {
  jobs: {
    list: (): Promise<Job[]> => fetcher.get<Job[]>("/jobs"),

    recommendations: (): Promise<Job[]> =>
      fetcher.get<Job[]>("/jobs/recommendations"),

    getById: (id: string): Promise<Job> => fetcher.get<Job>(`/jobs/${id}`),
  },

  user: {
    getMe: (): Promise<User> => fetcher.get<User>("/user/me"),

    upsertProfile: (data: CreateProfileInput): Promise<User> =>
      fetcher.post<User>("/user/profile", data),

    uploadAvatar: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetcher.post<SuccessResponse<string>>(
        "/user/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    },
  },
};

export default backend;
