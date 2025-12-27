import backend from "@/lib/backend";
import { response } from "@/lib/response";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return response.error({ message: "No file provided", status: 400 });
    }

    const result = await backend.user.uploadAvatar(file);
    return response.success(result);
  } catch (error) {
    console.error(`Error uploading avatar: ${error}`);
    return response.handleAxios(error);
  }
}
