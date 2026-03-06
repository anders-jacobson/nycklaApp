# Check Entity Isolation

Review the open files and/or recent changes for multi-tenant data isolation and data-access rules.

## What to check

1. **Prisma queries** – Every query that returns org-scoped data must filter by `entityId` or `user.activeOrganisationId` (or equivalent). No queries that fetch by `id` alone when the resource belongs to an organisation.

2. **Server actions** – Actions that read or write org data must:
   - Use `getCurrentUser()` (or `getCurrentUserId()` where appropriate)
   - Use `user.activeOrganisationId` (or the resolved entity id) in `where` clauses for Prisma

3. **Supabase** – No `supabase.from('...')` for application data. Supabase is for auth only; data access goes through Prisma.

4. **Routes/API** – Any route or API that returns entity-scoped data must enforce org context and filter by it.

## Output

- List each file (or diff) you reviewed.
- For each violation: file, line/section, and a one-line fix (e.g. "Add `where: { entityId: user.activeOrganisationId }`").
- If nothing violates, say so clearly.
