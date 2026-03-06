-- CreateTable AccessArea
CREATE TABLE "AccessArea" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable KeyTypeAccessArea
CREATE TABLE "KeyTypeAccessArea" (
    "keyTypeId" UUID NOT NULL,
    "accessAreaId" UUID NOT NULL,

    CONSTRAINT "KeyTypeAccessArea_pkey" PRIMARY KEY ("keyTypeId","accessAreaId")
);

-- CreateTable OnboardingSession
CREATE TABLE "OnboardingSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityId" UUID NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "draftJson" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable KeyType: Expand label field and remove accessArea field
ALTER TABLE "KeyType" ALTER COLUMN "label" TYPE VARCHAR(50);
ALTER TABLE "KeyType" DROP COLUMN IF EXISTS "accessArea";

-- CreateIndex
CREATE INDEX "AccessArea_entityId_idx" ON "AccessArea"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessArea_entityId_name_key" ON "AccessArea"("entityId", "name");

-- CreateIndex
CREATE INDEX "KeyTypeAccessArea_keyTypeId_idx" ON "KeyTypeAccessArea"("keyTypeId");

-- CreateIndex
CREATE INDEX "KeyTypeAccessArea_accessAreaId_idx" ON "KeyTypeAccessArea"("accessAreaId");

-- CreateIndex
CREATE INDEX "OnboardingSession_entityId_idx" ON "OnboardingSession"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_entityId_key" ON "OnboardingSession"("entityId");

-- AddForeignKey
ALTER TABLE "AccessArea" ADD CONSTRAINT "AccessArea_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyTypeAccessArea" ADD CONSTRAINT "KeyTypeAccessArea_keyTypeId_fkey" FOREIGN KEY ("keyTypeId") REFERENCES "KeyType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyTypeAccessArea" ADD CONSTRAINT "KeyTypeAccessArea_accessAreaId_fkey" FOREIGN KEY ("accessAreaId") REFERENCES "AccessArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

