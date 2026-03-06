-- CreateTable
CREATE TABLE "UserOrganisation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganisation_pkey" PRIMARY KEY ("id")
);

-- Migrate existing User data to UserOrganisation
INSERT INTO "UserOrganisation" ("userId", "organisationId", "role", "joinedAt")
SELECT "id", "entityId", "role", "createdAt"
FROM "User";

-- AddColumn to User table
ALTER TABLE "User" ADD COLUMN "activeOrganisationId" UUID;

-- Set activeOrganisationId to current entityId for all users
UPDATE "User"
SET "activeOrganisationId" = "entityId";

-- CreateIndex
CREATE INDEX "User_activeOrganisationId_idx" ON "User"("activeOrganisationId");

-- CreateIndex
CREATE INDEX "UserOrganisation_userId_idx" ON "UserOrganisation"("userId");

-- CreateIndex
CREATE INDEX "UserOrganisation_organisationId_idx" ON "UserOrganisation"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganisation_userId_organisationId_key" ON "UserOrganisation"("userId", "organisationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeOrganisationId_fkey" FOREIGN KEY ("activeOrganisationId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganisation" ADD CONSTRAINT "UserOrganisation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganisation" ADD CONSTRAINT "UserOrganisation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey (from old User.entityId relation)
ALTER TABLE "User" DROP CONSTRAINT "User_entityId_fkey";

-- DropIndex
DROP INDEX "User_entityId_idx";

-- AlterTable (remove old columns)
ALTER TABLE "User" DROP COLUMN "entityId",
DROP COLUMN "role";








