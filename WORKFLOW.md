# Claude Code Workflow — Nyckla

> Based on [@bcherny's setup](https://howborisusesclaudecode.com) · Reset this checklist each session

**Boris's Golden Rule:**
> Plan mode → Refine plan → Auto-accept → Claude 1-shots it.
> *A good plan is really important to avoid issues down the line.*

---

## 01 · Start of Session

- [ ] **Navigate to project folder**
  ```bash
  cd ~/dev/nycklaApp
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
  /review
  ```
  Checks for bugs, convention violations, and CLAUDE.md issues before committing

- [ ] **Run code-simplifier subagent**
  ```
  run code-simplifier on my changes
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
| Review changes | `/review` |
| Verify before PR | `/verify` |

---

## Still To Set Up

- [ ] GitHub Actions CI pipeline
- [ ] Parallel Ghostty sessions (Boris's tip #1)
- [ ] Worktrees for running multiple Claude sessions simultaneously

---

*Tip: After every session ask Claude to update `CLAUDE.md` with anything new it learned about your project.*
