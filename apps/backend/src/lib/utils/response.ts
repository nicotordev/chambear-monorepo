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

export interface ErrorDetail {
  message: string;
  code: string;
  path: string[];
}

export interface ErrorResponse extends BaseResponse {
  error?: ErrorDetail[];
}

type ErrorInput =
  | string
  | { message: string; status?: number; error?: ErrorDetail[] };

const response = {
  success<T>(data: T, message = "Success", status = 200): SuccessResponse<T> {
    return {
      data: data && typeof data === 'object' && 'data' in data ? data.data as T : data,
      meta: {
        ok: true,
        status,
        message,
      },
    };
  },

  created<T>(data: T, message = "Created"): SuccessResponse<T> {
    return this.success(data, message, 201);
  },

  error(input: ErrorInput): ErrorResponse {
    const message = typeof input === "string" ? input : input.message;
    const status = typeof input === "string" ? 500 : input.status ?? 500;
    const error = typeof input === "string" ? undefined : input.error;

    return {
      error,
      meta: {
        ok: false,
        status,
        message,
      },
    };
  },

  badRequest(message = "Bad Request", error?: ErrorDetail[]): ErrorResponse {
    return this.error({ message, status: 400, error });
  },

  unauthorized(message = "Unauthorized", error?: ErrorDetail[]): ErrorResponse {
    return this.error({ message, status: 401, error });
  },

  forbidden(message = "Forbidden", error?: ErrorDetail[]): ErrorResponse {
    return this.error({ message, status: 403, error });
  },

  notFound(message = "Not Found", error?: ErrorDetail[]): ErrorResponse {
    return this.error({ message, status: 404, error });
  },

  conflict(message = "Conflict", error?: ErrorDetail[]): ErrorResponse {
    return this.error({ message, status: 409, error });
  },

  unprocessableEntity(
    message = "Unprocessable Entity",
    error?: ErrorDetail[]
  ): ErrorResponse {
    return this.error({ message, status: 422, error });
  },

  internalError(
    message = "Internal Server Error",
    error?: ErrorDetail[]
  ): ErrorResponse {
    return this.error({ message, status: 500, error });
  },

  noContent(): BaseResponse {
    return {
      meta: {
        ok: true,
        status: 204,
        message: "No Content",
      },
    };
  },
};

export default response;
