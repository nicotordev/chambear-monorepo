/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceId]` on the table `Plan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CreditActionType" ADD VALUE 'JOB_SCAN';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "algoliaId" TEXT;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "stripePriceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");
