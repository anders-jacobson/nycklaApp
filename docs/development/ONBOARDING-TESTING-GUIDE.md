# Onboarding Wizard Testing Guide

## Prerequisites

1. **Database**: Ensure you have applied the latest schema changes
   ```bash
   npx prisma db push
   ```

2. **Test Account**: Have a user account with an organization that has **0 keys**

3. **Dev Server**: Run the development server
   ```bash
   npm run dev
   ```

## Test Scenarios

### Scenario 1: Complete Flow (Happy Path)

**Goal**: Complete all 6 steps and create keys successfully.

#### Steps:
1. **Trigger Onboarding**
   - Navigate to `/keys` or any dashboard route
   - ✅ **Verify**: Automatically redirected to `/onboarding/keys/step-1`

2. **Step 1: Organization Name**
   - Enter organization name (e.g., "Strandvägen BRF")
   - Click "Next"
   - ✅ **Verify**: Progress indicator shows step 1 complete
   - ✅ **Verify**: Redirected to step 2

3. **Step 2: Access Areas**
   - ✅ **Verify**: Default areas loaded (Port, Laundry, Basement, etc.)
   - Remove "Storage" by clicking X button
   - Add custom area "Gym" using input + plus button
   - Click "Next"
   - ✅ **Verify**: Total count shows 7 areas (default 7 - 1 + 1)
   - ✅ **Verify**: Redirected to step 3

4. **Step 3: Key Labels**
   - **Letters**: Select A, B, C
   - **Z-series**: Enter "From: 1", "To: 14"
   - **Custom**: Add "Office" and "Storage-1"
   - ✅ **Verify**: Total shows 19 keys (3 letters + 14 Z-series + 2 custom)
   - Click "Next"
   - ✅ **Verify**: Redirected to step 4

5. **Step 4: Copies Per Label**
   - ✅ **Verify**: All 19 labels listed with default 1 copy each
   - Increment "A" to 2 copies using + button
   - Increment "Z1" to 3 copies
   - ✅ **Verify**: Total copies shows 21
   - Click "Next"
   - ✅ **Verify**: Redirected to step 5

6. **Step 5: Display Names**
   - Enter "Main entrance key" for label "A"
   - Enter "Apartment 1 key" for label "Z1"
   - Leave others blank
   - Click "Next"
   - ✅ **Verify**: Redirected to step 6

7. **Step 6: Map Keys to Areas**
   - Expand "A" accordion
   - Select "Port", "Basement", "Gym"
   - ✅ **Verify**: Shows "3 of 7 areas"
   - Expand "Z1" accordion
   - Click "Select All"
   - ✅ **Verify**: Shows "7 of 7 areas"
   - Click "Next" (or "Review")
   - ✅ **Verify**: Redirected to review page

8. **Review Page**
   - ✅ **Verify**: Organization name displayed
   - ✅ **Verify**: Access areas shown as badges (7 total)
   - ✅ **Verify**: Key summary shows 19 types, 21 copies
   - ✅ **Verify**: Sample mappings show A → Port, Basement, Gym
   - Click "Create Keys"
   - ✅ **Verify**: Button shows "Creating..."
   - ✅ **Verify**: Redirected to done page

9. **Done Page**
   - ✅ **Verify**: Success message displayed
   - ✅ **Verify**: Auto-redirect to `/keys` after 3 seconds
   - **OR** Click "Go to Keys Now" for immediate redirect

10. **Keys Page**
    - ✅ **Verify**: 19 key types listed
    - ✅ **Verify**: "A" shows display name "Main entrance key"
    - ✅ **Verify**: "Z1" shows display name "Apartment 1 key"
    - ✅ **Verify**: "A" has 2 copies (both AVAILABLE)
    - ✅ **Verify**: "Z1" has 3 copies (all AVAILABLE)
    - ✅ **Verify**: Access areas displayed in table (e.g., "Port, Basement, Gym" for A)

### Scenario 2: Skip Flow

**Goal**: Verify skip functionality at each step.

#### Test A: Skip from Step 1
1. Navigate to `/keys` (triggers redirect to onboarding)
2. On Step 1, click "Skip Setup" in header
3. ✅ **Verify**: Confirmation dialog appears
4. Click "Skip Setup" (destructive button)
5. ✅ **Verify**: Redirected to `/keys`
6. ✅ **Verify**: Keys page shows empty state (no keys)
7. ✅ **Verify**: No further redirect to onboarding (skip is permanent)

#### Test B: Skip from Step 3
1. Complete Steps 1-2 normally
2. On Step 3, enter some labels
3. Click "Skip Setup" in header
4. ✅ **Verify**: Confirmation dialog appears
5. Click "Continue Setup" (cancel)
6. ✅ **Verify**: Dialog closes, remains on Step 3
7. Click "Skip Setup" again
8. Click "Skip Setup" (confirm)
9. ✅ **Verify**: Redirected to `/keys` (empty)

#### Test C: Skip from Step 6
1. Complete Steps 1-5 normally
2. On Step 6 (mapping), click "Skip Setup"
3. ✅ **Verify**: Confirmation dialog explains data loss
4. Confirm skip
5. ✅ **Verify**: Redirected to `/keys` (empty, all progress discarded)

### Scenario 3: Draft Persistence

**Goal**: Verify progress is saved server-side.

#### Steps:
1. Complete Step 1-2 normally
2. On Step 3, select labels: A, B, C and Z1-Z5
3. Click "Next" to save draft
4. On Step 4, **hard refresh the page** (Cmd+R / Ctrl+R)
5. ✅ **Verify**: Still on Step 4 (not kicked back to Step 1)
6. ✅ **Verify**: All 8 labels (A, B, C, Z1-Z5) are listed
7. ✅ **Verify**: Each has default 1 copy
8. Click "Back" to Step 3
9. ✅ **Verify**: Previously selected labels still selected
10. ✅ **Verify**: Z-series range shows "From: 1, To: 5"

### Scenario 4: Validation

**Goal**: Test form validation at each step.

#### Step 1 Validation:
1. Leave organization name empty
2. Click "Next"
3. ✅ **Verify**: Next button is disabled (no error shown, button just disabled)

#### Step 2 Validation:
1. Remove all default areas
2. Click "Next"
3. ✅ **Verify**: Error message "Please add at least one access area"
4. Add area "Test Area"
5. Try to add "Test Area" again
6. ✅ **Verify**: Error "This area already exists"
7. Add "A" + (101 characters)
8. ✅ **Verify**: Error "Area name too long (max 100 characters)"

#### Step 3 Validation:
1. Don't select any labels
2. Click "Next"
3. ✅ **Verify**: Error "Please select at least one key label"
4. Enter Z-series "From: 10, To: 5" (invalid range)
5. Click "Next"
6. ✅ **Verify**: Error "Invalid Z-series range (must be 1-9999, from ≤ to)"

#### Step 6 Validation:
1. Leave all labels unmapped (no areas selected)
2. Click "Next"
3. ✅ **Verify**: Allowed (area mapping is optional)

### Scenario 5: Mobile Responsive

**Goal**: Verify mobile-first design on small screens.

#### Desktop (≥768px):
1. Open browser at 1024px width
2. Navigate through onboarding
3. ✅ **Verify**: Progress stepper shows horizontal bar with labels
4. ✅ **Verify**: Letter grid shows 9 columns
5. ✅ **Verify**: All buttons have proper spacing

#### Tablet (≥640px, <768px):
1. Resize browser to 700px width
2. Navigate through onboarding
3. ✅ **Verify**: Progress stepper switches to simplified view
4. ✅ **Verify**: Letter grid shows 7 columns
5. ✅ **Verify**: Touch targets are at least 44px

#### Mobile (<640px):
1. Resize browser to 375px width (iPhone SE)
2. Navigate through onboarding
3. ✅ **Verify**: Progress indicator shows as dots (not labels)
4. ✅ **Verify**: Step counter shows "Step X of 6"
5. ✅ **Verify**: Letter grid shows 5 columns
6. ✅ **Verify**: Single-column layout throughout
7. ✅ **Verify**: Back/Next buttons full width or flex properly
8. ✅ **Verify**: Text is at least 16px (readable)
9. ✅ **Verify**: Accordion expands properly without horizontal scroll
10. ✅ **Verify**: Skip button visible in sticky header

### Scenario 6: Edge Cases

#### Test A: Large Label Count
1. Complete Steps 1-2
2. On Step 3, enter Z-series "From: 1, To: 100"
3. Select all letters (A-Z)
4. Add 10 custom labels
5. ✅ **Verify**: Total shows 136 keys
6. Click "Next"
7. ✅ **Verify**: Step 4 loads without timeout
8. ✅ **Verify**: All 136 labels listed (scroll works)
9. ✅ **Verify**: Can increment/decrement any label
10. Complete flow to review page
11. ✅ **Verify**: Review page loads (may take 1-2 seconds)
12. Click "Create Keys"
13. ✅ **Verify**: Transaction completes (may take 5-10 seconds)
14. ✅ **Verify**: Keys page shows all 136 key types

#### Test B: Special Characters in Labels
1. On Step 3 custom labels, add:
   - "Storage-1"
   - "Office #2"
   - "Key A/B"
   - "Test (Main)"
2. ✅ **Verify**: All accepted (no validation errors)
3. Complete flow
4. ✅ **Verify**: Keys page displays labels correctly

#### Test C: Long Display Names
1. Complete to Step 5
2. For label "A", enter 100 characters in display name
3. ✅ **Verify**: Input accepts up to 100 chars (enforced by maxLength)
4. Complete flow
5. ✅ **Verify**: Long name displays without breaking layout

#### Test D: Idempotency Check
1. Complete onboarding normally
2. Open browser DevTools → Network tab
3. Navigate to `/keys` (should work normally)
4. In database, delete `OnboardingSession.completedAt` for your entity
   ```sql
   UPDATE "OnboardingSession" SET "completedAt" = NULL WHERE "entityId" = '<your-id>';
   ```
5. Navigate to `/keys` again
6. ✅ **Verify**: Redirected to onboarding (because completedAt is null)
7. Complete flow to review page
8. Click "Create Keys"
9. ✅ **Verify**: Error "Keys already exist" (idempotency check works)
10. ✅ **Verify**: Session marked complete anyway
11. Navigate to `/keys`
12. ✅ **Verify**: Existing keys still displayed, no duplicates

### Scenario 7: Navigation

**Goal**: Test back/next and direct navigation.

#### Forward/Back Navigation:
1. Complete Steps 1-4 normally
2. Click "Back" from Step 4
3. ✅ **Verify**: Returns to Step 3
4. ✅ **Verify**: Previously entered data still present
5. Click "Next" twice to reach Step 5
6. ✅ **Verify**: Step 4 data preserved (copies map)

#### Direct URL Access:
1. While on Step 3, manually navigate to `/onboarding/keys/step-5`
2. ✅ **Verify**: Page loads (no redirect)
3. ✅ **Verify**: Draft data loads correctly
4. Click "Back"
5. ✅ **Verify**: Returns to Step 4 (not Step 3)

#### Browser Back Button:
1. Complete Steps 1-3
2. Click browser back button
3. ✅ **Verify**: Returns to Step 2
4. ✅ **Verify**: Data preserved

## Database Verification

After completing onboarding, verify database state:

```sql
-- Check OnboardingSession
SELECT * FROM "OnboardingSession" WHERE "entityId" = '<your-id>';
-- Should have completedAt set

-- Check AccessArea records
SELECT * FROM "AccessArea" WHERE "entityId" = '<your-id>';
-- Should match areas entered in Step 2

-- Check KeyType records
SELECT label, function FROM "KeyType" WHERE "entityId" = '<your-id>' ORDER BY label;
-- Should match labels from Step 3

-- Check KeyCopy counts
SELECT kt.label, COUNT(kc.id) as copies
FROM "KeyType" kt
LEFT JOIN "KeyCopy" kc ON kt.id = kc."keyTypeId"
WHERE kt."entityId" = '<your-id>'
GROUP BY kt.id, kt.label
ORDER BY kt.label;
-- Should match copy counts from Step 4

-- Check area mappings
SELECT kt.label, aa.name as area
FROM "KeyType" kt
JOIN "KeyTypeAccessArea" ktaa ON kt.id = ktaa."keyTypeId"
JOIN "AccessArea" aa ON ktaa."accessAreaId" = aa.id
WHERE kt."entityId" = '<your-id>'
ORDER BY kt.label, aa.name;
-- Should match mappings from Step 6
```

## Troubleshooting

### Issue: Infinite redirect loop
- **Cause**: Guard redirects to onboarding, but onboarding immediately redirects back
- **Fix**: Check `shouldShowOnboarding()` logic and `completedAt` value

### Issue: Draft not persisting
- **Cause**: `updateOnboardingDraft()` not called or failed silently
- **Fix**: Check network tab for failed requests, check database for draftJson value

### Issue: Keys not created
- **Cause**: Transaction failed in `createOnboardingKeys()`
- **Fix**: Check server logs, verify all foreign keys exist, check for constraint violations

### Issue: Access areas not displayed
- **Cause**: Query in keys page not loading relations
- **Fix**: Verify `accessAreas` relation is included in Prisma query

## Success Criteria

- [ ] Complete flow works end-to-end
- [ ] Skip flow works from any step
- [ ] Draft persists across page refreshes
- [ ] All validation rules enforced
- [ ] Mobile responsive at 375px, 768px, 1024px widths
- [ ] Edge cases handled (large counts, special chars, etc.)
- [ ] Navigation (back/next/browser back) works correctly
- [ ] Database state matches expected after completion
- [ ] Idempotency check prevents duplicate keys
- [ ] Keys page displays created keys correctly

## Reporting Issues

If you find bugs, report with:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (especially for UI issues)
5. **Browser/device** (for responsive issues)
6. **Console errors** (from DevTools)
7. **Database state** (relevant table snapshots)

