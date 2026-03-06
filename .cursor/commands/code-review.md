# Code Review Checklist

Review the code in scope (open files, recent changes, or specified diff) against this checklist.

## Functionality
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs or logic errors

## Code quality
- [ ] Readable and well-structured
- [ ] Functions are focused; names are descriptive
- [ ] No unnecessary duplication
- [ ] Follows project conventions

## Project conventions (this repo)
- [ ] Prisma for data (no Supabase `.from()`)
- [ ] Server actions use `getCurrentUser()` and filter by `activeOrganisationId` / `entityId`
- [ ] UI uses shadcn/ui + Tabler Icons; user dialogs use ResponsiveDialog
- [ ] ActionResult<T> for server action return type
- [ ] Multi-step DB ops in `prisma.$transaction`

## Security
- [ ] No hardcoded secrets
- [ ] Input validation where needed
- [ ] Data isolated by organisation (entityId) where required

Summarise findings and suggest concrete fixes for any issues.
