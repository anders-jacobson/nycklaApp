# Credential Rotation Guide

## Background: Why We're Rotating

The `.env.backup` and `.env.backup-before-test` files were tracked in git history, potentially exposing:
- Supabase API keys
- Database credentials
- Encryption keys

**Solution:** Rotate all credentials to invalidate any exposed values.

## Key Migration: Legacy → Modern

Supabase has introduced modern API keys that are easier to rotate and more secure.

### Key Comparison

| Old (Legacy) | New (Modern) | Purpose |
|--------------|--------------|---------|
| `SUPABASE_ANON_KEY` (JWT) | `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) | Client + Server auth |
| `SUPABASE_SERVICE_ROLE_KEY` (JWT) | `SUPABASE_SECRET_KEY` (`sb_secret_...`) | Admin operations only |

**Why migrate?**
- ✅ Independent rotation (no downtime)
- ✅ Shorter, simpler keys (not JWTs)
- ✅ Secret keys block browser use automatically
- ✅ Can have multiple secret keys per project
- ✅ Easy rollback if needed

📚 **Reference:** [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)

## Step-by-Step Rotation

### 1. Get New Supabase Keys

**Navigate to:** [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → **API Keys**

#### Publishable Key (Already Have ✅)
- Look for your existing `sb_publishable_...` key
- You're already using this in your code

#### Secret Key (Need to Create)
1. Scroll to **"Secret keys"** section
2. Click **"Create new secret key"**
3. Name it: `"Production Server Key"`
4. Copy the `sb_secret_...` value

### 2. Generate New Encryption Key

```bash
openssl rand -base64 32
```

Save this output - you'll need it for re-encryption.

### 3. Update Your .env File

**Current structure:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx  # ✅ Keep this
SUPABASE_SECRET_KEY=sb_secret_xxx                        # ✅ Already updated

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ENCRYPTION_KEY=old-key-here                               # ❌ Will replace after re-encryption
```

**Update to:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx  # Same as before
SUPABASE_SECRET_KEY=sb_secret_xxx                        # ✅ New secret key

DATABASE_URL="postgresql://..."                          # Same (or update if needed)
DIRECT_URL="postgresql://..."                            # Same (or update if needed)

# Temporarily add OLD key for re-encryption
OLD_ENCRYPTION_KEY=your-current-encryption-key-here
ENCRYPTION_KEY=your-new-encryption-key-from-step-2
```

### 4. Re-encrypt Existing Data

Your database has encrypted entity keys that need re-encryption with the new key.

```bash
npx tsx scripts/rotate-encryption-key.ts
```

**What it does:**
- Reads all entity encryption keys
- Decrypts with `OLD_ENCRYPTION_KEY`
- Re-encrypts with new `ENCRYPTION_KEY`
- Updates database

**Expected output:**
```
🔄 Starting encryption key rotation...

📊 Found 2 entities to re-encrypt

🔐 Processing: Test Organization (123...)
   ✅ Successfully re-encrypted

🔐 Processing: Demo Corp (456...)
   ✅ Successfully re-encrypted

📊 Summary:
   ✅ Success: 2
   ❌ Failed: 0

🎉 All encryption keys rotated successfully!

⚠️  IMPORTANT: Remove OLD_ENCRYPTION_KEY from .env now
```

### 5. Clean Up .env

**Remove the temporary line:**
```env
# Delete this line after successful re-encryption:
OLD_ENCRYPTION_KEY=xxx  # ❌ DELETE
```

**Final .env should be:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ENCRYPTION_KEY=your-new-encryption-key
```

### 6. Test Everything

```bash
# Test database connection
npx prisma db pull

# Test auth (start dev server)
npm run dev

# Try logging in at http://localhost:3000/auth/login
```

### 7. Deactivate Legacy Keys (Optional)

Once you've confirmed everything works:

**Supabase Dashboard** → Settings → **API Keys** → Legacy keys section:
- Click **"Deactivate"** next to the old `anon` and `service_role` keys
- This ensures old keys from git history are invalid

**Note:** You can re-activate them if needed.

### 8. Update Team & Deployment

- Share new credentials securely with team members
- Update production environment variables:
  - Vercel/Netlify: Dashboard → Settings → Environment Variables
  - Docker: Update `.env.production` or secrets
  - CI/CD: Update GitHub Secrets / GitLab Variables

## Verification Checklist

- [ ] New `SUPABASE_SECRET_KEY` created in Supabase Dashboard
- [ ] New `ENCRYPTION_KEY` generated
- [ ] `.env` updated with new credentials
- [ ] Re-encryption script ran successfully
- [ ] `OLD_ENCRYPTION_KEY` removed from `.env`
- [ ] Can connect to database (`npx prisma db pull`)
- [ ] Can log in to application
- [ ] Legacy Supabase keys deactivated in dashboard
- [ ] Production environment updated
- [ ] Team notified of new credentials

## Troubleshooting

### Re-encryption fails
```
❌ Failed to decrypt entity: invalid tag
```
**Solution:** Your `OLD_ENCRYPTION_KEY` is incorrect. Find the actual current key.

### Can't log in after rotation
**Check:**
1. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is correct
2. Browser cache cleared
3. Check browser console for errors

### Prisma can't connect
**Check:** `DATABASE_URL` format:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Security Best Practices Going Forward

1. **Never commit `.env` files** (except `.env.example`)
2. **Use `.env.*` naming** for backups (all ignored by git)
3. **Rotate credentials if:**
   - Team member leaves
   - Suspected exposure
   - Regular schedule (quarterly recommended)
4. **Use different keys for:**
   - Development (local)
   - Staging (separate project)
   - Production (separate project)

## References

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Why Legacy Keys Are Deprecated](https://supabase.com/docs/guides/api/api-keys#why-are-anon-and-servicerole-jwt-based-keys-no-longer-recommended)
- [Supabase Auth SSR Guide](https://supabase.com/docs/guides/auth/server-side)

