Run the full verification suite in order. Stop on first failure.

## Steps

Run each command in sequence. If any command fails, stop immediately and report the failure — do not continue to the next step.

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run test:workflows`

## On failure

Show:
- Which step failed
- The exact error output
- File path and line number (if available)
- A suggested fix (1–2 lines, concrete)

## On full success

Output exactly:
✅ Verify passed — ready to commit
