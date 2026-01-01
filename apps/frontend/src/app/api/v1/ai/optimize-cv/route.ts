import backend from "@/lib/backend";
import { response } from "@/lib/response";
import { type NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");

    const body = await req.json();
    const { jobId } = body;

    if (!profileId) {
      return response.badRequest("Profile ID is required");
    }
    if (!jobId) {
      return response.badRequest("Job ID is required");
    }

    const data = await backend.ai.optimizeCv(jobId, profileId);
    return response.success(data);
  } catch (error) {
    return response.handleAxios(error);
  }
};
