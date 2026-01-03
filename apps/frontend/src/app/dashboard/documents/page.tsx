import type { Metadata } from "next";
import { cookies } from "next/headers";
import backend from "@/lib/backend";
import { DocumentsView } from "../../../components/dashboard/documents/documents-view";

export const metadata: Metadata = {
  title: "Documents",
  description: "Manage your documents",
};

export default async function DocumentsPage() {
  const user = await backend.user.getMe();
  const cookieStore = await cookies();
  const profileIdCookie = cookieStore.get("chambear_current_profile_id")?.value;

  // Logic matching UserContext: check if cookie ID is valid for this user
  const currentProfile = user.profiles?.find((p) => p.id === profileIdCookie);
  // Fallback to first profile if cookie is missing or invalid
  const profileId = currentProfile?.id || user.profiles?.[0]?.id;

  const documents = profileId ? await backend.documents.list(profileId) : [];

  return (
    <div className="flex h-full flex-col space-y-8 p-8 bg-background animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage your resumes, cover letters, and notes.
          </p>
        </div>
      </div>

      <DocumentsView initialDocuments={documents} />
    </div>
  );
}
