"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setCookie, useGetCookie } from "cookies-next/client";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect } from "react";
import api from "@/lib/api";
import type { Profile, User } from "@/types";

interface UserContextType {
  user: User | undefined;
  profiles: Profile[];
  currentProfile: Profile | undefined;
  isLoading: boolean;
  isFetching: boolean;
  switchProfile: (profileId: string) => void;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const getCookie = useGetCookie();

  const {
    data: user,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => api.getUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const profiles = user?.profiles || [];
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If we have loaded the user, and they have NO profiles, force them to onboarding.
    // However, if they are already on /onboarding, do nothing to avoid loops/redundancy.
    if (
      !isLoading &&
      user &&
      profiles.length === 0 &&
      !pathname?.startsWith("/onboarding")
    ) {
      router.push("/onboarding");
    }
  }, [isLoading, user, profiles, pathname, router]);

  // Initialize currentProfileId if not set or if the current one is invalid
  useEffect(() => {
    const cookie = getCookie("chambear_current_profile_id");
    if (profiles.length > 0) {
      const isValidProfile = cookie && profiles.find((p) => p.id === cookie);
      if (!isValidProfile) {
        setCookie("chambear_current_profile_id", profiles[0].id, {
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }
  }, [profiles, getCookie]);

  const currentProfile = profiles.find(
    (p) => p.id === getCookie("chambear_current_profile_id"),
  );

  const switchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setCookie("chambear_current_profile_id", profileId, {
        maxAge: 60 * 60 * 24 * 365,
      });
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
        isFetching,
        switchProfile,
        refreshUser,
        refreshProfile: refreshUser,
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

export function useProfile() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a UserProvider");
  }
  return context;
}

export function useAppUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useAppUser must be used within a UserProvider");
  }
  return context;
}
