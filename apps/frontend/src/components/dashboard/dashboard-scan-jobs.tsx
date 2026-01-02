"use client";

import { useUser as useAppUser } from "@/contexts/user-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { FolderSearch, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface DashboardScanJobsProps {
  variant?: "default" | "icon";
  className?: string;
}

export default function DashboardScanJobs({
  variant = "default",
  className,
}: DashboardScanJobsProps) {
  const { currentProfile, profiles } = useAppUser();
  const [status, setStatus] = useState<
    "idle" | "active" | "completed" | "failed" | "delayed" | "waiting"
  >("idle");
  const router = useRouter();

  // Polling logic
  useEffect(() => {
    if (!currentProfile?.id) return;

    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await api.getScanStatus(currentProfile.id);
        setStatus(res.status as any);

        // Stop polling if idle/failed (unless we just started it locally, but simple polling is safer)
        // actually we want to poll if active/delayed/waiting
        if (["active", "delayed", "waiting"].includes(res.status)) {
          // continue polling
        } else {
          // stop or reduce freq?
          // If completed, maybe we stop after a while?
          // For now, let's just keep checking every 5s if active, else slower?
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [currentProfile?.id]);

  const handleScan = async () => {
    if (!currentProfile?.id) {
      if (profiles.length === 0) {
        toast.error("You must create a profile first");
        router.push("/onboarding");
        return;
      }
      toast.error("Select a profile to start scanning");
      return;
    }

    try {
      setStatus("active"); // Optimistic update
      await api.scanJobs(currentProfile?.id);
      toast.success("Scan started successfully");
    } catch (error: any) {
      console.error("Scan error:", error);
      setStatus("idle");

      if (error.response?.status === 402) {
        toast.error("Insufficient credits", {
          description: "You need more credits to scan for jobs.",
          action: {
            label: "Go to Billing",
            onClick: () => router.push("/dashboard/billing"),
          },
        });
        return;
      }

      toast.error("Error starting scan");
    }
  };

  const isScanning = ["active", "delayed", "waiting"].includes(status);

  if (variant === "icon") {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleScan}
            disabled={isScanning}
            className={cn(className, isScanning && "animate-pulse")}
          >
            {isScanning ? (
              <Loader2 className="size-4 text-primary animate-spin" />
            ) : (
              <FolderSearch className="size-4 text-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">
            {isScanning ? "Scanning in progress..." : "Scan for new jobs"}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handleScan}
      size="sm"
      className={cn("gap-2", className)}
      disabled={isScanning}
    >
      {isScanning ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FolderSearch className="size-4" />
      )}
      {isScanning ? "Scanning..." : "Scan now"}
    </Button>
  );
}
