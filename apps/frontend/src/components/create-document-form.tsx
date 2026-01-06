"use client";
import { Loader2, UploadCloud } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDocuments from "@/hooks/use-documents";
import { DocumentType } from "@/types";

export interface CreateDocumentFormProps {
  onSuccess: () => void;
}
export default function CreateDocumentForm({
  onSuccess,
}: CreateDocumentFormProps) {
  const { uploadFile, createDocument, isLoading } = useDocuments();
  const [file, setFile] = React.useState<File | null>(null);
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<DocumentType>(DocumentType.RESUME); // Default value

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label) return;

    try {
      // Upload the file (handles creation)
      await uploadFile({ file, label, type });

      onSuccess();
      setLabel("");
      setFile(null);
    } catch (error) {
      console.error("Error in creation flow:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="doc-name">Document Name</Label>
        <Input
          id="doc-name"
          placeholder="Ex: Full Stack CV 2024"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-type">Type</Label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as DocumentType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(DocumentType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-file">File (PDF, DOCX)</Label>
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
              Saving...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 size-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
