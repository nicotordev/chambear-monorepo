import { JobLlmClient } from "./jobllm";
import { PineconeJobsClient } from "./ai";
import { BrightDataClient } from "./brightdata";

export const jobLlmClient = new JobLlmClient({
  model: "gpt-5.2",
});

export const brightdataClient = new BrightDataClient();

export const pineconeJobsClient = new PineconeJobsClient();
