---
name: opsxp-onboard
description: Onboard a new user or new agent to this OPSXP/OpenSpec project workflow. Use when someone asks what this template is, how the opsxp skills fit together, which command to run first, or how setup, debug, explore, ff, apply, verify, archive, Notion, GitHub, sync, and wiki responsibilities are split.
license: MIT
compatibility: "Requires only local file reads. Optional: openspec CLI for live status."
user-invocable: true
metadata:
  author: openspec-plus
  version: "1.1"
---

Explain the OPSXP workflow to someone new to the project. This is onboarding only: do not create a change, edit code, run setup, open PRs, or write to Notion/wiki unless the user explicitly asks after onboarding.

Default output language: Traditional Chinese.

---

## Minimal Context Check

Read only lightweight project context:
- `AGENTS.md` or `CLAUDE.md` if present
- `openspec/opsxp.yaml` if present
- Optionally run `openspec list` or `openspec status` only if OpenSpec is available and the user wants live state

If a file or CLI is missing, say so briefly. Do not inspect the whole repo.

---

## Explain The Model

Cover these points, in this order:

1. **What this is**
   - OPSXP is this template's agent workflow around OpenSpec.
   - OpenSpec is the change/spec artifact layer: each meaningful feature/fix becomes a `change`.
   - Git and shipped code are source of truth when `git.required: true`; template maintenance or docs-only checkouts may use file-based evidence when Git is optional.

2. **Where state lives**
   - `openspec/opsxp.yaml`: project-level config, created/refreshed by `/opsxp-setup`; it owns command discovery, concrete commands, Git required/optional mode, auto-commit/auto-push policy, PR metadata policy, optional Notion task integration, and verification evidence artifact path.
   - `openspec/changes/<change>/`: per-change proposal/design/tasks/spec artifacts.
   - `pr.metadata_artifact` (default `openspec/changes/<change>/.pr-info.json`): per-change PR metadata (`project_slug`, `pr_number`, `pr_url`) and optional Notion task metadata (`notion_page_id`, `notion_task_url`).
   - Notion is the human-facing task card layer, not the source of truth.
   - The LLM wiki is for selective reusable lessons/pitfalls, not task progress.

3. **Command map**
   - `/opsxp-onboard`: explain workflow and recommend next step.
   - `/opsxp-setup`: global project setup; detects Makefile/monorepo/package/Python commands, asks git/PR policy, asks whether `/opsxp-ff` should open draft PRs, and asks whether Notion task integration is enabled.
   - `/opsxp-explore`: think through unclear work before creating a change.
   - `/opsxp-ff`: fast-forward OpenSpec artifacts for one change; if `pr.draft_on_ff` is enabled, opens a draft PR and writes PR metadata. If Notion is also enabled, asks for that change's Notion task URL and includes the task fields in the metadata.
   - `/opsxp-debug`: read-only root-cause diagnosis for known failures before choosing the fix path.
   - `/opsxp-apply`: implement tasks using the artifacts.
   - `/opsxp-verify`: verify fresh evidence before shipping, including spec/docs alignment and review lenses; persists evidence to the configured JSON artifact.
   - `/opsxp-archive`: archive completed change, then commit/push/create or update PR according to `git.auto_commit` and `git.auto_push`.
   - `/opsxp-notion`: after archive, write a summary back to the linked Notion task card.
   - `/opsxp-sync`: after merge/archive/remote cleanup, fast-forward the target branch and delete only proven-safe local branches.
   - `/opsxp-wiki`: only when the user explicitly wants to record a reusable cross-project pitfall/lesson.

4. **PR metadata and Notion split**
   - `pr.draft_on_ff` controls whether `/opsxp-ff` opens a draft PR.
   - `pr.metadata_artifact` controls where PR metadata is written.
   - `task_integration.notion_enabled` controls only Notion task-card linkage and writeback.
   - Every Notion-enabled change maps to its own Notion page, so `/opsxp-ff` asks for the Notion URL per change.
   - OPSXP can store PR-only metadata without Notion; `/opsxp-notion` runs only when metadata includes `notion_task_url`.

5. **Recommended next step**
   - If `openspec/opsxp.yaml` is missing: recommend `/opsxp-setup`.
   - If a failure exists but the cause is unclear: recommend `/opsxp-debug`.
   - If the user is unsure what to build: recommend `/opsxp-explore`.
   - If the user knows the change: recommend `/opsxp-ff <change description>`.
   - If there is an active change: recommend `/opsxp-apply` or `/opsxp-verify` depending on progress.

---

## Output Shape

Keep the answer compact:

```markdown
## OPSXP 是什麼
<2-4 bullets>

## 你現在的狀態
<what was found from AGENTS/opsxp.yaml/OpenSpec, or "尚未檢查/不存在">

## 常用流程
<one concise command flow>

## Notion / GitHub 怎麼接
<2-4 bullets>

## 下一步
<one recommended command and why>
```

Do not produce a long tutorial unless the user asks.

---

## Guardrails

- Onboarding is read-only.
- Do not run `/opsxp-setup`, `/opsxp-ff`, or other workflow skills on the user's behalf from this skill.
- Do not claim Notion is the source of truth.
- Do not imply one global Notion task exists; task pages are per-change.
- Do not assume a Claude-only command such as `claude mcp list`; use the current agent's available tools if checking integrations.
