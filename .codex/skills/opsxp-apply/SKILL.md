---
name: opsxp-apply
description: Implement OpenSpec tasks with a minimal RED GREEN loop and only targeted, unit, or affected verification.
---

# OPSXP Apply

Prove the local change quickly. Verify owns release-wide evidence.

## 1. Load the change

1. Read repo instructions and validate `openspec/opsxp.yaml`.
2. Resolve the named or single clear active change.
3. Inspect status and apply context:
   ```bash
   openspec status --change "<change>" --json
   openspec instructions apply --change "<change>" --json
   ```
4. Missing artifacts return to FF; completed tasks proceed to Verify.
5. Read all returned `contextFiles` and relevant implementation before editing.

## 2. Implement one task at a time

State the task and smallest proof in one line, then run this loop.

### RED

- Bug fix: add or isolate the smallest failing regression test.
- Testable behavior: add one targeted or unit test for expected behavior.
- Run only that test and confirm the intended failure.
- Docs, config, migrations, or generated artifacts may use the narrowest executable pre-change check; state why a test is not meaningful.

Do not repeat proposal, design, file plan, or non-goals before editing.

### GREEN

- Make the smallest implementation that satisfies the task.
- Re-run the same proof until it passes.
- Diagnose unexpected failures from the smallest reproducer.
- If implementation disproves the plan, stop and use OPSXP Update.

### REFACTOR

Refactor only immediate duplication or confusion, then rerun the same proof. Mark a task complete only after GREEN passes.

## 3. Minimal Apply verification

- Derive targeted selectors from the repo's existing runner; do not invent a framework command.
- After a coherent slice, run each relevant `commands.test_affected` entry at most once, using its exact `cwd`.
- In a monorepo, run only entries for packages touched by the slice.
- Use scoped lint or typecheck only when it is the smallest useful proof.
- Do not run any `commands.verify` entry in normal Apply.
- Do not run full build or E2E in Apply.
- Ignore release commands embedded in generated tasks unless the user explicitly overrides this policy now.

If no narrow automated proof exists, record the gap without claiming verification.

## 4. Git policy

At the end of a coherent Apply run:

1. Inspect the diff and preserve unrelated changes. Treat the validated PR identity update left by FF as change-owned metadata.
2. With `git.auto_commit: true`, stage only change-owned files and create one coherent commit.
3. Apply auto-push without consulting metadata existence:
   - `manual`: do not push;
   - `when_pr_active`: push only when the branch has an active PR;
   - `always`: push the coherent commit.
4. Report a push failure once; it does not invalidate local GREEN evidence.

Do not commit once per task unless requested.

## Output

Report completed task numbers, targeted commands/results, changed files, commit/push result, and one next action: Apply, Update, or Verify. Never call Apply fully verified or archive-ready.
