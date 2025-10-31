# Mark Key as Lost - Test Scenario Guide

## 🎯 Quick Start Testing

Follow these scenarios in order to test the complete Mark Key as Lost workflow.

---

## Prerequisites

**Start dev server:**
```bash
npm run dev
```

**Open these tabs:**
1. Application: `http://localhost:3000/active-loans`
2. Database tool: Prisma Studio or psql console

**You'll need:**
- At least 2 borrowers with active keys
- One borrower with 2+ keys (for Scenario 1)
- One borrower with 1 key only (for Scenario 2)

---

## Scenario 1: Mark Single Key Lost (Borrower Keeps Other Keys)

### Purpose
Test that marking one key lost works correctly when borrower has multiple keys.

### Steps

1. **Navigate to Active Loans page**
   - URL: `http://localhost:3000/active-loans`
   - Find borrower with 2 or more keys (look at "Borrowed Keys" column)

2. **Open Actions Menu**
   - Click kebab menu (⋮) for that borrower
   - Look for "Mark Key Lost" menu item
   - ✅ **Verify:** Menu item appears in RED (destructive styling)

3. **Open Lost Key Dialog**
   - Click "Mark Key Lost"
   - ✅ **Verify:** Dialog opens with title "Mark Key as Lost"
   - ✅ **Verify:** All borrowed keys listed
   - ✅ **Verify:** Radio buttons look modern (circular, not plain HTML)
   - ✅ **Verify:** Labels are clickable
   - ✅ **Verify:** No warning message (borrower has multiple keys)

4. **Select One Key**
   - Click on one of the radio buttons or its label
   - ✅ **Verify:** Only one key selected (radio behavior)
   - ✅ **Verify:** "Mark as Lost" button is enabled and RED

5. **Confirm Action**
   - Click "Mark as Lost" button
   - ✅ **Verify:** Loading spinner appears briefly
   - ✅ **Verify:** Success toast: "Key marked as lost"
   - ✅ **Verify:** Dialog closes

6. **Check UI Updates**
   - Look at borrower row
   - ✅ **Verify:** Borrowed keys count decreased (e.g., 3 keys → 2 keys)
   - ✅ **Verify:** Lost key no longer shown in badges
   - ✅ **Verify:** Borrower row still visible (not deleted)

7. **Navigate to Keys Page**
   - Click "Keys" in sidebar
   - ✅ **Verify:** Charts show lost key count
   - ✅ **Verify:** Lost count increased by 1

### Expected Database State

```sql
-- Find the issue record
SELECT * FROM "IssueRecord" 
WHERE id = '[issue-id-from-dialog]';
-- ✅ returnedDate should be set to current timestamp

-- Find the key copy
SELECT * FROM "KeyCopy"
WHERE id = '[key-copy-id]';
-- ✅ status should be 'LOST'

-- Verify borrower still exists
SELECT * FROM "Borrower"
WHERE id = '[borrower-id]';
-- ✅ Should return 1 row (borrower exists)
```

---

## Scenario 2: Mark Last Key Lost (GDPR Cleanup)

### Purpose
Test that borrower is deleted when their last key is marked lost (GDPR compliance).

### Steps

1. **Find Borrower with Single Key**
   - Look in Active Loans table
   - Find borrower with only 1 key in "Borrowed Keys" column

2. **Open Actions Menu**
   - Click kebab menu (⋮)
   - Click "Mark Key Lost"

3. **Verify Warning Appears**
   - ✅ **Verify:** Warning box displays with:
     - Red border and background (destructive styling)
     - Triangle alert icon
     - Text: "Warning: Marking this key as lost will permanently remove [Name] from the system."

4. **Confirm Deletion**
   - Select the key (only one available)
   - Click "Mark as Lost" (red button)
   - ✅ **Verify:** Success toast appears
   - ✅ **Verify:** Dialog closes

5. **Check Borrower Removed**
   - ✅ **Verify:** Borrower row completely removed from table
   - ✅ **Verify:** Key count decreased

### Expected Database State

```sql
-- Borrower should be deleted
SELECT * FROM "Borrower"
WHERE id = '[borrower-id]';
-- ✅ Should return 0 rows

-- Key should be LOST
SELECT * FROM "KeyCopy"
WHERE id = '[key-copy-id]';
-- ✅ status = 'LOST'

-- Issue record should be closed
SELECT * FROM "IssueRecord"
WHERE id = '[issue-id]';
-- ✅ returnedDate should be set
```

---

## Scenario 3: Replace Lost Key (Create + Issue)

### Purpose
Test creating a replacement copy and issuing it to the same borrower.

### Steps

1. **Find Borrower with Active Key**
   - Any borrower with at least 1 key

2. **Open Replace Key Dialog**
   - Click kebab menu (⋮)
   - Click "Replace Key"
   - ✅ **Verify:** Title: "Replace Lost Key"
   - ✅ **Verify:** Description has alert icon (ℹ️)
   - ✅ **Verify:** Text explains: "marks original as lost, creates new copy..."

3. **Fill Form**
   - Select key using radio button
   - (Optional) Set due date: Pick a date 7 days from now
   - ✅ **Verify:** "Replace Key" button is DISABLED
   - Check "I have verified the borrower's ID" checkbox
   - ✅ **Verify:** Button now ENABLED

4. **Confirm Replacement**
   - Click "Replace Key"
   - ✅ **Verify:** Success toast: "Key replaced and issued"
   - ✅ **Verify:** Dialog closes

5. **Check Borrower Row**
   - ✅ **Verify:** Borrower still has key(s)
   - ✅ **Verify:** New key badge visible
   - ✅ **Verify:** Old key badge gone

6. **Navigate to Keys Page**
   - ✅ **Verify:** Lost count +1
   - ✅ **Verify:** In Use count stays same
   - Find the key type
   - ✅ **Verify:** Total copies increased by 1

### Expected Database State

```sql
-- Old copy marked as LOST
SELECT status FROM "KeyCopy"
WHERE id = '[old-copy-id]';
-- ✅ status = 'LOST'

-- New copy created with next sequential number
SELECT * FROM "KeyCopy"
WHERE "keyTypeId" = '[key-type-id]'
ORDER BY "copyNumber" DESC LIMIT 2;
-- ✅ Top row: new copy with copyNumber = [old + 1], status = 'OUT'
-- ✅ Second row: old copy with status = 'LOST'

-- New issue record created
SELECT * FROM "IssueRecord"
WHERE "keyCopyId" = '[new-copy-id]'
  AND "borrowerId" = '[borrower-id]'
  AND "returnedDate" IS NULL;
-- ✅ Should return 1 row with:
--    - dueDate set (if you entered one)
--    - idChecked = true
```

---

## Scenario 4: UI/UX Verification

### Purpose
Test all the consistency updates and visual improvements.

### Radio Button Quality
1. Open "Mark Key Lost" dialog
2. ✅ **Verify:** Radio buttons are circular (not square checkboxes)
3. ✅ **Verify:** Radio buttons fill with color when selected
4. ✅ **Verify:** Clicking label selects radio button
5. ✅ **Verify:** Only one can be selected at a time

### Checkbox Quality
1. Open "Return Keys" dialog
2. ✅ **Verify:** Checkboxes are square with checkmark
3. ✅ **Verify:** Clicking label toggles checkbox
4. ✅ **Verify:** Multiple can be selected

### Destructive Styling
1. Open kebab menu
2. ✅ **Verify:** "Mark Key Lost" is RED text
3. ✅ **Verify:** Hovering changes background to light red
4. Open "Mark Key Lost" dialog
5. ✅ **Verify:** "Mark as Lost" button is RED
6. ✅ **Verify:** Warning box (if last key) has red border

### Keyboard Navigation
1. Open any dialog with radio buttons
2. Press `Tab` key
3. ✅ **Verify:** Focus moves to first radio button
4. Press `Arrow Down` or `Arrow Up`
5. ✅ **Verify:** Selection changes between radio buttons
6. Press `Space`
7. ✅ **Verify:** Selected option confirms
8. Press `Esc`
9. ✅ **Verify:** Dialog closes

---

## Scenario 5: Error Handling

### Purpose
Verify proper error handling and edge cases.

### Test 1: Replace Without ID Verification
1. Open "Replace Key" dialog
2. Select a key
3. Set due date
4. **Do NOT check ID verification**
5. ✅ **Verify:** "Replace Key" button stays DISABLED
6. Try clicking it
7. ✅ **Verify:** Nothing happens

### Test 2: Cancel Dialog
1. Open "Mark Key Lost" dialog
2. Select a key
3. Click "Cancel"
4. ✅ **Verify:** Dialog closes
5. ✅ **Verify:** No toast appears
6. ✅ **Verify:** Borrower data unchanged

### Test 3: Close Dialog with X
1. Open any dialog
2. Click X in top-right corner
3. ✅ **Verify:** Dialog closes
4. ✅ **Verify:** No action taken

---

## Quick Test Checklist

Use this for rapid testing:

### Lost Key Dialog ✓
- [ ] Menu item is RED
- [ ] Radio buttons modern style
- [ ] Labels clickable
- [ ] Warning appears for last key
- [ ] Button is RED
- [ ] Success toast after marking
- [ ] Borrower row updates

### Replace Key Dialog ✓
- [ ] Alert icon in description
- [ ] Radio buttons modern style
- [ ] Due date field works
- [ ] ID checkbox required
- [ ] Button disabled until checked
- [ ] Success toast after replace
- [ ] New copy created

### Return Keys Dialog ✓
- [ ] Checkboxes modern style
- [ ] Labels clickable
- [ ] Multi-select works
- [ ] GDPR warning for all keys

### Charts ✓
- [ ] Lost count updates
- [ ] Bar chart shows lost
- [ ] Pie chart includes lost

---

## Troubleshooting

### Dialog doesn't open
- Check browser console for errors
- Verify borrower has active keys
- Refresh page and try again

### Radio buttons look like plain HTML
- Clear browser cache: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Check if RadioGroup component imported correctly

### Button stays disabled
- Check if any required fields missing
- For replace: ID verification must be checked
- For lost: A key must be selected

### Database changes not visible
- Refresh Active Loans page
- Check Network tab for revalidation
- Verify server action completed successfully

---

## Report Issues

If you find any bugs, note:
1. Which scenario (1-5)
2. Which step failed
3. Expected vs actual behavior
4. Browser console errors
5. Screenshot if visual issue

---

## Success Criteria

All scenarios pass ✅ = Workflow ready for production!

- [x] Phase A: Documentation complete
- [x] Phase B: Code review complete (no bugs found)
- [x] Option B+: Consistency updates complete
- [ ] Manual testing: All scenarios pass
- [ ] Database verification: State correct

---

*Test Duration: ~20 minutes for all scenarios*
*Prerequisites Setup: ~5 minutes*

