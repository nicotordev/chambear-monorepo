"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Download,
  File as FileIcon,
  FileImage,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import useDocuments from "@/hooks/use-documents";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentType } from "@/types";
import { toast } from "sonner";
import { Document } from "@/types";

export function DashboardDocuments() {
  const {
    documents,
    isLoading,
    uploadFile,
    createDocument,
    deleteDocument,
  } = useDocuments();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<DocumentType>(DocumentType.RESUME);
  const [isUploading, setIsUploading] = useState(false);

  const hasDocs = documents && documents.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!label) {
        setLabel(selectedFile.name.split(".")[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !label || !type) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload file
      const url = await uploadFile(file);

      // 2. Create document record
      await createDocument({
        label,
        type,
        content: "File uploaded via dashboard", // Placeholder content or extracted text if available
        url,
        jobId: null,
        summary: null,
      });

      setFile(null);
      setLabel("");
      setType(DocumentType.RESUME);
      setIsUploadOpen(false);
    } catch (error) {
      console.error(error);
      // Error handled in hook
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
    } else {
      toast.error("Document has no URL");
    }
  };
  
  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
        await deleteDocument(docId);
    }
  }

  // Helper para asignar colores e iconos según el tipo de archivo
  const getFileIconProps = (docType: string) => {
    switch (docType) {
      case DocumentType.RESUME:
      case DocumentType.COVER_LETTER:
        return {
          icon: FileText,
          color: "text-red-600 bg-red-600/10 border-red-200",
        };
      case DocumentType.NOTE:
        return {
          icon: FileText,
          color: "text-blue-600 bg-blue-600/10 border-blue-200",
        };
      case DocumentType.OTHER:
        return {
          icon: FileImage,
          color: "text-purple-600 bg-purple-600/10 border-purple-200",
        };
      default:
        return {
          icon: FileIcon,
          color: "text-muted-foreground bg-muted border-border",
        };
    }
  };

  return (
    <div className="flex flex-col p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <FolderOpen className="size-3.5" /> Mis Documentos
        </h3>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-6 rounded-full"
                >
                  <Plus className="size-3.5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Subir nuevo documento</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Sube tu CV, carta de presentación u otros documentos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Archivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Nombre (Etiqueta)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej. CV 2024"
                  disabled={isUploading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as DocumentType)}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DocumentType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
                    Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={!file || !label || isUploading}>
                    {isUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Subir
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        ) : hasDocs ? (
          <div className="grid gap-3">
            {documents.map((file) => {
              const style = getFileIconProps(file.type);
              const Icon = style.icon;

              return (
                <div
                  key={file.id}
                  onClick={() => handleDownload(file)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-muted/40 p-3 transition-all hover:border-border hover:bg-background hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-lg border p-2",
                        style.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground/90 pr-2">
                        {file.label}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground">
                         {file.type} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="flex shrink-0 items-center text-muted-foreground gap-2">
                    {/* Icono de descarga visible solo al hover */}
                    <Download className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                     <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleDelete(e, file.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State / Upload Zone
          <div
            onClick={() => setIsUploadOpen(true)}
            className="group flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
          >
            <div className="mb-3 rounded-full bg-muted p-3 transition-transform group-hover:scale-110">
              <FileIcon className="size-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Tu portafolio está vacío
            </p>
            <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">
              Sube tu CV o Portafolio para aplicar más rápido.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-primary group-hover:underline"
            >
              Subir archivo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}