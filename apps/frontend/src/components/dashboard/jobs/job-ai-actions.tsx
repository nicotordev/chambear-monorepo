"use client";

import { isAxiosError } from "axios";
import { LetterText, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface JobAiActionsProps {
  jobId: string;
  profileId: string;
  variant?: "full" | "minimal";
}

export function JobAiActions({
  jobId,
  profileId,
  variant = "full",
}: JobAiActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleError = (error: unknown, action: string) => {
    console.error(error);
    if (isAxiosError(error) && error.response?.status === 402) {
      toast.error("Insufficient credits", {
        description: "Please upgrade your plan to continue.",
        action: {
          label: "Upgrade",
          onClick: () => router.push("/dashboard/billing"),
        },
      });
    } else {
      toast.error(`Error ${action}`);
    }
  };

  const handleRecalculateFit = async () => {
    setLoading("fit");
    try {
      await api.calculateFit(jobId, profileId);
      toast.success("Fit Score recalculated successfully");
      router.refresh();
    } catch (error) {
      handleError(error, "recalculating Fit Score");
    } finally {
      setLoading(null);
    }
  };

  const handleOptimizeCv = async () => {
    setLoading("optimize");
    try {
      const newDocument = await api.optimizeCv(jobId, profileId);
      toast.success("CV optimized successfully. Check your documents.");
      router.push("/dashboard/documents/" + newDocument.id);
    } catch (error) {
      handleError(error, "optimizing CV");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setLoading("letter");
    try {
      const newDocument = await api.generateCoverLetter(jobId, profileId);
      toast.success("Cover letter generated successfully");
      router.push("/dashboard/documents/" + newDocument.id);
    } catch (error) {
      handleError(error, "generating cover letter");
    } finally {
      setLoading(null);
    }
  };

  if (variant === "minimal") {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRecalculateFit}
        disabled={loading !== null}
      >
        {loading === "fit" ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Recalculate Fit
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full rounded-xl h-12 bg-blue-600 hover:bg-blue-700"
        onClick={handleOptimizeCv}
        disabled={loading !== null}
      >
        {loading === "optimize" ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Optimize CV
      </Button>
      <Button
        variant="secondary"
        className="w-full rounded-xl h-12"
        onClick={handleGenerateCoverLetter}
        disabled={loading !== null}
      >
        {loading === "letter" ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LetterText className="mr-2 h-4 w-4" />
        )}
        Generate Cover Letter
      </Button>
      <Button
        variant="ghost"
        onClick={handleRecalculateFit}
        disabled={loading !== null}
        className="w-full rounded-xl h-12"
      >
        {loading === "fit" ? (
          <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-3 w-3" />
        )}
        Recalculate Match Score
      </Button>
    </div>
  );
}
