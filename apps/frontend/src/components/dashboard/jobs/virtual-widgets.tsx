"use client";

import {
  useHitsPerPage,
  usePagination,
  useRefinementList,
  useSearchBox,
} from "react-instantsearch";

export function VirtualWidgets() {
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
