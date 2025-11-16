# Manual Role-Based Permissions Testing Checklist

## Setup Instructions

1. Create a test organisation with 3 users (OWNER, ADMIN, MEMBER)
2. Log in with each role in different browser profiles/incognito windows
3. Create test key types with available and lost copies
4. Follow the test scenarios below

## Test Scenarios

### 🔑 Key Management Operations

#### As MEMBER (Should be restricted)
- [ ] Try to update a key type → ❌ Should fail with permission error
- [ ] Try to delete a key type → ❌ Should fail with permission error
- [ ] Try to add a key copy → ❌ Should fail with permission error
- [ ] Try to mark available key as lost → ❌ Should fail with permission error
- [ ] Try to mark lost key as found → ❌ Should fail with permission error
- [ ] Try to mark issued key as lost → ❌ Should fail with permission error
- [ ] Issue a key → ✅ Should succeed
- [ ] Return a key → ✅ Should succeed
- [ ] View keys list → ✅ Should succeed

#### As ADMIN (Should have key management access)
- [ ] Update a key type → ✅ Should succeed
- [ ] Delete a key type → ✅ Should succeed
- [ ] Add a key copy → ✅ Should succeed
- [ ] Mark available key as lost → ✅ Should succeed
- [ ] Mark lost key as found → ✅ Should succeed
- [ ] Mark issued key as lost → ✅ Should succeed
- [ ] Issue a key → ✅ Should succeed
- [ ] Return a key → ✅ Should succeed

#### As OWNER (Should have full key management access)
- [ ] All operations above → ✅ Should succeed

---

### 👥 Team Management Operations

#### As MEMBER
- [ ] View team members list → ✅ Should succeed
- [ ] Try to invite a user → ❌ Should fail with permission error
- [ ] Try to view pending invitations → ❌ Should fail (or restricted)
- [ ] Try to change user role → ❌ Should fail with permission error
- [ ] Try to remove user → ❌ Should fail with permission error
- [ ] Leave organisation → ✅ Should succeed (if not last owner)

#### As ADMIN
- [ ] View team members list → ✅ Should succeed
- [ ] Invite a MEMBER → ✅ Should succeed
- [ ] Try to invite an ADMIN → ❌ Should fail (ADMIN can only invite MEMBER)
- [ ] Try to invite an OWNER → ❌ Should fail
- [ ] View pending invitations → ✅ Should succeed
- [ ] Cancel invitation → ✅ Should succeed
- [ ] Try to change user role → ❌ Should fail (OWNER only)
- [ ] Try to remove user → ❌ Should fail (OWNER only)

#### As OWNER
- [ ] View team members list → ✅ Should succeed
- [ ] Invite any role (MEMBER/ADMIN/OWNER) → ✅ Should succeed
- [ ] View pending invitations → ✅ Should succeed
- [ ] Cancel invitation → ✅ Should succeed
- [ ] Change user role → ✅ Should succeed
- [ ] Remove user → ✅ Should succeed
- [ ] Try to change own role → ❌ Should fail
- [ ] Try to remove self → ❌ Should fail (use "Leave" instead)

---

### 🏢 Organisation Management

#### As MEMBER
- [ ] View organisation details → ✅ Should succeed
- [ ] Try to update organisation name → ❌ Should fail with permission error
- [ ] Switch to another organisation (if member) → ✅ Should succeed
- [ ] Create new organisation → ✅ Should succeed

#### As ADMIN
- [ ] View organisation details → ✅ Should succeed
- [ ] Try to update organisation name → ❌ Should fail (OWNER only)
- [ ] Switch to another organisation → ✅ Should succeed
- [ ] Create new organisation → ✅ Should succeed

#### As OWNER
- [ ] View organisation details → ✅ Should succeed
- [ ] Update organisation name → ✅ Should succeed
- [ ] Switch to another organisation → ✅ Should succeed
- [ ] Create new organisation → ✅ Should succeed

---

## Quick Test Setup Script

### Create Test Organisation with 3 Users

1. Register as OWNER:
   ```
   Email: owner@testorg.com
   Org: Test RBAC Org
   ```

2. As OWNER, invite ADMIN:
   ```
   Go to Settings → Team
   Invite: admin@testorg.com (Role: ADMIN)
   ```

3. Register ADMIN via invite link

4. As OWNER, invite MEMBER:
   ```
   Go to Settings → Team
   Invite: member@testorg.com (Role: MEMBER)
   ```

5. Register MEMBER via invite link

### Create Test Data

As OWNER or ADMIN:
1. Create key type "Test Key" (Label: TK)
2. Add 3 copies
3. Issue 1 copy to a borrower
4. Mark 1 available copy as lost

---

## Error Messages to Verify

When a MEMBER tries restricted actions, verify these error messages:

- "Only owners and admins can update key types."
- "Only owners and admins can delete key types."
- "Only owners and admins can add key copies."
- "Only owners and admins can mark keys as lost."
- "Only owners and admins can mark lost keys as found."
- "You do not have permission to invite users."
- "Only organisation owners can update the name."
- "Only owners can change user roles." (via requireRole)

---

## Browser DevTools Console Checks

While testing, keep DevTools console open to catch:
- [ ] No CORS errors
- [ ] No 403/401 errors for valid operations
- [ ] Clean error messages returned to UI
- [ ] No database queries exposing other orgs' data

---

## Data Isolation Verification

For all roles, verify:
- [ ] Can only see keys from active organisation
- [ ] Can only see borrowers from active organisation
- [ ] Can only see team members from active organisation
- [ ] Cannot access data by URL manipulation (try changing IDs)
- [ ] Switching org properly filters all data

---

## Performance Check

- [ ] Permission checks don't cause noticeable lag
- [ ] Error responses are instant
- [ ] No redundant database queries for permission checks

---

## Notes

- Test in Chrome/Firefox/Safari if possible
- Use incognito/private windows for different roles simultaneously
- Clear localStorage between full role switches if needed
- Document any unexpected behaviors or bugs

## Testing Report Template

```
Date: [Date]
Tester: [Name]
Branch: [Git branch]

Summary:
- Total tests: X
- Passed: Y
- Failed: Z

Issues Found:
1. [Description]
2. [Description]

Notes:
[Any additional observations]
```




