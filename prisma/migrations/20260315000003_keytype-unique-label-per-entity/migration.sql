-- Enforce unique label per entity (prevents duplicate key type labels within the same organization)
CREATE UNIQUE INDEX "KeyType_entityId_label_key" ON "KeyType"("entityId", "label");
