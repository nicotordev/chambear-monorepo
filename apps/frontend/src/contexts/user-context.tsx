"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Profile } from "@/types";
import api from "@/lib/api";

interface UserContextType {
  user: User | undefined;
  profiles: Profile[];
  currentProfile: Profile | undefined;
  isLoading: boolean;
  switchProfile: (profileId: string) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => api.getUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const profiles = user?.profile || [];

  // Initialize currentProfileId if not set or if the current one is invalid
  useEffect(() => {
    if (profiles.length > 0) {
      // If no profile is selected, or the selected one doesn't exist in the list anymore
      if (
        !currentProfileId ||
        !profiles.find((p) => p.id === currentProfileId)
      ) {
        // Try to recover from local storage first
        const storedProfileId = localStorage.getItem("chambear_current_profile_id");
        if (storedProfileId && profiles.find((p) => p.id === storedProfileId)) {
          setCurrentProfileId(storedProfileId);
        } else {
          // Default to the first one
          setCurrentProfileId(profiles[0].id);
        }
      }
    }
  }, [profiles, currentProfileId]);

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  const switchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setCurrentProfileId(profileId);
      localStorage.setItem("chambear_current_profile_id", profileId);
    }
  };

  const refreshUser = async () => {
    await refetch();
    // Invalidate other queries that might depend on the user/profile
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profiles,
        currentProfile,
        isLoading,
        switchProfile,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
