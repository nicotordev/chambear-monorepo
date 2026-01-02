import { NextRequest } from "next/server";
import { response } from "@/lib/response";
import backend from "@/lib/backend";

export const GET = async (req: NextRequest) => {
  try {
    const profileId = await req.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return response.error("Profile ID is required");
    }
    const scanStatus = await backend.jobs.getScanStatus(profileId);
    return response.success(scanStatus);
  } catch (error) {
    console.error(error);
    return response.error("Internal server error");
  }
};
