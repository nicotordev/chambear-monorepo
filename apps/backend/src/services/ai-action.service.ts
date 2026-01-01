import { DocumentType } from "../lib/generated";
import { prisma } from "../lib/prisma";
import { jobLlmClient } from "../scraping/clients";
import aiContextService from "./aiContext.service";
import documentService from "./documents.service";

const aiActionService = {
  async optimizeCv(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobDescription = `
Title: ${job.title}
Company: ${job.companyName}
Description:
${job.description || "No description available."}
    `.trim();

    // 4. Generate Content
    const optimizedContent = await jobLlmClient.optimizeCv(
      userContext,
      jobDescription
    );

    // 5. Save Document
    const label = `Optimized CV for ${job.companyName}`;
    const doc = await documentService.createDocument(
      profileId,
      {
        type: DocumentType.RESUME,
        label,
        content: optimizedContent,
        jobId: job.id,
        summary: `Optimized for ${job.title} at ${job.companyName}`,
      },
      userId
    );

    return doc;
  },

  async generateCoverLetter(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobDescription = `
Title: ${job.title}
Company: ${job.companyName}
Description:
${job.description || "No description available."}
    `.trim();

    // 4. Generate Content
    const clContent = await jobLlmClient.generateCoverLetter(
      userContext,
      jobDescription
    );

    // 5. Save Document
    const label = `Cover Letter for ${job.companyName}`;
    const doc = await documentService.createDocument(
      profileId,
      {
        type: DocumentType.COVER_LETTER,
        label,
        content: clContent,
        jobId: job.id,
        summary: `Cover Letter for ${job.title} at ${job.companyName}`,
      },
      userId
    );

    return doc;
  },

  async calculateFit(userId: string, profileId: string, jobId: string) {
    // 1. Get Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error("Job not found");

    // 2. Build Context
    const userContext = await aiContextService.buildUserContextFromDb(
      profileId
    );

    // 3. Prepare Job Description
    const jobPosting = {
      title: job.title,
      company: job.companyName,
      location: job.location || undefined,
      remote: job.workMode as any,
      employmentType: job.employmentType as any,
      sourceUrl: job.externalUrl || `local:${job.id}`,
      descriptionMarkdown: job.description || "",
    };

    // 4. Rank
    const ranked = await jobLlmClient.rankJobs({
      jobs: [jobPosting],
      userContext,
      topK: 1,
    });

    const item = ranked.items[0];
    if (!item) throw new Error("Failed to calculate fit");

    // 5. Update/Create FitScore
    const fitScore = await prisma.fitScore.upsert({
      where: {
        profileId_jobId: {
          profileId,
          jobId,
        },
      },
      create: {
        profileId,
        jobId,
        score: item.fitScore,
        rationale: item.rationale as any,
      },
      update: {
        score: item.fitScore,
        rationale: item.rationale as any,
      },
    });

    return fitScore;
  },
};

export default aiActionService;
