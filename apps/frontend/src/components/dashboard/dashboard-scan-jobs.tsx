"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { FolderSearch, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function DashboardScanJobs() {
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      await api.scanJobs();
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
