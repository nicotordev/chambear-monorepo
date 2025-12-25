import type { Job } from "@/types";
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
    const response = await this.instance.get("/jobs");
    return response.data;
  }

  public async getJobById(id: string): Promise<Job> {
    const response = await this.instance.get(`/jobs/${id}`);
    return response.data;
  }
}

export default Api.getInstance();
