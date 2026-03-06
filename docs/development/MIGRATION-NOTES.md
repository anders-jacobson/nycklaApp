# Migration Notes

## Access Area Schema Migration (January 2026)

### Changes Made
- **Before**: `KeyType.accessArea` was a single `VARCHAR` field storing comma-separated area names
- **After**: Separate `AccessArea` table with `KeyTypeAccessArea` join table for many-to-many relationships

### What Works Now
✅ **Onboarding wizard**: Creates keys with proper AccessArea relations  
✅ **Keys page**: Displays access areas by joining relations  
✅ **Dashboard layout guard**: Redirects to onboarding when no keys exist

### What Needs Update (Manual Key Creation)
⚠️ **`app/actions/keyTypes.ts`**:
- `createKeyType()` still writes to removed `accessArea` field
- `updateKeyType()` still updates removed `accessArea` field
- **Solution**: Update these functions to:
  1. Accept comma-separated area names or array
  2. Parse area names
  3. Upsert `AccessArea` records (find or create)
  4. Create `KeyTypeAccessArea` join records

⚠️ **`components/keys/key-types-table.tsx`**:
- Create key form still has `<Input name="accessArea" />`
- **Solution**: Replace with multi-select or comma-separated input that integrates with new schema

⚠️ **`components/keys/key-type-columns.tsx`**:
- Edit dialog still has `<Input name="accessArea" />`
- **Solution**: Update to work with new access area relations

### Backward Compatibility
The `getKeyTypes()` function in `app/(dashboard)/keys/page.tsx` currently:
- Loads `accessAreas` relations
- Joins area names with `, ` for UI display
- This maintains UI compatibility while using new schema

### Testing Checklist
- [x] Onboarding creates keys with access areas
- [ ] Manual key creation works with new schema
- [ ] Manual key editing works with new schema
- [ ] Access area uniqueness enforced per entity
- [ ] Deleting key type cascades to join records
- [ ] Deleting access area cascades to join records

### Migration Steps for Existing Data
If there's existing data with the old `accessArea` field:

```sql
-- 1. Parse existing accessArea strings and create AccessArea records
INSERT INTO "AccessArea" ("id", "entityId", "name", "createdAt")
SELECT 
  gen_random_uuid(),
  "entityId",
  TRIM(unnest(string_to_array("accessArea", ','))),
  NOW()
FROM "KeyType"
WHERE "accessArea" IS NOT NULL AND "accessArea" != ''
ON CONFLICT ("entityId", "name") DO NOTHING;

-- 2. Create join records
INSERT INTO "KeyTypeAccessArea" ("keyTypeId", "accessAreaId")
SELECT DISTINCT
  kt.id,
  aa.id
FROM "KeyType" kt
CROSS JOIN LATERAL unnest(string_to_array(kt."accessArea", ',')) AS area_name
JOIN "AccessArea" aa ON aa."name" = TRIM(area_name) AND aa."entityId" = kt."entityId"
WHERE kt."accessArea" IS NOT NULL AND kt."accessArea" != '';
```

### Future Enhancements
1. **Area management page**: CRUD for access areas independent of keys
2. **Area-based permissions**: Restrict key access by user role and area
3. **Area icons/colors**: Visual identification of areas
4. **Area hierarchy**: Parent-child relationships (e.g., Building > Floor > Room)

