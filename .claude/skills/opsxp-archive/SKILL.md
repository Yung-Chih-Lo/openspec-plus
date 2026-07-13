---
name: opsxp-archive
description: Archive a completed OpenSpec change using the official CLI, then push the branch and create a Pull Request. Use when an implementation is verified and ready to ship.
license: MIT
compatibility: "Requires openspec CLI ≥ 1.2.0. Optional: GitHub connector/API or authenticated GitHub CLI fallback (falls back to compare URL)."
user-invocable: true
metadata:
  author: openspec-plus
  version: "3.5"
---

Archive a completed change using **`openspec archive -y`** (official CLI), then push and open a PR.

This skill does **not** write to Notion. After archive completes, optionally run `/opsxp-notion` only when the PR metadata links a Notion task card. Pitfalls stay separate in `/opsxp-wiki`.

**Input**: Optionally specify a change name. If omitted, infer from context. If ambiguous, MUST prompt.

---

## Pre-flight

Read `openspec/opsxp.yaml`.

If missing → STOP. Tell user to run `/opsxp-setup` first.

Read `git.required`, `git.pr_target_branch`, `git.branch_prefix`, `git.auto_commit`, `git.auto_push`, and `pr.metadata_artifact`. If `git.pr_target_branch` is missing or blank and `git.required` is not `false` → STOP.

Read `verification.archive_requires_full_suite`, `verification.verify_profile`, and `verification.evidence_artifact` when present. Archive does not run project test/lint/build commands itself; `/opsxp-verify` owns that expensive evidence and persists it to the evidence artifact.

Verify openspec CLI version:
```bash
openspec --version
```
Must be ≥ 1.2.0 for the modern archive flow. If older, tell user: `npm install -g @fission-ai/openspec@latest`.

---

## Steps

### 1. Select the change

If a name was provided, use it. Otherwise:
- `openspec list --json` → ask through the current runtime's input mechanism.
- Show only active (non-archived) changes
- Auto-select only if exactly one active change exists

### 1.5. Read PR metadata (if exists)

Check the configured `pr.metadata_artifact` with `{change}` replaced by `<name>` (default: `openspec/changes/<name>/.pr-info.json`). If present, parse:
- `notion_page_id`
- `notion_task_url`
- `project_slug`
- `pr_number`
- `pr_url`

Here `notion_page_id` means the Notion database `ID` column value such as `YSH-104`, not the internal Notion page UUID. It may be absent or `null` for PR-only metadata. If the metadata file includes `pr_number`, use it to update the draft PR in step 7.

### 2. Check artifact + task completion

```bash
openspec status --change "<name>" --json
```

Read `openspec/changes/<name>/tasks.md` and count `- [ ]` vs `- [x]`.

If artifacts not all `done` OR incomplete tasks exist:
- Show warning with counts
- Ask through the current runtime's input mechanism to confirm proceeding.
- Proceed only on explicit confirmation

### 2.5. Confirm release verification

If `verification.archive_requires_full_suite` is `true`, require evidence that `/opsxp-verify` was run after the last implementation change with release-level coverage:

- Prefer the configured `verification.evidence_artifact` with `{change}` replaced by the selected change name. It must exist, be readable JSON, name the same change, use `profile: "release"` when archive readiness is required, and contain a `READY` or user-accepted `READY WITH WARNINGS` verdict.
- Check staleness before archive. If Git is available and the evidence has `git_head`, current `HEAD` must match `git_head` and there must be no new implementation changes outside archive/spec metadata. If `HEAD` changed, relevant files changed, or staleness cannot be bounded, STOP and run `/opsxp-verify` again.
- Accept current-session evidence from `/opsxp-verify` showing `test_full_command` passed or was intentionally covered by CI/user-approved fallback.
- If only `standard` profile verification exists, STOP and tell the user to run `/opsxp-verify` with release coverage before archive.
- If no verification evidence is visible in the current context, ask once whether the user wants to proceed based on external CI/manual evidence; otherwise STOP and point to `/opsxp-verify`.

Do not run the full suite from archive. This keeps expensive project verification in one place.

### 3. Decide on spec sync mode

`openspec archive` auto-validates and merges delta specs into `openspec/specs/`. Decide which mode:

- **Default (full sync)** → `openspec archive -y "<name>"`
- **Skip specs** (for docs-only / infrastructure / tooling changes that have no spec impact) → `openspec archive -y --skip-specs "<name>"`

Auto-detect: if `openspec/changes/<name>/specs/` is empty or missing → use `--skip-specs`.
Otherwise default to full sync. Don't ask the user unless this auto-decision feels wrong.

### 4. Run the archive

```bash
openspec archive -y "<name>"
# or
openspec archive -y --skip-specs "<name>"
```

The CLI will:
- Validate the change structure
- Merge delta specs into `openspec/specs/<capability>/spec.md` (if not `--skip-specs`)
- Move the change to `openspec/changes/archive/YYYY-MM-DD-<name>/`

If the CLI fails:
- Read its error output
- Common cases: validation error → fix the artifact, re-run; permission error → check `~/.config/openspec/` ownership
- **Never fall back to manual `mv`** — the CLI is the source of truth

### 5. Commit the archive + spec sync when Git commit automation is enabled

If `git.required` is `false` and Git is unavailable, skip commit/push/PR and report the archived files as local artifact changes. If `git.auto_commit` is `false`, do not commit; report the exact paths that need manual commit.

When Git is available and `git.auto_commit` is `true`, stage everything under `openspec/`:

```bash
git add openspec/
git status
```

Verify staged files are only `openspec/...` paths (no stray edits). Then:

```bash
git commit -m "chore: archive change <name>"
```

### 6. Push the branch

Only push when Git is available and `git.auto_push` is not `manual`:

```bash
git push -u origin <branch-prefix><name>
```

If push fails (no remote, rejected, etc.) → report exact error, STOP **without rolling back the archive** (the archive itself succeeded).

### 7. Update or create the Pull Request

Build PR body from the archived change files at `openspec/changes/archive/YYYY-MM-DD-<name>/`:

```markdown
## Summary
<from proposal.md "Why" section>

## What Was Built
<from tasks.md completed checkboxes>

## Key Decisions
<from design.md "Decisions" section if present>

## Specs
<list capabilities whose specs were updated, or "no spec changes" if --skip-specs>

<if notion_page_id from step 1.5: append "Notion task: [<notion_page_id>](<notion_task_url>)" when URL exists, otherwise "Notion task: <notion_page_id>">
```

If `.pr-info.json` is present with `pr_number`, use it. If missing or incomplete, fall back to searching GitHub for an open PR whose head branch is `<branch-prefix><name>`.

#### Case A: existing PR metadata found → update existing PR

A draft PR was opened at `/opsxp-ff` time. Now finalize it.

Use the best available GitHub operation in this runtime:
- Prefer a connected GitHub connector/API.
- Otherwise use an authenticated GitHub CLI only if this runtime provides one, for example `gh pr edit` / `gh pr ready`.
- If neither is available, print the PR URL and body for manual update.

Update the PR with:
- `pullNumber`: `<pr_number>` from `.pr-info.json` or branch/head lookup
- `body`: the assembled body above (replaces the stub)
- `draft`: **false** (un-draft → ready for review)
- `title`: only update if the change name changed since PR was opened (rare; usually omit this field)

When the PR is linked to a Notion task, this `draft: false` transition may trigger Notion's GitHub integration to move the task from "In Progress" to "In Review".

If GitHub tooling fails:
- Print: "Could not auto-upgrade PR #<number>. Visit <pr_url>, replace the body with the text below, and click 'Ready for review':"
- Dump the body

#### Case B: no existing PR found → create a fresh PR

No draft PR exists (`pr.draft_on_ff` was off, Git/GitHub tooling failed at `/opsxp-ff` time, or PR metadata was not recorded).

Use the best available GitHub operation in this runtime:
- Prefer a connected GitHub connector/API.
- Otherwise use an authenticated GitHub CLI only if this runtime provides one, for example `gh pr create`.
- If neither is available, print the compare URL and body for manual creation.

Create the PR with:
- `title`: `[<notion_page_id>]: feat: <change-name>` if `.pr-info.json` has `notion_page_id`; otherwise `feat: <change-name>`
- `base`: `git.pr_target_branch` from `openspec/opsxp.yaml`
- `head`: `<branch-prefix><name>`
- `draft`: **false** (ready for review immediately)
- `body`: assembled above

Do not use Copilot/delegated PR creation flows; the agent should create or prepare the PR directly.

If the configured PR metadata artifact exists but had no PR fields, update the archived metadata file after PR creation with `pr_number` and `pr_url`, preserving `notion_page_id`, `notion_task_url`, and `project_slug`. Commit and push that metadata update.

If GitHub tooling fails:
- Get owner/repo from `git remote get-url origin`
- Print compare URL: `https://github.com/<owner>/<repo>/compare/<target-branch>...<branch-prefix><name>?expand=1`
- Tell user: "GitHub tooling failed. Open this URL to create the PR. Body to paste:" + dump body in code block

### 8. Switch back to target branch

Only switch branches when Git is available:

```bash
git checkout <target-branch>
```

### 9. Report

```
## Archive Complete

**Change**: <change-name>
**Archived to**: openspec/changes/archive/<date>-<name>/
**Spec sync**: <full sync | --skip-specs | no delta specs>
**Branch pushed**: <branch-prefix><name> → origin
**Pull Request**: <PR URL> → <target-branch>
                  (or: "Manual — open <compare URL>")
**Switched to**: <target-branch>

If this change has `notion_task_url` in PR metadata, write it back to its Notion task card with: /opsxp-notion
If anything from this change is worth remembering across projects (counter-intuitive fix, env/config quirk, "下次別再踩"): /opsxp-wiki "<description>"
```

---

## Guardrails

- Refuse to run if `openspec/opsxp.yaml` is missing, or if Git is required and PR target branch isn't configured
- Refuse to run if openspec CLI < 1.2.0
- **Always use `openspec archive -y` — never manual `mv`**. If the CLI errors, fix the underlying issue, don't bypass
- Never write to Notion from this skill
- Do not assume a specific GitHub connector or CLI exists; use connector/API, an authenticated GitHub CLI when available, or manual compare URL fallback.
- If push fails, report the failure but don't try to "undo" the archive — that's the user's call
- Use `--skip-specs` only when there are genuinely no delta specs
