import backend from "@/lib/backend";
import { response } from "@/lib/response";

export async function POST() {
  try {
    const { url } = await backend.billing.customerPortal();

    return response.success({ url });
  } catch (error) {
    return response.handleAxios(error);
  }
}
