---
name: opsxp-notion
description: "Write progress back to a Notion task card after archive. Use this manually after `/opsxp-archive` when the change is worth journaling. Task card only — pitfalls go to `/opsxp-wiki`, not here."
license: MIT
compatibility: "Requires an available Notion connector/API. `task_integration.notion_enabled` must be true."
user-invocable: true
metadata:
  author: openspec-plus
  version: "3.3"
---

Update the Notion task card linked to an archived change with a structured 6-section summary.

This skill is **never auto-triggered** — only you decide when a change is worth journaling. `/opsxp-archive` will print a one-line reminder when it finishes; you choose whether to write back.

**Pitfalls do not live here.** This skill no longer creates pitfall entries in Notion. If anything from the change is worth remembering across projects, use `/opsxp-wiki` to record it in the LLM Wiki second-brain at `~/Desktop/workspace/second-brains/`. The task card and the wiki are intentionally separate: Notion is the human frontend, the wiki is the AI layer.

---

## Pre-flight

**Project-level config**: read `openspec/opsxp.yaml`.

- File missing → "Notion is not enabled for this project. Run `/opsxp-setup` to enable." STOP.
- `task_integration.notion_enabled` is `false` → "Notion task integration disabled. Run `/opsxp-setup` to enable." STOP.
- For backward compatibility, if `task_integration.notion_enabled` is missing but `task_integration.enabled` exists, use `task_integration.enabled`.
- Read `project_slug`, `git.branch_prefix`, and `pr.metadata_artifact` (default: `openspec/changes/{change}/.pr-info.json`).

---

## Steps

### 1. Pick an archived change

List the 5 most recently archived changes:

```bash
ls -1t openspec/changes/archive/ | head -5
```

Ask the user through the current runtime's input mechanism to select. Names look like `2026-04-30-add-user-auth`.

If no archives exist → "No archived changes found. Run `/opsxp-archive` first." STOP.

### 2. Read PR metadata

Read the configured `pr.metadata_artifact` for the archived change. For the default path, this is `openspec/changes/archive/<selected>/.pr-info.json`. Required fields:

- `notion_page_id`
- `notion_task_url`
- `project_slug` (use `openspec/opsxp.yaml`'s `project_slug` if absent)
- `pr_url`, `pr_number`

If `.pr-info.json` is missing → "No Notion task linked to this change. Skipping." STOP.
If the metadata file exists but `notion_task_url` is empty or `null` → "PR metadata exists, but no Notion task is linked to this change. Skipping." STOP.

### 3. Resolve the task page

- If `notion_task_url` is non-empty → extract the internal Notion page ID from it or fetch by URL, depending on the available Notion connector/API.
- Else STOP. Metadata created by `/opsxp-ff` may be PR-only when Notion is disabled; `/opsxp-notion` requires `notion_task_url`.

Use the available Notion connector/API on the resolved ID or URL to confirm the page exists and read its current body. Capture the URL from the fetch result for later use.

Here `notion_page_id` is the Notion database `ID` column value such as `YSH-104`, used as a human task label. It is not the internal Notion page UUID.

### 4. Read change artifacts

From `openspec/changes/archive/<selected>/`:

- `proposal.md` (Why, What)
- `tasks.md` (completed `- [x]` and remaining `- [ ]`)
- `design.md` (Decisions, File Plan, Open Questions — if present)
- `specs/` (delta specs — note which capabilities)

### 5. Collect git info

```bash
change_short=$(echo "<selected>" | sed 's/^[0-9-]*-//')
git log --oneline --all --grep="$change_short" | head -20
```

Also derive changed files:

```bash
git diff --name-status <merge-base> <branch-prefix><change_short> 2>/dev/null | head -50
```

If the branch is gone (already merged + deleted), use the commits found above with `git show --stat`.

Use `pr_url` and `pr_number` from `.pr-info.json`. If either is missing in an older/incomplete metadata file, try to resolve the PR URL by searching GitHub for a PR whose head branch is `<branch-prefix><change_short>`. Use the available GitHub connector/API or environment-native GitHub tooling. If it cannot be resolved, keep `pr_url = "PR lookup unavailable"`; do not fail the Notion writeback just because PR lookup failed.

### 6. Build the 6-section task card body

```markdown
## 背景 / 為什麼做
<one paragraph from proposal.md "Why">

## 做了什麼（變更摘要）
<bulleted list, high-level — derived from tasks.md `- [x]` items, grouped by feature/section>

## 涉及檔案 / 模組
<bulleted list of changed files (path + one-line purpose), from git diff or design.md File Plan>

## 測試 / 驗證方式
<test/lint/typecheck commands that were run, with PASS/FAIL. Pull from conversation context if same session; otherwise state "驗證紀錄請見 PR description / commit log">

## PR / Commit
- PR: <resolved PR URL, or "PR lookup unavailable">
- Branch: `<branch-prefix><change-name>` from `openspec/opsxp.yaml`
- Key commits:
  - `<sha> <subject>`
  - ...

## 後續 / 待追蹤
<unchecked items from tasks.md, or "Open Questions" from design.md, or "無" if none>
```

**Do not add a "沉澱到知識庫的點" section.** Pitfall capture moved to `/opsxp-wiki` in v3.0. The task card stays focused on what this change did; durable lessons live in the LLM Wiki.

### 7. Update the task card

Use the available Notion connector/API to update the task page with the 6 sections above.

**Idempotency strategy**:

- If the page already contains H2 headings matching any of the 6 section names → replace those sections' content (keep the heading order as defined above).
- If the page is empty or has unrelated content (e.g., original task description) → **append** the 6 sections after existing content. Do NOT delete what's there — the user may have written context above.
- If the page has an old `## 沉澱到知識庫的點` section from a pre-v3.0 run of this skill, leave it alone — don't error on its presence. Yung can clean up in Notion if desired.
- Use the Notion patch/replace mechanism appropriate to the available connector/API. Prefer minimal diffs (replace block content, not the whole page).

### 8. Output

```
## Notion Task Card Updated

**Change**: <change-name>
**Task card**: <task page URL>
**Sections updated**: 背景 / 變更摘要 / 涉及檔案 / 測試 / PR / 後續

If pitfalls from this change are worth keeping across projects: `/opsxp-wiki "<description>"`.
If anything looks off in the task card, edit the page directly in Notion.
```

---

## Guardrails

- Never auto-trigger — only run when user explicitly asks
- If no Notion connector/API is available, report failure and STOP — don't try alternative output
- Don't modify the archived change files
- If task page can't be resolved, STOP — don't create a new page
- If `openspec/opsxp.yaml` doesn't exist, refuse to run and direct user to `/opsxp-setup`
- **Don't write pitfalls from this skill** — that responsibility moved to `/opsxp-wiki` in v3.0. If a user asks this skill to record a pitfall, redirect them to `/opsxp-wiki`.
- Don't read agent-local Notion/pitfall config files — they are unrelated to this skill's task-card flow.
