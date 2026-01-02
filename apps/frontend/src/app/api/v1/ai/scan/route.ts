import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const searchParamsEntries = req.nextUrl.searchParams.entries();
    const profileId = searchParamsEntries.find(
      (entry) => entry?.[0] === "profileId"
    )?.[1];

    if (!profileId) {
      return response.badRequest("Profile ID is required");
    }

    await backend.jobs.scan(undefined, profileId);
    return response.success("Scan initiated successfully");
  } catch (error) {
    return response.handleAxios(error);
  }
};
