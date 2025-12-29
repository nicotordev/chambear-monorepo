import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return response.badRequest("Profile ID is required");
    }

    await backend.jobs.scan(undefined, profileId);
    return response.success("Scan initiated successfully");
  } catch (error) {
    return response.handleAxios(error);
  }
};
