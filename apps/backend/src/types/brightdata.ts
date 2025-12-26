export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
export type UnlockerFormat = "raw" | "json";

export type UnlockerSyncRequest = Readonly<{
  zone: string;
  url: string;
  format?: UnlockerFormat;
  method?: HttpMethod;
  country?: string;
  data_format?: "markdown" | "html" | "text" | string;
  body?: string;
  headers?: Record<string, string>;
  cookies?: string;
  timeout_ms?: number;
}>;

export type UnlockerSyncResponse =
  | Readonly<{
      kind: "raw";
      status: number;
      headers: Readonly<Record<string, string>>;
      body: string;
    }>
  | Readonly<{
      kind: "json";
      status: number;
      headers: Readonly<Record<string, string>>;
      body: unknown;
    }>;
