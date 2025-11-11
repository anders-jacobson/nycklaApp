# 🧪 Multi-Tenant System Testing Checklist

## 🏗️ Architecture Overview

**Organization (Entity)** = Housing cooperative (e.g., "Brf Solrosen")
- Owns keys, borrowers, and transaction records
- Has unique encryption key
- Has team members who manage it

**Team** = Users who manage the organization
- OWNER (full control)
- ADMIN (manage keys + invite members)
- MEMBER (issue/return keys only)

## Prerequisites
- [ ] Database migration applied (`npx prisma migrate dev --name add-team-invitations`)
- [ ] Dev server running (`npm run dev`)
- [ ] Ready to create your first organization

---

## Test 1: Create Your First Organization ✓

### Step 1: Register
1. Go to http://localhost:3000/auth/register
2. Fill in:
   - Email: `owner@example.com`
   - Password: `password123`
   - **Organization Name**: `Brf Solrosen`
     - (This is your housing cooperative!)
3. Click "Register"

**Expected:**
- ✅ Organization "Brf Solrosen" created
- ✅ You are the OWNER
- ✅ Redirected to `/active-loans`
- ✅ Sidebar shows "Brf Solrosen" at top

**Check:**
- [ ] Registration succeeds
- [ ] Organization name appears in sidebar dropdown
- [ ] Your role shows as "owner" under org name

---

## Test 2: Start Dev Server

**Run:**
```bash
npm run dev
```

**Visit:** http://localhost:3000

---

## Test 3: Verify Organization Created

1. Click on **organization dropdown** (top of sidebar)
2. Should show:
   ```
   Organizations
   
   [B] Brf Solrosen      ✓
       owner
   
   [+] Join Another Organization
   ```

**Check:**
- [ ] Organization name displays correctly
- [ ] Your role shows as "owner"
- [ ] Checkmark indicates current organization
- [ ] "Join Another Organization" is disabled (for now)

---

## Test 4: Access Settings → Team Page

1. Click **"Settings"** in the sidebar (near bottom)
2. You'll land on `/settings/team`

**Expected to see:**
```
Settings
─────────
[Team] (tab - active/underlined)

Organization
• Name: Brf Solrosen
• Created: [date]
• Members: 1 team member

Your Profile
• Email: owner@example.com
• Role: OWNER 👑

Members (1)
[Table showing you as OWNER]

Invite Team Member
[Form with email + role selector]
```

**Check:**
- [ ] "Settings" title in header (not "Active Loans")
- [ ] "Team" tab is active/underlined
- [ ] Organization section shows correct name
- [ ] You see yourself as OWNER in members table
- [ ] Invite form is visible (you're OWNER)
- [ ] Role dropdown shows Member/Admin/Owner options

---

## Test 5: Invite a Team Member (As OWNER)

**Fill the invite form:**
- Email: `colleague@example.com` (use any email)
- Role: Select **ADMIN**
- Click **"Send Invitation"**

**Expected results:**
1. Success message: "✓ Invitation sent successfully!"
2. **Check your terminal/console** for invite link:

```
📧 INVITATION EMAIL
To: colleague@example.com
Subject: You've been invited to join [Your Org Name]
Body:
[Your Name] has invited you to join [Your Org Name] as a ADMIN.

Click the link below to accept your invitation:
http://localhost:3000/auth/register?token=abc123...

This invitation will expire in 7 days.
```

**Check:**
- [ ] Success message appears
- [ ] Console shows invitation email
- [ ] **COPY THE INVITE URL** (you'll need it next)

---

## Test 6: View Pending Invitation

**On the same team page:**

**Expected to see:**
```
[Pending Invitations]
  colleague@example.com    ADMIN    6d left    [Cancel]
```

**Check:**
- [ ] Pending invitation appears in table
- [ ] Shows correct email and role
- [ ] Shows expiration countdown

---

## Test 7: Accept Invitation (New User Registration)

1. **Copy the invite URL from console**
2. Open a **new incognito/private window**
3. Paste the invite URL
4. You'll land on `/auth/register?token=...`

**Expected to see:**
```
[Blue info box]
You've been invited to join [Your Org Name]
Role: ADMIN

Register:
  Email: [colleague@example.com] (pre-filled)
  Password: [________]
  [Register]
```

**Fill the form:**
- Email: `colleague@example.com` (should match invite)
- Password: `password123` (min 8 chars)
- Click **"Register"**

**Expected results:**
- ✅ Registration succeeds
- ✅ Redirects to `/active-loans`
- ✅ You're logged in as the new user!

**Check:**
- [ ] Registration form shows invite info
- [ ] Email is pre-filled
- [ ] No "Organization name" field (joining existing org)
- [ ] Registration succeeds
- [ ] Redirected to dashboard

---

## Test 8: Verify New User Joined

**In incognito window (new user):**
1. Click **"Team"** in sidebar
2. Check the team members table

**Expected to see:**
```
[Team Members (2)]
  Owner Name         OWNER    Jan 15, 2025
  colleague@...      ADMIN    Feb 1, 2025 (You)
```

**Check:**
- [ ] Both users visible
- [ ] New user shows as ADMIN
- [ ] New user has "You" badge
- [ ] Owner can't be modified

---

## Test 9: Test Role Permissions (As ADMIN)

**Still in incognito (ADMIN user):**

### Can Do:
1. Navigate to **Keys** page
2. Try to **create a key type** → Should work ✅
3. Try to **delete a key type** → Should work ✅
4. Navigate to **Team** page
5. Try to **invite a MEMBER** → Should work ✅

### Cannot Do:
1. Try to **invite an ADMIN** → Should see error ❌
2. Try to **change owner's role** → Shouldn't see dropdown ❌
3. Try to **remove owner** → Shouldn't see remove button ❌

**Check:**
- [ ] ADMIN can manage keys
- [ ] ADMIN can invite MEMBER only
- [ ] ADMIN cannot modify OWNER
- [ ] ADMIN cannot invite other ADMINs

---

## Test 10: Test Role Permissions (As MEMBER)

**In original window (OWNER):**
1. Go to Team page
2. Find the ADMIN user
3. Change role from **ADMIN** to **MEMBER**
4. Page reloads

**In incognito (now MEMBER):**
1. Refresh the page
2. Try to navigate to Keys
3. Try to **delete a key type** → Should see error! ❌

**Expected error:**
```
"Only owners and admins can delete key types."
```

4. Go to Team page
5. Try to click **"Send Invitation"**

**Expected:**
- [ ] No invite form visible (MEMBER can't invite)
- [ ] Can see team member list
- [ ] No role dropdowns (can't change roles)
- [ ] No remove buttons

**Check:**
- [ ] Role change works
- [ ] MEMBER blocked from deleting keys
- [ ] MEMBER blocked from inviting
- [ ] MEMBER can only view team

---

## Test 11: Change Role Back (As OWNER)

**In original window (OWNER):**
1. Go to Team page
2. Find the MEMBER user
3. Change role back to **ADMIN**

**In incognito (ADMIN again):**
1. Refresh page
2. Try to delete a key type → Should work! ✅

**Check:**
- [ ] Role change persists
- [ ] Permissions update immediately
- [ ] ADMIN can manage keys again

---

## Test 12: Remove Team Member (As OWNER)

**In original window (OWNER):**
1. Go to Team page
2. Find the ADMIN user
3. Click **trash icon** to remove
4. Confirm deletion

**Expected:**
- ✅ User removed from team
- ✅ Table updates to show 1 member
- ✅ Pending invitation remains (if not accepted)

**In incognito (removed user):**
1. Try to access `/active-loans`
2. Should get **"User not found"** error
3. Get redirected to sync-session page

**Check:**
- [ ] User successfully removed
- [ ] Removed user can't access app
- [ ] Owner remains as only member
- [ ] Can't remove yourself

---

## Test 13: Test Edge Cases

### Invite Existing Member
1. As OWNER, try to invite your own email
2. **Expected:** Error "User already in organization"

### Invite with Expired Token
1. (Skip for now - would need to wait 7 days or manually expire in DB)

### Register with Wrong Email
1. Copy an invite link (for colleague@example.com)
2. Open in incognito
3. Try to register with **different email**
4. **Expected:** Error "Invitation sent to different email address"

### Cancel Invitation
1. As OWNER, send new invitation
2. Click **"Cancel"** on pending invitation
3. Try to use the invite link
4. **Expected:** Error "Invalid invitation link"

**Check:**
- [ ] Can't invite existing members
- [ ] Email must match invitation
- [ ] Cancelled invites can't be used

---

## Test 14: Data Isolation (Multi-Tenant) 🔐

**This is the most important test!**

### Create Second Organization
1. **Open NEW incognito window** (close old one)
2. Go to http://localhost:3000/auth/register
3. Register with:
   - Email: `org2owner@example.com`
   - Password: `password123`
   - **Organization name: "Brf Strandparken"** (different from first!)
4. Login as this new user

**Expected:**
- ✅ New organization "Brf Strandparken" created
- ✅ New user is OWNER
- ✅ Separate encryption key generated
- ✅ Organization dropdown shows "Brf Strandparken"

### Verify Data Isolation
1. As "Test Org 2" owner:
   - Create a key type: "Test Key"
   - Create a borrower
   - Issue a key

2. **Switch back to original window (Org 1)**
   - Go to Keys page
   - Check Active Loans

**Critical Check:**
- [ ] Org 1 CANNOT see Org 2's keys
- [ ] Org 1 CANNOT see Org 2's borrowers
- [ ] Org 1 CANNOT see Org 2's loans
- [ ] Each org has separate team members
- [ ] Dashboard shows only own data

**If you see any data from the other org → CRITICAL BUG! 🚨**

---

## ✅ Success Criteria

### Core Features Working:
- [x] Team invitations send successfully
- [x] Invite links work correctly
- [x] New users join with correct role
- [x] Role hierarchy enforced (OWNER > ADMIN > MEMBER)
- [x] Permission guards block unauthorized actions
- [x] Remove team member works
- [x] Data isolation between organizations

### UI Working:
- [x] Team page displays correctly
- [x] Invite form visible to OWNER/ADMIN
- [x] Team members table shows all users
- [x] Pending invitations visible
- [x] Role dropdowns work (OWNER only)
- [x] Remove buttons work (OWNER only)

### Security Working:
- [x] MEMBER can't delete keys
- [x] ADMIN can't invite ADMIN
- [x] Can't modify yourself
- [x] Can't remove yourself
- [x] Email must match invitation
- [x] Organizations completely isolated

---

## 🐛 Common Issues & Solutions

### Issue: "User not found" after migration
**Solution:** Database was reset. Sign out, register again.

### Issue: Team page not loading
**Solution:** Check console for errors. Run `npx prisma generate`.

### Issue: No invite link in console
**Solution:** Check terminal (not browser console). Look for "📧 INVITATION EMAIL".

### Issue: Can't see "Team" in sidebar
**Solution:** Clear cache, hard refresh (Cmd+Shift+R / Ctrl+Shift+R).

### Issue: Permissions not working
**Solution:** Check your role. Refresh page. Try logging out/in.

### Issue: Registration fails with invite
**Solution:** Verify email matches invitation exactly (case-sensitive).

---

## 📊 Final Report

After completing all tests, you should have verified:

1. ✅ **Multi-tenant architecture works**
   - Multiple organizations
   - Complete data isolation
   - Per-entity encryption

2. ✅ **Team management works**
   - Invitations functional
   - Role management operational
   - Permissions enforced

3. ✅ **Security model works**
   - Role-based access control
   - Permission guards active
   - No data leakage between orgs

**Ready for production?** If all tests pass, yes! 🚀

Just add email service (Resend) to replace console logging.

---

## 🎯 Quick Test (5 Minutes)

Don't have time for full test? Run this quick version:

1. Run migration
2. Login as owner
3. Visit `/settings/team`
4. Invite someone (check console for link)
5. Open link in incognito → Register
6. Verify both users in team list
7. Try changing roles
8. Try deleting keys as MEMBER (should fail)

**If these work → Core system is functional! ✅**

