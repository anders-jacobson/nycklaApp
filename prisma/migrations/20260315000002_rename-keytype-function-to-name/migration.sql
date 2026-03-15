-- Rename KeyType.function → KeyType.name
-- Using RENAME COLUMN instead of DROP/ADD to preserve all existing data
ALTER TABLE "KeyType" RENAME COLUMN "function" TO "name";
