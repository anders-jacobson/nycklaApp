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

**Goal**: Complete all 4 steps and create keys successfully.

#### Steps:
1. **Trigger Onboarding**
   - Navigate to `/keys` or any dashboard route
   - ✅ **Verify**: Automatically redirected to `/onboarding/keys/step-1`

2. **Step 1: Organization Name**
   - Enter organization name (e.g., "Strandvägen BRF")
   - Click "Next"
   - ✅ **Verify**: Progress bar fills to 25%
   - ✅ **Verify**: Fraction text shows "Step 1 of 4 · Organization"
   - ✅ **Verify**: Redirected to step 2

3. **Step 2: Access Areas**
   - ✅ **Verify**: Default areas loaded (Port, Laundry, Basement, etc.)
   - Remove "Storage" by clicking X button
   - Add custom area "Gym" using input + plus button
   - Click "Next"
   - ✅ **Verify**: Redirected to step 3

4. **Step 3: Key Labels**
   - ✅ **Verify**: Three accordion sections visible (all collapsed by default)
   - **Common Keys**: Open accordion, select A, B, C
     - ✅ **Verify**: Accordion trigger updates to "3 selected"
     - ✅ **Verify**: Bottom summary shows A, B, C badges with × to deselect
   - **Apartment Keys**: Open accordion, enter "From: 1", "To: 14" (prefix stays "Z")
     - ✅ **Verify**: Accordion trigger shows "Z1–Z14 · 14 keys"
     - ✅ **Verify**: Bottom summary shows `Z1–Z14 · 14` badge
     - ✅ **Verify**: Prefix tooltip explains Z is the default
     - ✅ **Verify**: Letter Z is disabled in Common Keys grid
     - ✅ **Verify**: Hint text says "reserved — change under Apartment Keys"
   - **Custom Labels**: Open accordion, add "Office" and "Storage-1"
     - ✅ **Verify**: Accordion trigger shows "2 labels"
     - ✅ **Verify**: Bottom summary shows Office ×, Storage-1 × badges
   - ✅ **Verify**: Bottom summary shows 19 total (3 letters + 14 series + 2 custom)
   - Click "Next"
   - ✅ **Verify**: Redirected to step 4

5. **Step 4: Copies Per Label**
   - ✅ **Verify**: All 19 labels listed with default 1 copy each
   - Increment "A" to 2 copies using + button
   - Increment "Z1" to 3 copies
   - ✅ **Verify**: Total copies shows 21
   - Click "Next"
   - ✅ **Verify**: Redirected to **Review** page (not step 5)

6. **Review Page**
   - ✅ **Verify**: Organization name displayed
   - ✅ **Verify**: Access areas shown as badges
   - ✅ **Verify**: Key summary shows 19 types, 21 copies
   - ✅ **Verify**: Per-key list shows each label with its copy count
   - Click "Create Keys"
   - ✅ **Verify**: Button shows "Creating..."
   - ✅ **Verify**: Redirected to done page

7. **Done Page**
   - ✅ **Verify**: Success message displayed
   - ✅ **Verify**: Auto-redirect to `/keys` after 3 seconds
   - **OR** Click "Go to Keys Now" for immediate redirect

8. **Keys Page**
   - ✅ **Verify**: 19 key types listed
   - ✅ **Verify**: "A" has 2 copies (both AVAILABLE)
   - ✅ **Verify**: "Z1" has 3 copies (all AVAILABLE)

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
1. Complete Steps 1–2 normally
2. On Step 3, enter some labels
3. Click "Skip Setup" in header
4. ✅ **Verify**: Confirmation dialog appears
5. Click "Continue Setup" (cancel)
6. ✅ **Verify**: Dialog closes, remains on Step 3
7. Click "Skip Setup" again → confirm
8. ✅ **Verify**: Redirected to `/keys` (empty)

#### Test C: Skip from Step 4
1. Complete Steps 1–3 normally
2. On Step 4, click "Skip Setup"
3. ✅ **Verify**: Confirmation dialog appears
4. Confirm skip
5. ✅ **Verify**: Redirected to `/keys` (empty, all progress discarded)

### Scenario 3: Draft Persistence

**Goal**: Verify progress is saved server-side.

#### Steps:
1. Complete Steps 1–2 normally
2. On Step 3, select labels: A, B, C and series Z1–Z5
3. Click "Next" to save draft
4. On Step 4, **hard refresh the page** (Cmd+R / Ctrl+R)
5. ✅ **Verify**: Still on Step 4 (not kicked back to Step 1)
6. ✅ **Verify**: All 8 labels (A, B, C, Z1–Z5) are listed
7. Click "Back" to Step 3
8. ✅ **Verify**: Previously selected letters still selected
9. ✅ **Verify**: Bottom summary shows all selected badges
10. ✅ **Verify**: Z-series accordion trigger shows "Z1–Z5 · 5 keys"

### Scenario 4: Validation

**Goal**: Test form validation at each step.

#### Step 1 Validation:
1. Leave organization name empty
2. Click "Next"
3. ✅ **Verify**: Next button is disabled

#### Step 2 Validation:
1. Remove all default areas
2. Click "Next"
3. ✅ **Verify**: Error message "Please add at least one access area"
4. Add area "Test Area"
5. Try to add "Test Area" again
6. ✅ **Verify**: Error "This area already exists"

#### Step 3 Validation:
1. Don't select any labels
2. Click "Next"
3. ✅ **Verify**: Next button disabled / error "Please select at least one key label"
4. Enter Z-series "From: 10, To: 5" (invalid range)
5. Click "Next"
6. ✅ **Verify**: Error "Invalid series range (must be 1-9999, from ≤ to)"
7. Enter only "From: 1" without "To"
8. ✅ **Verify**: Error "Please fill both 'from' and 'to' fields or leave both empty"

### Scenario 5: Mobile Responsive

**Goal**: Verify mobile-first design on small screens.

#### Desktop (≥768px):
1. Open browser at 1024px width
2. Navigate through onboarding
3. ✅ **Verify**: Header shows "Nyckla" + "Skip Setup" on one line
4. ✅ **Verify**: Progress bar below header, full width
5. ✅ **Verify**: Letter grid shows 9 columns
6. ✅ **Verify**: All buttons have proper spacing

#### Mobile (<640px):
1. Resize browser to 375px width (iPhone SE)
2. Navigate through onboarding
3. ✅ **Verify**: Header stays on one line, no overflow
4. ✅ **Verify**: Progress bar full-width below header
5. ✅ **Verify**: Fraction text shows "Step X of 4 · Label"
6. ✅ **Verify**: Letter grid shows 5 columns
7. ✅ **Verify**: Accordion sections expand without horizontal scroll
8. ✅ **Verify**: Bottom badge summary wraps cleanly
9. ✅ **Verify**: Skip button visible in sticky header

### Scenario 6: Step 3 — Accordion & Tooltips

**Goal**: Verify the accordion UX and tooltip behaviour.

1. Navigate to Step 3
2. ✅ **Verify**: All three accordion sections collapsed by default
3. ✅ **Verify**: Triggers show placeholder text ("Letters for shared areas", "Optional — numbered series", "Optional — anything else")
4. Open **Common Keys** — select A, B
5. ✅ **Verify**: Trigger updates to "2 selected" without leaving section
6. ✅ **Verify**: Z button is greyed out (disabled by default series prefix)
7. ✅ **Verify**: Hint text under grid says "Letter Z is reserved for apartment keys — change the prefix under **Apartment Keys**"
8. Hover over Z (disabled) — no tooltip expected
9. Hover over P — ✅ **Verify**: Tooltip "Common for parking / garage"
10. Hover over B — ✅ **Verify**: Tooltip "Common for basement"
11. Close section. Open **Apartment Keys**
12. ✅ **Verify**: Prefix input has ? icon; hover it → tooltip explains Z default
13. ✅ **Verify**: "Quick Presets" collapsible works
14. Close section. Open **Custom Labels**
15. Add "Office" via Common Area Keys preset
16. ✅ **Verify**: Bottom summary shows "Office ×" badge; click × removes it

### Scenario 7: Edge Cases

#### Test A: Large Label Count
1. Complete Steps 1–2
2. On Step 3, enter Z-series "From: 1, To: 100", select A–H letters, add 5 custom labels
3. ✅ **Verify**: Total shows 113 keys in bottom summary
4. ✅ **Verify**: Series badge shows `Z1–Z100 · 100`
5. Click "Next" → Step 4 loads without timeout
6. ✅ **Verify**: All 113 labels listed (scroll works)
7. Complete flow → Review page
8. ✅ **Verify**: Per-key list is scrollable (max-height container)
9. Click "Create Keys"
10. ✅ **Verify**: Transaction completes

#### Test B: Special Characters in Labels
1. On Step 3 custom labels, add: "Storage-1", "Office #2", "Key A/B"
2. ✅ **Verify**: All accepted
3. ✅ **Verify**: All appear in bottom summary as badges
4. Complete flow; ✅ **Verify**: Keys page displays labels correctly

#### Test C: Idempotency Check
1. Complete onboarding normally
2. In database, set `OnboardingSession.completedAt = NULL` for your entity
3. Navigate to `/keys` → redirected to onboarding
4. Complete flow → click "Create Keys"
5. ✅ **Verify**: Error "Keys already exist" (idempotency check works)
6. ✅ **Verify**: Existing keys not duplicated

#### Test D: Conflict Detection
1. Open **Apartment Keys**, set prefix to "A", From: 1, To: 5
2. ✅ **Verify**: Letter A is auto-disabled in Common Keys grid
3. Change prefix back to "Z"
4. ✅ **Verify**: Letter A re-enables
5. Add custom label "B" via text input
6. ✅ **Verify**: Letter B is disabled in Common Keys grid with hint text
7. Remove custom label "B" from bottom summary
8. ✅ **Verify**: Letter B re-enables

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
- **Fix**: Check server logs, verify all foreign keys exist

### Issue: Step 4 "Next" goes to step-5 (404)
- **Fix**: Ensure step-4/page.tsx routes to `/onboarding/keys/review`

## Success Criteria

- [ ] Complete 4-step flow works end-to-end
- [ ] Skip flow works from any step (1–4)
- [ ] Draft persists across page refreshes
- [ ] All validation rules enforced
- [ ] Accordion UX: collapsed by default, trigger shows live summary
- [ ] Bottom summary shows all selections as badges with remove actions
- [ ] Letter tooltips appear for convention-significant letters
- [ ] Prefix tooltip explains changeable default
- [ ] Disabled-letter hint links to Apartment Keys section
- [ ] Mobile responsive at 375px (header on one line, progress bar full-width)
- [ ] Edge cases handled (large counts, special chars, conflicts)
- [ ] Database state matches expected after completion
- [ ] Idempotency check prevents duplicate keys

## Reporting Issues

If you find bugs, report with:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (especially for UI issues)
5. **Browser/device** (for responsive issues)
6. **Console errors** (from DevTools)
7. **Database state** (relevant table snapshots)
