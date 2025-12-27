import { prisma } from "../lib/prisma";
import {
  CreateDocumentSchema,
  type CreateDocumentInput,
} from "@/schemas/document";

const documentService = {
  /**
   * Create a document for a user.
   */
  async createDocument(profileId: string, data: CreateDocumentInput) {
    const validated = CreateDocumentSchema.parse(data);

    return prisma.document.create({
      data: {
        profileId,
        ...validated,
      },
    });
  },

  async getUserDocuments(profileId: string) {
    return prisma.document.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
  },

  async deleteDocument(profileId: string, documentId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.profileId !== profileId) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.delete({
      where: { id: documentId },
    });
  },

  async updateDocument(
    profileId: string,
    documentId: string,
    data: CreateDocumentInput
  ) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.profileId !== profileId) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.update({
      where: { id: documentId },
      data: CreateDocumentSchema.parse(data),
    });
  },
};

export default documentService;
