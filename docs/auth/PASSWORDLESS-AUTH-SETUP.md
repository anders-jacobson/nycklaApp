# Passwordless Authentication Setup

## Overview

This app uses **passwordless authentication** with Supabase Auth:

- **Primary method**: Email OTP (magic link + 6-digit code)
- **Secondary method**: Google OAuth
- **Security**: Cloudflare Turnstile CAPTCHA (server-side, automatic)

---

## Supabase Dashboard Configuration

### 1. Enable Email OTP Provider

Navigate to:

```
Authentication → Sign In / Providers → Email
```

Settings:

- ✅ **Enable Email provider**
- ⚠️ **Confirm email**: Toggle based on your needs
  - OFF = Passwordless (user logs in immediately)
  - ON = Requires email confirmation before first login

---

### 2. Enable CAPTCHA Protection (Turnstile)

Navigate to:

```
Authentication → Attack Protection
```

Steps:

1. Toggle **"Enable Captcha protection"** to ON
2. Choose **"Turnstile"** from the dropdown
3. Paste your **Turnstile Secret Key** (see below)
4. Click **"Save changes"**

#### Getting Turnstile Keys

**For Local Development (Recommended):**

Use Cloudflare's **test secret key** that always passes:

```
1x0000000000000000000000000000000AA
```

1. Go to Supabase Dashboard → Authentication → Bot and Abuse Protection (or Attack Protection)
2. Paste the test key above into **"Captcha secret"** field
3. Save changes
4. Test freely on localhost! ✅

**For Production:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up/login (free account)
3. Navigate to **Turnstile** in sidebar
4. Click **"Add site"**
5. Configure:
   - **Domain**: Your production domain (e.g., `yourdomain.com`)
   - **Widget Mode**: **Managed** (recommended)
6. Click **"Create"**
7. Copy the **Secret Key** (the long private one)
8. Go to Supabase Dashboard → Authentication → Bot and Abuse Protection
9. **Replace the test key** with your real production secret key
10. Save changes

**Important**:

- You only need the **Secret Key** for Supabase (the Site Key is not used in server-side protection)
- Remember to swap test → production keys before deploying! 🚨

---

### 3. Configure Rate Limits (Recommended)

Navigate to:

```
Authentication → Rate Limits
```

Recommended settings:

- **Email sign-in**: 4 requests per hour per email
- **Per IP address**: 6 requests per hour
- **SMS OTP** (if used): 4 requests per hour

These prevent spam and abuse while being reasonable for legitimate users.

---

### 4. Configure Google OAuth (Optional)

Navigate to:

```
Authentication → Sign In / Providers → Google
```

Steps:

1. Enable Google provider
2. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
3. Paste **Client ID** and **Client Secret** into Supabase
4. Save changes

---

### 5. Configure Redirect URLs

Navigate to:

```
Authentication → URL Configuration
```

Add your site URLs:

- **Site URL**: `https://yourdomain.com` (production)
- **Redirect URLs**: Add:
  - `http://localhost:3000/auth/callback` (development)
  - `https://yourdomain.com/auth/callback` (production)

---

### 6. Customize Email Template

Navigate to:

```
Authentication → Email (under NOTIFICATIONS)
```

Template: **"Magic Link"** (this is the one used for OTP)

The default template includes:

- **Magic link button** ({{ .ConfirmationURL }})
- **6-digit OTP code** ({{ .Token }})

Both are included automatically! Users can either:

1. Click the magic link (easiest)
2. Copy/paste the 6-digit code

**No customization needed unless you want to change branding/styling.**

---

## Environment Variables

### Required for CAPTCHA

If CAPTCHA is enabled in Supabase Auth settings, add to your `.env.local`:

```bash
# Cloudflare Turnstile Site Key (public, safe to expose)
# Development (test key): 1x00000000000000000000AA
# Production: Get from https://dash.cloudflare.com/ → Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### Setup Steps

1. **Development** (use test keys):
   - Site Key (client): `1x00000000000000000000AA`
   - Secret Key (Supabase): `1x0000000000000000000000000000000AA`
2. **Production** (use real keys):
   - Get Site Key & Secret Key from Cloudflare Dashboard
   - Add Site Key to `.env.local` (client-side)
   - Add Secret Key to Supabase Dashboard (server-side)

---

## How It Works

### User Flow

1. **User enters email** → clicks "Continue with email"
2. **Supabase checks request** (automatic, server-side):
   - Is this IP suspicious?
   - Too many requests?
   - Bot-like behavior?
3. **If risky** → Request blocked/challenged automatically
4. **If safe** → Email sent with magic link + OTP code
5. **User verifies**:
   - **Option A**: Click magic link in email (mobile-friendly)
   - **Option B**: Enter 6-digit code (desktop-friendly)
6. **Logged in** → Redirected to dashboard

### No Visible CAPTCHA Widget

Unlike traditional CAPTCHA implementations, users **never see a CAPTCHA challenge** unless Supabase's algorithms detect suspicious activity. This means:

✅ **Legitimate users** → Seamless experience (no friction)  
⚠️ **Suspicious activity** → Automatically blocked (no email sent)  
🤖 **Bots** → Can't bypass server-side verification

---

## Testing

### Test 1: Normal Sign-In (Happy Path)

1. Go to `/auth/login`
2. Enter a valid email address
3. Click **"Continue with email"**
4. Check your email inbox
5. **Option A**: Click the magic link → should redirect to dashboard
6. **Option B**: Copy 6-digit code → paste into form → click "Verify code"

**Expected**: Login succeeds, redirects to `/active-loans` (dashboard)

---

### Test 2: Rate Limiting

1. Try sending OTP code 5+ times rapidly
2. Should see error: "Too many attempts. Please wait a moment and try again."
3. Wait 60 seconds (client-side cooldown)
4. Try again → should work

**Expected**: Rate limit prevents spam

---

### Test 3: Invalid OTP Code

1. Request OTP code
2. Enter wrong 6-digit code (e.g., `000000`)
3. Click "Verify code"

**Expected**: Error message: "Invalid code. Please check that you entered the correct digits."

---

### Test 4: Expired OTP Code

1. Request OTP code
2. Wait 10+ minutes
3. Try to verify code

**Expected**: Error message: "Code has expired. Request a new code."

---

### Test 5: Magic Link (Separate Session)

1. Open `/auth/login` on Device A (e.g., public computer)
2. Enter email, click "Continue with email"
3. Open email on Device B (e.g., your phone)
4. Click magic link → logs in on Device B only
5. Check Device A

**Expected**: Device A stays on code entry page (secure - no auto-login)

---

### Test 6: Google OAuth (if configured)

1. Go to `/auth/login`
2. Click **"Sign in with Google"**
3. Complete Google sign-in flow
4. Should redirect back to dashboard

**Expected**: OAuth login succeeds

---

### Test 7: Gmail/Outlook Quick Access Buttons

1. Go to `/auth/login`
2. Enter email, click "Continue with email"
3. See "Open Gmail" and "Open Outlook" buttons
4. Click one → should open email provider in new tab

**Expected**: Quick access buttons work

---

## Architecture

### Files Structure

```
app/
├── actions/
│   └── auth.ts                 # Server actions (sendOtpCode, verifyOtpCode, signInWithOAuth)
├── auth/
│   ├── callback/
│   │   └── route.ts            # OAuth & magic link callback handler
│   ├── confirmed/
│   │   └── page.tsx            # Success page (rarely used, auto-redirects)
│   └── login/
│       └── page.tsx            # Login page wrapper
components/
└── root/
    └── login-form.tsx          # Main login form component (2-step flow)
lib/
└── supabase/
    ├── client.ts               # Browser Supabase client
    └── server.ts               # Server Supabase client
```

### Authentication Flow (Code)

```typescript
// 1. User submits email
handleSendCode() → sendOtpCode(email)
  ↓
// 2. Supabase checks (server-side, automatic):
//    - Rate limits
//    - CAPTCHA verification (if suspicious)
//    - Sends email with magic link + OTP code
  ↓
// 3a. Magic link path
User clicks link → /auth/callback → createClient().auth.getSession()
  ↓
// 3b. OTP code path
User enters code → verifyOtpCode(email, token)
  ↓
// 4. Session established
Redirect to /active-loans (dashboard)
```

---

## Security Features

### 1. Server-Side CAPTCHA (Turnstile)

- Verifies requests server-side
- Invisible to legitimate users
- Can't be bypassed by client-side manipulation

### 2. Rate Limiting

- 4 requests per hour per email
- 6 requests per hour per IP
- 60-second client-side cooldown

### 3. Token Expiry

- Magic links expire after 1 hour (default)
- OTP codes expire after 10 minutes (default)

### 4. Auto-Create Users

- First-time email → automatically creates user account
- No separate registration flow needed

### 5. Session Management

- Secure HTTP-only cookies
- Automatic token refresh (middleware)

### 6. Public Computer Safety

- **No auto-detection of magic link clicks**
- Magic link → logs in ONLY where the link is clicked
- Original code entry page → stays on code entry (no auto-login)
- Prevents accidental login on public/shared computers
- User has explicit control over where they authenticate

---

## Troubleshooting

### Issue: "Security verification failed"

**Cause**: CAPTCHA protection blocked the request  
**Solution**: Wait a moment and try again. If persists, check Supabase logs for suspicious activity.

### Issue: "Too many attempts"

**Cause**: Rate limit exceeded  
**Solution**: Wait 60 seconds and try again. Consider adjusting rate limits if affecting legitimate users.

### Issue: Magic link not working

**Cause**: Redirect URL not configured  
**Solution**: Add your site URL to Supabase → Authentication → URL Configuration

### Issue: Email not arriving

**Cause**: Email provider not configured OR rate limited  
**Solution**: Check Supabase → Authentication → Email settings. Verify SMTP is configured (uses Supabase's default if not).

### Issue: "Invalid code" on correct code

**Cause**: Code expired (>10 minutes old)  
**Solution**: Request new code

---

## Production Checklist

Before deploying to production:

- [ ] ✅ Enable CAPTCHA protection (Turnstile)
- [ ] ✅ Configure rate limits (4/hour per email)
- [ ] ✅ Set production redirect URLs
- [ ] ✅ Configure Google OAuth (if using)
- [ ] ✅ Customize email template (optional, for branding)
- [ ] ⚠️ Set **Confirm email** based on requirements
- [ ] ⚠️ Test all flows (magic link, OTP code, OAuth)
- [ ] ⚠️ Monitor Supabase logs for abuse patterns
- [ ] ⚠️ Set up custom SMTP (optional, for better deliverability)

---

## Further Reading

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Magic Links vs OTP](https://supabase.com/docs/guides/auth/auth-magic-link)
