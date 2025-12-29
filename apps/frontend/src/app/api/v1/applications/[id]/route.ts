import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest } from "next/server";

export const GET = async (
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
    const application = await backend.applications.getById(id, profileId);
    return response.success(application);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const DELETE = async (
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
    const result = await backend.applications.delete(id, profileId);
    return response.success(result);
  } catch (error) {
    return response.handleAxios(error);
  }
};
