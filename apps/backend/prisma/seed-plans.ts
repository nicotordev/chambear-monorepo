import { PlanTier } from "../src/lib/generated";
import { prisma } from "../src/lib/prisma";

async function main() {
  const plans = [
    {
      tier: PlanTier.FREE,
      name: "Free",
      monthlyPriceUsd: 0,
      monthlyCredits: 5,
      description: "Basic access to get you started.",
    },
    {
      tier: PlanTier.BASE,
      name: "Base",
      monthlyPriceUsd: 1999,
      monthlyCredits: 50,
      description: "For serious job seekers.",
    },
    {
      tier: PlanTier.PRO,
      name: "Pro",
      monthlyPriceUsd: 4999,
      monthlyCredits: 200,
      description: "Advance your career with AI priority.",
    },
    {
      tier: PlanTier.RESULT,
      name: "Result",
      monthlyPriceUsd: 9999,
      monthlyCredits: 500,
      description: "The ultimate package for career acceleration.",
    },
  ];

  console.log("Seeding plans...");

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }

  console.log("Plans seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
