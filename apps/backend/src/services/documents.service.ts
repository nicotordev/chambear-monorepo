import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "@/schemas/document";
import { prisma } from "../lib/prisma";

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

  async getProfileDocuments(profileId: string, userId: string) {
    return prisma.document.findMany({
      where: { profile: { id: profileId, userId } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getDocumentById(profileId: string, documentId: string, userId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profile: { id: profileId, userId } },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return doc;
  },

  async deleteDocument(profileId: string, documentId: string, userId: string) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profile: { id: profileId, userId } },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.delete({
      where: { id: documentId, profile: { id: profileId, userId } },
    });
  },

  async updateDocument(
    profileId: string,
    documentId: string,
    data: UpdateDocumentInput,
    userId: string
  ) {
    // Ensure ownership
    const doc = await prisma.document.findUnique({
      where: { id: documentId, profile: { id: profileId, userId } },
    });
    if (!doc) {
      throw new Error("Document not found or access denied");
    }
    return prisma.document.update({
      where: { id: documentId, profile: { id: profileId, userId } },
      data: UpdateDocumentSchema.parse(data),
    });
  },
};

export default documentService;
