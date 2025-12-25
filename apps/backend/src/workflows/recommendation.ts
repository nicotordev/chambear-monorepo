import { jobLlmClient, openAiEmbedClient, type JobPosting } from "../scraping/clients/ai";
import aiContextService from "../services/aiContext.service";
import aiIntegrationService from "../services/aiIntegration.service";

export type RecommendationInput = {
  userId: string;
  jobs: JobPosting[]; // Candidates to rank
  topK?: number;
};

export const recommendationWorkflow = {
  /**
   * Main AI Entrypoint:
   * 1. Build User Context from DB
   * 2. Index & Recommend Jobs (Pinecone + LLM Rerank)
   * 3. Persist Jobs to DB
   * 4. Persist FitScores (and SAVED applications)
   */
  async recommendAndPersistJobs(input: RecommendationInput) {
    const { userId, jobs, topK = 10 } = input;

    // 1. Build User Context
    console.log(`[Recommendation] Building context for user ${userId}...`);
    const userContext = await aiContextService.buildUserContextFromDb(userId);

    // 2. Recommend (Pinecone Retrieve -> LLM Rerank)
    console.log(`[Recommendation] Ranking ${jobs.length} jobs...`);
    const rankOutput = await jobLlmClient.recommendJobsWithPinecone({
      jobs,
      userContext,
      embed: (text) => openAiEmbedClient.embed(text),
      // pinecone client instantiated internally or passed if needed
      finalTopK: topK,
    });

    console.log(`[Recommendation] Got ${rankOutput.items.length} ranked items.`);

    // 3. Persist Jobs (Ensure they exist in DB to link FitScore)
    // We persist ALL input jobs or just the ranked ones? 
    // Ideally we persist at least the ranked ones. 
    // To be safe and support future retrieval, let's persist the ranked ones.
    const rankedJobPostings = rankOutput.items.map(i => i.job);
    
    console.log(`[Recommendation] Persisting ${rankedJobPostings.length} jobs to DB...`);
    const sourceUrlToId = await aiIntegrationService.persistJobsFromAi(rankedJobPostings);

    // 4. Persist FitScores
    console.log(`[Recommendation] Persisting FitScores...`);
    await aiIntegrationService.persistRankings(userId, rankOutput.items, sourceUrlToId, topK);

    return rankOutput;
  },
};
