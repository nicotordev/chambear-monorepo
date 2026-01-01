import type { NextRequest } from "next/server";
import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const user = await backend.user.completeOnboarding();
    return response.success(user);
  } catch (error) {
    console.log(`Error updating user: ${error}`);
    return response.handleAxios(error);
  }
}
