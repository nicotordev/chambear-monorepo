"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input"
import api from "@/lib/api";

export default function AppSidebarJobSearcher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get("search") || "";
  });

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (searchTerm !== currentSearch) {
      setSearchTerm(currentSearch);
    }
  }, [searchParams, searchTerm]);

  const updateSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`/dashboard?${params.toString()}`);
  };

  useDebounce(
    () => {
      const currentSearch = searchParams.get("search") || "";
      if (searchTerm !== currentSearch) {
        updateSearch(searchTerm);
      }
    },
    500,
    [searchTerm],
  );

  const handleClear = () => {
    setSearchTerm("");
    updateSearch("");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateSearch(searchTerm);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative group flex items-center w-full"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          type="text"
          placeholder="Search jobs..."
          className="pl-9 pr-8 w-full h-9 bg-muted/50 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary rounded-md transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </form>
  );
}
