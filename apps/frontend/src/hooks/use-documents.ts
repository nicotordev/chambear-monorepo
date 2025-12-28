import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/schemas/document";
import { useUser } from "@/contexts/user-context";

export default function useDocuments() {
  const queryClient = useQueryClient();
  const { currentProfile } = useUser();
  const profileId = currentProfile?.id;

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", profileId],
    queryFn: () => {
      if (!profileId) return Promise.resolve([]);
      return api.getDocuments(profileId);
    },
    enabled: !!profileId,
  });

  const { mutateAsync: uploadFile, isPending: isPendingUploadFile } =
    useMutation({
      mutationFn: (file: File) => {
        if (!profileId) throw new Error("No profile selected");
        return api.uploadFile(file, profileId);
      },
      onError: (error) => {
        toast.error("Failed to upload file");
        console.error(error);
      },
    });

  const { mutateAsync: createDocument, isPending: isPendingCreateDocument } =
    useMutation({
      mutationFn: (document: CreateDocumentInput) => {
        if (!profileId) throw new Error("No profile selected");
        return api.createDocument(document, profileId);
      },
      onSuccess: () => {
        toast.success("Document created successfully");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (error) => {
        toast.error("Failed to create document");
        console.error(error);
      },
    });

  const { mutateAsync: updateDocument, isPending: isPendingUpdateDocument } =
    useMutation({
      mutationFn: (document: UpdateDocumentInput) => {
        if (!profileId) throw new Error("No profile selected");
        return api.updateDocument(document.id, document, profileId);
      },
      onSuccess: () => {
        toast.success("Document updated successfully");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (error) => {
        toast.error("Failed to update document");
        console.error(error);
      },
    });

  const { mutateAsync: deleteDocument, isPending: isPendingDeleteDocument } =
    useMutation({
      mutationFn: (documentId: string) => {
        if (!profileId) throw new Error("No profile selected");
        return api.deleteDocument(documentId, profileId);
      },
      onSuccess: () => {
        toast.success("Document deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (error) => {
        toast.error("Failed to delete document");
        console.error(error);
      },
    });

  const isLoading =
    isLoadingDocuments ||
    isPendingUploadFile ||
    isPendingCreateDocument ||
    isPendingUpdateDocument ||
    isPendingDeleteDocument;

  return {
    documents,
    uploadFile,
    createDocument,
    updateDocument,
    deleteDocument,
    isLoading,
  };
}
