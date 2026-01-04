# Auth & Prisma User ID Alignment Implementation

**Date:** 2026-01-02  
**Status:** ✅ Implemented

## Overview

Refactored authentication and user management to use Supabase `auth.users.id` as the canonical identity across the entire system, eliminating dual-ID issues and implementing production-hardened patterns.

## Changes Implemented

### 1. Schema Migration ✅

**File:** `prisma/schema.prisma`

```prisma
model User {
  id String @id @db.Uuid  // Removed @default - now set from Supabase
  // ... rest unchanged
}
```

**Migration:** `20260102134331_use_supabase_user_id`

### 2. Idempotent Registration ✅

**File:** `app/actions/registerUser.ts`

**Critical fixes:**
- Changed `user.create()` → `user.upsert()` (handles retries)
- Changed `userOrganisation.create()` → `userOrganisation.upsert()` (prevents P2002 errors)
- Atomic invitation consumption via `updateMany` with `where: { accepted: false }`
- Uses `authUserId` from Supabase for Prisma `User.id`

**Prevents:**
- Double-submit errors
- Race conditions in concurrent invitation accepts
- Duplicate membership creation

### 3. Smart Callback Upsert ✅

**File:** `app/auth/callback/route.ts`

**Key changes:**
- Always upserts user (even new users) with minimal record
- Authorization based on `UserOrganisation` membership count
- Fixes stale `activeOrganisationId` on login
- Deterministic org selection via `orderBy: { joinedAt: 'asc' }`

**Security:** User existence ≠ org access. Membership required.

### 4. ID-Based Lookups ✅

**File:** `lib/auth-utils.ts`

**Changes:**
- `getCurrentUser()` uses `where: { id: user.id }` instead of email
- Validates membership exists (authorization)
- Handles stale `activeOrganisationId` without DB mutation (callback fixes it)
- Deterministic org ordering everywhere

**Added helpers:**
- `hasMembership(userId)`
- `getFirstOrganisation(userId)`
- `hasAccessToOrg(userId, orgId)`

### 5. Profile Updates ✅

**File:** `app/actions/updateProfile.ts`

- Changed `where: { email }` → `where: { id: user.id }`

## Architecture Principles

### Authentication ≠ Authorization

```typescript
// ✅ CORRECT
const { user } = await supabase.auth.getUser(); // Authentication
const membership = await prisma.userOrganisation.findFirst({ 
  where: { userId: user.id } 
}); // Authorization
if (!membership) throw new Error('Access denied');
```

### activeOrganisationId is a Preference

```typescript
// ❌ WRONG: Trusting activeOrganisationId without validation
const data = await prisma.keyType.findMany({
  where: { entityId: user.activeOrganisationId }
});

// ✅ CORRECT: getCurrentUser() validates membership
const user = await getCurrentUser();
const data = await prisma.keyType.findMany({
  where: { entityId: user.entityId }
});
```

### Always Use Upsert for User Creation

```typescript
// ✅ Idempotent
const user = await prisma.user.upsert({
  where: { id: authUserId },
  create: { id: authUserId, email },
  update: { email }
});
```

## Data Flow

```
1. User signs up/logs in → Supabase Auth
2. Callback receives auth.users.id + email
3. Callback upserts User (id = auth.users.id)
4. Check UserOrganisation membership count
5. If 0 memberships → /auth/complete-profile
6. If has memberships → validate/fix activeOrganisationId → /active-loans
```

## Critical Fixes Applied

### 1. Idempotent Membership Creation
- Uses `upsert` with composite unique key
- Prevents P2002 errors on retry

### 2. Race-Safe Invitation Consumption
- Atomic `updateMany` with `where: { accepted: false }`
- Only one concurrent accept succeeds

### 3. Deterministic Org Selection
- `orderBy: { joinedAt: 'asc' }` everywhere
- Consistent "first org" across requests

### 4. No Mutation in Cached Functions
- `getCurrentUser()` doesn't update DB
- Callback fixes stale activeOrganisationId

### 5. Email Strategy
- Kept `String @unique` (safe for MVP)
- Synced on every login from Supabase

## Testing Checklist

### Happy Paths
- [x] Schema migration applied
- [x] Code updated and linted
- [ ] New user registration creates User with Supabase ID
- [ ] OAuth login upserts user with metadata
- [ ] User can create new organisation
- [ ] User can join via invitation
- [ ] getCurrentUser() works correctly
- [ ] Profile updates work

### Edge Cases
- [ ] Double-submit registration (should not error)
- [ ] Concurrent invitation accepts (only one succeeds)
- [ ] User removed from all orgs (redirects to complete-profile)
- [ ] Stale activeOrganisationId (auto-fixed on login)
- [ ] Email change in Supabase (syncs on next login)

## Next Steps

1. **Test registration flow** - Create new user and org
2. **Test invitation flow** - Invite user, accept invitation
3. **Test OAuth flow** - Sign in with Google
4. **Test edge cases** - Retry registration, concurrent accepts
5. **Update auth rules** - Document new patterns in `.cursor/rules/auth-rules.mdc`

## Rollback Plan

If issues arise:

```bash
# Revert migration
cd /Users/andogpp/Documents/dev/Chas/11-examensarbete/test-ai
npx prisma migrate resolve --rolled-back 20260102134331_use_supabase_user_id

# Revert code changes
git revert <commit-hash>
```

## References

- Plan: `.cursor/plans/align_prisma_user.id_with_supabase_auth_2d1c346c.plan.md`
- Schema: `prisma/schema.prisma`
- Migration: `prisma/migrations/20260102134331_use_supabase_user_id/`


