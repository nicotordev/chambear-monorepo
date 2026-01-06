"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabTriggerProps {
  children: React.ReactNode;
}
export default function TabTrigger({ children }: TabTriggerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState(() =>
    searchParams.get("state") === "sign-in" ? "sign-in" : "sign-up",
  );

  useEffect(() => {
    router.replace("/auth?state=" + state);
  }, [state]);

  return (
    <Tabs value={state} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="sign-in" onClick={() => setState("sign-in")}>
          Sign In
        </TabsTrigger>
        <TabsTrigger value="sign-up" onClick={() => setState("sign-up")}>
          Sign Up
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
