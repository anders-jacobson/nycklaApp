# Nyckla — CLAUDE.md

Key management app for Swedish housing cooperatives (*bostadsrättsföreningar*). Multi-tenant, with per-entity PII encryption.

## Tech Stack

- **Next.js 15** App Router, TypeScript strict mode, React 19
- **Tailwind CSS v4** (CSS-first, `@theme` in `globals.css`)
- **shadcn/ui** — all UI primitives live in `components/ui/`
- **Tabler Icons** (`@tabler/icons-react`) — the only icon library
- **Prisma ORM** — all database access
- **Supabase** — Auth only (passwordless OTP + Google OAuth, no passwords)
- **CryptoJS AES-256** — PII encryption via `lib/entity-encryption.ts`
- **Resend** — invitation emails

## Architecture

### Multi-tenancy
- `Entity` is the tenant container (renamed from "Organization"). All data tables carry `entityId`.
- Users belong to entities via `UserOrganisation` (roles: `OWNER > ADMIN > MEMBER`).
- `User.activeOrganisationId` tracks the current entity context.
- Always scope queries to the active entity — never fetch cross-entity data.

### Route groups
- `(root)` = public/auth pages
- `(dashboard)` = protected app (active-loans, keys)
- `issue-key/` = standalone key issuing workflow
- `onboarding/`, `settings/`, `create-organization/` = standalone flows

### Server Actions
All mutations live in `app/actions/`. No API routes for business logic.

### Auth
- **Middleware** (`middleware.ts`) gates protected routes.
- **Supabase `auth.id` (UUID)** is the source of truth — never look up users by email.
- `getCurrentUser()` in `lib/auth-utils.ts` is the standard helper (React-cached, throws if unauthenticated or no org membership).
- Use `getCurrentUserOrNull()` for onboarding/pre-membership flows.

### Encryption
- Each `Entity` has its own AES key stored encrypted in `Entity.encryptionKey` (master key in env).
- All borrower PII (name, email, phone, address) is encrypted at rest via `lib/entity-encryption.ts`.
- **Encrypted fields cannot be queried in SQL.** Searching borrowers requires fetch-all + decrypt in memory.

## Conventions — Always Follow

### User/auth lookup
```ts
// lib/auth-utils.ts — always use this, never roll your own
import { getCurrentUser } from '@/lib/auth-utils';
const user = await getCurrentUser(); // { id, email, activeOrganisationId, ... }
// user.id is the Prisma User UUID; use user.activeOrganisationId to scope queries
```

### Entity scoping in queries
```ts
// Always filter by entityId
await prisma.keyType.findMany({
  where: { entityId: user.activeOrganisationId },
});
```

### Role checks
```ts
import { requireRole } from '@/lib/auth-utils';
await requireRole('ADMIN'); // throws if current user's role is below ADMIN
// Role hierarchy: OWNER > ADMIN > MEMBER
```

### Server action shape
```ts
'use server';
type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };
// Pattern: getCurrentUser() → validate → db operation (transaction if multi-step) → revalidatePath → return
```

### Encryption
```ts
import { encryptWithEntityKey, decryptWithEntityKey, getEntityKey } from '@/lib/entity-encryption';
const entityKey = await getEntityKey(entityId);
const encrypted = encryptWithEntityKey(plaintext, entityKey);
const plaintext = decryptWithEntityKey(encrypted, entityKey);
```

### Borrower pattern
```ts
// Polymorphic — use lib/borrower-utils.ts helpers, never access residentBorrower/externalBorrower directly
import { getBorrowerDetails, createBorrowerWithAffiliation } from '@/lib/borrower-utils';
const details = await getBorrowerDetails(borrower, entityId); // returns unified decrypted object
```

### UI
- **shadcn/ui components only** — no plain `<button>`, `<input>`, `<table>`, etc.
- **Tabler Icons only** — `import { IconPlus } from '@tabler/icons-react'`
- Icon size in buttons: `className="h-3.5 w-3.5"`

### Imports
```ts
import { cn } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server'; // server components & actions
import { createClient } from '@/lib/supabase/client'; // client components only
import { getCurrentUser } from '@/lib/auth-utils';
```

### Transactions
Use `prisma.$transaction()` for all multi-step writes. Pass `tx` into utility functions that need it (e.g. `createBorrowerWithAffiliation(..., tx)`).

## Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Full data model |
| `lib/auth-utils.ts` | `getCurrentUser`, role helpers |
| `lib/entity-encryption.ts` | Per-entity PII encryption |
| `lib/borrower-utils.ts` | Borrower create/find/decrypt helpers |
| `app/actions/` | All server actions |
| `components/ui/` | shadcn/ui primitives |
