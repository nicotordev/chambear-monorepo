import { prisma } from "../../src/lib/prisma";
import userService from "../../src/services/user.service";
import { searchAndRecommendWorkflow } from "../../src/workflows/searchAndRecommend";

async function main() {
  console.log("🔥 Starting Full Search & Recommend Smoke Test...");

  // 1. Create or Get Dummy User & Profile
  // We use a fixed email to reuse the profile if it exists, or create new
  const email = `test-user-search@example.com`;
  
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
        data: {
        email,
        name: "Test User Search",
        },
    });
  }

  console.log(`✅ User: ${user.id}`);

  // Upsert profile with specific roles to generate good dorks
  await userService.upsertProfile(user.id, {
    headline: "Senior Backend Engineer",
    summary: "Experienced in Node.js, TypeScript and Cloud Infrastructure.",
    targetRoles: ["Senior Backend Engineer", "Staff Software Engineer"],
    location: "Remote",
    skills: [
        { skillName: "TypeScript", level: "EXPERT" as any },
        { skillName: "Node.js", level: "ADVANCED" as any },
        { skillName: "AWS", level: "ADVANCED" as any }
    ],
    experiences: [],
    educations: []
  });

  console.log("✅ Profile ready.");

  // 2. Run Workflow
  if (!process.env.BRIGHTDATA_API_KEY) {
      console.warn("⚠️ BRIGHTDATA_API_KEY missing. Cannot run search test.");
      return;
  }

  try {
      await searchAndRecommendWorkflow.runSearchAndRecommend(user.id);
      
      // 3. Verify
      const apps = await prisma.application.findMany({
          where: { userId: user.id },
          include: { job: { include: { fitScores: true } } },
          take: 5
      });
      
      console.log(`\nFound ${apps.length} applications/recommendations:`)
      apps.forEach(app => {
          console.log(`- ${app.job.title} @ ${app.job.companyName} (Score: ${app.job.fitScores[0]?.score})`);
          console.log(`  Source: ${app.job.externalUrl || app.job.rawData}`);
      });

  } catch (e) {
      console.error("❌ Workflow failed:", e);
  }
}

main().catch(console.error);
