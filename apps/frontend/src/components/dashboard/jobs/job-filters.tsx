"use client";

import { RefinementList } from "react-instantsearch";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function JobFilters() {
  return (
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
              noResults: "text-xs text-muted-foreground py-2 text-center",
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
              noResults: "text-xs text-muted-foreground py-2 text-center",
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
  );
}
