"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
            networkMode: "always",
          },
        },
      })
  );

  const [persister, setPersister] = useState<any>(undefined);

  useEffect(() => {
    // Ensure this only runs on the client to avoid hydration mismatch
    if (typeof window !== "undefined") {
      const localStoragePersister = createAsyncStoragePersister({
        storage: window.localStorage,
      });
      setPersister(localStoragePersister);
    }
  }, []);

  if (!persister) {
    // During SSR or initial client mount before useEffect, render without persistence
    // or return a loading state if persistence is critical (usually not for providers)
    // Here we can just use the standard provider temporarily or return children wrapped in Clerk
    // But PersistQueryClientProvider requires a persister.
    // Strategy: Render Clerk -> Provider with NO persistence (loading) or just wait.
    // Better strategy for Next.js to avoid flicker: Render basic provider first?
    // Actually, for this specific lib, it's safer to wait for mount or use a non-persisting client initially.
    // However, simplest safe fix for now is:
    return (
      <TooltipProvider>
        <ClerkProvider>
          {/* Fallback provider until persister is ready if strict persistence is needed,
                but usually we can just render children or a loader.
                For onboarding, we want to ensure we don't have hydration errors.
            */}
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: createAsyncStoragePersister({ storage: undefined }),
            }} // No-op persister for SSR
          >
            {children}
          </PersistQueryClientProvider>
        </ClerkProvider>
      </TooltipProvider>
    );
  }

  return (
    <ClerkProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {children}
      </PersistQueryClientProvider>
    </ClerkProvider>
  );
}
