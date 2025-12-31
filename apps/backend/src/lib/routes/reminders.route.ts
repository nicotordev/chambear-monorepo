import remindersController from "@/controllers/reminders.controller";
import {
  CreateReminderSchema,
  ReminderSchema,
  UpdateReminderSchema,
} from "@/schemas/reminder";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from "@/schemas/response";

const app = new OpenAPIHono();

const createReminder = createRoute({
  method: "post",
  path: "/reminders",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateReminderSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Create reminder",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ReminderSchema),
        },
      },
    },
    400: {
      description: "Invalid input",
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
  },
});

const getAllReminders = createRoute({
  method: "get",
  path: "/reminders",
  responses: {
    200: {
      description: "Get all reminders",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(ReminderSchema)),
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
  },
});

const getReminderById = createRoute({
  method: "get",
  path: "/reminders/:id",
  responses: {
    200: {
      description: "Get reminder by id",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ReminderSchema),
        },
      },
    },
    404: {
      description: "Reminder not found",
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
  },
});

const updateReminder = createRoute({
  method: "patch",
  path: "/reminders/:id",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateReminderSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update reminder",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(ReminderSchema),
        },
      },
    },
    404: {
      description: "Reminder not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid input",
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
  },
});

const deleteReminder = createRoute({
  method: "delete",
  path: "/reminders/:id",
  responses: {
    200: {
      description: "Delete reminder",
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.object({ success: z.boolean() })),
        },
      },
    },
    404: {
      description: "Reminder not found",
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
  },
});

app.openapi(createReminder, remindersController.createReminder);
app.openapi(getAllReminders, remindersController.getAllReminders);
app.openapi(getReminderById, remindersController.getReminderById);
app.openapi(updateReminder, remindersController.updateReminder);
app.openapi(deleteReminder, remindersController.deleteReminder);

export default app;
