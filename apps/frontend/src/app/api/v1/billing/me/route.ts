import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function GET() {
  try {
    const data = await backend.billing.getMySubscription();
    return response.success(data);
  } catch (error) {
    return response.handleAxios(error);
  }
}
