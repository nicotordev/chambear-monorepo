import { response } from "@/lib/response";
import { backend } from "@/lib/backend";

export async function GET() {
  try {
    const jobs = await backend.jobs.list();
    return response.success(jobs);
  } catch (error) {
    console.log(`Error getting jobs: ${error}`);
    return response.handleAxios(error);
  }
}
