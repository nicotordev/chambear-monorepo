"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "react-use";
import { Input } from "./ui/input";

export default function AppSidebarJobSearcher(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState<string>("");

  // Guardamos el último "search" de la URL que aplicamos al estado,
  // para evitar re-sincronizaciones que pisan el input mientras tipeas.
  const lastUrlSearchRef = useRef<string>("");

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";

    // Solo sincroniza estado cuando la URL cambió realmente (navegación externa)
    if (currentSearch !== lastUrlSearchRef.current) {
      lastUrlSearchRef.current = currentSearch;
      setSearchTerm(currentSearch);
    }
  }, [searchParams]);

  const replaceWithParams = useCallback(
    (params: URLSearchParams, targetPath: string) => {
      const qs = params.toString();
      const url = qs.length > 0 ? `${targetPath}?${qs}` : targetPath;
      router.replace(url);
    },
    [router]
  );

  const updateSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmed.length > 0) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }

      const targetPath = pathname.startsWith("/dashboard/jobs")
        ? pathname
        : "/dashboard/jobs";

      // Actualiza el ref para que el effect no te pise el input después del replace
      lastUrlSearchRef.current = trimmed;

      replaceWithParams(params, targetPath);
    },
    [pathname, replaceWithParams, searchParams]
  );

  useDebounce(
    () => {
      const currentSearch = searchParams.get("search") ?? "";
      const next = searchTerm.trim();

      // Evita reemplazar si no cambió nada
      if (next === currentSearch) return;

      updateSearch(next);
    },
    500,
    [searchTerm, searchParams, updateSearch]
  );

  const handleClear = useCallback(() => {
    setSearchTerm("");
    updateSearch("");
  }, [updateSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      updateSearch(searchTerm);
    },
    [searchTerm, updateSearch]
  );

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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
        {searchTerm.length > 0 && (
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
