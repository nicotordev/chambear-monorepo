"use client";

import { Loader2, SearchX, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useScanJobs } from "@/hooks/use-scan-jobs";

import { ScanningAnimation } from "../scanning-animation";

export default function JobEmptyState({ isLoading }: { isLoading?: boolean }) {
  const {
    isScanning,
    handleScan,
    shouldSkipConfirmation,
    setSkipConfirmation,
  } = useScanJobs();

  if (isScanning || isLoading) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] items-center justify-center bg-background">
        <ScanningAnimation />
      </div>
    );
  }

  const scanButton = (
    <Button
      disabled={isScanning}
      onClick={shouldSkipConfirmation ? handleScan : undefined}
    >
      {isScanning ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {isScanning ? "Escaneando..." : "Buscar ofertas"}
    </Button>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] items-center justify-center bg-background animate-in fade-in duration-500 space-y-4">
      <div className="bg-muted p-6 rounded-full">
        <SearchX className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        No hay trabajos disponibles
      </h2>
      <p className="text-muted-foreground max-w-md text-center">
        Actualmente no hemos encontrado ofertas que coincidan o la lista está
        vacía. Intenta recargar o buscar manualmente.
      </p>
      <div className="flex gap-2">
        {shouldSkipConfirmation ? (
          scanButton
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>{scanButton}</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Buscar nuevas ofertas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Analizaremos tu perfil y buscaremos las mejores oportunidades
                  disponibles en tiempo real. Esta acción tiene un costo de{" "}
                  <b className="text-primary text-lg">1 crédito</b>.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex items-center space-x-2 py-4">
                <Checkbox
                  id="skip-confirm"
                  onCheckedChange={(checked) => setSkipConfirmation(!!checked)}
                />
                <Label
                  htmlFor="skip-confirm"
                  className="text-sm cursor-pointer"
                >
                  No volver a mostrar este mensaje por esta sesión
                </Label>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleScan}>
                  Confirmar y Gastar 1 Crédito
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
