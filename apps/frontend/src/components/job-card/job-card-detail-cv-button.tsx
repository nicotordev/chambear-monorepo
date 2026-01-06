import { Notebook } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types";

export interface JobCardDetailCVButtonProps {
  job: Job;
}

export default function JobCardDetailCVButton({
  job,
}: JobCardDetailCVButtonProps) {
  return (
    <Button className="cursor-pointer" asChild>
      <Link href={`/dashboard/jobs/${job.id}`} className="flex flex-1 w-full">
        <Notebook className="mr-2 size-4" />
        Ir a la oferta
      </Link>
    </Button>
  );
}
