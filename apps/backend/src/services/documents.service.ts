import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "@/schemas/document";
import { prisma } from "../lib/prisma";
import { uploadFileToR2 } from "@/lib/storage";

const documentService = {
  /**
   * Create a document for a user.
   */
  async createDocument(
    profileId: string,
    data: CreateDocumentInput,
    userId: string
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

  async uploadDocument(profileId: string, file: File) {
    const extension = file.name.split(".").pop();
    const fileName = `${profileId}-${Date.now()}.${extension}`;
    const contentType = file.type;

    const uploadedFileR2 = await uploadFileToR2(
      Buffer.from(await file.arrayBuffer()),
      `documents/${profileId}`,
      fileName,
      contentType
    );

    return uploadedFileR2;
  },
};

export default documentService;
