import { CreateProfileInput } from "@/schemas/user";
import type { Job, User } from "@/types";
import axios from "axios";
import "server-only";

const backendApiClient = axios.create({
  baseURL: process.env.BACKEND_API_URL + "/api/v1",
});

export const backend = {
  jobs: {
    getJobs: (): Promise<Job[]> => backendApiClient.get("/jobs"),
    getRecommendations: (): Promise<Job[]> =>
      backendApiClient.get("/jobs/recommendations"),
    getJobsById: (id: string): Promise<Job> =>
      backendApiClient.get(`/jobs/${id}`),
  },
  user: {
    getMe: (): Promise<User> => backendApiClient.get("/user/me"),
    upsert: (data: CreateProfileInput): Promise<User> =>
      backendApiClient.post("/user/profile", data),
  },
};

export default backend;
