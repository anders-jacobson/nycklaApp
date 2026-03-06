# Passwordless Auth Testing Guide

This guide provides a comprehensive testing checklist for the passwordless authentication implementation with Supabase Auth, Resend (for magic links and invitation emails), Google OAuth, and Turnstile CAPTCHA.

**⚠️ IMPORTANT**: This app uses ONLY passwordless authentication. There are NO password-related flows. See `docs/auth/PASSWORDLESS-AUTH-SETUP.md` for full setup guide.

## Prerequisites

Before testing, ensure:

1. ✅ Resend SMTP is configured in Supabase Dashboard (for auth emails)
2. ✅ Resend API key is set in `.env.local` (for invitation emails)
3. ✅ Turnstile CAPTCHA is configured (test keys work for dev)
4. ✅ Google OAuth is enabled (optional)
5. ✅ Development server is running (`npm run dev`)

## Test Scenarios

### 1. Magic Link Login Flow

**Test Case 1.1: Successful Magic Link Login**
- [ ] Navigate to `/auth/login`
- [ ] Enter valid email address
- [ ] Complete CAPTCHA (automatic in test mode)
- [ ] Click "Continue with email"
- [ ] Verify success message appears
- [ ] Check email inbox for magic link + OTP email
- [ ] Verify email contains:
  - [ ] Clickable magic link button
  - [ ] 6-digit OTP code
- [ ] Click magic link in email
- [ ] Verify redirect to application
- [ ] Verify session established
- [ ] If has organization → redirect to `/active-loans`
- [ ] If no organization → redirect to `/auth/complete-profile`

**Test Case 1.2: Rate Limiting**
- [ ] Try sending OTP code 5+ times rapidly
- [ ] Verify error: "Too many attempts. Please wait a moment and try again."
- [ ] Wait 60 seconds
- [ ] Verify can send code again

**Test Case 1.3: Magic Link on Different Device**
- [ ] Open `/auth/login` on Device A
- [ ] Request code
- [ ] Open email on Device B
- [ ] Click magic link → logs in on Device B only
- [ ] Check Device A → still on code entry (secure, no auto-login)

---

### 2. OTP Code Login Flow

**Test Case 2.1: Successful OTP Login**
- [ ] Navigate to `/auth/login`
- [ ] Enter email and request code
- [ ] Check email for 6-digit code
- [ ] Enter code on waiting screen
- [ ] Verify auto-submit on 6th digit
- [ ] Verify successful login and redirect

**Test Case 2.2: Invalid Code**
- [ ] Request OTP code
- [ ] Enter wrong 6-digit code (e.g., `000000`)
- [ ] Verify error: "Invalid code. Please check that you entered the correct digits."

**Test Case 2.3: Expired Code**
- [ ] Request OTP code
- [ ] Wait 10+ minutes
- [ ] Try to verify code
- [ ] Verify error: "Code has expired. Request a new code."

**Test Case 2.4: Gmail/Outlook Quick Access**
- [ ] On waiting screen, verify "Open Gmail" and "Open Outlook" buttons
- [ ] Click one → verify opens email provider in new tab

**Test Case 2.5: Resend Code**
- [ ] On waiting screen, click "Send new code"
- [ ] Verify cooldown timer (60s)
- [ ] Wait for cooldown
- [ ] Click again → verify new code sent

---

### 3. Google OAuth Flow

**Test Case 3.1: New User via Google**
- [ ] Navigate to `/auth/login`
- [ ] Click "Sign in with Google"
- [ ] Authorize with Google account (first time)
- [ ] Verify redirect to `/auth/complete-profile` (no org yet)
- [ ] Create or join organization
- [ ] Verify user record created with `user_metadata.full_name`

**Test Case 3.2: Existing User via Google**
- [ ] Login with Google using email that has organization
- [ ] Verify redirect to `/active-loans`
- [ ] Verify session established correctly

**Test Case 3.3: Cancel OAuth**
- [ ] Click "Sign in with Google"
- [ ] Cancel authorization on Google's page
- [ ] Verify redirect back to login (error handled gracefully)

---

### 4. Invitation Flow

**Test Case 4.1: Accept Invitation via Email Link**
- [ ] Admin sends invitation from Team page
- [ ] Check invited user's email
- [ ] Verify invitation email received (from Resend)
- [ ] Verify email shows:
  - [ ] Organization name
  - [ ] Role being invited to
  - [ ] Invitation link
- [ ] Click invitation link
- [ ] Verify redirect to `/auth/login?token=...`
- [ ] Verify invitation info displayed (org name, role)
- [ ] Verify email is pre-filled
- [ ] Complete login (magic link or OTP)
- [ ] Verify membership created
- [ ] Verify redirect to `/active-loans`

**Test Case 4.2: Accept Invitation via Manual Code Entry**
- [ ] As authenticated user with no org, go to `/no-organization`
- [ ] Click "Join with Invitation Code"
- [ ] Enter invitation token from email
- [ ] Click "Join Organization"
- [ ] Verify membership created
- [ ] Verify redirect to `/active-loans`

**Test Case 4.3: Invalid Invitation Code**
- [ ] Try entering invalid/made-up invitation code
- [ ] Verify error: "Invalid invitation link."

**Test Case 4.4: Expired Invitation**
- [ ] Use invitation token older than 7 days
- [ ] Try to accept
- [ ] Verify error: "This invitation has expired."

**Test Case 4.5: Wrong Email for Invitation**
- [ ] Get invitation for `user1@example.com`
- [ ] Login as `user2@example.com`
- [ ] Try to accept invitation
- [ ] Verify error: "This invitation was sent to a different email address."

**Test Case 4.6: Duplicate Invitation Acceptance**
- [ ] Accept invitation successfully
- [ ] Try to accept same invitation again (refresh callback or manual code)
- [ ] Verify error: "This invitation has already been used."

**Test Case 4.7: Invitation with Google OAuth**
- [ ] Get invitation link for `user@gmail.com`
- [ ] Click link → login page shows invitation
- [ ] Choose "Sign in with Google" instead of email
- [ ] Complete OAuth
- [ ] Verify invitation is auto-accepted
- [ ] Verify redirect to `/active-loans`

---

### 5. Email Delivery (Resend)

**Test Case 5.1: Auth Email (Magic Link + OTP)**
- [ ] Request login code
- [ ] Check inbox within 5 seconds
- [ ] Verify sender name and email (Supabase SMTP via Resend)
- [ ] Verify email contains:
  - [ ] Clickable magic link button
  - [ ] 6-digit OTP code
  - [ ] Not in spam folder
- [ ] Verify email branding

**Test Case 5.2: Invitation Email**
- [ ] Send invitation to new user
- [ ] Check inbox within 5 seconds
- [ ] Verify sender (from Resend direct API: `onboarding@yourdomain.com`)
- [ ] Verify email contains:
  - [ ] Organization name
  - [ ] Role
  - [ ] Clickable invitation link
  - [ ] Invitation token/code
  - [ ] Expiry notice (7 days)
- [ ] Verify email branding/styling

**Test Case 5.3: Resend Dashboard Logs**
- [ ] Go to Resend Dashboard → Logs
- [ ] Verify auth emails sent (via SMTP)
- [ ] Verify invitation emails sent (via API)
- [ ] Check delivery status: "delivered" for all
- [ ] No bounces or errors

---

### 6. Middleware & Route Protection

**Test Case 6.1: Unauthenticated Access**
- [ ] Logout (if logged in)
- [ ] Try to access `/active-loans`
- [ ] Verify redirect to `/auth/login`
- [ ] Try to access `/settings`
- [ ] Verify redirect to `/auth/login`
- [ ] Try to access `/team`
- [ ] Verify redirect to `/auth/login`

**Test Case 6.2: Public Routes**
- [ ] Verify unauthenticated access to:
  - [ ] `/auth/login`
  - [ ] `/auth/callback`
- [ ] Verify pages load without redirect

**Test Case 6.3: No Organization Landing**
- [ ] Login as authenticated user with no org membership
- [ ] Verify redirect to `/no-organization`
- [ ] Verify page shows:
  - [ ] "Create Organization" button
  - [ ] "Join with Invitation Code" button
  - [ ] Sign Out button

**Test Case 6.4: Session Persistence**
- [ ] Login successfully
- [ ] Refresh page
- [ ] Verify still logged in (no redirect)
- [ ] Close tab and reopen app
- [ ] Verify session persists

**Test Case 6.5: Token Refresh**
- [ ] Login and note session expiry (check cookies/network)
- [ ] Wait for token to expire (or manually expire)
- [ ] Navigate to protected route
- [ ] Verify middleware refreshes token automatically
- [ ] Verify no logout/redirect

---

### 7. CAPTCHA & Security

**Test Case 7.1: CAPTCHA in Dev Mode**
- [ ] Using test keys, verify no visible CAPTCHA widget
- [ ] Request OTP code
- [ ] Verify success (automatic verification)

**Test Case 7.2: CAPTCHA in Prod Mode**
- [ ] Using real Turnstile keys, login from known IP
- [ ] Verify no CAPTCHA challenge (invisible mode)
- [ ] Verify code sent successfully

**Test Case 7.3: Suspicious Activity (Manual Test)**
- [ ] Simulate bot-like behavior (rapid requests from new IP)
- [ ] Verify Supabase blocks request server-side
- [ ] Verify error message displayed

---

### 8. Multi-Organization Support

**Test Case 8.1: User in Multiple Orgs**
- [ ] Login as user belonging to 2+ organizations
- [ ] Verify redirect to `/active-loans` with first org (by `joinedAt`)
- [ ] Use org switcher to change active org
- [ ] Verify `activeOrganisationId` updates

**Test Case 8.2: User Removed from Active Org**
- [ ] Admin removes user from their active organization
- [ ] User refreshes page
- [ ] Verify `activeOrganisationId` updates to another org (if any)
- [ ] If no orgs left → redirect to `/no-organization`

---

## Configuration Verification Checklist

Before running tests, verify:

### Supabase Dashboard

- [ ] Email provider enabled (passwordless OTP)
- [ ] "Confirm email" setting is OFF (immediate access)
- [ ] CAPTCHA protection enabled (Turnstile)
- [ ] Rate limits configured (4/hour per email, 6/hour per IP)
- [ ] SMTP configured (Resend: `smtp.resend.com:465`, username `resend`)
- [ ] Redirect URLs added (`http://localhost:3000/auth/callback`)

### Environment Variables

Verify `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://...
MASTER_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

### Resend Dashboard

- [ ] Domain verified (or using sandbox for testing)
- [ ] API key created with "Sending access"
- [ ] Sender email matches `RESEND_FROM_EMAIL`
- [ ] Check email logs for delivery status

---

## Test Summary

After completing all tests, verify:

- ✅ Users can login via magic link
- ✅ Users can login via 6-digit OTP code
- ✅ Google OAuth works for new and existing users
- ✅ Invitations can be sent and accepted (email link + manual code)
- ✅ Invitation tokens prevent double-use (atomic consumption)
- ✅ Rate limiting prevents spam (60s client + Supabase server limits)
- ✅ CAPTCHA protection active (invisible for legitimate users)
- ✅ Middleware protects routes correctly
- ✅ Sessions persist across page refreshes
- ✅ Token refresh works automatically
- ✅ Email delivery reliable (< 5s delivery time)
- ✅ Error messages are clear and helpful
- ✅ All flows are mobile-friendly
- ✅ No password storage or password-related flows exist

---

## Troubleshooting

### Emails Not Arriving

1. Check Resend Dashboard → Logs for delivery status
2. Verify SMTP configured correctly in Supabase
3. Check spam folder
4. Verify sender domain verified in Resend
5. Check Supabase logs: `Authentication → Logs`

### CAPTCHA Errors

1. Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env.local`
2. For dev: Use test key `1x00000000000000000000AA`
3. For prod: Get real keys from Cloudflare Dashboard
4. Verify secret key configured in Supabase Dashboard

### Rate Limit Issues

1. If hitting rate limits during testing, increase in Supabase:
   - Authentication → Rate Limits
   - Increase per-email and per-IP limits temporarily
2. Wait 60s for client-side cooldown
3. Clear browser cookies/storage to reset

### Session Issues

1. Verify middleware is running (check console logs)
2. Check cookies in browser DevTools → Application
3. Verify `DATABASE_URL` is correct
4. Check Supabase logs for auth errors

---

## Further Reading

- [PASSWORDLESS-AUTH-SETUP.md](../auth/PASSWORDLESS-AUTH-SETUP.md) - Complete setup guide
- [AUTH-PRISMA-ALIGNMENT.md](AUTH-PRISMA-ALIGNMENT.md) - User and org architecture
- [AUTH-IMPLEMENTATION-SUMMARY.md](AUTH-IMPLEMENTATION-SUMMARY.md) - Implementation overview
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/passwordless-login)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
