import backend from "@/lib/backend";
import { response } from "@/lib/response";

const getUserHandler = async () => {
  try {
    const user = await backend.user.getMe();
    return response.success(user);
  } catch (error) {
    console.log(`Error getting user: ${error}`);

    return response.handleAxios(error);
  }
};

const postUserHandler = async (request: Request) => {
  try {
    const body = await request.json();
    const user = await backend.user.upsertProfile(body);
    return response.success(user);
  } catch (error) {
    console.log(`Error updating user: ${error}`);
    return response.handleAxios(error);
  }
};

export const GET = getUserHandler;
export const POST = postUserHandler;
