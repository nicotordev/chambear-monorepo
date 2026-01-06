import type { NextRequest } from "next/server";
import backend from "@/lib/backend";
import { response } from "@/lib/response";

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
