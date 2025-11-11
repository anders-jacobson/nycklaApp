# Cursor Rules - Ultra-Minimal Structure

## Philosophy: Trust Claude Sonnet 4, Document Only Project-Specific Patterns

**Claude Sonnet 4 already knows:**

- How to use Next.js 15, Prisma, React, Tailwind, etc.
- Current best practices and patterns
- Latest library APIs

**These rules document ONLY:**

- Your project's unique conventions
- Your specific architecture decisions
- Your custom patterns

## 📊 Structure (5 Files, ~300 Lines Total)

### Always Applied (2 files, 145 lines)

**1. `cursor-rules.mdc` (100 lines)** - Master rules

- 6 critical project-specific patterns
- Quick schema reference
- Standard imports for this project
- Validation checklist

**2. `file-organization.mdc` (45 lines)** - File structure enforcement

- Documentation must live in docs/
- Prevents misplaced files

### Context-Based (3 files, 155 lines)

**3. `patterns.mdc` (75 lines)** - Unique patterns only

- Multi-tenant entity model (unique to project)
- Placeholder email system (unique feature)
- Supabase+Prisma integration (your specific way)
- Applied to: `**/actions/**`, `**/components/**`

**4. `project-context.mdc` (60 lines)** - Business context

- Swedish housing cooperative domain
- GDPR compliance requirements
- Applied to: `**/auth/**`, `**/dashboard/**`, `**/key*`

**5. `key-features.mdc` (60 lines)** - Feature requirements

- Dashboard, lending, return workflows
- Applied to: `**/dashboard/**`, `**/keys/**`, `**/borrower*`

## 📉 Evolution

```
Version 1 (Initial):     9 files, ~1,500 lines
Version 2 (Consolidated): 6 files, ~450 lines (70% reduction)
Version 3 (No Context7):  5 files, ~300 lines (80% reduction)
```

### What Was Removed

❌ **Context7 files** - Redundant with Claude Sonnet 4

- Claude already has recent training data
- Cursor has `@web` for latest docs when needed
- Less complexity, same results

❌ **Generic code examples** - Claude knows these

- How to write React components
- How to use Prisma queries
- How to structure Next.js apps

✅ **Kept: Project-specific patterns only**

- Your getCurrentUserId() pattern
- Your entity-based multi-tenancy
- Your placeholder email system
- Your specific file organization

## 🎯 What Each File Does

### cursor-rules.mdc (Master)

**Problem it solves:** Enforces project-specific decisions

- Never use Supabase .from() (use Prisma)
- Always lookup users by email (not auth.id)
- Always filter by entityId (multi-tenant)
- Standard ActionResult<T> type

### patterns.mdc (Unique Patterns)

**Problem it solves:** Documents non-obvious integrations

- How Supabase auth + Prisma data work together in THIS project
- Entity-based multi-tenancy implementation
- Placeholder email generation logic
- File structure (where things live)

### project-context.mdc (Domain)

**Problem it solves:** Provides business context

- Swedish housing cooperative terminology
- GDPR compliance requirements
- Target users (seniors, non-tech-savvy)

### key-features.mdc (Requirements)

**Problem it solves:** Feature specifications

- What the dashboard should show
- How lending workflow works
- Validation rules

### file-organization.mdc (Structure)

**Problem it solves:** Keeps project organized

- No .md files in root
- All docs in docs/ structure

## ✅ Benefits

1. **80% smaller** than original
2. **Zero redundancy** with Claude's knowledge
3. **Only documents unique decisions**
4. **Fast to load and understand**
5. **No external dependencies** (no Context7)

## 🚫 What We Don't Document

- ❌ How to write React components (Claude knows)
- ❌ How to use Prisma (Claude knows)
- ❌ How to use Next.js App Router (Claude knows)
- ❌ Generic TypeScript patterns (Claude knows)

## ✅ What We Do Document

- ✅ Your auth-to-database lookup pattern
- ✅ Your entity-based multi-tenancy
- ✅ Your placeholder email system
- ✅ Your specific file organization
- ✅ Your business domain (housing cooperatives)

## 📚 For Developers

### Starting work:

1. Master rules apply automatically
2. Context rules load based on files you edit
3. Trust Claude for generic patterns
4. Use `@web` if you need latest docs

### Common scenarios:

**"How do I query the database?"**
→ Claude knows Prisma. Just follow the master rule: always filter by entityId

**"How do I create a server action?"**
→ Claude knows Next.js 15. Just use the ActionResult<T> pattern from master rules

**"How does auth work in this project?"**
→ Check `cursor-rules.mdc` for the getCurrentUserId() pattern (project-specific)

**"How does multi-tenancy work?"**
→ Check `patterns.mdc` for entity-based isolation (unique to project)

---

**Last Updated**: November 7, 2025  
**Philosophy**: Document decisions, not documentation. Trust Claude, customize your patterns.
