const healthService = {
  getHealthPayload() {
    return { status: "ok", service: "chambear-backend" } as const;
  },
};

export default healthService;