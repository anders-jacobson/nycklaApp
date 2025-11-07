/*
  Warnings:

  - You are about to drop the column `company` on the `Borrower` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Borrower` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Borrower` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Borrower` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Borrower` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `IssueRecord` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `KeyType` table. All the data in the column will be lost.
  - You are about to drop the column `cooperative` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[residentBorrowerId]` on the table `Borrower` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalBorrowerId]` on the table `Borrower` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `affiliation` to the `Borrower` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `Borrower` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `IssueRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `KeyType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BorrowerAffiliation" AS ENUM ('RESIDENT', 'EXTERNAL');

-- DropForeignKey
ALTER TABLE "Borrower" DROP CONSTRAINT "Borrower_userId_fkey";

-- DropForeignKey
ALTER TABLE "IssueRecord" DROP CONSTRAINT "IssueRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "KeyType" DROP CONSTRAINT "KeyType_userId_fkey";

-- AlterTable
ALTER TABLE "Borrower" DROP COLUMN "company",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "userId",
ADD COLUMN     "affiliation" "BorrowerAffiliation" NOT NULL,
ADD COLUMN     "entityId" UUID NOT NULL,
ADD COLUMN     "externalBorrowerId" UUID,
ADD COLUMN     "residentBorrowerId" UUID;

-- AlterTable
ALTER TABLE "IssueRecord" DROP COLUMN "notes",
ADD COLUMN     "entityId" UUID NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "KeyType" DROP COLUMN "userId",
ADD COLUMN     "entityId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cooperative",
ADD COLUMN     "entityId" UUID NOT NULL,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Entity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "encryptionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentBorrower" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(500) NOT NULL,
    "email" VARCHAR(500) NOT NULL,
    "phone" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResidentBorrower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalBorrower" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(500) NOT NULL,
    "email" VARCHAR(500) NOT NULL,
    "phone" VARCHAR(200),
    "address" VARCHAR(500),
    "company" VARCHAR(500),
    "borrowerPurpose" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalBorrower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueRecordNote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issueRecordId" UUID NOT NULL,
    "note" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueRecordNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_name_key" ON "Entity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentBorrower_email_key" ON "ResidentBorrower"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalBorrower_email_key" ON "ExternalBorrower"("email");

-- CreateIndex
CREATE INDEX "IssueRecordNote_issueRecordId_idx" ON "IssueRecordNote"("issueRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_residentBorrowerId_key" ON "Borrower"("residentBorrowerId");

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_externalBorrowerId_key" ON "Borrower"("externalBorrowerId");

-- CreateIndex
CREATE INDEX "Borrower_entityId_idx" ON "Borrower"("entityId");

-- CreateIndex
CREATE INDEX "IssueRecord_entityId_idx" ON "IssueRecord"("entityId");

-- CreateIndex
CREATE INDEX "IssueRecord_userId_idx" ON "IssueRecord"("userId");

-- CreateIndex
CREATE INDEX "KeyType_entityId_idx" ON "KeyType"("entityId");

-- CreateIndex
CREATE INDEX "User_entityId_idx" ON "User"("entityId");

-- CreateIndex
CREATE INDEX "User_auth_id_idx" ON "User"("auth_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyType" ADD CONSTRAINT "KeyType_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Borrower" ADD CONSTRAINT "Borrower_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Borrower" ADD CONSTRAINT "Borrower_residentBorrowerId_fkey" FOREIGN KEY ("residentBorrowerId") REFERENCES "ResidentBorrower"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Borrower" ADD CONSTRAINT "Borrower_externalBorrowerId_fkey" FOREIGN KEY ("externalBorrowerId") REFERENCES "ExternalBorrower"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueRecord" ADD CONSTRAINT "IssueRecord_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueRecord" ADD CONSTRAINT "IssueRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueRecordNote" ADD CONSTRAINT "IssueRecordNote_issueRecordId_fkey" FOREIGN KEY ("issueRecordId") REFERENCES "IssueRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
