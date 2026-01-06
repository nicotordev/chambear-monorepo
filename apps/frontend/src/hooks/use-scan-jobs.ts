"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";
import api from "@/lib/api";

export type ScanStatus =
  | "idle"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "waiting"
  | "pending"
  | "processing";

const SCAN_KEY = "CHAMBEAR_SCAN_IN_PROGRESS";

export function useScanJobs() {
  const { currentProfile, profiles } = useUser();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [shouldSkipConfirmation, setShouldSkipConfirmation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const skip =
      sessionStorage.getItem("CHAMBEAR_SKIP_SCAN_CONFIRMATION") === "true";
    setShouldSkipConfirmation(skip);
  }, []);

  const setSkipConfirmation = useCallback((skip: boolean) => {
    sessionStorage.setItem("CHAMBEAR_SKIP_SCAN_CONFIRMATION", skip.toString());
    setShouldSkipConfirmation(skip);
  }, []);

  const isScanning = [
    "active",
    "delayed",
    "waiting",
    "pending",
    "processing",
  ].includes(status);

  const checkStatus = useCallback(async () => {
    if (!currentProfile?.id) return;
    try {
      const res = await api.getScanStatus(currentProfile.id);
      const newStatus = res.status as ScanStatus;
      setStatus(newStatus);

      if (
        ["active", "delayed", "waiting", "pending", "processing"].includes(
          newStatus,
        )
      ) {
        localStorage.setItem(SCAN_KEY, "true");
      } else {
        localStorage.removeItem(SCAN_KEY);
      }
    } catch (err) {
      console.error("Status check failed", err);
    }
  }, [currentProfile?.id]);

  // Initial status check on mount
  useEffect(() => {
    if (currentProfile?.id) {
      checkStatus();
    }
  }, [currentProfile?.id, checkStatus]);

  // Polling while scanning
  useEffect(() => {
    if (!currentProfile?.id || !isScanning) return;

    const intervalId = setInterval(checkStatus, 3000);
    return () => clearInterval(intervalId);
  }, [currentProfile?.id, isScanning, checkStatus]);

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
      localStorage.setItem(SCAN_KEY, "true");
      setStatus("active"); // Optimistic update
      await api.scanJobs(currentProfile.id);
      toast.success("Scan started successfully");
    } catch (error: any) {
      console.error("Scan error:", error);
      setStatus("idle");
      localStorage.removeItem(SCAN_KEY);

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

  return {
    status,
    isScanning,
    handleScan,
    shouldSkipConfirmation,
    setSkipConfirmation,
  };
}
