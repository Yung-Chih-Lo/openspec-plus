---
name: opsxp-ff
description: Fast-forward through OpenSpec artifact creation with enhanced task quality and implementation-ready task packets. Use when the user wants to quickly create all artifacts needed for implementation.
license: MIT
compatibility: "Requires openspec CLI. Requires `/opsxp-setup` to have been run."
user-invocable: true
metadata:
  author: openspec-plus
  version: "3.7"
---

Fast-forward through artifact creation — generate everything needed to start implementation in one go.

**Input**: A change name (kebab-case) OR a description of what to build.

---

## Pre-flight

1. Check `openspec/opsxp.yaml` exists.
   - Missing → STOP. Print: "Project not initialized. Run `/opsxp-setup` first."
2. Read `git.required`, `git.pr_target_branch`, `git.branch_prefix`, `git.auto_commit`, `git.auto_push`, `pr.draft_on_ff`, `pr.metadata_artifact`, and `task_integration.notion_enabled`.
   - If `git.pr_target_branch` is missing or blank and `git.required` is not `false` → STOP. Print: "PR target branch not configured. Run `/opsxp-setup` first."
   - If omitted, default to `required=true`, `auto_commit=true`, and `auto_push=when_pr_info_exists` for older configs.
   - For backward compatibility, if `task_integration.notion_enabled` is missing but `task_integration.enabled` exists, use that value as `notion_enabled` and default `pr.draft_on_ff` to the same value.
   - If `pr.metadata_artifact` is missing, default to `openspec/changes/{change}/.pr-info.json`.

---

## Steps

### 1. If no clear input, ask

Ask the user through the current runtime's input mechanism:
> "What change do you want to work on? Describe what you want to build or fix."

Derive a kebab-case name.

### 2. Create the change directory

```bash
openspec new change "<name>"
```

### 3. Create a feature branch when Git is enabled

Read PR target branch and branch prefix from `openspec/opsxp.yaml`.

If `git.required` is `false` and the current checkout is not a Git worktree, skip branch creation and continue creating OpenSpec artifacts only. Report: "Git disabled/optional; branch and PR automation skipped."

```bash
git checkout -b <branch-prefix><name>
```

If the target branch doesn't exist locally:
```bash
git fetch origin <target>
git checkout -b <branch-prefix><name> origin/<target>
```

### 4. Get the artifact build order

```bash
openspec status --change "<name>" --json
```

Parse:
- `applyRequires` — artifacts needed before implementation
- `artifacts` — list with status and dependencies

### 5. Create artifacts in sequence until apply-ready

Loop through artifacts in dependency order:

a. **For each artifact that is `ready`**:
   - `openspec instructions <artifact-id> --change "<name>" --json`
   - Read completed dependency files for context
   - Create the artifact file using `template` as structure
   - Apply `context` and `rules` as constraints — do NOT copy them into the file
   - Show: "Created <artifact-id>"

b. **Continue until all `applyRequires` are complete**

c. **If an artifact requires user input**: ask through the current runtime's input mechanism.

### 6. Show final status

```bash
openspec status --change "<name>"
```

### 7. Open draft PR and collect optional Notion task metadata

Read these values from `openspec/opsxp.yaml`:
- `pr.draft_on_ff`
- `pr.metadata_artifact`
- `task_integration.notion_enabled`

If `pr.draft_on_ff` is `false` and `task_integration.notion_enabled` is `false`, SKIP this step entirely.

If `git.required` is `false` or Git is unavailable, skip draft PR creation and PR metadata unless the user provides PR metadata manually. If Notion is enabled, still collect the task URL only when it can be stored with real PR metadata; otherwise report that Notion writeback cannot be linked yet.

**a. Collect Notion task page only when enabled**

If `task_integration.notion_enabled` is `true`, ask through the current runtime's input mechanism:
> "這個 change 對應的 Notion 任務卡 URL 是什麼？輸入 skip 只跳過 Notion linkage；draft PR 仍依 pr.draft_on_ff 設定處理。"

Accept these forms:
- **Notion URL**: keep it exactly as `notion_task_url`.
- **Bare task code** like `YSH-104` is not enough. Ask for the Notion URL instead.
- **Empty input**: ask once more for the URL or explicit `skip`.
- **`skip` / `none`**: skip Notion linkage for this change only. Do not skip the draft PR when `pr.draft_on_ff` is true.

Fetch the Notion page via the available Notion connector/API using `notion_task_url`. Read the page/database property named `ID` (for example `YSH-104`). Store that value as `notion_page_id`.

If the page cannot be fetched or the `ID` property is missing, ask the user:
> "這張 Notion 任務卡的 ID 欄位值是什麼？例如 YSH-104"

Use `notion_page_id` as the human-facing label for the PR title/body. In this workflow, `notion_page_id` means the Notion database `ID` column value (`YSH-104`), not the internal Notion page UUID. Do not update the Notion page in `/opsxp-ff`; the page already has GitHub integration and will associate with the PR itself.

If `task_integration.notion_enabled` is `false`, set `notion_page_id = null` and `notion_task_url = null`. Continue with draft PR creation when `pr.draft_on_ff` is true.

**b. Save metadata-only linkage when draft PR is disabled**

If `pr.draft_on_ff` is `false`:
- If Notion metadata was collected, write the configured `pr.metadata_artifact` with `pr_number = null` and `pr_url = null`. `/opsxp-archive` will create the regular PR later and fill in the PR fields.
- If no Notion metadata was collected, skip PR metadata entirely and continue to output.

Metadata-only artifact:
```json
{
  "project_slug": "<slug from openspec/opsxp.yaml>",
  "pr_number": null,
  "pr_url": null,
  "notion_page_id": "<Notion ID column value, e.g. YSH-104>",
  "notion_task_url": "<full Notion task page URL>"
}
```

If `git.auto_commit` is `true`, commit this metadata together with generated OpenSpec artifacts. If `git.auto_commit` is `false`, leave it unstaged and report the path. Then skip draft PR creation.

**c. Stage generated artifacts as the initial commit when draft PR is enabled**

If `git.auto_commit` is `false`, do not commit; report the generated artifact paths and continue without draft PR automation unless the user explicitly wants manual PR setup.

```bash
git add openspec/changes/<name>/
git commit -m "chore: open <name>"
```

If `notion_page_id` is present, use:
```bash
git commit -m "chore: open <name> [<notion_page_id>]"
```

**d. Push branch**

Only push when `git.auto_push` is not `manual`:

```bash
git push -u origin <branch-prefix><name>
```

**e. Open the draft PR**

Use the best available GitHub operation in this runtime:
- Prefer a connected GitHub connector/API that can create a draft PR.
- Otherwise use an authenticated GitHub CLI only if this runtime provides one, for example `gh pr create --draft`.
- If neither is available, print the compare URL plus title/body for manual PR creation.

Create the draft PR with:
- `title`: `[<notion_page_id>]: feat: <change-name>` when `notion_page_id` is present; otherwise `feat: <change-name>`
- `base`: `git.pr_target_branch` from `openspec/opsxp.yaml`
- `head`: `<branch-prefix><name>`
- `draft`: **true**
- `body` (stub):
  ```markdown
  > Change in progress. Body will be updated when `/opsxp-archive` runs.

  <!-- Include only when Notion is linked. -->
  Notion task: <notion_page_id>
  ```

Do not use Copilot/delegated PR creation flows; the agent should create or prepare the PR directly.

**f. Save PR metadata**

After the draft PR is created, write the configured `pr.metadata_artifact` path with `{change}` replaced by `<name>`:
```json
{
  "project_slug": "<slug from openspec/opsxp.yaml>",
  "pr_number": <number>,
  "pr_url": "<GitHub PR URL>",
  "notion_page_id": "<Notion ID column value, e.g. YSH-104, or null>",
  "notion_task_url": "<full Notion task page URL, or null>"
}
```

Commit and push the metadata when `git.auto_commit` / `git.auto_push` allow it:
```bash
git add <pr.metadata_artifact with {change} replaced>
git commit -m "chore: record PR metadata for <name>"
git push
```

If `notion_page_id` is present, the commit message may be `chore: link <name> to Notion task <notion_page_id>`.

If `git.auto_commit` is `false`, leave `.pr-info.json` unstaged and report it. If `git.auto_push` is `manual`, do not push.

**Fallback if GitHub tooling fails**: print compare URL + title/body to paste; do not write PR metadata until a real `pr_number` and `pr_url` are known. The user can manually create the draft PR and then ask the agent to add the configured `pr.metadata_artifact`.

---

## Output

Summarize:
- Change name and location
- Artifacts created
- Draft PR status: `<created | disabled | skipped | manual required>`
- Notion metadata status: `<linked | disabled | skipped | manual required>`
- "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsxp-apply` to start implementing."

---

## Enhanced Task Writing (for tasks artifact)

Apply these standards when writing the **tasks artifact**:

### Scope Pressure Before Writing Tasks

Before finalizing tasks, pressure-test the change:

- What user pain or system risk does this slice solve?
- What is the smallest vertical slice that proves it?
- What is explicitly out of scope for this change?
- What targeted command, test, UI check, or artifact proves the change is done before `/opsxp-verify` runs the full suite?
- Is any task too broad to finish from a fresh context window?

If the answer reveals multiple independent slices, keep this change narrow and put the rest under "Out of scope / later".

### Bite-Sized Granularity

Each step = one action (2-5 minutes):

```markdown
- [ ] Write failing test for user registration endpoint
- [ ] Run test, verify it fails with "function not defined"
- [ ] Implement minimal registration handler to pass test
- [ ] Run targeted test, then affected/scoped tests if configured
```

NOT: `- [ ] Implement user registration with validation and error handling`

### Minimum Proof Structure

```markdown
### Feature: User Registration

- [ ] PROOF: Write focused test `test_register_creates_user` — POST /register returns 201
- [ ] Verify proof: <single-test invocation> → FAIL for a new behavior test, or shows the current gap
- [ ] GREEN: Implement `register()` handler with minimal logic
- [ ] Verify GREEN: <single-test invocation> → PASS; <affected/scoped command> → PASS if configured
- [ ] REFACTOR: Extract validation if duplicated
```

For bug fixes, the proof must be a failing regression test first. For UI/config/docs/infrastructure where a RED test is not appropriate, name the smallest concrete check and why it is sufficient.

### Task Packet Standard

For every non-trivial implementable unit, make the task self-contained enough that a fresh agent can execute it without relying on chat memory:

```markdown
### Task N: <specific behavior>
Context: <proposal/design/spec requirement this serves>
Files: <expected files to create/modify/read>
Proof: <specific failing regression test, RED test, or concrete check>
GREEN: <minimal implementation target>
Verify: <single-test/concrete proof command, affected/scoped command if available, and note that full-suite release evidence belongs to /opsxp-verify>
Done when: <observable result or artifact state>
Not included: <scope boundary>
```

Small tasks can stay as direct checkboxes, but they still need file paths, verification, and a clear done condition.

### No Placeholders

Every task must contain enough detail to execute. These are **plan failures**:
- "TBD", "TODO", "implement later"
- "Add appropriate error handling"
- "Write tests for the above" (without specifics)
- "Similar to task above" (repeat the specifics)
- References to undefined types/functions

### File Structure Mapping

Before writing tasks, map files:

```markdown
## File Plan
- Create: `src/api/auth.ts` — registration and login handlers
- Create: `tests/auth.test.ts` — auth endpoint tests
- Modify: `src/api/router.ts:15-20` — add auth routes
```

### Self-Review

After writing all tasks:
1. **Spec coverage**: every requirement has a task?
2. **Placeholder scan**: no "TBD", vague instructions?
3. **Consistency**: names and paths match across tasks?

---

## Artifact Creation Guidelines

- Follow the `instruction` field from `openspec instructions`
- Read dependency artifacts for context before creating new ones
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file

---

## Guardrails

- Refuse to run without `/opsxp-setup` complete
- Create ALL artifacts needed for implementation
- If context is critically unclear, ask the user through the current runtime's input mechanism.
- If a change with that name exists, suggest checking out the existing branch instead
- Verify each artifact file exists after writing
- If Notion integration is enabled, never invent the Notion `ID` column value. Fetch it from the per-change Notion URL via the available connector/API; if unavailable, ask the user for the exact ID value or explicitly skip Notion linkage.
