---
description: Review local uncommitted changes against Nyckla conventions before committing
---

Review all current changes (staged + unstaged) against project conventions before committing.

Changed files:
$(git diff --name-only HEAD)

Full diff:
$(git diff HEAD)

## Instructions

Analyze the diff above and report findings grouped by severity. Check every item in the list below.

### Conventions checklist

**Auth & scoping**
- [ ] `getCurrentUser()` used for auth — never look up users by email
- [ ] Every query is scoped to `entityId` (= `user.activeOrganisationId`)
- [ ] `requireRole('ADMIN')` (or higher) called before any destructive action

**Data access**
- [ ] Only Prisma used for DB — no `supabase.from()` calls
- [ ] Multi-step writes use `prisma.$transaction()`
- [ ] Borrower PII accessed via `getBorrowerDetails()` / `createBorrowerWithAffiliation()` — never direct field access on residentBorrower/externalBorrower

**Encryption**
- [ ] Borrower PII (name, email, phone, address) encrypted via `encryptWithEntityKey` before write
- [ ] No attempt to SQL-filter on encrypted fields

**Server actions**
- [ ] Return shape is `{ success: true; data?: T } | { success: false; error: string }`
- [ ] `'use server'` directive present in action files

**UI**
- [ ] Only shadcn/ui components used — no plain `<button>`, `<input>`, `<table>`, etc.
- [ ] Only Tabler Icons (`@tabler/icons-react`) — no lucide-react or other icon libraries
- [ ] Icon size in buttons: `className="h-3.5 w-3.5"`

**General**
- [ ] No hardcoded entity IDs, user IDs, or secrets
- [ ] TypeScript strict — no `any`, no `!` non-null assertions on untrusted data

### Output format

Report findings in three sections. Omit a section if empty.

**Bugs** — will cause runtime errors or data corruption
**Convention violations** — breaks rules in CLAUDE.md
**Style suggestions** — optional improvements

If everything looks good, say so clearly.
