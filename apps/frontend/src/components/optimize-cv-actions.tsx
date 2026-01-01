"use client";

import { Button } from "@/components/ui/button";
import backend from "@/lib/backend";
import { LetterText, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OptimizeCvActionsProps {
  jobId: string;
  profileId: string;
}

export function OptimizeCvActions({ jobId, profileId }: OptimizeCvActionsProps) {
  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingCl, setLoadingCl] = useState(false);
  const router = useRouter();

  const handleOptimizeCv = async () => {
    try {
      setLoadingCv(true);
      const doc = await backend.ai.optimizeCv(jobId, profileId);
      toast.success("CV optimizado creado exitosamente", {
        description: "Puedes verlo en la sección de documentos.",
        action: {
          label: "Ver",
          onClick: () => router.push(`/dashboard/documents/${doc.id}`),
        },
      });
      router.refresh();
    } catch (error: any) {
      toast.error("Error al optimizar CV", {
        description: error.response?.data?.meta?.message || "Inténtalo de nuevo.",
      });
    } finally {
      setLoadingCv(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    try {
      setLoadingCl(true);
      const doc = await backend.ai.generateCoverLetter(jobId, profileId);
      toast.success("Carta generada exitosamente", {
        description: "Puedes verla en la sección de documentos.",
        action: {
          label: "Ver",
          onClick: () => router.push(`/dashboard/documents/${doc.id}`),
        },
      });
      router.refresh();
    } catch (error: any) {
      toast.error("Error al generar carta", {
        description: error.response?.data?.meta?.message || "Inténtalo de nuevo.",
      });
    } finally {
      setLoadingCl(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        className="w-full rounded-xl h-12" 
        onClick={handleOptimizeCv}
        disabled={loadingCv || loadingCl}
      >
        {loadingCv ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <>
            Optimizar CV <Sparkles className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        className="w-full rounded-xl h-12"
        onClick={handleGenerateCoverLetter}
        disabled={loadingCv || loadingCl}
      >
        {loadingCl ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <>
            Generar Carta <LetterText className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
