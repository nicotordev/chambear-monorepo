import { response } from "@/lib/response";
import backend from "@/lib/backend";
import type { NextRequest } from "next/server";

export const GET = async (_req: NextRequest) => {
  try {
    const documents = await backend.documents.list();
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
