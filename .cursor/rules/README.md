# Cursor Rules – Lean Structure

## Philosophy

Document only project-specific patterns. The model already knows Next.js, Prisma, React, Tailwind; use rules for your conventions, skills for on-demand procedures, and commands for slash workflows.

## Structure

### Always applied (1 file)

- **`cursor-rules.mdc`** – Master rules: Prisma-only data, getCurrentUser(), UI (shadcn + Tabler + ResponsiveDialog), ActionResult<T>, activeOrganisationId filtering, docs in docs/. References the supabase-auth-ssr skill for Auth SSR.

### Apply intelligently (4 files)

- **`patterns.mdc`** – Multi-tenant entity model, placeholder emails, Supabase+Prisma split, file layout. Globs: `**/actions/**`, `**/components/**`.
- **`file-organization.mdc`** – Documentation only in `docs/` subdirs; never in project root (except README.md).
- **`project-context.mdc`** – Swedish housing cooperative domain, GDPR. Globs: auth, dashboard, key, borrower.
- **`key-features.mdc`** – Dashboard, lending/return workflows, validation. Globs: dashboard, keys, borrower, loan, issue.

### Skills (agent-decided)

- **`.cursor/skills/supabase-auth-ssr/`** – Supabase Auth SSR: use `@supabase/ssr` with `getAll`/`setAll` only; never `auth-helpers-nextjs`. Loaded when working on auth, middleware, or cookie handling.

### Commands (slash)

- **`/feature-workflow`** – Structured checklist: branch → implement → test → push.
- **`/code-review`** – Code review checklist (functionality, quality, security, project conventions).
- **`/check-entity-isolation`** – Review for Prisma/entityId filtering and no Supabase `.from()`.

## References

- **Schema**: `prisma/schema.prisma`
- **UI**: `docs/development/UI-COMPONENTS.md`
- **Docs**: `docs/README.md`, `docs/DOCUMENTATION_GUIDE.md`

## For developers

1. Master rules apply to every TS/TSX session.
2. Context rules and the auth skill load when relevant (file patterns or task).
3. Use `/code-review` or `/check-entity-isolation` in chat for those workflows.

**Auth/middleware work** → Supabase Auth SSR is in `.cursor/skills/supabase-auth-ssr/SKILL.md` (not in rules).

---

Last updated: Feb 2026. Philosophy: document decisions, not docs; keep rules lean.
