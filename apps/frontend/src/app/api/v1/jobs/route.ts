import { response } from "@/lib/response";
import { backend } from "@/lib/backend";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");

    const jobs = await backend.jobs.list(search || undefined);
    return response.success(jobs);
  } catch (error) {
    console.log(`Error getting jobs: ${error}`);
    return response.handleAxios(error);
  }
}
