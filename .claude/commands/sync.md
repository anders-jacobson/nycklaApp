---
description: Fetch and merge latest main into the current branch, install deps if package.json changed
---

Pull latest main, merge into the current branch, and install deps if package.json changed.

Current branch: $(git branch --show-current)

package.json diff vs origin/main:
$(git diff HEAD origin/main -- package.json --name-only)

## Instructions

1. Fetch latest main:
   ```
   git fetch origin main
   ```

2. Check if `package.json` differs between current HEAD and `origin/main`:
   - If the pre-computed diff above shows `package.json`, note that deps will need to be installed after the merge.

3. Merge:
   ```
   git merge origin/main
   ```

4. If the merge produced conflicts, stop and list each conflicted file. Ask the user how they want to resolve them before proceeding.

5. If `package.json` changed (from step 2), run:
   ```
   npm install
   ```
   (postinstall automatically runs `prisma generate`)

6. Report what happened: commits merged, whether deps were installed, any conflicts.
