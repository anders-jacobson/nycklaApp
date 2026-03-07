# Environment Variables

All variables live in `.env` (not `.env.local`). Never commit secrets.

## Required — Always

### Supabase

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Modern publishable key (replaces legacy anon key)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# Secret key for server-side admin operations (replaces service_role JWT)
SUPABASE_SECRET_KEY=sb_secret_xxx

# Optional legacy service role JWT (only needed for older scripts)
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database

```bash
# Pooled connection (used by Prisma at runtime)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Direct connection (used by Prisma migrate)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### Encryption

```bash
# AES-256 master key for envelope encryption of per-entity PII keys
# Generate: openssl rand -base64 32
ENCRYPTION_KEY=your-32-byte-base64-key
```

> **Note:** This was previously called `MASTER_KEY` in older docs. The correct name is `ENCRYPTION_KEY`.

### Email (Resend)

```bash
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=no-reply@mail.yourdomain.com
```

### Application URL

```bash
# Used to build invitation links — must match actual host
# Development:
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Production:
# NEXT_PUBLIC_SITE_URL=https://app.yourdomain.com
```

### Cloudflare Turnstile CAPTCHA

```bash
# Development test key (always passes):
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
# Production: get from https://dash.cloudflare.com/ → Turnstile
```

**Turnstile test keys:**
- Site key (client): `1x00000000000000000000AA`
- Secret key (for Supabase dashboard): `1x0000000000000000000000000000000AA`
- Docs: https://developers.cloudflare.com/turnstile/reference/testing/

## Required — Seed / Dev Scripts Only

```bash
# Used by prisma/seed.ts to create a test user in Supabase Auth
SEED_TEST_EMAIL=test@example.com
SEED_TEST_PASSWORD=testpassword123
```

## Minimal `.env` for Local Development

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ENCRYPTION_KEY=your-base64-key
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=no-reply@mail.yourdomain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

## Variable Security

| Variable | Browser-visible | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Safe — public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Safe — designed for client use |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Safe — your own domain |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ Yes | Safe — public CAPTCHA key |
| `DATABASE_URL` | ❌ No | Keep secret — direct DB access |
| `DIRECT_URL` | ❌ No | Keep secret — migration DB access |
| `ENCRYPTION_KEY` | ❌ No | Keep secret — master encryption key |
| `RESEND_API_KEY` | ❌ No | Keep secret — email sending |
| `SUPABASE_SECRET_KEY` | ❌ No | Keep secret — admin auth operations |

## Supabase Auth — OAuth Redirect URLs

In Supabase dashboard → Authentication → URL Configuration, add:
- `http://localhost:3000/auth/callback` (development)
- `https://app.yourdomain.com/auth/callback` (production)

## Troubleshooting

- **"NEXT_PUBLIC_SITE_URL is not configured"** → Add `NEXT_PUBLIC_SITE_URL` to `.env` and restart dev server
- **"ENCRYPTION_KEY missing"** → Generate with `openssl rand -base64 32` and add to `.env`
- **Invitation emails not sending** → Check `RESEND_API_KEY` and that `RESEND_FROM_EMAIL` is a verified sender
- **Variables not loading** → Restart dev server after any `.env` change
