import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const searchParamsEntries = req.nextUrl.searchParams.entries();
    const profileId = searchParamsEntries.find(
      (entry) => entry?.[0] === "profileId"
    )?.[1];

    if (!profileId) {
      return response.badRequest("Missing profileId");
    }

    const applications = await backend.applications.list(profileId);
    return response.success(applications);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const searchParamsEntries = req.nextUrl.searchParams.entries();
    const profileId = searchParamsEntries.find(
      (entry) => entry?.[0] === "profileId"
    )?.[1];

    if (!profileId) {
      return response.badRequest("Missing profileId");
    }

    const body = await req.json();
    const application = await backend.applications.upsert(body, profileId);
    return response.success(application);
  } catch (error) {
    return response.handleAxios(error);
  }
};
