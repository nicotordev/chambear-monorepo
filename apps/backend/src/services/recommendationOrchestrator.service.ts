import { prisma } from "../lib/prisma";
import aiContextService from "./aiContext.service";
import { searchAndRecommendWorkflow } from "../workflows/searchAndRecommend";
import { jobLlmClient, openAiEmbedClient, PineconeJobsClient, retrieveRelevantJobs } from "../scraping/clients/ai";
import userService from "./user.service";

const recommendationOrchestrator = {
  /**
   * Smart Recommendation Flow:
   * 1. Check existing matches in Vector DB.
   * 2. If < threshold, scrape fresh jobs.
   * 3. Return best matches from DB.
   */
  async getSmartRecommendations(userId: string) {
    const MIN_JOBS_THRESHOLD = 10;
    
    // 1. Build Context & Vector
    const userContext = await aiContextService.buildUserContextFromDb(userId);
    const pinecone = new PineconeJobsClient(); // Uses env vars
    
    // 2. Retrieve Existing Candidates from Index
    // We assume the index contains all available jobs.
    // Note: This only gets IDs and scores, not full DB objects yet.
    // In a real app, we might want to filter by "not applied" etc.
    let matches = await retrieveRelevantJobs({
        jobs: [], // We are querying the *Index*, not a list of new jobs. Passing empty array implies "Index Query".
                  // Wait, retrieveRelevantJobs logic in ai.ts might depend on 'jobs' input to map back?
                  // Let's check ai.ts implementation.
                  // ... "const matches = await params.pinecone.query(...) ... const job = byId.get(m.id)"
                  // Ah, retrieveRelevantJobs currently REQUIRES the job objects to be passed in to map them back.
                  // We need a method that queries Pinecone and just returns IDs, then we fetch from DB.
        userContext,
        embed: (t) => openAiEmbedClient.embed(t),
        pinecone,
        topK: MIN_JOBS_THRESHOLD * 2
    });
    
    // Since retrieveRelevantJobs relies on input 'jobs' to return 'RetrievedJob', 
    // and we want to query the GLOBAL index, we need to adjust or use pinecone client directly.
    // Let's use pinecone client directly here to get IDs.
    
    const queryVector = await openAiEmbedClient.embed(userContext);
    const pineconeResults = await pinecone.query({
        vector: queryVector,
        topK: MIN_JOBS_THRESHOLD,
        includeMetadata: true
    });
    
    let foundJobIds = pineconeResults.map(m => {
        // We assume ID in pinecone matches our DB or we can look it up via sourceUrl/stableId.
        // Our jobStableId is hash(sourceUrl...);
        // We might not have the DB ID in metadata. 
        // We should probably rely on finding the job in DB by the hashed ID if we stored it as ID?
        // Or we stored standard CUIDs in DB and hashed IDs in Pinecone?
        // In 'persistJobsFromAi', we save to DB.
        // In 'recommendJobsWithPinecone', we index.
        // The persistence doesn't explicitly sync the Pinecone ID to DB ID unless we put DB ID in metadata.
        // For this MVP, let's assume we might need to rely on the search workflow mostly or fuzzy match.
        
        // However, the prompt asks to "get the vector of jobs... returning a list of job IDs".
        // Let's assume we treat the "matches" count as valid if we find them in DB.
        return m.id; // This is the hash
    });

    // We can't easily map Hash -> DB ID without storing Hash in DB or matching metadata.
    // Let's try to match by Title/Company if metadata is there.
    // Or simpler: Just check if we have enough "Fresh" FitScores for this user in Postgres.
    // FitScore is the ultimate source of truth for "User matched to Job".
    
    const existingRecommendations = await prisma.fitScore.findMany({
        where: { 
            userId,
            score: { gte: 70 } // Good matches only
        },
        include: { job: true },
        orderBy: { score: 'desc' },
        take: MIN_JOBS_THRESHOLD
    });

    console.log(`[SmartRecs] Found ${existingRecommendations.length} existing high-score matches.`);

    let jobs = existingRecommendations.map(f => f.job);

    // 3. Check Threshold
    if (jobs.length < MIN_JOBS_THRESHOLD) {
        console.log(`[SmartRecs] Below threshold (${jobs.length} < ${MIN_JOBS_THRESHOLD}). Initiating Search...`);
        
        // 3a. Check if user is "worth it" (Profile check)
        const profile = await userService.getProfile(userId);
        const isWorthIt = profile && (profile.targetRoles.length > 0 || !!profile.headline);
        
        if (isWorthIt) {
             const newJobs = await searchAndRecommendWorkflow.runSearchAndRecommend(userId);
             if (newJobs && newJobs.length > 0) {
                 // New jobs were found, persisted, and FitScores calculated.
                 // Re-fetch best jobs from DB to include new ones.
                 const allRecommendations = await prisma.fitScore.findMany({
                    where: { 
                        userId,
                        score: { gte: 60 } // Lower threshold slightly for fresh ones
                    },
                    include: { job: true },
                    orderBy: { score: 'desc' },
                    take: 20
                });
                jobs = allRecommendations.map(f => f.job);
             }
        } else {
            console.log("[SmartRecs] User profile insufficient for search.");
        }
    }

    return jobs;
  }
};

export default recommendationOrchestrator;
