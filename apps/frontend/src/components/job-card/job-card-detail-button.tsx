"use client";

import { Button } from "@/components/ui/button";
import { useJobStore } from "@/stores/job/job.store";
import type { Job } from "@/types";
import { Briefcase } from "lucide-react";

export interface JobCardDetailButtonProps {
  job: Job;
}

export default function JobCardDetailButton({ job }: JobCardDetailButtonProps) {
  const setSelectedJobDetail = useJobStore(
    (state) => state.setSelectedJobDetail
  );
  return (
    <Button
      variant="outline"
      className="cursor-pointer flex flex-1"
      onClick={() => setSelectedJobDetail(job)}
    >
      <Briefcase className="mr-2 size-4" />
      Ver Detalle
    </Button>
  );
}
