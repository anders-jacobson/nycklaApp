# Feature workflow

Structured checklist for creating a feature, testing, and pushing to a branch. Follow in order; tick as you go.

## 1. Branch
- [ ] Create branch from latest `main`/`develop`: `git checkout -b feature/short-name`
- [ ] Confirm you're on the right base

## 2. Implement
- [ ] Follow project rules: Prisma only, `getCurrentUser()` + `entityId`/`activeOrganisationId` filtering, shadcn + Tabler + ResponsiveDialog, `ActionResult<T>` for actions
- [ ] Keep changes focused; one logical feature per branch
- [ ] No Supabase `.from()` for data; auth only. New docs go in `docs/` only

## 3. Test
- [ ] Run tests: `npm test` (or project test command)
- [ ] Manual smoke test of the feature (happy path + one edge case)
- [ ] Optional: run `/check-entity-isolation` on changed files

## 4. Commit & push
- [ ] Stage only relevant files: `git add <paths>`
- [ ] Commit with a clear message: e.g. `feat(scope): short description`
- [ ] Push branch: `git push -u origin feature/short-name`
- [ ] Open PR when ready; run `/code-review` on the diff if you want a pass

## Quick refs
- Rules: `.cursor/rules/cursor-rules.mdc` and `.cursor/rules/README.md`
- Entity check: use `/check-entity-isolation`
- Review: use `/code-review`
