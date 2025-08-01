/*
  Warnings:

  - You are about to drop the `LendingRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LendingRecord" DROP CONSTRAINT "LendingRecord_borrowerId_fkey";

-- DropForeignKey
ALTER TABLE "LendingRecord" DROP CONSTRAINT "LendingRecord_keyCopyId_fkey";

-- DropForeignKey
ALTER TABLE "LendingRecord" DROP CONSTRAINT "LendingRecord_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auth_id" UUID;

-- DropTable
DROP TABLE "LendingRecord";

-- CreateTable
CREATE TABLE "IssueRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "keyCopyId" UUID NOT NULL,
    "borrowerId" UUID NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "idChecked" BOOLEAN NOT NULL DEFAULT false,
    "returnedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "IssueRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IssueRecord" ADD CONSTRAINT "IssueRecord_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueRecord" ADD CONSTRAINT "IssueRecord_keyCopyId_fkey" FOREIGN KEY ("keyCopyId") REFERENCES "KeyCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueRecord" ADD CONSTRAINT "IssueRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
