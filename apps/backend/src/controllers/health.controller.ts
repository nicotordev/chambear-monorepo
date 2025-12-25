import type { Context } from "hono";
import healthService from "@/services/health.service";

const healthController = {
  getHealth(c: Context) {
    return c.json(healthService.getHealthPayload(), 200);
  },
};

export default healthController;
