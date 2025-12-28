import documentsController from "@/controllers/documents.controller";
import {
  CreateDocumentSchema,
  DocumentSchema,
  UpdateDocumentSchema,
} from "@/schemas/document";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const getPublicDocuments = createRoute({
  method: "get",
  path: "/documents",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Get public documents",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(DocumentSchema)),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const getDocumentById = createRoute({
  method: "get",
  path: "/documents/:id",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Get document by id",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Document not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const createDocument = createRoute({
  method: "post",
  path: "/documents",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateDocumentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Create document",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const updateDocument = createRoute({
  method: "patch",
  path: "/documents/:id",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateDocumentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update document",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Document not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const deleteDocument = createRoute({
  method: "delete",
  path: "/documents/:id",
  request: {
    query: z.object({
      profileId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Delete document",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(DocumentSchema),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Document not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const app = new OpenAPIHono();

app.openapi(getPublicDocuments, documentsController.getPublicDocuments);
app.openapi(getDocumentById, documentsController.getDocumentById);
app.openapi(createDocument, documentsController.createDocument);
app.openapi(updateDocument, documentsController.updateDocument);
app.openapi(deleteDocument, documentsController.deleteDocument);

export default app;
