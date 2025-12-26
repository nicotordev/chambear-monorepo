import "server-only";
import axios from "axios";

const backendApiClient = axios.create({
  baseURL: process.env.BACKEND_API_URL + "/api/v1",
});

export const backend = {
  jobs: {
    getJobs: () => backendApiClient.get("/jobs"),
    getRecommendations: () => backendApiClient.get("/jobs/recommendations"),
    getJobsById: (id: string) => backendApiClient.get(`/jobs/${id}`),
  },
};

export default backend;
