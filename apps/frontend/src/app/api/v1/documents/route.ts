import { response } from "@/lib/response";
import backend from "@/lib/backend";
import type { NextResponse } from "next/server";

export const GET = async (_req: NextResponse) => {
  try {
    const documents = await backend.documents.list();
    return response.success(documents);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const POST = async (req: NextResponse) => {
  try {
    const file = (await req.formData()).get("file") as File;
    const documents = await backend.documents.create(file);
    return response.success(documents);
  } catch (error) {
    return response.handleAxios(error);
  }
};
