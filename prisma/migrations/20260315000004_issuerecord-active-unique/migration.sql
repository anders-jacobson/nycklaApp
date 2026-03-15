-- Partial unique index: at most one active (unreturned) loan per key copy
CREATE UNIQUE INDEX "IssueRecord_keyCopyId_active_unique"
  ON "IssueRecord" ("keyCopyId")
  WHERE "returnedDate" IS NULL;
