"use client";

import { Filter } from "lucide-react";
import { Configure } from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { ALGOLIA_INDEX_NAME, algoliaClient } from "@/lib/algolia";
import type { AlgoliaUiState, RouteState } from "@/types/algolia";
import { JobExplorer } from "./job-explorer";
import { JobFilters } from "./job-filters";
import { VirtualWidgets } from "./virtual-widgets";

export default function AlgoliaJobsView() {
  return (
    <InstantSearchNext
      searchClient={algoliaClient}
      indexName={ALGOLIA_INDEX_NAME}
      future={{ preserveSharedStateOnUnmount: true }}
      routing={{
        router: {
          cleanUrlOnDispose: false,
        },
        stateMapping: {
          stateToRoute(uiState: AlgoliaUiState) {
            const indexUiState = uiState[ALGOLIA_INDEX_NAME] || {};
            return {
              search: indexUiState.query,
              location: indexUiState.refinementList?.location,
              employmentType: indexUiState.refinementList?.employmentType,
              page: indexUiState.page,
            } as RouteState;
          },
          routeToState(routeState: RouteState): AlgoliaUiState {
            return {
              [ALGOLIA_INDEX_NAME]: {
                query: routeState.search,
                refinementList: {
                  location: routeState.location || [],
                  employmentType: routeState.employmentType || [],
                },
                page: routeState.page,
              },
            };
          },
        },
      }}
    >
      <Configure hitsPerPage={20} />
      <VirtualWidgets />

      <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-background">
        {/* Simplified Header */}
        <div className="px-6 py-3 border-b bg-background/80 backdrop-blur-md shrink-0 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Job Hunt</h1>
            <div className="h-4 w-px bg-border/50" />
            <p className="text-sm text-muted-foreground hidden sm:block">
              Swipe right to save, left to pass
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <Filter className="size-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </SheetTrigger>
              <JobFilters />
            </Sheet>
          </div>
        </div>

        {/* Main layout */}
        <JobExplorer />
      </div>
    </InstantSearchNext>
  );
}
