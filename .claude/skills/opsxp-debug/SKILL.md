---
name: opsxp-debug
description: Diagnose an OPSXP/OpenSpec project failure or bug before deciding the fix path. Use when a test, build, deploy, browser flow, API call, or user-reported behavior is failing but the root cause is not yet proven. Produces evidence, root-cause hypotheses, and a narrow handoff to /opsxp-explore, /opsxp-ff, or /opsxp-apply without editing code.
license: MIT
compatibility: "Requires local repo reads. Optional: openspec CLI, git, browser, GitHub/Notion connectors."
user-invocable: true
metadata:
  author: openspec-plus
  version: "1.0"
---

# OPSXP Debug

Diagnose before fixing. This skill is for failures where the symptom is known but the root cause is not proven.

This is read-only by default. Do not edit code, OpenSpec artifacts, config, dependencies, Notion, GitHub, or wiki entries.

## When To Use

Use this for:

- Failing test/lint/typecheck/build commands
- Runtime errors, browser/UI breakage, deployment smoke failures
- API/RAG/agent behavior that changed unexpectedly
- User reports where you need a root cause before starting a formal change

Do not use this for normal implementation of an active change; use `/opsxp-apply`. Do not use it for final shipment evidence; use `/opsxp-verify`.

## Evidence Order

1. User-provided symptom, error text, URL, command, screenshot, or reproduction steps
2. Current repo state: `pwd`, `git status --short --branch` when Git is available; if Git is unavailable or optional, report that and continue from files/OpenSpec/docs evidence
3. Active OpenSpec change and specs, if relevant: `openspec list --json`, `openspec status --change "<name>" --json`
4. Failing command output or reproducible browser/API evidence
5. Relevant implementation, tests, config, docs, and recent diffs
6. External systems only when already available and necessary to reproduce the symptom

## Workflow

### 1. Frame The Symptom

State the failure in one sentence:

- Expected behavior
- Actual behavior
- Where it was observed
- Whether reproduction is confirmed in this run

If reproduction steps are missing, ask for the smallest missing anchor.

### 2. Reproduce Or Bound

Run the smallest safe command or read the smallest evidence needed to confirm the failure.

Examples:

```bash
<single failing test>
<lint/typecheck/build command>
curl -i <local endpoint>
```

For browser/UI issues, use the available browser tool when possible and capture route, viewport, console errors, network failures, and screenshot/DOM evidence.

If reproduction is impossible in the current environment, say exactly why and continue from available evidence.

### 3. Trace Root Cause

Do not patch from vibes. Work through one hypothesis at a time:

1. Identify the first application-owned frame, failing assertion, bad response, or state transition.
2. Trace upstream to the input/data boundary.
3. Trace downstream to the user-visible failure.
4. Compare implementation against tests/spec/docs.
5. Confirm or reject each hypothesis with one concrete check.

Prefer source-of-truth evidence over memory or chat summaries.

### 4. Classify The Fix Path

Choose one:

- **Existing active change**: hand off to `/opsxp-apply <change>` with a regression test idea.
- **No active change, clear bug fix**: recommend `/opsxp-ff <bug-fix-name>` with a concise explore/ff prompt.
- **Design ambiguity**: recommend `/opsxp-explore` with the exact question to resolve.
- **Environment/setup drift**: recommend `opsxp-doctor` or a setup/config action.
- **Not enough evidence**: list the missing reproduction anchor.

### 5. Stop Before Editing

Do not implement the fix from this skill. The output should make the next workflow step cheap and unambiguous.

## Output Format

```markdown
## Debug Report

### Symptom
- Expected:
- Actual:
- Reproduced: yes/no/partial

### Evidence
- `<command or file>`: <result>

### Root Cause Analysis
1. Hypothesis: <specific>
   - Check: <what was inspected/run>
   - Result: confirmed/rejected

### Most Likely Root Cause
<one direct paragraph with evidence>

### Fix Path
- Recommended next command: `/opsxp-apply <change>` | `/opsxp-explore <prompt>` | `/opsxp-ff <name>`
- Regression test idea:
- Files likely involved:
- Not included:
```

## Guardrails

- Read-only unless the user explicitly exits debug mode.
- Do not install packages.
- Do not reset, stash, or clean the working tree.
- Do not mark tasks complete or archive.
- Do not turn every observation into a new change.
- If a failure is security/data-loss related, label it as blocking and recommend formal OpenSpec handling.
