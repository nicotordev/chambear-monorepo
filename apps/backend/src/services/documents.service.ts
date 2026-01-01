import { DocumentType } from "@/lib/generated";
import { uploadFileToR2 } from "@/lib/storage";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "@/schemas/document";
import { ocrSpace } from "ocr-space-api-wrapper";
import { PDFParse } from "pdf-parse";
import { prisma } from "../lib/prisma";

const documentService = {
  /**
   * Create a document for a user.
   */
  async createDocument(
    profileId: string,
    data: CreateDocumentInput,
    _userId: string
  ) {
    const validated = CreateDocumentSchema.parse(data);

    return prisma.document.create({
      data: {
        profileId,
        ...validated,
      },
    });
  },

  async getProfileDocuments(profileId: string) {
    return prisma.document.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getDocumentById(profileId: string, documentId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profileId },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return doc;
  },

  async deleteDocument(profileId: string, documentId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profileId },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.delete({
      where: { id: documentId, profileId },
    });
  },

  async updateDocument(
    profileId: string,
    documentId: string,
    data: UpdateDocumentInput
  ) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profileId },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.update({
      where: { id: documentId, profileId },
      data: UpdateDocumentSchema.parse(data),
    });
  },

  async uploadDocument(
    profileId: string,
    file: File,
    type: DocumentType = DocumentType.RESUME,
    label?: string
  ) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${profileId}-${Date.now()}.${extension}`;
    const contentType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to R2 (Cloudflare)
    const uploadedFileR2 = await uploadFileToR2(
      buffer,
      `documents/${profileId}`,
      fileName,
      contentType
    );

    let extractedText = "";

    try {
      // 2. Try to extract text using pdf-parse if it's a PDF
      if (contentType === "application/pdf") {
        try {
          const pdfParse = new PDFParse(buffer);
          const pdfData = await pdfParse.getText();
          if (pdfData.text && pdfData.text.trim().length > 0) {
            extractedText = pdfData.text;
          }
        } catch (e) {
          console.error("PDF parse error, falling back to OCR", e);
        }
      }

      // 3. If no text found (or not PDF), try OCR Space
      // OCR Space accepts base64 with data URI scheme
      if (!extractedText) {
        // Only try OCR for images or PDFs that failed text extraction
        // Supported by OCR Space: PDF, PNG, JPG, WEBP...
        const supportedTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/webp",
        ];

        if (supportedTypes.includes(contentType)) {
          console.log("Attempting OCR for", contentType);
          const base64 = buffer.toString("base64");
          const dataUri = `data:${contentType};base64,${base64}`;

          const ocrRes = await ocrSpace(dataUri, {
            apiKey: process.env.OCR_API_KEY || "helloworld", // 'helloworld' is the free default key
            language: "eng", // Default to English, or make it dynamic if needed
          });

          if (
            ocrRes &&
            ocrRes.ParsedResults &&
            ocrRes.ParsedResults.length > 0
          ) {
            extractedText = ocrRes.ParsedResults.map(
              (r: any) => r.ParsedText
            ).join("\n");
          }
        }
      }
    } catch (error) {
      console.error("OCR/Extraction failed:", error);
      // We don't fail the upload just because OCR failed
    }

    // Ensure content is not empty for Schema validation (min(1))
    const finalContent =
      extractedText.trim().length > 0
        ? extractedText
        : "No text content extracted.";

    // 4. Create Document in DB
    const document = await prisma.document.create({
      data: {
        profileId,
        type,
        label: label || file.name,
        content: finalContent,
        url: uploadedFileR2,
        summary: null, // AI can generate this later
      },
    });

    return document;
  },
};

export default documentService;
