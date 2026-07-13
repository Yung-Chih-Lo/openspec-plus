---
name: opsxp-apply
description: Implement tasks from an OpenSpec change using minimum proof loops, implementation task packets, and systematic debugging. Use when the user wants to start, continue, or work through implementation tasks.
license: MIT
compatibility: "Requires openspec CLI. Reads workflow config from openspec/opsxp.yaml."
user-invocable: true
metadata:
  author: openspec-plus
  version: "3.2"
---

Implement tasks from an OpenSpec change using the smallest proof loop that can safely validate each task.

**Input**: Optionally specify a change name. If omitted, infer from context. If ambiguous, prompt.

---

## Pre-flight

Read `openspec/opsxp.yaml`. Extract:
- `test_affected_command` from `commands.test_affected`
- `test_full_command` from `commands.test_full`, falling back to `commands.test` for older configs
- `lint_command` from `commands.lint`
- `typecheck_command` from `commands.typecheck`
- `stack` from `commands.stack`
- `apply_full_suite_policy` from `verification.apply_full_suite` (default: `never`)
- `git_auto_commit` from `git.auto_commit` (default: `true`)
- `git_auto_push` from `git.auto_push` (default: `when_pr_info_exists`)

If file missing → STOP and tell user to run `/opsxp-setup`.

If a command is `<not configured>`, skip steps that require it (don't error).

Command semantics:
- Bug fixes require a focused failing regression test before implementation.
- Testable behavior should use RED/GREEN with the smallest single-test invocation.
- UI-only, docs-only, config-only, generated, or infrastructure tasks use the narrowest concrete check available and must state why a RED test is not appropriate.
- `test_affected_command` is the preferred scoped regression command when configured.
- `test_full_command` is expensive release evidence owned by `/opsxp-verify`; do not run it in apply unless the user explicitly asks in the current message.

**Stack-specific test patterns** (use these to construct single-test invocations):

| Stack hint (from `commands.stack` / command value) | Single-test pattern |
|---|---|
| `pytest ...` | `pytest path/to/test.py::test_name -v` |
| `npm test` / `vitest` | `npx vitest run path/to/test.spec.ts -t "test name"` |
| `jest` | `npx jest path/to/test.spec.ts -t "test name"` |
| `npm run test:unit` | use the same — append file path |

---

## Minimum Proof Rule

```
NO POSITIVE CLAIM WITHOUT A FRESH CHECK
NO BUG FIX WITHOUT A FAILING REGRESSION TEST FIRST
NO FULL SUITE IN APPLY UNLESS THE USER EXPLICITLY ASKS FOR IT
```

For feature work, prefer RED/GREEN when the behavior is testable. When a RED test is not the right proof, record the reason and run the smallest relevant check before and after the change.

---

## Steps

### 1. Select the change

If a name is provided, use it. Otherwise:
- Infer from conversation context
- Auto-select if exactly one active change
- If ambiguous: `openspec list --json`, then ask through the current runtime's input mechanism.

Announce: "Using change: <name>"

### 2. Check status

```bash
openspec status --change "<name>" --json
```

### 3. Get apply instructions

```bash
openspec instructions apply --change "<name>" --json
```

**Handle states**:
- `state: "blocked"` → report the blocker (which artifact and why), STOP
- `state: "all_done"` → congratulate, suggest `/opsxp-verify`, STOP
- otherwise → proceed

### 4. Read context files from `contextFiles`.

### 5. Show progress

Schema, "N/M tasks complete", remaining tasks.

### 6. Build the task packet

Before editing for each pending task, compress the working context into a task packet:

- Objective: the exact behavior or artifact this task completes
- Source requirement: proposal/design/spec/task lines that justify it
- Expected files: files to read, create, or modify
- Proof check: the failing regression test, RED test, or smallest concrete command that should prove the gap
- GREEN target: the minimal implementation needed
- Verification: single-test or concrete proof command, affected/scoped command if available, and explicit note that full-suite release evidence belongs to `/opsxp-verify`
- Non-goals: related work that must stay out of scope

If the task artifact already contains this packet, verify it against the live repo and use it. If the packet is missing or too vague, refine the task in `tasks.md` before implementation.

### 7. Implement tasks (loop until done or blocked)

For each pending task, follow the **Proof Gate**:

#### PROVE THE GAP

- Bug fix: write one minimal failing regression test describing the broken behavior.
- Testable feature behavior: write one minimal RED test describing the expected behavior.
- UI/config/docs/infrastructure: define the narrowest concrete check, screenshot, build assertion, lint/typecheck, smoke route, or file assertion that proves the pre-change gap.
- Use real code/checks, no placeholders.

#### Verify the gap — MANDATORY

Run the single-test or concrete proof command:

```bash
<single-test or concrete proof invocation>
```

**STOP and post the output in this message.** Then check:

| Output type | Action |
|---|---|
| `AssertionError` / explicit assertion failure | ✓ proceed to GREEN |
| Concrete check shows the documented gap | ✓ proceed to GREEN |
| `ImportError` / `ModuleNotFoundError` / `SyntaxError` | ✗ test is broken, fix the test, re-run |
| Test passes | ✗ test isn't testing the new behavior — strengthen it, re-run |
| Other error (fixture missing, etc.) | ✗ fix the test setup, re-run |

**Proof Gate Red Flags — STOP immediately**:
- Skipping the test run
- Writing implementation before posting the gap evidence for a bug fix
- Saying "the test would fail because..." without running it when a test is feasible

#### GREEN — Minimal implementation

Write the simplest code that makes the test pass. Nothing more.

#### Verify GREEN — MANDATORY

```bash
<single-test or proof command> # the new behavior must pass
<affected/scoped test command> # when configured or easy to derive
```

Post the outputs you ran. If no affected/scoped command is configured and no narrow command can be derived, state that clearly and leave full-suite coverage to `/opsxp-verify`.

If the new test still fails after the implementation:
- Increment the **failure counter for this task** (mental tally)
- Enter the systematic debugging lane before trying another implementation

#### Minimal apply verification

Do **not** run `test_full_command` in apply by default. Apply verification is targeted proof plus affected/scoped checks.

When risk is broad, broaden only to the cheapest relevant configured commands:
- Shared/core behavior changed (auth, routing, permissions, serialization, error handling, shared UI primitives)
- Database schema, migration, data model, generated API contract, or build/test infrastructure changed
- Dependency, package manager, environment, framework config, or CI behavior changed
- The affected/scoped command is unavailable and the changed surface is broad
- A previous targeted/affected run exposed surprising cross-module failure

For those cases, run affected/scoped tests, lint, typecheck, build, migration smoke, or a focused browser/API smoke if configured and relevant. If no scoped command exists, record the gap and leave full-suite coverage to `/opsxp-verify`.

Only run `test_full_command` during apply when the user explicitly asks for full-suite apply verification in the current message. Otherwise record: `Full suite: not run in apply; release evidence belongs to /opsxp-verify`.

#### Systematic debugging lane

Do not guess through failures. For every unexpected failure:

1. Preserve the exact failing command, exit code, and relevant stack/output.
2. Identify the first application-owned frame, data boundary, or contract mismatch.
3. Form one concrete hypothesis.
4. Run the smallest check that can confirm or reject it.
5. Patch only after evidence points to the root cause.

For browser/UI failures, capture the exact route, viewport, console/network errors, and screenshot/DOM evidence when tools are available. For async timing, prefer condition-based waits over sleeps.

**Three-strike rule**: If the same task hits 3 GREEN failures in a row → **STOP**. Print:
```
This task has failed 3 implementation attempts.
The design may be wrong. Suggested next step:
  - Re-read design.md and the spec for this requirement
  - Or enter explore mode (`/opsxp-explore`) to rethink
Do NOT keep retrying.
```

Also provide a handoff:

- Task packet
- Failing commands and outputs
- Hypotheses tried and rejected
- Most likely root cause
- Suggested next `/opsxp-explore` question or revised task

#### REFACTOR (only after GREEN)

Remove duplication, improve names. Re-run the targeted proof and the affected/scoped command if the refactor can affect nearby behavior. Do not run full suite after refactors; release evidence belongs to `/opsxp-verify`.

#### Mark task complete

Update `tasks.md`: `- [ ]` → `- [x]`.

**Evidence required** — the proof/check output must be in this message.

#### Commit policy

If `git_auto_commit` is `true`, stage only the files touched by this task, including `tasks.md` when the checkbox changed:
```bash
git add <source files> <test files> openspec/changes/<change-name>/tasks.md
git commit -m "feat(<change-name>): task <N> - <short task description>"
```

Follow the opsxp git settings in `openspec/opsxp.yaml`. **Do NOT use `git add -A`.**

If `git_auto_commit` is `false`, do not commit. Report the changed files and the exact verification evidence.

#### Push policy

If `git_auto_push` is `when_pr_info_exists` and the configured PR metadata artifact exists (default: `openspec/changes/<change-name>/.pr-info.json`):
```bash
git push
```
This keeps the draft PR up to date. If the PR is also linked to Notion, Notion's GitHub integration can reflect live progress.

If push fails (e.g., remote branch deleted) → report once, continue without push for this run. Don't re-attempt.

If `git_auto_push` is `manual`, do not push. If PR metadata is absent → skip push; commits stay local until `/opsxp-archive`.

#### Pause if

- Task description is unclear
- Implementation reveals a design issue
- Three-strike rule triggered
- User interrupts

### 8. On completion / pause, show status

Tasks completed, overall progress, recommended next step.

---

## Verification Before Any Positive Claim

1. **IDENTIFY**: What command proves the claim?
2. **RUN**: Execute it now in this message
3. **READ**: Full output, exit code
4. **VERIFY**: Output confirms the claim?
5. **ONLY THEN**: Make the claim, with the output as evidence

---

## Wiki Capture Awareness

While implementing, hold a mental note for `/opsxp-wiki` candidates. If a task hits any of these — non-trivial debug effort to resolve, counter-intuitive fix that future-you would forget, or Yung saying "下次別再踩" — **remember it but do not interrupt the TDD loop to write**. Surface candidates in the final completion report; let Yung decide whether to invoke `/opsxp-wiki` after archive.

Skip noise: typos, code-already-in-commit-diff, navigation-by-grep, transient failures (provider outage / flaky DNS / network glitch).

---

## Output

```
## Implementing: <change-name>

Working on task 3/7: <description>

PROOF:
  $ <single-test invocation>
  → AssertionError: expected ... got ... (✓ failure as expected)

GREEN:
  <code change summary>
  $ <single-test/proof command>   → PASS
  $ <affected/scoped test command> → PASS
  Full suite: not run in apply; release evidence belongs to /opsxp-verify

Task 3 complete. Committed: feat(<name>): task 3 - <description>
```

**On completion**:
```
## Implementation Complete

**Change**: <change-name>
**Progress**: 7/7 tasks

### Verification
$ <targeted/affected commands run during apply> → PASS
$ <lint_command>      → clean (if run)
$ <typecheck_command> → clean (if run)

Run `/opsxp-verify` next, then `/opsxp-archive`.
```

---

## Guardrails

- Read `openspec/opsxp.yaml` first; refuse to run if missing
- Bug fixes require regression-first proof; testable behavior should use RED/GREEN; non-testable surfaces need the narrowest concrete check and a stated reason
- Read context files before starting
- Keep changes minimal and scoped to each task
- Use task packets to preserve context and prevent broad edits
- Diagnose unexpected failures from evidence before patching
- Update task checkbox immediately after evidence is posted
- **Never claim completion without proof/check output in this message**
- **Never run the full suite in apply unless the user explicitly asks in the current message**
- Three-strike rule is non-negotiable — stop and re-think, don't grind
