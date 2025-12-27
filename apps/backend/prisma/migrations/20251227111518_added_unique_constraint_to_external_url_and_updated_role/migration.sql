/*
  Warnings:

  - The values [USER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[externalUrl]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UrlKind" AS ENUM ('JOB_LISTING', 'JOBS_INDEX', 'CAREERS', 'LOGIN_OR_GATE', 'BLOG_OR_NEWS', 'COMPANY_ABOUT', 'IRRELEVANT');

-- CreateEnum
CREATE TYPE "Seniority" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'STAFF', 'LEAD', 'PRINCIPAL', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "EmploymentType" ADD VALUE 'UNKNOWN';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('BUYER', 'SELLER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BUYER';
COMMIT;

-- AlterEnum
ALTER TYPE "WorkMode" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "salary" TEXT,
ADD COLUMN     "seniority" "Seniority" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "urlKind" "UrlKind" NOT NULL DEFAULT 'IRRELEVANT',
ALTER COLUMN "employmentType" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "workMode" SET DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BUYER';

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Job_externalUrl_key" ON "Job"("externalUrl");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
