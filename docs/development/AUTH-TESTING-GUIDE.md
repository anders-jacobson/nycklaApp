# Passwordless Auth Testing Guide

This guide provides a comprehensive testing checklist for the passwordless authentication implementation with Supabase Auth, Resend (for magic links and invitation emails), Google OAuth, and Turnstile CAPTCHA.

## Prerequisites

Before testing, ensure:

1. ✅ Resend SMTP is configured in Supabase Dashboard
2. ✅ Google OAuth is enabled with valid credentials
3. ✅ Environment variables are set correctly
4. ✅ Root `proxy.ts` is in place (Next.js 16)
5. ✅ Development server is running (`npm run dev`)

## Test Scenarios

### 1. Magic Link Login Flow

**Test Case 1.1: Successful Magic Link Login**
- [ ] Navigate to `/auth/login`
- [ ] Enter valid email address
- [ ] Complete CAPTCHA (or use test mode)
- [ ] Click "Continue with email"
- [ ] Verify success message appears
- [ ] Check email inbox for confirmation email (from Resend)
- [ ] Verify email contains confirmation link
- [ ] Click confirmation link in email
- [ ] Verify redirect to confirmation success page or dashboard
- [ ] Try logging in with credentials
- [ ] Verify successful login and redirect to `/active-loans`

**Test Case 1.2: Email Already Exists**
- [ ] Try registering with an existing email
- [ ] Verify error message: "A user with this email already exists."

**Test Case 1.3: Weak Password**
- [ ] Try registering with password < 8 characters
- [ ] Verify error message: "Password must be at least 8 characters."

**Test Case 1.4: Organization Name Conflict**
- [ ] Try registering with an organization name that already exists
- [ ] Verify error message about organization name being taken

### 2. Email/Password Login Flow

**Test Case 2.1: Successful Login**
- [ ] Navigate to `/auth/login`
- [ ] Enter valid email and password
- [ ] Click "Log In"
- [ ] Verify redirect to `/active-loans`
- [ ] Verify user is authenticated (check nav bar)

**Test Case 2.2: Unconfirmed Email**
- [ ] Register a new user but don't click confirmation link
- [ ] Try logging in with unconfirmed account
- [ ] Verify error: "Please confirm your email before logging in."

**Test Case 2.3: Invalid Credentials**
- [ ] Try logging in with wrong password
- [ ] Verify error message displayed
- [ ] Try logging in with non-existent email
- [ ] Verify error message displayed

**Test Case 2.4: Logout**
- [ ] While logged in, click logout button
- [ ] Verify redirect to `/auth/login`
- [ ] Try accessing protected route (e.g., `/active-loans`)
- [ ] Verify redirect back to login

### 3. Google OAuth Flow

**Test Case 3.1: New User OAuth Registration**
- [ ] Navigate to `/auth/login` or `/auth/register`
- [ ] Click "Sign in with Google" button
- [ ] Verify redirect to Google consent screen
- [ ] Select/login with Google account
- [ ] Verify redirect back to app via `/auth/callback`
- [ ] If new user, verify redirect to `/auth/complete-profile`
- [ ] Complete profile with organization name
- [ ] Verify redirect to `/active-loans`

**Test Case 3.2: Existing User OAuth Login**
- [ ] Logout if logged in
- [ ] Click "Sign in with Google"
- [ ] Login with Google account that's already registered
- [ ] Verify direct redirect to `/active-loans` (skip profile completion)
- [ ] Verify user is authenticated

**Test Case 3.3: OAuth Error Handling**
- [ ] Start Google OAuth flow
- [ ] Cancel on Google consent screen
- [ ] Verify graceful error handling (no crash)
- [ ] Verify redirect back to login with error message

### 4. Password Reset Flow

**Test Case 4.1: Successful Password Reset**
- [ ] Navigate to `/auth/login`
- [ ] Click "Forgot password?" link
- [ ] Verify redirect to `/auth/forgot-password`
- [ ] Enter valid email address
- [ ] Click "Send Reset Link"
- [ ] Verify success message appears
- [ ] Check email inbox for password reset email (from Resend)
- [ ] Click reset link in email
- [ ] Verify redirect to `/auth/reset-password`
- [ ] Enter new password (min 8 characters)
- [ ] Confirm new password (must match)
- [ ] Click "Reset Password"
- [ ] Verify success message and auto-redirect to login
- [ ] Login with new password
- [ ] Verify successful login

**Test Case 4.2: Invalid Email**
- [ ] Go to `/auth/forgot-password`
- [ ] Enter non-existent email
- [ ] Submit form
- [ ] Verify appropriate error handling (Supabase sends email either way for security)

**Test Case 4.3: Password Mismatch**
- [ ] Request password reset and get to reset form
- [ ] Enter different passwords in both fields
- [ ] Submit form
- [ ] Verify error: "Passwords do not match"

**Test Case 4.4: Weak Password**
- [ ] In reset password form, enter password < 8 characters
- [ ] Submit form
- [ ] Verify error: "Password must be at least 8 characters"

**Test Case 4.5: Expired/Invalid Token**
- [ ] Use an old password reset link (> 1 hour old)
- [ ] Try to reset password
- [ ] Verify error message about expired link
- [ ] Verify redirect to appropriate page

### 5. Resend SMTP Email Delivery

**Test Case 5.1: Email Confirmation Template**
- [ ] Register new user
- [ ] Check inbox for confirmation email
- [ ] Verify sender name matches configuration
- [ ] Verify sender email (e.g., noreply@yourdomain.com)
- [ ] Verify email is not in spam folder
- [ ] Verify email template renders correctly
- [ ] Verify confirmation link works

**Test Case 5.2: Password Reset Email Template**
- [ ] Request password reset
- [ ] Check inbox for reset email
- [ ] Verify sender name and email
- [ ] Verify email is not in spam folder
- [ ] Verify email template renders correctly
- [ ] Verify reset link works

**Test Case 5.3: Email Delivery Time**
- [ ] Time how long it takes for emails to arrive
- [ ] Emails should arrive within 1-5 seconds
- [ ] If delayed, check Resend dashboard logs

### 6. Middleware & Session Management

**Test Case 6.1: Protected Routes**
- [ ] Logout if logged in
- [ ] Try accessing `/active-loans` directly
- [ ] Verify redirect to `/auth/login`
- [ ] Try accessing `/keys` directly
- [ ] Verify redirect to `/auth/login`
- [ ] Try accessing `/settings` directly
- [ ] Verify redirect to `/auth/login`

**Test Case 6.2: Public Routes (Unauthenticated)**
- [ ] While logged out, access `/auth/login`
- [ ] Verify page loads normally
- [ ] Access `/auth/register`
- [ ] Verify page loads normally
- [ ] Access `/auth/forgot-password`
- [ ] Verify page loads normally

**Test Case 6.3: Auth Routes (Authenticated)**
- [ ] Login successfully
- [ ] Try accessing `/auth/login` directly
- [ ] Verify redirect to `/active-loans`
- [ ] Try accessing `/auth/register`
- [ ] Verify redirect to `/active-loans`

**Test Case 6.4: Session Persistence**
- [ ] Login successfully
- [ ] Refresh the page
- [ ] Verify still logged in
- [ ] Close browser tab
- [ ] Reopen and navigate to app
- [ ] Verify still logged in (if session not expired)

**Test Case 6.5: Token Refresh**
- [ ] Login and stay on the page for 1+ hour
- [ ] Verify automatic token refresh (no logout)
- [ ] Interact with the app (make a request)
- [ ] Verify no authentication errors

### 7. Edge Cases & Error Handling

**Test Case 7.1: Network Errors**
- [ ] Disconnect internet
- [ ] Try logging in
- [ ] Verify graceful error handling
- [ ] Reconnect internet
- [ ] Retry operation
- [ ] Verify success

**Test Case 7.2: Concurrent Sessions**
- [ ] Login on Browser A
- [ ] Login with same account on Browser B
- [ ] Verify both sessions work
- [ ] Logout on Browser A
- [ ] Verify Browser B still works

**Test Case 7.3: Callback Error Handling**
- [ ] Access `/auth/callback` without code parameter
- [ ] Verify redirect to login with error message
- [ ] Access `/auth/callback` with invalid code
- [ ] Verify error handling

## Manual Configuration Verification

### Supabase Dashboard Checks

1. **Authentication Settings**
   - [ ] Email Auth is enabled
   - [ ] Email confirmation is enabled
   - [ ] Google OAuth provider is configured
   - [ ] Redirect URLs are allowlisted

2. **SMTP Configuration**
   - [ ] SMTP host: `smtp.resend.com`
   - [ ] SMTP port: `465` or `587`
   - [ ] SMTP username: `resend`
   - [ ] SMTP password: [Your Resend API key]
   - [ ] Sender email is verified in Resend
   - [ ] Sender name is set

3. **Email Templates**
   - [ ] Confirmation email template is customized
   - [ ] Password reset email template is customized
   - [ ] Magic link template (if used) is customized

### Resend Dashboard Checks

1. **Domain Verification**
   - [ ] Domain is verified (green checkmark)
   - [ ] DNS records are properly configured

2. **API Key**
   - [ ] API key has "Sending access" permission
   - [ ] API key is not expired

3. **Email Logs**
   - [ ] Check recent emails sent
   - [ ] Verify delivery status (delivered, not bounced)
   - [ ] Check for any errors in logs

### Google Cloud Console Checks

1. **OAuth Consent Screen**
   - [ ] App name is set
   - [ ] User support email is set
   - [ ] Developer contact email is set

2. **Credentials**
   - [ ] OAuth 2.0 Client ID exists
   - [ ] Authorized JavaScript origins include your domain
   - [ ] Authorized redirect URIs include Supabase callback URL
   - [ ] Client ID and Secret match Supabase configuration

## Environment Variables Validation

```bash
# Run in terminal to verify environment variables are loaded
npm run dev

# In your code, add temporary log (remove after testing):
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
```

Required variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `DATABASE_URL`
- [ ] `MASTER_KEY`

## Performance Testing

**Test Case: Email Delivery Speed**
- [ ] Register 3 users in quick succession
- [ ] Verify all confirmation emails arrive within 10 seconds
- [ ] Check Resend logs for delivery times

**Test Case: Auth Flow Performance**
- [ ] Time full registration flow (< 3 seconds)
- [ ] Time login flow (< 2 seconds)
- [ ] Time OAuth flow (< 5 seconds including Google)

## Success Criteria

All tests pass if:
- ✅ Users can register and receive confirmation emails
- ✅ Confirmed users can login successfully
- ✅ Google OAuth works for new and existing users
- ✅ Password reset emails are delivered and links work
- ✅ Middleware protects routes correctly
- ✅ Sessions persist across page refreshes
- ✅ Tokens refresh automatically
- ✅ Error messages are user-friendly
- ✅ No console errors during auth flows
- ✅ Emails arrive in inbox (not spam) within 5 seconds

## Troubleshooting Common Issues

### Emails Not Arriving

1. Check Resend dashboard for errors
2. Verify domain is properly configured
3. Check spam folder
4. Verify SMTP credentials in Supabase
5. Test with Resend's test email feature

### OAuth Not Working

1. Verify redirect URLs match exactly
2. Check Google Cloud Console credentials
3. Verify Client ID/Secret in Supabase
4. Check browser console for errors
5. Verify `NEXT_PUBLIC_SITE_URL` is correct

### Middleware Issues

1. Verify `proxy.ts` exists at project root (Next.js 16 uses proxy, not middleware)
2. Check proxy matcher configuration
3. Verify no syntax errors in proxy
4. Check browser devtools Network tab for redirect loops
5. Verify session cookies are being set

### Session/Token Issues

1. Clear browser cookies and try again
2. Check Supabase dashboard for auth users
3. Verify JWT secret is properly configured
4. Check for cookie setting errors in console
5. Verify `getAll`/`setAll` cookie pattern is used (not deprecated methods)

## Reporting Issues

When reporting issues, include:
- [ ] Browser and version
- [ ] Error messages (console and UI)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Screenshots if applicable
- [ ] Network tab HAR export for auth flows


