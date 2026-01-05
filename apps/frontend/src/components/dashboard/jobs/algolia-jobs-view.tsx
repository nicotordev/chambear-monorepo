"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ALGOLIA_INDEX_NAME, algoliaClient } from "@/lib/algolia";
import type { Job } from "@/types";
import { Filter, SearchX } from "lucide-react";
import {
  Configure,
  RefinementList,
  useHits,
  useHitsPerPage,
  usePagination,
  useRefinementList,
  useSearchBox,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import JobCardMinimalWithFit from "./job-card-minimal-with-fit";
import SelectedJob from "./selected-job";

import { useJobsPageStore } from "@/stores/jobs-page/jobs-page";

interface AlgoliaJob extends Job {
  objectID: string;
}

interface AlgoliaUiState {
  [indexName: string]: {
    query?: string;
    refinementList?: Record<string, string[]>;
    page?: number;
    [key: string]: any;
  };
}

function VirtualWidgets() {
  useSearchBox();
  useRefinementList({ attribute: "location" });
  useRefinementList({ attribute: "employmentType" });
  useRefinementList({ attribute: "title" });
  usePagination();
  useHitsPerPage({
    items: [
      { label: "10 per page", value: 10, default: true },
      { label: "20 per page", value: 20 },
      { label: "50 per page", value: 50 },
    ],
  });
  return null;
}

function CustomPagination() {
  const {
    currentRefinement,
    nbPages,
    pages,
    isFirstPage,
    isLastPage,
    refine,
    createURL,
  } = usePagination();

  if (nbPages <= 1) return null;

  return (
    <Pagination className="mt-8">
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          {!isFirstPage && (
            <PaginationPrevious
              href={createURL(currentRefinement - 1)}
              onClick={(event) => {
                event.preventDefault();
                refine(currentRefinement - 1);
              }}
            />
          )}
        </PaginationItem>

        {pages.map((page) => {
          const isEllipsis = page === -1; // react-instantsearch uses -1 for ellipsis in some versions, but let's check the pages array
          if (isEllipsis) {
            return (
              <PaginationItem key={`ellipsis-${Math.random()}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href={createURL(page)}
                isActive={currentRefinement === page}
                onClick={(event) => {
                  event.preventDefault();
                  refine(page);
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          {!isLastPage && (
            <PaginationNext
              href={createURL(currentRefinement + 1)}
              onClick={(event) => {
                event.preventDefault();
                refine(currentRefinement + 1);
              }}
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function HitsPerPageSelector() {
  const { items, refine } = useHitsPerPage({
    items: [
      { label: "10 per page", value: 10, default: true },
      { label: "20 per page", value: 20 },
      { label: "50 per page", value: 50 },
    ],
  });

  const currentValue = items.find((item) => item.isRefined)?.value || 10;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Show
      </span>
      <Select
        value={currentValue.toString()}
        onValueChange={(value) => refine(Number.parseInt(value))}
      >
        <SelectTrigger size="sm" className="h-8 w-27.5">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value.toString()}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CustomHits() {
  const { items, results } = useHits<AlgoliaJob>();
  const setJobs = useJobsPageStore((state) => state.setJobs);

  useEffect(() => {
    if (results) {
      setJobs(items as unknown as Job[]);
    }
  }, [items, results, setJobs]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted p-4 rounded-full mb-4">
          <SearchX className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No results found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {results?.nbHits} jobs found
        </p>
        <HitsPerPageSelector />
      </div>
      {items.map((hit) => (
        <JobCardMinimalWithFit key={hit.objectID} job={hit} />
      ))}
      <CustomPagination />
    </div>
  );
}

export default function AlgoliaJobsView({
  initialJobs,
}: {
  initialJobs: Job[];
}) {
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
            };
          },
          routeToState(routeState): AlgoliaUiState {
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
        {/* Header with Search and Filter */}
        <div className="px-8 py-4 border-b bg-card/30 backdrop-blur-sm shrink-0 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Find your next opportunity with Al-powered search.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold px-1">Job Title</h4>
                    <RefinementList
                      attribute="title"
                      limit={10}
                      showMore
                      searchable
                      searchablePlaceholder="Search titles..."
                      classNames={{
                        label:
                          "flex items-center gap-2 text-sm py-1.5 cursor-pointer hover:text-primary transition-colors",
                        checkbox:
                          "rounded border-muted-foreground/30 text-primary focus:ring-primary/20",
                        count:
                          "ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full",
                        noResults:
                          "text-xs text-muted-foreground py-2 text-center",
                        showMore:
                          "text-xs font-medium text-primary mt-2 flex items-center justify-center w-full py-1 hover:bg-muted rounded-md transition-colors",
                      }}
                    />
                  </div>
                  <div className="space-y-4 pt-2 border-t">
                    <h4 className="font-semibold px-1">Location</h4>
                    <RefinementList
                      attribute="location"
                      limit={10}
                      showMore
                      searchable
                      searchablePlaceholder="Search locations..."
                      className="AlgoliaRefinementList"
                      classNames={{
                        label:
                          "flex items-center gap-2 text-sm py-1.5 cursor-pointer hover:text-primary transition-colors",
                        checkbox:
                          "rounded border-muted-foreground/30 text-primary focus:ring-primary/20",
                        count:
                          "ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full",
                        noResults:
                          "text-xs text-muted-foreground py-2 text-center",
                        showMore:
                          "text-xs font-medium text-primary mt-2 flex items-center justify-center w-full py-1 hover:bg-muted rounded-md transition-colors",
                      }}
                    />
                  </div>
                  <div className="space-y-4 pt-2 border-t">
                    <h4 className="font-semibold px-1">Employment Type</h4>
                    <RefinementList
                      attribute="employmentType"
                      classNames={{
                        label:
                          "flex items-center gap-2 text-sm py-1.5 cursor-pointer hover:text-primary transition-colors",
                        checkbox:
                          "rounded border-muted-foreground/30 text-primary focus:ring-primary/20",
                        count:
                          "ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full",
                      }}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main layout */}
        <div className="pl-8 flex items-stretch gap-4 overflow-x-hidden flex-1 h-full">
          {/* LEFT: Job list */}
          <div className="w-105 min-w-87.5 border-r overflow-y-scroll overflow-x-hidden pr-8 pb-8 scrollbar-hide">
            <CustomHits />
          </div>

          {/* RIGHT: Job detail */}
          <div className="flex-1 overflow-y-auto bg-background/50">
            <SelectedJob ssrJobs={initialJobs} />
          </div>
        </div>
      </div>
    </InstantSearchNext>
  );
}
