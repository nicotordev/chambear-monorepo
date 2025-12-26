import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const job = await backend.jobs.getJobsById(_params.id);
    return response.success(job);
  } catch (error) {
    return response.internalError("Failed to fetch job", error);
  }
}
