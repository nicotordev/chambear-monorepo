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
  const [type, setType] = React.useState<string>("RESUME"); // Default value

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label) return;

    try {
      // 1. Upload the file
      const uploadResponse = await uploadFile(file);
      // Assuming uploadFile returns { url: string } or the string directly.
      // Adjust this according to what your api.uploadFile returns
      const fileUrl = uploadResponse;

      // 2. Create the record in the DB
      await createDocument({
        label,
        type: type as any, // Adjust type according to your enum
        url: fileUrl,
        content: "Content pending processing", // Optional, depends on your backend
      });

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
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESUME">Resume (CV)</SelectItem>
            <SelectItem value="COVER_LETTER">Cover Letter</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
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