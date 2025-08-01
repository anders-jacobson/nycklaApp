/*
  Warnings:

  - You are about to drop the column `endDate` on the `IssueRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IssueRecord" DROP COLUMN "endDate",
ADD COLUMN     "dueDate" TIMESTAMP(3);
