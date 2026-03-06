# Cursor Rules – Lean Structure

## Philosophy

Document only project-specific patterns. The model already knows Next.js, Prisma, React, Tailwind; use rules for your conventions, skills for on-demand procedures, and commands for slash workflows.

## Structure

### Always applied (1 file)

- **`cursor-rules.mdc`** – Master rules: references `@CLAUDE.md` as the single source of truth for all conventions. Adds only the Cursor-specific `ResponsiveDialog` note and slash command cheatsheet.

### Apply intelligently (3 files)

- **`file-organization.mdc`** – Documentation only in `docs/` subdirs; never in project root (except README.md).
- **`project-context.mdc`** – Swedish housing cooperative domain, GDPR. Globs: auth, dashboard, key, borrower.
- **`key-features.mdc`** – Dashboard, lending/return workflows, validation. Globs: dashboard, keys, borrower, loan, issue.

### Skills (agent-decided)

- **`.cursor/skills/supabase-auth-ssr/`** – Supabase Auth SSR: use `@supabase/ssr` with `getAll`/`setAll` only; never `auth-helpers-nextjs`. Loaded when working on auth, middleware, or cookie handling.

### Commands (slash)

- **`/feature-workflow`** – Structured checklist: branch → implement → test → push.
- **`/code-review`** – Code review checklist (functionality, quality, security, project conventions).
- **`/check-entity-isolation`** – Review for Prisma/entityId filtering and no Supabase `.from()`.

## Single Source of Truth

All conventions live in `CLAUDE.md`. Both Claude Code and Cursor read from it:
- Claude Code loads it automatically
- Cursor picks it up via `@CLAUDE.md` in the always-apply `cursor-rules.mdc`

**To update a convention: edit `CLAUDE.md` only.**

## References

- **Schema**: `prisma/schema.prisma`
- **UI**: `docs/development/UI-COMPONENTS.md`
- **Conventions**: `CLAUDE.md`

## For developers

1. Master rules apply to every TS/TSX session and pull in `@CLAUDE.md`.
2. Context rules and the auth skill load when relevant (file patterns or task).
3. Use `/code-review` or `/check-entity-isolation` in chat for those workflows.

**Auth/middleware work** → Supabase Auth SSR is in `.cursor/skills/supabase-auth-ssr/SKILL.md` (not in rules).

---

Last updated: March 2026. Philosophy: document decisions, not docs; keep rules lean; CLAUDE.md is the canonical source.
