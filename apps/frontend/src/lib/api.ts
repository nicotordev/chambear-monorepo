import "client-only";

import { CreateProfileInput } from "@/schemas/user";
import type { Job, User } from "@/types";
import axios, { AxiosInstance } from "axios";

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

  public async getUser(): Promise<User> {
    const res = await this.instance.get("/user/me");
    if (!("data" in res.data)) {
      throw new Error("Invalid response format");
    }
    return res.data.data;
  }

  public async upsertUser(data: CreateProfileInput): Promise<User> {
    const res = await this.instance.post("/user/profile", data);
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
    return { url: res.data.data };
  }
}

export default Api.getInstance();
