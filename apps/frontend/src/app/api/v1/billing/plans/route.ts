import { backend } from "@/lib/backend";
import { response } from "@/lib/response";

export async function GET() {
  try {
    const plans = await backend.billing.getPlans();
    return response.success(plans);
  } catch (error) {
    return response.handleAxios(error);
  }
}
