export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  brightDataApiKey: process.env.BRIGHTDATA_API_KEY ?? "",
  brightDataZone: process.env.BRIGHTDATA_ZONE ?? "",
  brightDataSerpZone: process.env.BRIGHTDATA_SERP_ZONE ?? "serp",
  brightDataCustomer: process.env.BRIGHTDATA_CUSTOMER ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  searchApiKey: process.env.SEARCH_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
};
