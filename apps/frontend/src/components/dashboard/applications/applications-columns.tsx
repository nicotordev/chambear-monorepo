"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Building2,
  Calendar,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Application, Job } from "@/types";
import { ApplicationStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

// Type definition
type Row = Application & { job?: Job };

// Helper: Status Styles (Refined for better contrast)
const getStatusStyles = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.APPLIED:
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50";
    case ApplicationStatus.INTERVIEW:
    case ApplicationStatus.INTERVIEWING:
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50";
    case ApplicationStatus.OFFER:
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50";
    case ApplicationStatus.REJECTED:
      return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  }
};

export const applicationColumns: ColumnDef<Row>[] = [
  {
    id: "title",
    accessorFn: (row) => row.job?.title || "Sin título",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Puesto / Empresa</span>
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const job = row.original.job;
      const companyName =
        job?.company?.name ?? job?.companyName ?? "Empresa Confidencial";
      const title = job?.title ?? "Puesto desconocido";

      return (
        <div className="flex items-center gap-3 py-1">
          {/* Logo / Icon Placeholder */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>

          {/* Text Content with Truncation */}
          <div className="flex flex-col max-w-45 md:max-w-60">
            <span
              className="truncate text-sm font-medium leading-none text-foreground"
              title={title}
            >
              {title}
            </span>
            <span
              className="truncate text-xs text-muted-foreground mt-1.5"
              title={companyName}
            >
              {companyName}
            </span>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border shadow-sm",
            getStatusStyles(status)
          )}
        >
          {status}
        </Badge>
      );
    },
  },

  {
    accessorKey: "appliedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start px-0 text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <Calendar className="mr-2 h-3.5 w-3.5" />
        Fecha envío
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.appliedAt;

      if (!date) {
        return (
          <span className="text-muted-foreground text-xs italic">
            Pendiente
          </span>
        );
      }

      return (
        <div className="text-sm font-medium tabular-nums text-foreground/80">
          {new Intl.DateTimeFormat("es-CL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(date))}
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const application = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-45">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(application.id)}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Copiar ID
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer focus:bg-destructive/10">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
