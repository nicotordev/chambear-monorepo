import { CreateProfileInput } from "@/schemas/user";
import type { Job, User } from "@/types";
import axios, { AxiosInstance } from "axios";

class Api {
  private static instance: Api;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_BASE_URL + "/api/v1",
    });
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
    const res = await this.instance.get("/user");
    return res.data.data;
  }

  public async upsertUser(data: CreateProfileInput): Promise<User> {
    const res = await this.instance.post("/user", data);
    return res.data.data;
  }
}

export default Api.getInstance();
