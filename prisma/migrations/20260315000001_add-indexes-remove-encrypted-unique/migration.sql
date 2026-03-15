-- Drop broken unique constraints on encrypted email fields
-- (CryptoJS uses random IV/salt per call, so same plaintext → different ciphertext; unique constraint never fires)
DROP INDEX IF EXISTS "ResidentBorrower_email_key";
DROP INDEX IF EXISTS "ExternalBorrower_email_key";

-- Add missing index on KeyCopy.status (filtered on every active-loans and availability query)
CREATE INDEX "KeyCopy_status_idx" ON "KeyCopy"("status");

-- Add missing index on IssueRecord.borrowerId (FK, frequently queried by borrower)
CREATE INDEX "IssueRecord_borrowerId_idx" ON "IssueRecord"("borrowerId");
