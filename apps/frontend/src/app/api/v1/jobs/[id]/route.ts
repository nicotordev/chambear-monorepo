import { demoJobs } from "@/data/demo";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const _params = await params;
  const job = demoJobs.find((job) => job.id === _params.id);
  return Response.json(job, { status: 200 });
}
