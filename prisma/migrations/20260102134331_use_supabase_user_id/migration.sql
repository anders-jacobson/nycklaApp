-- AlterTable: Remove default UUID generation from User.id
-- User.id will now be set manually from Supabase auth.users.id

ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;


