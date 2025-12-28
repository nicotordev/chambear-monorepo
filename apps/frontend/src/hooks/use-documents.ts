import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/schemas/document";

export default function useDocuments() {
  const queryClient = useQueryClient();

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.getDocuments(),
  });

  const { mutateAsync: uploadDocument, isPending: isPendingUploadDocument } =
    useMutation({
      mutationFn: (document: CreateDocumentInput) =>
        api.uploadDocument(document),
      onSuccess: () => {
        toast.success("Document uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (error) => {
        toast.error("Failed to upload document");
        console.error(error);
      },
    });

  const { mutateAsync: updateDocument, isPending: isPendingUpdateDocument } =
    useMutation({
      mutationFn: (document: UpdateDocumentInput) =>
        api.updateDocument(document.id, document),
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
      mutationFn: (documentId: string) => api.deleteDocument(documentId),
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
    isPendingUploadDocument ||
    isPendingUpdateDocument ||
    isPendingDeleteDocument;

  return {
    documents,
    uploadDocument,
    updateDocument,
    deleteDocument,
    isLoading,
  };
}
