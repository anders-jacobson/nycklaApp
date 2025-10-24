# Workflow Testing Guide

Comprehensive testing guide for the Issue Key and Return Key workflows.

## 📋 Table of Contents

- [Automated Tests](#automated-tests)
- [Manual UI Tests](#manual-ui-tests)
- [Integration Tests](#integration-tests)
- [Test Data Setup](#test-data-setup)
- [Troubleshooting](#troubleshooting)

---

## 🤖 Automated Tests

### Running Automated Tests

The automated test suite covers backend logic, database operations, and workflow integrations.

```bash
# Run the workflow test suite
npm run test:workflows
```

### What's Tested Automatically

#### Issue Workflow Tests

1. ✅ **Issue Single Key to New Borrower**

   - Creates new borrower
   - Issues single key
   - Verifies key status changes to OUT
   - Verifies issue record creation
   - Checks due date handling

2. ✅ **Issue Multiple Keys to New Borrower**

   - Creates new borrower with company info
   - Issues 3 keys simultaneously
   - Verifies all keys marked as OUT
   - Confirms all linked to same borrower

3. ✅ **Issue Key to Existing Borrower**

   - Reuses existing borrower from test 1
   - Verifies no duplicate borrower created
   - Confirms loan count increases

4. ✅ **Form Validation and Error Handling**
   - Tests empty borrower name rejection
   - Tests invalid email format rejection
   - Tests unavailable key prevention

#### Return Workflow Tests

5. ✅ **Return Single Key**

   - Returns one key from active loan
   - Verifies return date set
   - Confirms key status changes to AVAILABLE
   - Checks GDPR cleanup logic

6. ✅ **Return Last Key Deletes Borrower (GDPR)**

   - Creates borrower with single key
   - Returns that key
   - Verifies borrower automatically deleted
   - Confirms GDPR compliance

7. ✅ **Return Multiple Keys (Bulk)**

   - Returns all keys for a borrower
   - Verifies all marked as returned
   - Confirms all keys available again
   - Checks bulk GDPR cleanup

8. ✅ **Prevent Double Return**
   - Returns a key
   - Attempts to return again
   - Verifies prevention mechanism works

#### Integration Tests

9. ✅ **Issue → Return → Reissue Cycle**

   - Issues key to borrower 1
   - Returns key
   - Reissues same key to borrower 2
   - Verifies complete workflow cycle
   - Confirms issue history maintained

10. ✅ **Data Isolation Between Users**
    - Tests cross-user access prevention
    - Verifies RLS policies work
    - Confirms cooperative isolation

### Test Output

The test suite provides detailed output:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║         🔑 KEY ISSUE & RETURN WORKFLOWS - COMPREHENSIVE TESTS 🔑          ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

================================================================================
  TEST 1: Issue Single Key to New Borrower
================================================================================

📝 Using key: A1-1
   Function: Main entrance

✅ Issue single key to new borrower
✅ Key status changed to OUT
✅ Issue record created
✅ Borrower correctly linked
✅ Due date set

📋 Summary:
   Borrower: Test User Single Key (test.single@workflow.test)
   Key: A1-1
   Issue ID: abc-123-def-456
   Due Date: 10/31/2025

...
```

### Expected Results

- **10/10 tests should pass** for fully working workflows
- Tests automatically clean up all test data
- No manual cleanup required

---

## 🖥️ Manual UI Tests

While automated tests cover backend logic, manual testing ensures the UI works correctly.

### Prerequisites

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Log in to the application with test credentials

3. Ensure you have at least 3-4 available keys in the system

---

### Issue Workflow UI Tests

#### Test 1: Single Key Issue to New Borrower

**Steps:**

1. Navigate to **Active Loans** page
2. Click **"Issue Keys"** button (top right)
3. **Step 1: Select Keys**
   - Select one key from the dropdown
   - Choose a specific copy number
   - Click **"Next"**
4. **Step 2: Borrower Details**
   - Type a new name (e.g., "John Smith")
   - Enter email: `john.smith@test.com`
   - Enter phone: `070-123-4567`
   - Click **"Next"**
5. **Step 3: Lending Details**
   - Set due date (optional)
   - Check **"I have verified the borrower's ID"**
   - Click **"Next"**
6. **Step 4: Confirm**
   - Review all details
   - Click **"Issue Keys"**

**Expected Results:**

- ✅ Each step validates before proceeding
- ✅ Borrower autocomplete suggests as you type (should be empty for new)
- ✅ Confirmation screen shows correct details
- ✅ Success toast appears: "Keys issued successfully!"
- ✅ Redirects to Active Loans page
- ✅ New row appears for John Smith with the key

**Screenshot Checklist:**

- [ ] Step 1: Key selection with copy picker
- [ ] Step 2: Borrower form with validation
- [ ] Step 3: Lending details with ID checkbox
- [ ] Step 4: Confirmation summary
- [ ] Success toast notification
- [ ] Active Loans table with new entry

---

#### Test 2: Multiple Keys Issue to New Borrower

**Steps:**

1. Navigate to **Active Loans** → **"Issue Keys"**
2. **Step 1:** Select 3 different keys
   - Choose specific copy numbers for each
   - Note the "Combined Access Areas" summary
3. **Step 2:** Create new borrower
   - Name: "Jane Contractor"
   - Email: `jane.contractor@company.com`
   - Company: "Test Maintenance AB"
4. **Step 3:** Set lending details
   - Due date: 7 days from now
   - Check ID verification
5. **Step 4:** Confirm and issue

**Expected Results:**

- ✅ All 3 keys shown in confirmation
- ✅ Copy numbers displayed correctly
- ✅ Access areas summary combines all 3 keys
- ✅ Success toast: "3 keys issued to Jane Contractor"
- ✅ Single row in Active Loans with "3 keys" badge

---

#### Test 3: Issue Key to Existing Borrower

**Steps:**

1. Navigate to **Active Loans** → **"Issue Keys"**
2. **Step 1:** Select one key
3. **Step 2:** Type "John" in name field
   - Autocomplete should suggest "John Smith"
   - Click on the suggestion to select
   - Form pre-fills with existing data
4. Complete steps 3 & 4

**Expected Results:**

- ✅ Autocomplete finds existing borrower
- ✅ Email, phone pre-filled (read-only or editable)
- ✅ No duplicate borrower created
- ✅ John Smith row now shows 2 keys

---

#### Test 4: Form Validation

**Test Empty Fields:**

1. Issue Keys → Step 2
2. Leave name empty → Click Next
3. **Expected:** Error message: "Name is required"

**Test Invalid Email:**

1. Step 2 → Enter name: "Test"
2. Email: "invalid-email" (no @)
3. Click Next
4. **Expected:** Error: "Invalid email format"

**Test Missing ID Verification:**

1. Complete Steps 1 & 2
2. Step 3 → Leave ID checkbox unchecked
3. Click Next
4. **Expected:** Error: "ID verification is required"

**Test Unavailable Key:**

1. Issue all copies of a specific key type
2. Try to issue another copy
3. **Expected:** Key type disabled in dropdown OR error message

---

#### Test 5: Workflow Navigation

**Test Back Button:**

1. Start issue workflow
2. Go to Step 3
3. Click **"Back"** (top left)
4. **Expected:** Returns to Step 2 with data preserved

**Test Exit Button:**

1. Start issue workflow
2. Go to Step 2
3. Click **X** (top right)
4. **Expected:** Returns to Active Loans (may show confirmation dialog)

**Test Progress Indicator:**

1. Navigate through all 4 steps
2. **Expected:** Progress dots update at each step
3. **Expected:** Current step highlighted

---

### Return Workflow UI Tests

#### Test 6: Return Single Key

**Steps:**

1. Navigate to **Active Loans**
2. Find borrower with 1 key
3. Click **kebab menu** (⋮) → **"Return Keys"**
4. Dialog appears with key selection
5. **Expected:** Warning message: "Returning all keys for [Name] will remove their contact from the system"
6. Click **"Return Key"**

**Expected Results:**

- ✅ Confirmation dialog shows key details
- ✅ GDPR warning displayed (last key)
- ✅ Success toast: "Key returned"
- ✅ Row disappears from Active Loans table
- ✅ Key shows as AVAILABLE in Keys page

---

#### Test 7: Return Multiple Keys (Partial)

**Steps:**

1. Find borrower with 3+ keys (from Test 2)
2. Click kebab menu → **"Return Keys"**
3. **Select only 2 of 3 keys** (uncheck one)
4. **Expected:** No GDPR warning (borrower has remaining keys)
5. Click **"Return Keys"**

**Expected Results:**

- ✅ Only selected keys marked as returned
- ✅ Borrower row still visible
- ✅ Badge updates: "3 keys" → "1 key"
- ✅ No GDPR warning shown

---

#### Test 8: Return All Keys (Bulk)

**Steps:**

1. Find borrower with multiple keys
2. Kebab menu → **"Return Keys"**
3. All keys pre-selected
4. **Expected:** GDPR warning displayed
5. Click **"Return Keys"**

**Expected Results:**

- ✅ All keys returned simultaneously
- ✅ Borrower row disappears
- ✅ Toast: "Keys returned"
- ✅ All keys available in Keys page

---

#### Test 9: Cancel Return

**Steps:**

1. Open return dialog
2. Click **"Cancel"** button

**Expected Results:**

- ✅ Dialog closes
- ✅ No changes made
- ✅ Borrower still has keys

---

### Lost Key Workflow UI Tests (if implemented)

#### Test 10: Mark Key as Lost

**Steps:**

1. Active Loans → Kebab menu → **"Mark Lost"**
2. Confirm lost status
3. Optional: Create replacement
4. Optional: Issue replacement to same borrower

**Expected Results:**

- ✅ Key status changes to LOST
- ✅ Issue record closed
- ✅ Replacement copy created (if selected)
- ✅ Charts reflect lost key count

---

## 🔗 Integration Tests

Test complete workflows across multiple pages.

### Integration Test 1: Full Lifecycle

**Steps:**

1. **Issue** 2 keys to new borrower
2. Navigate to **Keys** page
   - Verify available count decreased
3. Navigate to **Dashboard**
   - Verify chart shows keys OUT
4. Return to **Active Loans**
   - **Return** 1 key
5. Check **Keys** page
   - Verify count increased by 1
6. Return remaining key
7. Verify borrower deleted

**Expected Results:**

- ✅ All pages update in real-time
- ✅ Charts reflect current state
- ✅ Data consistency across views

---

### Integration Test 2: Multi-User Isolation

**Setup:** Two test accounts in different cooperatives

**Steps:**

1. Log in as **User A**
2. Issue key to borrower
3. Note borrower name and key
4. **Log out**
5. Log in as **User B** (different cooperative)
6. Navigate to Active Loans

**Expected Results:**

- ✅ User B cannot see User A's borrower
- ✅ User B cannot see User A's keys
- ✅ Complete data isolation

---

## 🗄️ Test Data Setup

### Creating Test Keys

1. Navigate to **Keys** page
2. Click **"Create Key Type"**
3. Create several key types:
   ```
   A1 - Main Entrance (3 copies)
   A2 - Garage (2 copies)
   B1 - Storage Room (4 copies)
   B2 - Roof Access (1 copy)
   ```

### Test Borrower Profiles

**Resident Borrower:**

- Name: "Test Resident"
- Email: `resident@test.com`
- Phone: `070-111-1111`

**External Borrower:**

- Name: "Test Contractor"
- Email: `contractor@company.com`
- Company: "Test Services AB"
- Phone: `070-222-2222`

**Borrower with Placeholder Email:**

- Name: "Walk-in Customer"
- Email: `unknown@placeholder.com`
- Phone: `070-333-3333`

---

## 🔍 Troubleshooting

### Common Issues

#### Keys Not Appearing in Issue Flow

**Problem:** Dropdown shows "No keys found"

**Solutions:**

1. Check Keys page - ensure keys exist
2. Verify keys have AVAILABLE status
3. Check you're logged in correctly
4. Try refreshing the page

---

#### Borrower Not Found in Search

**Problem:** Autocomplete doesn't find existing borrower

**Solutions:**

1. Type full name or email
2. Check spelling
3. Verify borrower exists in Active Loans
4. Try different search term (phone, company)

---

#### Return Button Not Working

**Problem:** Nothing happens when clicking "Return Keys"

**Solutions:**

1. Check browser console for errors
2. Verify issue record exists
3. Check key isn't already returned
4. Try refreshing page

---

#### GDPR Cleanup Not Happening

**Problem:** Borrower not deleted after returning last key

**Solutions:**

1. Check database for other active loans
2. Verify transaction completed
3. Check server logs for errors
4. May need to manually cleanup

---

### Debugging Steps

1. **Open Browser DevTools** (F12)
2. **Check Console** for errors
3. **Network Tab** - verify API calls succeed
4. **React DevTools** - inspect component state

### Database Verification

```bash
# Connect to database
npx prisma studio

# Check issue records
# Table: IssueRecord
# Filter: returnedDate IS NULL (active loans)

# Check key statuses
# Table: KeyCopy
# Filter by status: AVAILABLE, OUT, LOST

# Check borrowers
# Table: Borrower
```

---

## 📊 Testing Checklist

Use this checklist to track your testing progress:

### Automated Tests

- [ ] All 10 automated tests pass
- [ ] No database errors
- [ ] Cleanup completes successfully

### Issue Workflow UI

- [ ] Test 1: Single key to new borrower
- [ ] Test 2: Multiple keys to new borrower
- [ ] Test 3: Key to existing borrower
- [ ] Test 4: Form validation
- [ ] Test 5: Workflow navigation

### Return Workflow UI

- [ ] Test 6: Return single key
- [ ] Test 7: Return multiple keys (partial)
- [ ] Test 8: Return all keys (bulk)
- [ ] Test 9: Cancel return

### Integration

- [ ] Full lifecycle test
- [ ] Multi-user isolation test

### Edge Cases

- [ ] Issue with placeholder email
- [ ] Issue with no due date
- [ ] Return after due date (overdue)
- [ ] Multiple borrowers same name

---

## 🎯 Success Criteria

Your workflows are **production-ready** when:

- ✅ All automated tests pass (10/10)
- ✅ All UI tests complete without errors
- ✅ Forms validate properly
- ✅ Data persists correctly
- ✅ GDPR cleanup works
- ✅ Multi-user isolation works
- ✅ No console errors
- ✅ Toast notifications appear
- ✅ Page navigation smooth
- ✅ Data consistent across pages

---

## 📝 Reporting Issues

If you find bugs during testing, document:

1. **Test case name**
2. **Steps to reproduce**
3. **Expected result**
4. **Actual result**
5. **Screenshots/videos**
6. **Browser console errors**

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. Update task file (`docs/development/tasks.md`)
2. Mark workflow tests as complete
3. Move to next feature (Lost Key workflow, etc.)
4. Deploy to staging environment
5. Conduct user acceptance testing

---

**Last Updated:** 2025-10-24  
**Test Coverage:** Issue & Return Workflows  
**Status:** Ready for Testing ✅
