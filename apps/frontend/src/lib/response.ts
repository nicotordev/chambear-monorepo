import type { AxiosError } from "axios";
import axios from "axios";
import type Error from "next/error";
import { NextResponse } from "next/server";

export interface BaseResponse {
  meta: {
    ok: boolean;
    status: number;
    message: string;
  };
}

export interface SuccessResponse<T> extends BaseResponse {
  data: T;
}

export interface ErrorResponse extends BaseResponse {
  error?: Array<{ message: string; code: string; path: string[] }>;
}

type ErrorInput =
  | string
  | {
      message: string;
      status?: number;
      error?: Array<{ message: string; code: string; path: string[] }>;
    };

export const response = {
  success<T>(data: T, message = "Success", status = 200) {
    return NextResponse.json(
      {
        data,
        meta: {
          ok: true,
          status,
          message,
        },
      } satisfies SuccessResponse<T>,
      { status }
    );
  },

  created<T>(data: T, message = "Created") {
    return this.success(data, message, 201);
  },

  noContent() {
    return new NextResponse(null, { status: 204 });
  },

  error(input: ErrorInput) {
    const message = typeof input === "string" ? input : input.message;
    const status = typeof input === "string" ? 500 : input.status ?? 500;
    const error = typeof input === "string" ? undefined : input.error;

    return NextResponse.json(
      {
        error,
        meta: {
          ok: false,
          status,
          message,
        },
      } satisfies ErrorResponse,
      { status }
    );
  },

  badRequest(
    message = "Bad Request",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 400, error });
  },

  unauthorized(
    message = "Unauthorized",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 401, error });
  },

  forbidden(
    message = "Forbidden",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 403, error });
  },

  notFound(
    message = "Not Found",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 404, error });
  },

  conflict(
    message = "Conflict",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 409, error });
  },

  unprocessableEntity(
    message = "Unprocessable Entity",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 422, error });
  },

  internalError(
    message = "Internal Server Error",
    error?: Array<{ message: string; code: string; path: string[] }>
  ) {
    return this.error({ message, status: 500, error });
  },

  handleAxios(error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const data = error.response?.data as ErrorResponse | undefined;
      const message = data?.meta?.message ?? error.message ?? "An unexpected error occurred";

      return this.error({ message, status, error: data?.error });
    }
    return this.internalError();
  },
};
