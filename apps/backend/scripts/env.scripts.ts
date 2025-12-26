import "dotenv/config";
import { z } from "zod";

const processEnv = z.object({
  PINECONE_API_KEY: z.string(),
  PINECONE_INDEX: z.string(),
  PINECONE_NAMESPACE: z.string(),

  OPENAI_API_KEY: z.string(),
  OPENAI_EMBEDDING_MODEL: z.string(),
  OPENAI_EMBEDDING_DIMENSIONS: z.string(),

  DATABASE_URL: z.string(),
  BRIGHTDATA_API_KEY: z.string(),
});

const env = processEnv.safeParse(process.env);

if (!env.success) {
  console.error(
    "Invalid environment variables: " +
      JSON.stringify(env.error.flatten().fieldErrors)
  );
  process.exit(1);
}

console.log("Environment variables are valid");
process.exit(0);
