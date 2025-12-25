import { prisma } from "../../src/lib/prisma";
import userService from "../../src/services/user.service";
import { recommendationWorkflow } from "../../src/workflows/recommendation";
import { JobPosting } from "../../src/scraping/clients/ai";

async function main() {
  console.log("🔥 Starting AI Integration Smoke Test...");

  // 1. Create Dummy User & Profile
  const email = `test-user-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: "Test User AI",
    },
  });

  console.log(`✅ Created user: ${user.id}`);

  await userService.upsertProfile(user.id, {
    headline: "Senior Full Stack Engineer",
    summary: "Expert in TypeScript, Node.js, and React. Loves building scalable backends.",
    targetRoles: ["Senior Software Engineer", "Backend Lead"],
    skills: [
        { skillName: "TypeScript", level: "EXPERT" as any },
        { skillName: "Node.js", level: "ADVANCED" as any },
        { skillName: "PostgreSQL", level: "ADVANCED" as any }
    ],
    experiences: [
      {
        title: "Software Engineer",
        company: "Tech Corp",
        startDate: new Date("2020-01-01"),
        summary: "Built microservices using NestJS and Kafka.",
      },
    ],
  });

  console.log("✅ Created profile.");

  // 2. Mock Job Postings (Candidates)
  const jobs: JobPosting[] = [
    {
      title: "Senior Backend Engineer (Node/TS)",
      company: "Startup Inc",
      location: "Remote",
      remote: "remote",
      descriptionMarkdown: "We need a TS expert to build our core platform.",
      requirements: ["TypeScript", "Node.js", "SQL"],
      sourceUrl: `https://example.com/job1-${Date.now()}`,
      applyUrl: `https://example.com/apply1-${Date.now()}`,
    },
    {
      title: "Junior React Developer",
      company: "Agency LLC",
      location: "New York",
      remote: "on_site",
      descriptionMarkdown: "Looking for a junior dev to slice designs.",
      requirements: ["React", "CSS"],
      sourceUrl: `https://example.com/job2-${Date.now()}`,
    },
    {
        title: "Staff Engineer",
        company: "Big Corp",
        location: "Hybrid",
        remote: "hybrid",
        descriptionMarkdown: "Lead our infrastructure team.",
        requirements: ["Kubernetes", "Go", "System Design"],
        sourceUrl: `https://example.com/job3-${Date.now()}`,
    }
  ];

  // 3. Run Recommendation Workflow
  // Note: This will actually call OpenAI/Pinecone if configured. 
  // If no API keys, it might fail. 
  // For this smoke test, we hope the environment has keys or we mock the clients.
  // Assuming keys are present or we accept failure at that step but verify the setup.
  
  if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not found. Skipping actual LLM call.");
      // We can manually test persist logic here if we want, but let's try to run.
      // Or we can mock the clients in the test? Too complex for a simple script.
      // Let's just create the data and verify persistence manually if we can't run LLM.
      
      // Manually calling persist to verify DB part at least
      const aiIntegrationService = (
        await import("../../src/services/aiIntegration.service")
      ).default;
      const map = await aiIntegrationService.persistJobsFromAi(jobs);
      console.log(`✅ Manually persisted ${map.size} jobs (Skipped LLM).`);
      
      // Verify DB
      const dbJobs = await prisma.job.findMany({ where: { title: { in: jobs.map(j => j.title) } } });
      console.log(`Found ${dbJobs.length} jobs in DB.`);
      
      return;
  }

  try {
      await recommendationWorkflow.recommendAndPersistJobs({
        userId: user.id,
        jobs,
        topK: 2,
      });
      console.log("✅ Recommendation workflow completed.");
  
      // 4. Verify DB State
      const apps = await prisma.application.findMany({
          where: { userId: user.id },
          include: { job: { include: { fitScores: true } } }
      });
      
      console.log(`Found ${apps.length} applications for user.`);
      apps.forEach(app => {
          console.log(`- App for ${app.job.title} [${app.status}]`);
          const score = app.job.fitScores.find(fs => fs.userId === user.id);
          console.log(`  FitScore: ${score?.score} (Rationale: ${JSON.stringify(score?.rationale).slice(0, 50)}...)`);
      });

  } catch (e) {
      console.error("❌ Workflow failed:", e);
  } finally {
      // Cleanup
     // await prisma.user.delete({ where: { id: user.id } }); // Optional
  }
}

main().catch(console.error);
