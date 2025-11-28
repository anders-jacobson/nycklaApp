# Multi-Tenant Isolation - Manual Testing Checklist

## Setup (5 min)

### 1. Create Test Data
- [ ] Log in as a user
- [ ] Create **Organisation A**: "Test Housing Co-op A"
- [ ] Create **Organisation B**: "Test Housing Co-op B"

### 2. Populate Organisation A
Switch to Organisation A, then:
- [ ] Create key type **A1** (function: "Main Entrance")
  - [ ] Add 2 copies
- [ ] Create key type **A2** (function: "Storage Room")
  - [ ] Add 1 copy
- [ ] Create borrower **Alice Anderson** (resident)
- [ ] Issue key A1-1 to Alice
- [ ] Verify dashboard shows: 3 total keys, 1 out, 2 available

### 3. Populate Organisation B
Switch to Organisation B, then:
- [ ] Create key type **B1** (function: "Office")
  - [ ] Add 3 copies
- [ ] Create borrower **Bob Brown** (external, company: "ABC Ltd")
- [ ] Issue key B1-1 to Bob
- [ ] Verify dashboard shows: 3 total keys, 1 out, 2 available

---

## Test Cases

### Test 1: Keys Page Isolation ✅
**When viewing Organisation A:**
- [ ] Keys page shows only A1, A2 (not B1)
- [ ] Total copies shows 3 (not 6)
- [ ] Dashboard pie chart reflects only org A data

**When viewing Organisation B:**
- [ ] Keys page shows only B1 (not A1, A2)
- [ ] Total copies shows 3 (not 6)
- [ ] Dashboard pie chart reflects only org B data

**Switch back to A:**
- [ ] Data reverts to showing only org A keys

---

### Test 2: Borrowers Isolation ✅
**When viewing Organisation A:**
- [ ] Active Loans page shows only Alice (not Bob)
- [ ] Borrower search finds only Alice

**When viewing Organisation B:**
- [ ] Active Loans page shows only Bob (not Alice)
- [ ] Borrower search finds only Bob

---

### Test 3: Issue Key Workflow ✅
**In Organisation A:**
- [ ] Issue Key page shows only org A keys (A1, A2)
- [ ] Borrower search shows only Alice
- [ ] Cannot see Bob in borrower list
- [ ] Issue A2-1 to Alice
- [ ] Verify Alice now has 2 keys

**In Organisation B:**
- [ ] Issue Key page shows only org B keys (B1)
- [ ] Borrower search shows only Bob
- [ ] Cannot see Alice in borrower list
- [ ] Try to create new borrower "Charlie" in org B
- [ ] Verify Charlie only appears in org B, not A

---

### Test 4: Return Key Workflow ✅
**In Organisation A:**
- [ ] Active Loans shows only Alice's loans
- [ ] Return A1-1 from Alice
- [ ] Verify key status updates to AVAILABLE
- [ ] Dashboard updates to show 3 available, 0 out

**Switch to Organisation B:**
- [ ] Alice's return should NOT affect org B data
- [ ] Bob still has 1 key out
- [ ] Dashboard shows 2 available, 1 out

---

### Test 5: Empty Organisation ✅
**Create Organisation C:**
- [ ] Switch to new empty Organisation C
- [ ] Keys page shows empty state message
- [ ] Dashboard shows no data (not org A or B data)
- [ ] Active Loans shows no borrowers
- [ ] Verify helpful onboarding message displayed

---

### Test 6: Direct URL Access Prevention 🔐
**Get IDs from Organisation A:**
- [ ] Copy key type ID from URL or inspect element
- [ ] Copy borrower ID from URL

**Switch to Organisation B:**
- [ ] Try to access org A's key by URL manipulation (if possible)
- [ ] Should not be able to see or edit org A data
- [ ] Try to issue org A's key from org B (via form manipulation)
- [ ] Should fail with error or not show in dropdown

---

### Test 7: Team Members View Isolation 👥
**If you have another user account:**
- [ ] Invite user to only Organisation A
- [ ] Log in as that user
- [ ] Verify they see only org A data
- [ ] Verify they don't see org B in org switcher
- [ ] Invite same user to org B
- [ ] Verify they now see both orgs in switcher
- [ ] Verify data isolation still works after invitation

---

### Test 8: Statistics & Charts ✅
**In Organisation A:**
- [ ] Note down dashboard stats (e.g., "3 available, 1 out")
- [ ] Check pie chart percentages

**Switch to Organisation B:**
- [ ] Dashboard stats should change
- [ ] Pie chart should reflect only org B data
- [ ] Numbers should be independent of org A

**Create activity in org B (issue/return keys):**
- [ ] Switch back to org A
- [ ] Verify org A stats unchanged

---

## Expected Results Summary

✅ **Pass Criteria:**
- No cross-organisation data visibility
- Empty state shows when org has no data
- All queries filtered by `entityId`
- Switching organisations updates all pages correctly
- Dashboard/charts reflect only active org
- URL manipulation doesn't expose other org data

❌ **Fail Scenarios:**
- Seeing keys/borrowers from inactive organisation
- Stats/charts mixing data from multiple orgs
- Search results returning cross-org data
- Being able to issue another org's key
- Empty state not showing for new org

---

## Performance Checks (Optional)

- [ ] Organisation switch completes in < 1 second
- [ ] No console errors when switching
- [ ] No visible flicker/data leak during transition
- [ ] Browser back/forward buttons work correctly

---

## Cleanup (2 min)

- [ ] Delete all test borrowers (Alice, Bob, Charlie)
- [ ] Delete all test keys (A1, A2, B1)
- [ ] Delete test organisations (A, B, C)
- [ ] Verify your real data is intact

---

**Testing Date:** __________  
**Tester:** __________  
**Result:** ☐ PASS  ☐ FAIL (see notes)  
**Notes:**






