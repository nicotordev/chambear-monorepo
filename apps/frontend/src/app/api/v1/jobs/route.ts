import { response } from "@/lib/response";
import { backend } from "@/lib/backend";

export async function GET() {
  try {
    const jobs = await backend.jobs.getJobs();
    return response.success(jobs);
  } catch (error) {
    return response.internalError("Failed to fetch jobs", error);
  }
}
