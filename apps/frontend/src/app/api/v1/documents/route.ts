import type { NextRequest } from "next/server";
import backend from "@/lib/backend";
import { response } from "@/lib/response";

export const GET = async (req: NextRequest) => {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return response.badRequest("Missing profileId");
    }
    const documents = await backend.documents.list(profileId);
    return response.success(documents);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const file = (await req.formData()).get("file") as File;
    const documents = await backend.documents.create(file);
    return response.success(documents);
  } catch (error) {
    return response.handleAxios(error);
  }
};
