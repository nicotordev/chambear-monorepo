import type { Job } from "./db";

export interface AlgoliaJob extends Job {
  objectID: string;
}

export interface AlgoliaUiState {
  [indexName: string]: {
    query?: string;
    refinementList?: Record<string, string[]>;
    page?: number;
    [key: string]:
      | string
      | string[]
      | number
      | Record<string, string[]>
      | undefined;
  };
}

export interface RouteState {
  search?: string;
  location?: string[];
  employmentType?: string[];
  page?: number;
}
