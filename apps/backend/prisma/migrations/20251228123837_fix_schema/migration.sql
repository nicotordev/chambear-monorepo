/*
  Warnings:

  - You are about to drop the column `userId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `FitScore` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `InterviewSession` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Reminder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profileId,jobId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileId,jobId]` on the table `FitScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `FitScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "FitScore" DROP CONSTRAINT "FitScore_userId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSession" DROP CONSTRAINT "InterviewSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_userId_fkey";

-- DropIndex
DROP INDEX "Application_userId_jobId_key";

-- DropIndex
DROP INDEX "FitScore_userId_jobId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "userId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "FitScore" DROP COLUMN "userId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InterviewSession" DROP COLUMN "userId",
ADD COLUMN     "meetLink" TEXT,
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "userId",
ADD COLUMN     "profileId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Application_profileId_jobId_key" ON "Application"("profileId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "FitScore_profileId_jobId_key" ON "FitScore"("profileId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitScore" ADD CONSTRAINT "FitScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
