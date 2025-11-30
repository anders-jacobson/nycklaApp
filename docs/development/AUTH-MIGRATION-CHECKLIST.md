# Supabase Auth Standards Migration - Testing Checklist

This document outlines the changes made to align with the latest Supabase Auth SSR standards and provides a comprehensive testing checklist.

## Changes Implemented

### 1. ✅ Environment Variable Naming (COMPLETED)

**Changed:** Using modern `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (replaces legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**Files Updated:**
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`

**Action Required:**
- Update your `.env.local` file
- Update staging environment variables
- Update production environment variables
- Update CI/CD pipeline secrets

**Reference:** See `docs/development/ENVIRONMENT-VARIABLES.md` for full setup guide

---

### 2. ✅ Refactored Login Form (COMPLETED)

**Changed:** Removed client-side Supabase authentication, now uses server actions exclusively

**Files Updated:**
- `components/root/login-form.tsx` - Removed module-level Supabase client, now calls server actions

**Benefits:**
- Better security (no credentials in client JS)
- Consistent session cookie handling
- Proper middleware integration
- Single source of truth for auth logic

---

### 3. ✅ Fixed Register Page OAuth (COMPLETED)

**Changed:** Added missing Google OAuth handler for registration page

**Files Updated:**
- `app/auth/register/page.tsx` - Added `handleGoogleSignUp` function using server action

---

### 4. ✅ Middleware Security Hardening (COMPLETED)

**Changed:** Restricted public API paths from broad `/api` to specific routes

**Files Updated:**
- `middleware.ts` - Now only `/auth` and `/api/check-user-exists` are public

**Security Impact:**
- All other API routes now require authentication
- Prevents unauthorized access to internal API endpoints
- Test endpoints (`/api/prisma-test`, `/api/supabase-test`) now require auth

---

### 5. ✅ Session Refresh Error Handling (COMPLETED)

**Changed:** Added error handling for session refresh failures

**Files Updated:**
- `lib/supabase/middleware.ts` - Now logs and handles auth errors gracefully

**Benefits:**
- Better debugging of auth issues
- Prevents users from getting stuck in auth loops
- Clearer error messages in logs

---

### 6. ✅ JWT Signing Keys Migration (COMPLETED)

**Changed:** Migrated from legacy JWT secret to modern JWT signing keys (ES256)

**Date Completed:** November 28, 2025

**Benefits:**
- Improved JWT validation performance (local validation, no Auth server call)
- Better security (private key not extractable)
- Zero-downtime key rotation capability
- Better alignment with SOC2/compliance frameworks

**Key Details:**
- Algorithm: ES256 (P-256 Elliptic Curve)
- Legacy JWT secret: Revoked on [TBD - after wait period]
- Legacy anon/service_role keys: Disabled (using publishable key)

**No Code Changes Required:** Our implementation already used `supabase.auth.getUser()` exclusively

**Migration Documentation:**
- Pre-migration readiness: `docs/development/JWT-SIGNING-KEYS-MIGRATION-READINESS.md`
- Full migration plan: `jwt-signing-keys-migration.plan.md`

---

## Testing Checklist

### Pre-Testing Setup

- [ ] Update `.env.local` with new environment variable names
- [ ] Restart development server (`npm run dev`)
- [ ] Verify environment variables are loaded (check browser console for public vars)

### 1. Email/Password Registration Flow

- [ ] Navigate to `/auth/register`
- [ ] Fill in email, password, and organization name
- [ ] Click "Register" button
- [ ] Verify success message appears
- [ ] Check email for confirmation link
- [ ] Click confirmation link in email
- [ ] Verify redirect to `/auth/confirmed` page
- [ ] Click "Go to Login" button
- [ ] Login with registered credentials
- [ ] Verify successful login and redirect to `/active-loans`

### 2. Email/Password Login Flow

- [ ] Navigate to `/auth/login`
- [ ] Enter valid email and password
- [ ] Click "Log In" button
- [ ] Verify redirect to `/active-loans` (or last accessed page)
- [ ] Verify user is authenticated
- [ ] Check that navigation shows user's organization

### 3. Google OAuth Login Flow

- [ ] Navigate to `/auth/login`
- [ ] Click "Sign in with Google" button
- [ ] Verify redirect to Google OAuth consent screen
- [ ] Complete Google authentication
- [ ] Verify redirect back to app via `/auth/callback`
- [ ] If new user, verify redirect to `/auth/complete-profile`
- [ ] If existing user, verify redirect to `/active-loans`
- [ ] Verify user is authenticated
- [ ] Verify session persists on page reload

### 4. Google OAuth Registration Flow

- [ ] Navigate to `/auth/register`
- [ ] Click "Sign up with Google" button
- [ ] Complete Google authentication
- [ ] Verify redirect to `/auth/complete-profile` (if needed)
- [ ] Complete profile with organization name
- [ ] Verify redirect to dashboard
- [ ] Verify new organization is created
- [ ] Verify user is assigned as OWNER

### 5. Middleware Authentication Tests

- [ ] While logged out, try accessing `/active-loans`
- [ ] Verify redirect to `/auth/login`
- [ ] While logged out, try accessing `/keys`
- [ ] Verify redirect to `/auth/login`
- [ ] While logged out, access `/` (root)
- [ ] Verify public access allowed
- [ ] While logged in, access `/active-loans`
- [ ] Verify access granted
- [ ] While logged in, access protected API routes
- [ ] Verify access granted (check browser network tab)

### 6. Session Refresh Tests

**Short Session Test:**
- [ ] Login successfully
- [ ] Wait 5 minutes
- [ ] Navigate to different page
- [ ] Verify session is still active (no redirect to login)
- [ ] Verify no errors in browser console

**Long Session Test:**
- [ ] Login successfully
- [ ] Leave browser tab open for 1 hour (minimize, don't close)
- [ ] Return to tab and navigate to different page
- [ ] Verify session refreshed automatically
- [ ] Check browser console for any errors
- [ ] Verify no "Session refresh failed" logs

**Session Expiry Test:**
- [ ] Login successfully
- [ ] In Supabase dashboard, manually expire the user's session
- [ ] Try navigating to protected page
- [ ] Verify graceful handling (redirect to login)
- [ ] Verify error logged but app doesn't crash

### 7. Multi-Organization Flow

- [ ] Login as user with multiple organizations
- [ ] Verify team switcher shows all organizations
- [ ] Switch to different organization
- [ ] Verify `activeOrganisationId` updates
- [ ] Verify session persists through organization switch
- [ ] Navigate to different pages
- [ ] Verify correct organization data is displayed
- [ ] Refresh page
- [ ] Verify selected organization persists

### 8. Logout Flow

- [ ] While logged in, click logout
- [ ] Verify redirect to `/auth/login`
- [ ] Try accessing protected page
- [ ] Verify redirect back to login (no cached session)
- [ ] Verify session cookies cleared (check browser dev tools)

### 9. Edge Cases

**Unconfirmed Email:**
- [ ] Register new account
- [ ] Try logging in before confirming email
- [ ] Verify error message: "Please confirm your email before logging in."

**Invalid Credentials:**
- [ ] Try logging in with wrong password
- [ ] Verify appropriate error message
- [ ] Try logging in with non-existent email
- [ ] Verify appropriate error message

**Duplicate Registration:**
- [ ] Try registering with existing email
- [ ] Verify error: "A user with this email already exists."

**Invalid Invitation:**
- [ ] Try accessing registration with expired invite token
- [ ] Verify error message about expired invitation

### 10. API Route Security

**Authenticated API Routes (should require auth):**
- [ ] While logged out, try POST to `/api/borrowers/search`
- [ ] Verify 401/403 or redirect to login
- [ ] While logged out, try accessing `/api/prisma-test`
- [ ] Verify auth required

**Public API Routes:**
- [ ] While logged out, POST to `/api/check-user-exists`
- [ ] Verify access granted (returns `{exists: boolean}`)

### 11. Browser Compatibility

Test the above flows in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browser (iOS Safari or Android Chrome)

### 12. Console and Network Checks

Throughout testing, verify:
- [ ] No console errors related to auth
- [ ] No network errors (except expected 401s for unauthed requests)
- [ ] Session cookies set correctly (check Application → Cookies)
- [ ] OAuth redirects use `NEXT_PUBLIC_SITE_URL`
- [ ] No "Session refresh failed" errors (unless intentionally testing expired sessions)

---

## Common Issues and Solutions

### Issue: OAuth Redirects Fail

**Solution:** 
1. Check `NEXT_PUBLIC_SITE_URL` is set correctly
2. In Supabase dashboard → Authentication → URL Configuration:
   - Add redirect URL: `http://localhost:3000/auth/callback` (dev)
   - Add redirect URL: `https://your-domain.com/auth/callback` (prod)

### Issue: "Missing environment variable" errors

**Solution:**
1. Verify `.env.local` has all required variables
2. Restart Next.js dev server
3. Check spelling of variable names

### Issue: Infinite redirect loop

**Solution:**
1. Clear browser cookies
2. Clear browser cache
3. Check middleware logic (shouldn't redirect public paths)
4. Verify session cookies are being set correctly

### Issue: Session doesn't persist

**Solution:**
1. Check middleware is returning `supabaseResponse` correctly
2. Verify cookies are being set with correct options
3. Check browser isn't blocking cookies

---

## Success Criteria

All tests should pass before deploying to production:

- ✅ Email registration and login work correctly
- ✅ Google OAuth registration and login work correctly
- ✅ Middleware correctly protects routes
- ✅ Session refresh happens automatically
- ✅ Multi-organization switching works without session issues
- ✅ Error handling is graceful (no crashes)
- ✅ All auth flows work across different browsers
- ✅ API routes are properly secured
- ✅ No console errors during normal auth flows

---

## Post-Deployment Verification

After deploying to production:

- [ ] Test full registration flow in production
- [ ] Test full login flow in production
- [ ] Test OAuth flow in production (verify redirect URLs)
- [ ] Monitor error logs for auth-related issues
- [ ] Verify environment variables are set correctly in production

---

## Rollback Plan

If critical issues are found in production:

1. **Revert environment variables:**
   - Modern keys are recommended, but legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` can still work if needed
   - Both keys work simultaneously during migration

2. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Monitor for resolution:**
   - Check error logs
   - Verify auth flows work
   - Deploy hotfix if needed

---

## Additional Resources

- [Supabase Auth SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Environment Variables Guide](./ENVIRONMENT-VARIABLES.md)
- [Project Security Overview](../security/security-overview.md)
- [Auth Rules](.cursor/rules/auth-rules.mdc)

