import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest } from "next/server";

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const searchParamsEntries = req.nextUrl.searchParams.entries();
    const profileId = searchParamsEntries.find(
      (entry) => entry?.[0] === "profileId"
    )?.[1];

    if (!profileId) {
      return response.badRequest("Missing profileId");
    }

    const { id } = await params;
    const body = await req.json();
    const interview = await backend.applications.createInterview(
      id,
      body,
      profileId
    );
    return response.success(interview);
  } catch (error) {
    return response.handleAxios(error);
  }
};
