import { NextResponse } from "next/server";
import { demoJobs } from "@/data/demo";

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json(demoJobs, {
    status: 200,
  });
}
