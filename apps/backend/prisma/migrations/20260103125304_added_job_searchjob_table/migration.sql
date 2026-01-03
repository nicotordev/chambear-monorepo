/*
  Warnings:

  - You are about to drop the column `jobId` on the `JobSearchJob` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobSearchJobStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "JobSearchJob" DROP CONSTRAINT "JobSearchJob_jobId_fkey";

-- DropIndex
DROP INDEX "JobSearchJob_profileId_jobId_key";

-- AlterTable
ALTER TABLE "JobSearchJob" DROP COLUMN "jobId",
ADD COLUMN     "status" "JobSearchJobStatus" NOT NULL DEFAULT 'PENDING';
