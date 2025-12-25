import { prisma } from "../lib/prisma";
import {
  CreateDocumentSchema,
  type CreateDocumentInput,
} from "@/schemas/document";

const documentService = {
  /**
   * Create a document for a user.
   */
  async createDocument(userId: string, data: CreateDocumentInput) {
    const validated = CreateDocumentSchema.parse(data);

    return prisma.document.create({
      data: {
        userId,
        ...validated,
      },
    });
  },

  async getUserDocuments(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
  
  async deleteDocument(userId: string, documentId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.userId !== userId) {
        throw new Error("Document not found or access denied");
    }
    return prisma.document.delete({
        where: { id: documentId }
    });
  }
};

export default documentService;
