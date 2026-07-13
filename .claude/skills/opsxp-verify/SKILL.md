---
name: opsxp-verify
description: "Verify an OPSXP/OpenSpec change with fresh command evidence, artifact alignment, documentation alignment, two-gate review, and mandatory multi-perspective adversarial review before archive."
license: MIT
compatibility: "Requires openspec CLI. Reads workflow config from openspec/opsxp.yaml."
user-invocable: true
metadata:
  author: openspec-plus
  version: "4.2"
---

# OPSXP Verify

Verify that an implementation matches the active OpenSpec change before archive. This is a gate, not a summary step.

Input: optionally specify a change name. If ambiguous, ask before continuing.

## Iron Law

No completion claim without fresh evidence from this verification run.

Before any positive claim:

1. Identify the command or file evidence that proves it.
2. Run or read it now.
3. Inspect exit code, output, counts, and failures.
4. Claim only what the evidence proves.

Do not trust previous runs, old screenshots, memory, or the implementer's own summary.

## Pre-flight

1. Confirm location and repo state:

```bash
pwd
git status --short --branch
```

If `git status` fails, read `git.required` from `openspec/opsxp.yaml` before treating it as fatal. When `git.required: false`, continue with file-based evidence and report that Git evidence was unavailable.

2. Read `openspec/opsxp.yaml`. If missing, stop and tell the user to run `/opsxp-setup`.
3. Extract `commands.test_full`, `commands.test_affected`, `commands.test`, `commands.lint`, `commands.typecheck`, and `commands.build`.
   - `test_full_command` = `commands.test_full`, falling back to `commands.test` for older configs.
   - `test_affected_command` = `commands.test_affected`.
4. Extract `verification.verify_profile` (default: `release`), `verification.archive_requires_full_suite` (default: `true`), and `verification.evidence_artifact` (default: `openspec/changes/{change}/.verification/latest.json`).
5. Skip `<not configured>` commands, but report them as missing verification coverage.
6. If the working tree contains unrelated dirty files, preserve them and keep the report scoped to the active change.

Profile semantics:
- `release`: archive-ready verification. Run full suite when configured; if `archive_requires_full_suite: true` and no full-suite command exists, report missing coverage.
- `standard`: cheaper mid-change verification. Run affected/scoped tests when configured and skip full suite unless a risk trigger requires it. Do not call this archive-ready when `archive_requires_full_suite: true`.

## Select Change

If a change name was provided, use it. Otherwise:

```bash
openspec list --json
```

- Auto-select if exactly one active change exists.
- If multiple changes exist, ask which one to verify.
- If no active change exists, stop. For post-archive repository health, use `openspec validate --specs --strict --json` instead.

Announce: `Verifying change: <name>`.

## Verification Steps

### 1. Structural Status

```bash
openspec status --change "<name>" --json
openspec validate "<name>" --type change --strict --json
```

If strict validation fails, report it as `CRITICAL`. Continue with other checks so the user sees the full failure set, but do not recommend archive.

### 2. Load Change Artifacts

```bash
openspec instructions apply --change "<name>" --json
```

Read all returned `contextFiles`, plus the active change's:

- `proposal.md`
- `design.md` if present
- `tasks.md`
- `specs/**/spec.md`
- `.pr-info.json` if present

### 3. Find Implementation Surface

Collect current implementation evidence:

```bash
git diff --name-only
git diff --stat
```

If the change was already committed on a branch, inspect the branch diff against the configured target branch:

```bash
git diff --name-only <target>...HEAD
git diff --stat <target>...HEAD
```

If Git is unavailable or optional, build the changed-file list from active change artifacts, task file paths, and files read during verification. Use the changed-file list to choose reviewer lenses. Do not review the whole repo unless the change surface requires it.

### 4. Run Project Commands

Run configured commands in this order when available:

```bash
<lint_command>
<typecheck_command>
<test_affected_command> # when configured
<test_full_command>     # release profile, or standard profile with a full-suite risk trigger
<build_command>
```

Record command, exit code, and short result. If a command fails, report `CRITICAL` and keep going only when later checks can produce useful evidence without masking the failure.

Do not repeat targeted single-test commands already run by `/opsxp-apply` unless they are the smallest useful reproducer for a verification concern. Verify should spend the expensive pass once at the gate, not replay every TDD step.

Full-suite risk triggers in `standard` profile:
- Shared/core behavior changed (auth, routing, permissions, serialization, error handling, shared UI primitives)
- Database schema, migration, data model, generated API contract, or build/test infrastructure changed
- Dependency, package manager, environment, framework config, or CI behavior changed
- Affected/scoped test command is unavailable and the changed surface is broad
- The user asked for archive readiness

### 5. Completeness Check

- Parse `tasks.md` checkboxes. Incomplete required tasks are `CRITICAL`.
- Map every changed requirement/scenario to implementation evidence.
- Confirm every new or changed behavior has test evidence, or explicitly mark the gap.
- Confirm removed or postponed scope is reflected in artifacts, not only in chat.

### 6. Documentation Alignment Check

Always check document alignment. This is mandatory, even for code-only changes.

Read docs touched by the change and likely public contract files:

- README / docs / runbooks affected by the change
- `.env.example`, deployment notes, API docs, route docs, schema docs
- `AGENTS.md` / `CLAUDE.md` only when workflow behavior changed
- OpenSpec capability specs under `openspec/specs/**`

Look for:

- Stale names, env vars, endpoint paths, model/provider names, screenshots, command examples
- Docs promising behavior not implemented
- Implemented behavior not documented when it affects users, operators, or future agents
- OpenSpec deltas not merged or contradicted by implementation

Documentation drift is at least `WARNING`; it is `CRITICAL` when it would cause a wrong deploy, wrong API use, or wrong agent workflow.

## Mandatory Review Gate

After structural checks and project commands, run a multi-perspective review before any archive recommendation.

Use the current runtime's subagent/task tool if available. Prefer parallel reviewers. If no subagent tool is available, perform the same lenses as separate self-contained passes and state that independent subagents were unavailable.

### Two-Gate Order

Keep reviewer attention in this order:

1. **Spec compliance gate**: Does the implementation match proposal, tasks, delta specs, and user-facing docs?
2. **Code quality gate**: Is the matched implementation maintainable, tested, resilient, and safe?

Do not let code-quality polish hide a spec miss. If the wrong thing was built, report that before discussing refactors.

### Reviewer Packet

Every reviewer gets the same packet:

- Change name
- Proposal, design, tasks, delta specs
- Changed-file list and diff summary
- Relevant implementation files only
- Verification command results
- Documentation files checked
- Known risk areas from the implementation pass

### Required Lenses

Run these lenses for every non-trivial code change:

| Lens | Role | Must Check |
|---|---|---|
| Spec & Docs Alignment | Product/documentation reviewer | Proposal/tasks/specs match implementation; README/docs/env/API examples are current |
| Test & Regression | QA reviewer | Missing edge cases, false-positive tests, test files excluded by typecheck/build |
| Architecture & Maintainer | Code owner/maintainer | Simplicity, local patterns, ownership boundaries, readability, future maintenance |
| Adversarial Security/Data | Security reviewer | Injection, IDOR, auth bypass, tenant/scope leaks, unsafe parsing, unsafe output rendering |

Add conditional lenses when relevant:

| Trigger | Add Lens | Focus |
|---|---|---|
| UI/frontend files changed | Frontend UX reviewer | React hook order, accessibility, responsive layout, scroll ownership, stale closures |
| Deployment/config/env changed | Runtime/deploy reviewer | Build-time vs runtime config, env var contract, CORS, CI/build coverage, smoke-test gap |
| Database/schema/migration changed | Data reviewer | Migration safety, backward compatibility, constraints, rollback risk |
| LLM/RAG/agent code changed | AI behavior reviewer | prompt contract, tool schema, provider compatibility, eval/test coverage, failure modes |

Docs-only or config-only changes may use a reduced gate, but must still run Spec & Docs Alignment plus Maintainer.

### Reviewer Output

Each lens returns:

```markdown
### <Lens>
- Verdict: PASS | WARN | FAIL
- Findings:
  - [P0/P1/P2] <issue> — Evidence: <file:line or command>. Required fix: <specific action>.
- Checked:
  - <what was inspected>
```

Priority:

- `P0`: blocks archive; correctness/security/data-loss/build failure
- `P1`: should block archive unless user explicitly accepts risk
- `P2`: improvement or later candidate

## Report Format

Return:

```markdown
## Verification Report: <change-name>

### Verdict
BLOCKED | READY WITH WARNINGS | READY

### Fresh Evidence
- Profile: `<release | standard>`; archive full-suite requirement: `<true | false>`
- `openspec validate "<name>" --type change --strict --json`: <result>
- `<lint_command>`: <result or skipped>
- `<typecheck_command>`: <result or skipped>
- `<test_affected_command>`: <result or skipped>
- `<test_full_command>`: <result, skipped, or missing coverage>
- `<build_command>`: <result or skipped>

### Artifact Alignment
- Tasks: <complete>/<total>
- Requirements/scenarios: <mapped>/<total>
- Documentation alignment: PASS | WARN | FAIL

### Review Lenses
<merged lens findings, grouped by priority>

### Required Fixes Before Archive
1. <only P0/P1 items>

### Later Candidates
- <P2 or next-change ideas that should not block this archive>

### Apply Handoff
- <only when BLOCKED: exact fix path, files to inspect, failing command, suggested regression test, and whether to use /opsxp-apply or /opsxp-explore>

### Final Assessment
<one direct sentence>
```

After producing the report, persist the same release evidence to the configured `verification.evidence_artifact` path with `{change}` replaced by the change name. Create the parent directory if needed.

Minimum JSON shape:

```json
{
  "change": "<change-name>",
  "profile": "release",
  "archive_requires_full_suite": true,
  "verdict": "READY",
  "commands": [
    {"command": "<command>", "exit_code": 0, "result": "PASS"}
  ],
  "artifact_alignment": {
    "tasks_complete": true,
    "requirements_mapped": true,
    "docs_alignment": "PASS"
  },
  "review_findings": [],
  "generated_at": "<ISO-8601 timestamp>",
  "git_evidence": "<available | unavailable | optional>",
  "git_head": "<HEAD sha when available, else null>",
  "working_tree_status": "<clean | dirty | unavailable>",
  "changed_files": ["<file>"]
}
```

If the evidence artifact cannot be written, downgrade the final assessment to `READY WITH WARNINGS` at best and report the write failure. `/opsxp-archive` relies on this file when current-session evidence is unavailable.

If Git is available, record the current `HEAD` and whether the working tree is clean at verification time. If the working tree is dirty because the project intentionally does not auto-commit, include the relevant changed files so `/opsxp-archive` can detect whether new implementation changes appeared after verification.

Final assessment rules:

- Any failed command, strict validation failure, incomplete required task, or P0 finding -> `BLOCKED`.
- P1 findings -> `BLOCKED` unless user explicitly accepts risk.
- In `release` profile with `archive_requires_full_suite: true`, missing or skipped `test_full_command` -> `BLOCKED` unless the user explicitly accepts external CI/manual evidence as the release gate.
- Only P2 findings -> `READY WITH WARNINGS`.
- No findings and all required commands for the active verification profile pass -> `READY`.
- In `standard` profile with `archive_requires_full_suite: true`, skipping `test_full_command` can be at most `READY WITH WARNINGS`, not archive-ready.

When `BLOCKED`, the report must include an Apply Handoff that is specific enough for `/opsxp-apply` to resume without re-discovering the failure.

Never run `/opsxp-archive` from this skill. Archive is a separate user decision.

## Wiki Capture Awareness

If verification surfaces a transferable lesson that should help future projects, flag it as `(wiki candidate)` in the report. Do not write wiki entries unless the user invokes `/opsxp-wiki`.

## Stop Yourself

- Do not say "seems", "probably", or "should be fine".
- Do not skip docs alignment because tests pass.
- Do not let the implementer perspective be the only perspective.
- Do not review only happy paths.
- Do not bury security or tenant-scope concerns under suggestions.
- Do not claim ready while any P0/P1 finding remains.
