# Development Documentation

Technical implementation details and development guides for Nyckla.

## Documents

| Doc | What it covers |
|---|---|
| [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) | All required env vars with correct names and examples |
| [TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md) | Manual browser testing guide — run before merging to main |
| [ARCHITECTURE-DECISION-RECORD.md](./ARCHITECTURE-DECISION-RECORD.md) | Multi-tenant entity model ADRs |
| [UI-COMPONENTS.md](./UI-COMPONENTS.md) | shadcn/ui component patterns, ResponsiveDialog, icons |
| [MULTI-TENANT-USER-MODEL.md](./MULTI-TENANT-USER-MODEL.md) | Entity model, roles, data isolation |
| [ONBOARDING-GUIDE.md](./ONBOARDING-GUIDE.md) | Onboarding flow implementation |
| [PERFORMANCE-CACHING.md](./PERFORMANCE-CACHING.md) | React cache(), revalidatePath patterns |
| [HANDLING-UNSTABLE-CONNECTIONS.md](./HANDLING-UNSTABLE-CONNECTIONS.md) | DB connection error handling |
| [CREDENTIAL-ROTATION-GUIDE.md](./CREDENTIAL-ROTATION-GUIDE.md) | Rotating encryption keys and credentials |
| **Features** | |
| [features/key-management.md](./features/key-management.md) | Key types, copies, status management |
| [features/key-workflows.md](./features/key-workflows.md) | Issue and return workflows |
| [features/column-customization.md](./features/column-customization.md) | Table column visibility customization |
| [features/active-loans-improvements.md](./features/active-loans-improvements.md) | Overdue tracking, tooltips |

## Current Status

All core features implemented and passing CI:

- ✅ **Auth** — passwordless OTP + Google OAuth (Supabase), Turnstile CAPTCHA
- ✅ **Multi-tenancy** — Entity model, per-entity AES-256 encryption, data isolation
- ✅ **Keys** — Key type CRUD, copy management, status tracking (Available/Out/Lost)
- ✅ **Issue workflow** — 4-step wizard: select keys → borrower → lending details → confirm
- ✅ **Active Loans** — Borrower table, return/lost/replace flows, overdue chart
- ✅ **Team** — Invite members (email via Resend), role management (OWNER/ADMIN/MEMBER), remove members
- ✅ **Settings** — Org rename, member list, invitation management, delete org
- ✅ **Onboarding** — Guided first-run setup

## Tech Stack Quick Reference

| Concern | Tool |
|---|---|
| Framework | Next.js 15 App Router, TypeScript strict, React 19 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| UI primitives | shadcn/ui in `components/ui/` |
| Icons | Tabler Icons (`@tabler/icons-react`) only |
| ORM | Prisma |
| Auth | Supabase (passwordless OTP + Google OAuth) |
| Encryption | CryptoJS AES-256 via `lib/entity-encryption.ts` |
| Email | Resend |

## Key Conventions

See `CLAUDE.md` at the repo root — it's the single source of truth for conventions.

Quick links:
- Auth lookup: `lib/auth-utils.ts` → `getCurrentUser()`
- Entity scoping: always filter by `entityId`
- Role checks: `requireRole('ADMIN')` before destructive ops
- Server action shape: `ActionResult<T>` = `{ success: true; data? } | { success: false; error }`
- Pure client-safe borrower helpers: `lib/borrower-pure-utils.ts`
- Server-only borrower helpers (DB + encryption): `lib/borrower-utils.ts`

## Development Workflow

See `WORKFLOW.md` at repo root for the session checklist.

```
/sync → plan → implement → /verify → /commit-push-pr
```
