# Claude Code Workflow — Nyckla

> Based on [@bcherny's setup](https://howborisusesclaudecode.com) · Reset this checklist each session

**Boris's Golden Rule:**
> Plan mode → Refine plan → Auto-accept → Claude 1-shots it.
> *A good plan is really important to avoid issues down the line.*

---

## 01 · Start of Session

- [ ] **Navigate to project folder**
  ```bash
  cd ~/Documents/Firma/Projects/Nyckla/nycklaApp
  ```
  Always launch Claude Code from inside the project — never from your home folder

- [ ] **Sync with main before starting**
  ```
  /sync
  ```
  Pulls latest main, merges into your branch, auto-installs deps if package.json changed

- [ ] **Create a focused branch for ONE thing**
  ```bash
  git checkout -b feat/short-description
  ```
  Small branches = clean PRs = fewer conflicts. Describable in 4–5 words max

---

## 02 · Before Writing Any Code

- [ ] **Switch to Plan Mode**
  ```
  Shift+Tab twice → plan mode on
  ```
  Claude thinks and plans first — touches zero files until you approve

- [ ] **Describe what you want — iterate on the plan**
  Go back and forth until the plan is solid. Push back, ask questions, adjust scope.
  This is where you stay in control.

- [ ] **Switch to auto-accept when plan is approved**
  ```
  Shift+Tab → auto-accept edits on
  ```
  Let Claude execute the full plan without interruptions

---

## 03 · After Claude Finishes

- [ ] **Run code review against CLAUDE.md conventions**
  ```
  /audit
  ```
  Checks for bugs, convention violations, and CLAUDE.md issues before committing

- [ ] **Run code-simplifier subagent**
  ```
  /simplify
  ```
  Cleans up duplication and simplifies logic — without changing functionality

- [ ] **Verify the app builds and types check**
  ```
  /verify
  ```
  Runs lint → typecheck → build → tests in order. Stops on first failure with exact error and suggested fix

---

## 04 · Ship It

- [ ] **Commit, push and open PR**
  ```
  /commit-push-pr
  ```
  Auto-generates commit message, pushes branch, opens PR on GitHub

- [ ] **Update CLAUDE.md if Claude made a mistake**
  ```
  update CLAUDE.md so you don't repeat this
  ```
  Boris's team does this multiple times a week — this is how Claude gets smarter on your project over time

---

## Quick Reference

| What | How |
|------|-----|
| Plan mode | `Shift+Tab` twice |
| Auto-accept | `Shift+Tab` once |
| Stop Claude | `Ctrl+C` |
| Clear input | `Ctrl+U` |
| New Ghostty tab | `Cmd+T` |
| Open project in Cursor | `cursor .` |
| Commit + PR | `/commit-push-pr` |
| Sync with main | `/sync` |
| Review changes | `/audit` |
| Simplify code | `/simplify` |
| Verify before PR | `/verify` |
| New worktree | `git worktree add ~/…/worktrees/feat-x -b feat/x` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove ~/…/worktrees/feat-x` |

---

## Parallel Sessions (Worktrees)

Run multiple Claude sessions on different branches simultaneously — each worktree is a full independent checkout.

Only worth it when you genuinely have two independent things to work on. Don't force it.

**Daily habit when you do have parallel work**
```bash
# Tab 1 — already open, main feature
# (no change needed)

# Tab 2 — Cmd+T → new tab → cd into worktree → start Claude
cd ~/Documents/Firma/Projects/Nyckla/worktrees/feat-my-feature
claude
```

Ghostty tab titles automatically show the directory name so you always know which branch you're in.

**Create and launch a worktree**
```bash
# New branch
git worktree add ~/Documents/Firma/Projects/Nyckla/worktrees/feat-my-feature -b feat/my-feature

# Existing branch
git worktree add ~/Documents/Firma/Projects/Nyckla/worktrees/feat-my-feature feat/my-feature

# Then open it in a new Ghostty tab (Cmd+T) and start Claude
cd ~/Documents/Firma/Projects/Nyckla/worktrees/feat-my-feature
claude
```

**List all active worktrees**
```bash
git worktree list
```

**Remove a worktree when done**
```bash
git worktree remove ~/Documents/Firma/Projects/Nyckla/worktrees/feat-my-feature
```

**Prune stale worktree refs** (if you deleted the folder manually)
```bash
git worktree prune
```

---

## Still To Set Up

- [ ] GitHub Actions CI pipeline

---

*Tip: After every session ask Claude to update `CLAUDE.md` with anything new it learned about your project.*
