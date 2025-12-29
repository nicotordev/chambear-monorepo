import backend from "@/lib/backend";
import { response } from "@/lib/response";
import type { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const reminder = await backend.reminders.getById(id);
    return response.success(reminder);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const reminder = await backend.reminders.update(id, body);
    return response.success(reminder);
  } catch (error) {
    return response.handleAxios(error);
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const result = await backend.reminders.delete(id);
    return response.success(result);
  } catch (error) {
    return response.handleAxios(error);
  }
};
