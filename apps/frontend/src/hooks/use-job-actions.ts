import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAppUser } from "@/contexts/user-context";
import api from "@/lib/api";
export default function useJobActions() {
  const { currentProfile, profiles } = useAppUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleScan = async () => {
    if (!currentProfile?.id) {
      if (profiles.length === 0) {
        toast.error("You must create a profile first");
        router.push("/onboarding");
        return;
      }
      toast.error("Select a profile to start scanning");
      return;
    }
    setIsLoading(true);
    try {
      await api.scanJobs(currentProfile?.id);
      toast.success("Scan started successfully");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Error starting scan");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleScan,
  };
}
