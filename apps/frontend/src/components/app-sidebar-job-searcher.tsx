"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";

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
      className="relative flex items-stretch justify-center w-full"
    >
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search job..."
          className="pr-10 w-full py-2 rounded-r-0! rounded-l-full!"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button
        size="icon"
        aria-label="Search"
        className="rounded-l-0 rounded-r-full! shrink-0"
        type="submit"
      >
        <Search className="size-4" />
      </Button>
    </form>
  );
}
