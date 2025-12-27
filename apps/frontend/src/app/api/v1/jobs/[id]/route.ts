import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const job = await backend.jobs.getById(_params.id);
    return response.success(job);
  } catch (error) {
    console.log(`Error getting job: ${error}`);
    return response.handleAxios(error);
  }
}
