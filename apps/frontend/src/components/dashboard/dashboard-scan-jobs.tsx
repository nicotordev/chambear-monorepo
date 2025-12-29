"use client";

import { useUser as useAppUser } from "@/contexts/user-context";
import api from "@/lib/api";
import { FolderSearch, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function DashboardScanJobs() {
  const { currentProfile, profiles } = useAppUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleScan = async () => {
    if (!currentProfile?.id) {
      if (profiles.length === 0) {
        toast.error("Debes crear un perfil primero");
        router.push("/onboarding");
        return;
      }
      toast.error("Selecciona un perfil para iniciar el escaneo");
      return;
    }
    setIsLoading(true);
    try {
      await api.scanJobs(currentProfile?.id);
      toast.success("Escaneo iniciado correctamente");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Error al iniciar el escaneo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleScan}
      size="sm"
      className="gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FolderSearch className="size-4" />
      )}
      {isLoading ? "Escaneando..." : "Escanear ahora"}
    </Button>
  );
}
