import { backend } from "@/lib/backend";
import { response } from "@/lib/response";
import { type NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");
    const body = await req.json();

    if (!profileId) {
      return response.badRequest("Profile ID is required");
    }

    const result = await backend.jobPreferences.upsert(
      jobId,
      profileId,
      body.liked
    );
    return response.success(result);
  } catch (error) {
    console.error(`Error saving job preference: ${error}`);
    return response.handleAxios(error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return response.badRequest("Profile ID is required");
    }

    const result = await backend.jobPreferences.get(jobId, profileId);
    return response.success(result);
  } catch (error) {
    console.error(`Error getting job preference: ${error}`);
    return response.handleAxios(error);
  }
}
