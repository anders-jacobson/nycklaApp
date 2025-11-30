# Environment Variables Configuration

This document describes the required environment variables for the application.

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Project URL
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your-project-url

# Supabase Publishable Key (formerly called "anon key")
# Get from: https://app.supabase.com/project/_/settings/api
# ⚠️ IMPORTANT: Use PUBLISHABLE_KEY, not ANON_KEY (updated naming convention)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Application Configuration

```bash
# Site URL for OAuth redirects and absolute URLs
# Development: http://localhost:3000
# Production: https://your-domain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Configuration

```bash
# PostgreSQL connection string
# Get from: https://app.supabase.com/project/_/settings/database
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
```

### Encryption Configuration

```bash
# Master encryption key for entity-level PII encryption
# Generate a secure key with:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
MASTER_KEY=your-base64-encoded-master-key
```

## Migration from Legacy Variable Names

If you were previously using legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, you should:

1. Rename the environment variable to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. The value remains the same (it's the same key, just renamed for clarity)
3. Update this in all environments:
   - Local development (`.env.local`)
   - Staging environment
   - Production environment
   - CI/CD pipelines

## JWT Signing Keys

**Note:** We use Supabase's modern JWT signing keys system (ES256). The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is independent from JWT signing keys and does not need rotation when JWT keys are rotated.

### Key Independence

- **Publishable/Secret API Keys**: Used for API authentication (never rotate during JWT key rotation)
- **JWT Signing Keys**: Used for signing user session tokens (can be rotated independently)

Legacy `anon` and `service_role` keys (which were JWTs) are disabled in favor of the modern publishable/secret key system.

### JWT Signing Key Rotation

When JWT signing keys are rotated (for security or compliance):

- ✅ **No environment variable changes needed**
- ✅ **No code deployment required**
- ✅ **Users stay logged in (zero downtime)**
- ✅ **Automatic token refresh with new key**

**Documentation:**

- Migration plan: `jwt-signing-keys-migration.plan.md`
- Readiness report: `docs/development/JWT-SIGNING-KEYS-MIGRATION-READINESS.md`
- Security details: `docs/security/security-overview.md`

## Environment Variable Security

### Public Variables

These variables are prefixed with `NEXT_PUBLIC_` and are exposed to the browser:

- `NEXT_PUBLIC_SUPABASE_URL` - Safe to expose (public project URL)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Safe to expose (designed for client-side use)
- `NEXT_PUBLIC_SITE_URL` - Safe to expose (your own domain)

### Private Variables

These variables are NEVER exposed to the browser:

- `DATABASE_URL` - **Keep secret!** Direct database access
- `MASTER_KEY` - **Keep secret!** Used for encryption

## Setup Instructions

### Development Setup

1. Copy the example values below to a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
MASTER_KEY=your-generated-master-key-here
```

2. Generate a master key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

3. Get Supabase credentials from your project dashboard

### Production Deployment

Ensure all environment variables are set in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Railway**: Project → Variables
- **AWS/GCP/Azure**: Use respective secrets management services

## Verification

After setting up environment variables, verify they're loaded correctly:

```bash
# Check if variables are available (development only)
npm run dev

# In browser console (public variables only):
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
```

## Troubleshooting

### "Missing environment variable" errors

- Restart your development server after changing `.env.local`
- Ensure variable names are spelled correctly
- Check for typos in variable values

### OAuth redirect issues

- Verify `NEXT_PUBLIC_SITE_URL` matches your actual domain
- In Supabase dashboard, add redirect URLs to allowed list:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://your-domain.com/auth/callback`

### Database connection issues

- Verify `DATABASE_URL` format is correct
- Check network access in Supabase dashboard
- Ensure password doesn't contain special characters that need URL encoding

## References

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs#environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Auth SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
