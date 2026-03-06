---
description: Commit staged changes with an AI-generated message, push, and open a pull request
---

Commit staged changes with an AI-generated message, push to the current branch, and open a pull request.

Current branch: $(git branch --show-current)

Staged files:
$(git diff --staged --stat)

Staged diff:
$(git diff --staged)

Recent commits (style reference):
$(git log --oneline -5)

## Instructions

1. If the staged diff is empty, stop and tell the user there is nothing staged to commit.

2. Generate a commit message based on the staged diff and the style of recent commits above.
   - Follow conventional commits format if the log shows it (e.g. `feat:`, `fix:`, `chore:`)
   - Be concise: one subject line (≤72 chars), optional blank line + body if needed
   - Focus on *why*, not *what*

3. Commit using:
   ```
   git commit -m "<generated message>"
   ```

4. Push to the current branch:
   ```
   git push -u origin $(git branch --show-current)
   ```

5. Create a PR with `gh pr create`. Use a HEREDOC for the body:
   ```
   gh pr create --title "<PR title>" --body "$(cat <<'EOF'
   ## Summary
   - <bullet points from diff>

   ## Test plan
   - [ ] Manual smoke test

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

6. Return the PR URL to the user.
