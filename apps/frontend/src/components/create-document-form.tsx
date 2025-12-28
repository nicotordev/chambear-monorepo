"use client";
import useDocuments from "@/hooks/use-documents";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UploadCloud } from "lucide-react";

export interface CreateDocumentFormProps {
  onSuccess: () => void;
}
export default function CreateDocumentForm({ onSuccess }: CreateDocumentFormProps) {
  const { uploadFile, createDocument, isLoading } = useDocuments();
  const [file, setFile] = React.useState<File | null>(null);
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<string>("RESUME"); // Valor por defecto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label) return;

    try {
      // 1. Subir el archivo
      const uploadResponse = await uploadFile(file);
      // Asumiendo que uploadFile retorna { url: string } o el string directo.
      // Ajusta esto según lo que retorne tu api.uploadFile
      const fileUrl = uploadResponse;

      // 2. Crear el registro en la BD
      await createDocument({
        label,
        type: type as any, // Ajustar tipo según tu enum
        url: fileUrl,
        content: "Contenido pendiente de procesar", // Opcional, depende de tu backend
      });

      onSuccess();
      setLabel("");
      setFile(null);
    } catch (error) {
      console.error("Error en el flujo de creación:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="doc-name">Nombre del documento</Label>
        <Input
          id="doc-name"
          placeholder="Ej: CV Full Stack 2024"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-type">Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESUME">Currículum (CV)</SelectItem>
            <SelectItem value="COVER_LETTER">Carta de Presentación</SelectItem>
            <SelectItem value="OTHER">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-file">Archivo (PDF, DOCX)</Label>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            id="doc-file"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading || !file || !label}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 size-4" />
              Subir Documento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
