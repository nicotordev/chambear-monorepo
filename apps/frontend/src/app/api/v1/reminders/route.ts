import type { NextRequest } from "next/server";
import backend from "@/lib/backend";
import { response } from "@/lib/response";

export const GET = async () => {
  try {
    const reminders = await backend.reminders.list();
    return response.success(reminders);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const reminder = await backend.reminders.create(body);
    return response.success(reminder);
  } catch (error) {
    return response.handleAxios(error);
  }
};
