import type { Context } from "hono";
import healthService from "@/services/health.service";
import response from "@/lib/utils/response";

const healthController = {
  getHealth(c: Context) {
    return c.json(response.success(healthService.getHealthPayload()), 200);
  },
};

export default healthController;
