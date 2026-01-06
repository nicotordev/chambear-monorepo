"use client";

import { FolderSearch, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useScanJobs } from "@/hooks/use-scan-jobs";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ScanningAnimation } from "./scanning-animation";

interface DashboardScanJobsProps {
  variant?: "default" | "icon";
  className?: string;
}

export default function DashboardScanJobs({
  variant = "default",
  className,
}: DashboardScanJobsProps) {
  const {
    isScanning,
    handleScan,
    shouldSkipConfirmation,
    setSkipConfirmation,
  } = useScanJobs();

  const scanTrigger = (
    // biome-ignore lint/a11y/noStaticElementInteractions: Wrapper for click handling
    // biome-ignore lint/a11y/useKeyWithClickEvents: Wrapper for click handling
    <div
      className="contents"
      onClick={shouldSkipConfirmation ? handleScan : undefined}
    >
      {variant === "icon" ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
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
              {isScanning
                ? "Scanning in progress..."
                : "Scan for new jobs (1 credit)"}
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
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
      )}
    </div>
  );

  const content = shouldSkipConfirmation ? (
    scanTrigger
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>{scanTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Iniciar escaneo de empleos?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción buscará nuevas ofertas que coincidan con tu perfil y
            tiene un costo de **1 crédito**.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="skip-confirm-dashboard"
            onCheckedChange={(checked) => setSkipConfirmation(!!checked)}
          />
          <Label
            htmlFor="skip-confirm-dashboard"
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
  );

  return (
    <>
      {content}
      <Dialog open={isScanning} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Escanenando ofertas</DialogTitle>
          </DialogHeader>
          <ScanningAnimation />
        </DialogContent>
      </Dialog>
    </>
  );
}
