import response from "@/lib/utils/response";
import { CreateDocumentSchema } from "@/schemas/document";
import documentService from "@/services/documents.service";
import { getAuth } from "@hono/clerk-auth";
import type { Context, Env } from "hono";

const documentsController = {
  getPublicDocuments: async (
    c: Context<Env, "/documents", { in: { query: { profileId: string } } }>
  ) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      if (!profileId) {
        // Should be handled by validator, but just in case
        return c.json(
          {
            meta: {
              ok: false,
              status: 400,
              message: "Profile ID is required",
            },
          },
          400 as const
        );
      }
      return c.json(
        {
          meta: {
            ok: false,
            status: 401,
            message: "Unauthorized",
          },
        },
        401 as const
      );
    }

    try {
      const publicDocuments = await documentService.getProfileDocuments(
        profileId,
        userId
      );

      return c.json(
        {
          data: publicDocuments,
          meta: {
            ok: true,
            status: 200,
            message: "Documents retrieved successfully",
          },
        },
        200 as const
      );
    } catch (error) {
      return c.json(
        {
          meta: {
            ok: false,
            status: 500,
            message: "Internal server error",
          },
        },
        500 as const
      );
    }
  },

  getDocumentById: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const documentId = c.req.param("id");
    const profileId = c.req.query("profileId");

    if (!userId || !profileId || !documentId) {
      return c.json(
        {
          meta: {
            ok: false,
            status: 400,
            message: "Missing required parameters",
          },
        },
        400 as const
      );
    }

    try {
      const document = await documentService.getDocumentById(
        profileId,
        documentId,
        userId
      );

      return c.json(
        {
          data: document,
          meta: {
            ok: true,
            status: 200,
            message: "Document retrieved successfully",
          },
        },
        200 as const
      );
    } catch (error) {
      // Assume 404 from service if not found (it throws "Document not found or access denied")
      // But the service throws Error. We should inspect it or just return 404/500.
      // Assuming the service throws generic Error for now.
      return c.json(
        {
          meta: {
            ok: false,
            status: 404, // Service throws if not found/access denied
            message: "Document not found",
          },
        },
        404 as const
      );
    }
  },

  createDocument: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");

    if (!userId || !profileId) {
      return c.json(
        {
          meta: {
            ok: false,
            status: 401,
            message: "Unauthorized or missing profileId",
          },
        },
        401 as const
      );
    }

    try {
      const body = await c.req.json();

      const validatedBody = CreateDocumentSchema.parse(body);

      const document = await documentService.createDocument(
        profileId,
        validatedBody,
        userId
      );

      return c.json(
        {
          data: document,
          meta: {
            ok: true,
            status: 201, // Created
            message: "Document created successfully",
          },
        },
        200 as const
      ); // Returning 200 OK with 201 status in meta as per schema? Valid schema says 200.
      // Wait, route definition says 200 response with created data.
    } catch (error) {
      return c.json(
        {
          meta: {
            ok: false,
            status: 500,
            message: "Failed to create document",
          },
        },
        500 as const
      );
    }
  },

  updateDocument: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const documentId = c.req.param("id");

    if (!userId || !profileId || !documentId) {
      return c.json(
        {
          meta: { ok: false, status: 400, message: "Missing required params" },
        },
        400 as const
      );
    }

    try {
      const body = await c.req.json();
      const document = await documentService.updateDocument(
        profileId,
        documentId,
        body,
        userId
      );

      return c.json(
        {
          data: document,
          meta: {
            ok: true,
            status: 200,
            message: "Document updated successfully",
          },
        },
        200 as const
      );
    } catch (error) {
      return c.json(
        {
          meta: { ok: false, status: 404, message: "Document not found" },
        },
        404 as const
      );
    }
  },

  deleteDocument: async (c: Context) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    const profileId = c.req.query("profileId");
    const documentId = c.req.param("id");

    if (!userId || !profileId || !documentId) {
      return c.json(
        {
          meta: { ok: false, status: 400, message: "Missing required params" },
        },
        400 as const
      );
    }

    try {
      const document = await documentService.deleteDocument(
        profileId,
        documentId,
        userId
      );

      return c.json(
        {
          data: document,
          meta: {
            ok: true,
            status: 200,
            message: "Document deleted successfully",
          },
        },
        200 as const
      );
    } catch (error) {
      return c.json(
        {
          meta: { ok: false, status: 404, message: "Document not found" },
        },
        404 as const
      );
    }
  },
  uploadDocument: async (
    c: Context<
      Env,
      "/api/v1/documents/upload",
      { in: { query: { profileId: string } } }
    >
  ) => {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
      return c.json(response.unauthorized(), 401);
    }

    const data = await c.req.parseBody();

    const file = data.file;

    const profileId = c.req.query("profileId");

    if (!file || !(file instanceof File)) {
      return c.json(response.badRequest("No file provided"), 400);
    }

    if (!profileId) {
      return c.json(response.badRequest("No profileId provided"), 400);
    }

    try {
      const finalURL = await documentService.uploadDocument(profileId, file);
      return c.json(response.success(finalURL), 200);
    } catch (error) {
      console.error(error);
      return c.json(response.error("Failed to upload document"), 500);
    }
  },
};

export default documentsController;
