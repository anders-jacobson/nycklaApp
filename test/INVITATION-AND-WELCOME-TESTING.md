# Invitation Workflow & Welcome Screen Testing Guide

**Commit Feature:** Complete invitation system with email sending + Welcome screen for new org members

**Date:** 2026-02-13

---

## 📋 Overview

This testing guide covers all changes in the current commit:

1. **Invitation Workflow** - Email invitations with multiple acceptance methods
2. **Welcome Screen** - Onboarding screen shown when joining/creating an organization
3. **Passwordless Auth Integration** - Invitation support in magic link, OTP, and OAuth flows

---

## 🗂️ Files Changed/Created

### New Files (5)
- ✅ `lib/email.ts` - Resend integration for invitation emails
- ✅ `app/welcome/page.tsx` - Welcome screen server component
- ✅ `app/welcome/content.tsx` - Welcome screen client component with timer
- ✅ `app/no-organization/content.tsx` - Client component with "Join via Code" dialog
- ✅ `docs/development/PASSWORDLESS-AUTH-TESTING.md` - Comprehensive testing guide

### Modified Files (9)
- ✅ `app/actions/team.ts` - Added `acceptInvitation()`, real email sending
- ✅ `app/actions/auth.ts` - Added `inviteToken` support to `sendOtpCode()` and `signInWithOAuth()`
- ✅ `app/actions/organisation.ts` - Changed redirect to `/welcome?from=create`
- ✅ `app/auth/callback/route.ts` - Auto-accepts invitation, redirects to welcome
- ✅ `components/root/login-form.tsx` - Invitation UI and token handling
- ✅ `app/no-organization/page.tsx` - Split into server + client components
- ✅ `docs/development/AUTH-IMPLEMENTATION-SUMMARY.md` - Removed password references
- ✅ `docs/development/AUTH-TESTING-GUIDE.md` - Updated to passwordless
- ✅ `package.json` - Added `resend` package

---

## 🔧 Pre-Test Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Resend (for custom invitation emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

### 2. Resend Configuration

- Go to https://resend.com
- Create API key with "Sending access"
- Verify sender domain (or use sandbox for testing)

### 3. Start Development Server

```bash
npm run dev
```

---

## 🧪 Test Scenarios

### **Test Suite 1: Invitation Workflow**

#### **Test 1.1: Send Invitation Email ✉️**

**Objective:** Verify invitation emails are sent correctly

**Steps:**
1. Login as admin/owner
2. Navigate to `/team`
3. Click "Invite Member"
4. Enter email: `test-user@example.com`
5. Select role: `ADMIN`
6. Click "Send Invitation"

**Expected Results:**
- ✅ Success message appears
- ✅ Email received within 5 seconds
- ✅ Email contains:
  - Organization name
  - Role (ADMIN)
  - Clickable invitation link
  - Invitation code/token
  - Expiry notice (7 days)
- ✅ Sender: `onboarding@yourdomain.com`

**Files Tested:**
- `app/actions/team.ts` → `inviteUser()`
- `lib/email.ts` → `sendInvitationEmail()`

**Status:** [ ]

---

#### **Test 1.2: Accept Invitation via Email Link (Magic Link) 🔗**

**Objective:** Verify invitation can be accepted by clicking email link and logging in with magic link

**Steps:**
1. Open invitation email from Test 1.1
2. Click invitation link
3. Verify redirect to `/auth/login?token=...`
4. Verify invitation info displayed:
   - "You've been invited!"
   - Organization name
   - Role
5. Verify email is pre-filled
6. Click "Continue with email"
7. Check email for magic link
8. Click magic link in email

**Expected Results:**
- ✅ Redirect to `/welcome?from=invitation`
- ✅ Welcome screen displays:
  - "You have successfully joined!"
  - Organization name
  - Stats (key types, total keys, active loans)
  - 5-second countdown timer
  - "Get Started" button
  - Progress bar
- ✅ After 5 seconds, auto-redirect to `/active-loans`
- ✅ User is member of organization
- ✅ Invitation marked as `accepted: true`

**Files Tested:**
- `components/root/login-form.tsx` → Token validation, UI
- `app/actions/auth.ts` → `sendOtpCode()` with token
- `app/auth/callback/route.ts` → Token extraction, `acceptInvitation()`
- `app/actions/team.ts` → `acceptInvitation()`
- `app/welcome/page.tsx` + `content.tsx` → Welcome screen

**Status:** [ ]

---

#### **Test 1.3: Accept Invitation via Email Link (OTP Code) 🔢**

**Objective:** Verify invitation can be accepted using 6-digit OTP code instead of magic link

**Steps:**
1. Open invitation email
2. Click invitation link → `/auth/login?token=...`
3. Verify invitation info displayed
4. Click "Continue with email"
5. Check email for 6-digit code
6. Enter code on waiting screen (don't click magic link)
7. Verify auto-submit on 6th digit

**Expected Results:**
- ✅ Redirect to `/welcome?from=invitation`
- ✅ Welcome screen displays correctly
- ✅ Auto-redirect to `/active-loans` after 5 seconds
- ✅ User is member of organization

**Files Tested:**
- `components/root/login-form.tsx` → OTP entry
- `app/actions/auth.ts` → `verifyOtpCode()`
- `app/auth/callback/route.ts` → Invitation acceptance
- `app/welcome/page.tsx` + `content.tsx`

**Status:** [ ]

---

#### **Test 1.4: Accept Invitation via Google OAuth 🔐**

**Objective:** Verify invitation can be accepted using Google OAuth

**Steps:**
1. Open invitation email for `user@gmail.com`
2. Click invitation link → `/auth/login?token=...`
3. Verify invitation info displayed
4. Click "Sign in with Google" (instead of email)
5. Complete Google OAuth flow

**Expected Results:**
- ✅ Redirect to `/welcome?from=invitation`
- ✅ Welcome screen displays correctly
- ✅ Auto-redirect to `/active-loans`
- ✅ User is member of organization
- ✅ Invitation marked as accepted

**Files Tested:**
- `components/root/login-form.tsx` → Passes token to OAuth
- `app/actions/auth.ts` → `signInWithOAuth()` with token
- `app/auth/callback/route.ts` → OAuth callback with token
- `app/welcome/page.tsx` + `content.tsx`

**Status:** [ ]

---

#### **Test 1.5: Accept Invitation via Manual Code Entry 📝**

**Objective:** Verify invitation can be accepted by manually entering code at /no-organization

**Steps:**
1. Logout (if logged in)
2. Create new account and login (no organization)
3. Verify redirect to `/no-organization`
4. Click "Join with Invitation Code"
5. Copy invitation token from email
6. Paste token into dialog
7. Click "Join Organization"

**Expected Results:**
- ✅ Dialog opens with input field
- ✅ After submission, redirect to `/welcome?from=invitation`
- ✅ Welcome screen displays correctly
- ✅ Auto-redirect to `/active-loans`
- ✅ User is member of organization

**Files Tested:**
- `app/no-organization/content.tsx` → Dialog, validation
- `app/actions/team.ts` → `validateInvitationToken()`, `acceptInvitation()`
- `app/welcome/page.tsx` + `content.tsx`

**Status:** [ ]

---

#### **Test 1.6: Invalid Invitation Token ❌**

**Objective:** Verify error handling for invalid tokens

**Steps:**
1. Go to `/auth/login?token=invalid-token-123`
2. Try to login

**Expected Results:**
- ✅ Error message: "Invalid invitation link."

**Alternative: Manual Code Entry**
1. Go to `/no-organization`
2. Click "Join with Invitation Code"
3. Enter `invalid-token-123`
4. Click "Join Organization"

**Expected Results:**
- ✅ Error message: "Invalid invitation link."

**Files Tested:**
- `app/actions/team.ts` → `validateInvitationToken()`

**Status:** [ ]

---

#### **Test 1.7: Expired Invitation ⏰**

**Objective:** Verify error handling for expired invitations

**Steps:**
1. Create invitation
2. Manually update DB: `UPDATE "Invitation" SET "expiresAt" = NOW() - INTERVAL '1 day'`
3. Try to accept invitation

**Expected Results:**
- ✅ Error message: "This invitation has expired."

**Files Tested:**
- `app/actions/team.ts` → `validateInvitationToken()`, `acceptInvitation()`

**Status:** [ ]

---

#### **Test 1.8: Wrong Email for Invitation 📧**

**Objective:** Verify invitation can only be accepted by invited email

**Steps:**
1. Send invitation to `user1@example.com`
2. Login as `user2@example.com`
3. Try to accept invitation (via manual code or after authenticating with different email)

**Expected Results:**
- ✅ Error message: "This invitation was sent to a different email address."

**Files Tested:**
- `app/actions/team.ts` → `acceptInvitation()` email verification

**Status:** [ ]

---

#### **Test 1.9: Double Invitation Acceptance 🔒**

**Objective:** Verify invitation can only be accepted once (atomic consumption)

**Steps:**
1. Accept invitation successfully (Test 1.2)
2. Get invitation token again
3. Try to accept same invitation in new incognito window

**Expected Results:**
- ✅ Error message: "This invitation has already been used."

**Files Tested:**
- `app/actions/team.ts` → `acceptInvitation()` with `updateMany` where `accepted: false`

**Status:** [ ]

---

### **Test Suite 2: Welcome Screen**

#### **Test 2.1: Welcome After Organization Creation 🎉**

**Objective:** Verify welcome screen appears after creating new organization

**Steps:**
1. Go to `/create-organization`
2. Enter organization name: "Test Housing Coop"
3. Click "Create Organization"

**Expected Results:**
- ✅ Redirect to `/welcome?from=create`
- ✅ Welcome message: "Your organization has been created!"
- ✅ Organization name: "Test Housing Coop"
- ✅ Stats displayed:
  - Key Types: 0
  - Total Keys: 0
  - Active Loans: 0
- ✅ 5-second countdown timer
- ✅ Progress bar animates
- ✅ Button text: "Set Up Keys" (since no keys exist)
- ✅ Timer text: "Setting up your keys in Xs..."
- ✅ After 5 seconds, auto-redirect to `/onboarding/keys` (not /active-loans)

**Files Tested:**
- `app/create-organization/page.tsx` → Form submission
- `app/actions/organisation.ts` → `createOrganisation()` redirect
- `app/welcome/page.tsx` → Stats fetching
- `app/welcome/content.tsx` → Timer, UI

**Status:** [ ]

---

#### **Test 2.1b: Duplicate Organization Name Prevention 🚫**

**Objective:** Verify duplicate organization names are rejected

**Steps:**
1. Create organization "Test Org"
2. Wait for welcome screen, complete onboarding
3. Logout or use another browser
4. Try to create organization "Test Org" again (exact same name)
5. Try "test org" (different casing)

**Expected Results:**
- ✅ Error message: "An organisation with this name already exists."
- ✅ Form stays on `/create-organization` (no redirect)
- ✅ Error displayed in red box above button
- ✅ User can edit name and retry
- ✅ Case-insensitive check (both "Test Org" and "test org" are treated as duplicate)

**Files Tested:**
- `app/actions/organisation.ts` → `createOrganisation()` with `findFirst` case-insensitive check
- `app/create-organization/page.tsx` → Error display

**Status:** [ ]

---

#### **Test 2.2: Welcome After Invitation Acceptance 👋**

**Objective:** Verify welcome screen appears after accepting invitation

**Steps:**
1. Accept invitation (Test 1.2, 1.3, or 1.4)
2. Observe welcome screen

**Expected Results:**
- ✅ Redirect to `/welcome?from=invitation`
- ✅ Welcome message: "You have successfully joined!"
- ✅ Organization name displayed
- ✅ Stats displayed (actual counts from existing org)
- ✅ 5-second countdown timer
- ✅ Auto-redirect to `/active-loans`

**Files Tested:**
- `app/auth/callback/route.ts` or `app/no-organization/content.tsx` → Redirect
- `app/welcome/page.tsx` + `content.tsx`

**Status:** [ ]

---

#### **Test 2.3: Skip Welcome Screen ⏩**

**Objective:** Verify user can skip countdown by clicking button

**Steps:**
1. Trigger welcome screen (create org or accept invitation)
2. Click "Get Started" button immediately (before 5 seconds)

**Expected Results:**
- ✅ Immediate redirect to `/active-loans` (no waiting)

**Files Tested:**
- `app/welcome/content.tsx` → Button click handler, `router.push()`

**Status:** [ ]

---

#### **Test 2.4: Welcome Screen Stats Accuracy 📊**

**Objective:** Verify stats displayed are accurate

**Steps:**
1. Create organization with existing data:
   - Create 3 key types
   - Add 10 keys total
   - Create 2 active loans
2. Manually navigate to `/welcome?from=create`

**Expected Results:**
- ✅ Key Types: 3
- ✅ Total Keys: 10
- ✅ Active Loans: 2

**Files Tested:**
- `app/welcome/page.tsx` → Prisma queries

**Status:** [ ]

---

#### **Test 2.5: Welcome Screen Mobile Responsiveness 📱**

**Objective:** Verify welcome screen works on mobile devices

**Steps:**
1. Trigger welcome screen
2. Open DevTools, switch to mobile viewport (375px width)

**Expected Results:**
- ✅ Layout stacks vertically
- ✅ Stats cards display in single column on small screens
- ✅ Text remains readable
- ✅ Button is full-width on mobile
- ✅ Progress bar visible

**Files Tested:**
- `app/welcome/content.tsx` → Responsive design (Tailwind classes)

**Status:** [ ]

---

### **Test Suite 3: Edge Cases & Error Handling**

#### **Test 3.1: Browser Back Button Protection 🔙**

**Objective:** Verify users with organizations can't access `/create-organization` via back button

**Steps:**
1. Create organization "Test Org"
2. Wait for welcome screen
3. Complete onboarding (or skip)
4. Arrive at `/active-loans`
5. Click browser back button multiple times
6. Try to reach `/create-organization`

**Expected Results:**
- ✅ Automatic redirect to `/active-loans`
- ✅ Cannot access `/create-organization` page
- ✅ No hydration errors
- ✅ No duplicate organization creation possible

**Files Tested:**
- `app/create-organization/page.tsx` → Server-side auth and membership check

**Status:** [ ]

---

#### **Test 3.2: No Organization After Welcome ⚠️**

**Objective:** Verify error handling if organization is deleted during welcome screen

**Steps:**
1. Trigger welcome screen
2. In another tab, delete the organization (as owner)
3. Wait for auto-redirect or click "Get Started"

**Expected Results:**
- ✅ Redirect to `/no-organization` or error page
- ✅ No crash or infinite loop

**Files Tested:**
- `app/welcome/page.tsx` → `getCurrentUser()`, redirect logic

**Status:** [ ]

---

#### **Test 3.2: Direct Welcome URL Access 🔗**

**Objective:** Verify welcome screen can be accessed directly (not just via redirects)

**Steps:**
1. Login as user with organization
2. Manually navigate to `/welcome` or `/welcome?from=create`

**Expected Results:**
- ✅ Welcome screen loads
- ✅ Stats are accurate
- ✅ Timer starts, auto-redirects work

**Files Tested:**
- `app/welcome/page.tsx` + `content.tsx`

**Status:** [ ]

---

#### **Test 3.3: Rate Limiting During Invitation Flow 🚦**

**Objective:** Verify rate limits don't break invitation acceptance

**Steps:**
1. Get invitation link
2. Click link → login page
3. Request OTP code 5+ times rapidly
4. Verify rate limit error
5. Wait 60 seconds
6. Request code again and complete login

**Expected Results:**
- ✅ Rate limit error: "Too many attempts. Please wait a moment and try again."
- ✅ After cooldown, code sent successfully
- ✅ Invitation still accepted correctly
- ✅ Redirect to welcome screen works

**Files Tested:**
- `components/root/login-form.tsx` → Cooldown timer
- `app/actions/auth.ts` → Rate limiting (Supabase)

**Status:** [ ]

---

### **Test Suite 4: Email Delivery**

#### **Test 4.1: Invitation Email Delivery ✉️**

**Objective:** Verify invitation emails arrive quickly and correctly

**Steps:**
1. Send invitation
2. Time how long until email arrives
3. Check Resend Dashboard → Logs

**Expected Results:**
- ✅ Email arrives within 5 seconds
- ✅ Not in spam folder
- ✅ Resend logs show "delivered" status
- ✅ Email HTML renders correctly
- ✅ Links are clickable

**Files Tested:**
- `lib/email.ts` → Resend API call

**Status:** [ ]

---

#### **Test 4.2: Multiple Invitations (Rate Limit) 📨**

**Objective:** Verify system handles multiple invitations

**Steps:**
1. Send 5 invitations to different emails rapidly
2. Check all emails arrive
3. Accept all invitations

**Expected Results:**
- ✅ All emails arrive
- ✅ All invitations can be accepted
- ✅ No errors in console
- ✅ No database conflicts

**Files Tested:**
- `lib/email.ts`
- `app/actions/team.ts`

**Status:** [ ]

---

### **Test Suite 5: Integration Tests**

#### **Test 5.1: Full User Journey (Create Org → Invite → Accept) 🔄**

**Objective:** Complete end-to-end test of entire workflow

**Steps:**
1. **User A:** Create organization "Test Coop"
2. Verify welcome screen appears
3. Wait for auto-redirect to `/active-loans`
4. **User A:** Invite User B as ADMIN
5. **User B:** Click invitation link in email
6. **User B:** Login with magic link
7. Verify welcome screen appears
8. **User B:** Click "Get Started" (skip timer)
9. **User B:** Verify at `/active-loans`
10. **User B:** Verify can access Team page

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Both users see same organization
- ✅ User B has ADMIN role

**Status:** [ ]

---

#### **Test 5.2: Multi-Organization User Workflow 🏢**

**Objective:** Verify invitation works for users already in another org

**Steps:**
1. **User A:** Member of Org 1
2. **User B (Owner of Org 2):** Invites User A
3. **User A:** Accepts invitation while logged in
4. Verify redirect to welcome screen
5. Verify User A now has access to both organizations
6. Verify active org switched to Org 2

**Expected Results:**
- ✅ User A can switch between both orgs
- ✅ Active org is Org 2 (newly joined)
- ✅ Data isolation maintained (can't see Org 1 keys in Org 2)

**Status:** [ ]

---

## ✅ Quick Test Checklist (5 Minutes)

**Fastest way to verify all features work:**

1. [ ] Create organization → verify welcome screen
2. [ ] Send invitation → check email received
3. [ ] Accept via email link → verify welcome screen
4. [ ] Accept via manual code → verify welcome screen
5. [ ] Try double-use → verify error
6. [ ] Skip welcome button → verify immediate redirect

---

## 🐛 Common Issues & Fixes

### Issue: Emails not arriving

**Possible causes:**
- Resend API key not set in `.env.local`
- Sender domain not verified
- Rate limit exceeded

**Fix:**
1. Check `.env.local` has `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
2. Verify domain in Resend Dashboard
3. Check Resend logs for errors

---

### Issue: Welcome screen not showing

**Possible causes:**
- Redirect not updated in code
- Missing query param `?from=...`

**Fix:**
1. Check redirect in `app/actions/organisation.ts` → `/welcome?from=create`
2. Check redirect in `app/auth/callback/route.ts` → `/welcome?from=invitation`

---

### Issue: Invitation already used (but wasn't)

**Possible causes:**
- Database not updated correctly
- Race condition in acceptance

**Fix:**
1. Check `Invitation` table: `accepted` should be `false` before acceptance
2. Verify `updateMany` query in `acceptInvitation()` uses `where: { accepted: false }`

---

## 📊 Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|---------|---------|-------|
| Invitation Workflow | 9 | | | |
| Welcome Screen | 6 | | | |
| Edge Cases | 4 | | | |
| Email Delivery | 2 | | | |
| Integration | 2 | | | |
| **TOTAL** | **23** | **0** | **0** | |

---

## 📝 Notes & Observations

**Date:** ___________

**Tester:** ___________

**Environment:**
- [ ] Local Development
- [ ] Staging
- [ ] Production

**Browser(s) Tested:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

**Additional Notes:**

```
[Add any observations, bugs found, or improvement suggestions here]
```

---

## ✅ Sign-Off

**Code Review:** [ ] Passed  
**Testing Complete:** [ ] Passed  
**Ready for Merge:** [ ] Yes / [ ] No

**Reviewer:** _________________  
**Date:** _________________
