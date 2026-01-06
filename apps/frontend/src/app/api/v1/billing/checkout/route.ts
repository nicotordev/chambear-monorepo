import type { NextRequest } from "next/server";
import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json();
    const data = await backend.billing.createCheckout(tier);
    return response.success(data);
  } catch (error) {
    return response.handleAxios(error);
  }
}
