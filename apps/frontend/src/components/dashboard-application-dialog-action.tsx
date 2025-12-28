"use client";
import NewApplicationDialog from "./dashboard/applications/new-application-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusCircle } from "lucide-react";

export default function DashboardApplicationDialogAction() {
  return (
    <NewApplicationDialog>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="h-8 w-8 rounded-full shadow-sm bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
            <PlusCircle className="size-5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Agregar postulación manual</p>
        </TooltipContent>
      </Tooltip>
    </NewApplicationDialog>
  );
}
