---
name: opsxp-setup
description: Initialize project-specific OpenSpec workflow settings — auto-detect commands, set PR target branch, configure draft PR metadata, and configure optional Notion integration. Run once per new project, or to refresh settings.
license: MIT
compatibility: "Requires openspec CLI ≥ 1.2.0. Optional: GitHub and Notion connector/API or authenticated CLI fallback."
user-invocable: true
metadata:
  author: openspec-plus
  version: "3.4"
---

Initialize project-specific settings for the OpenSpec workflow. Run this **once** when starting a new project from the template, or re-run to refresh.

This skill produces the shared project config that downstream skills (`opsxp-apply`, `opsxp-verify`, `opsxp-ff`, `opsxp-archive`, `opsxp-notion`) read at runtime.

---

## Outputs

| File | Purpose | When |
|---|---|---|
| `openspec/opsxp.yaml` | shared opsxp config: command discovery, commands, git/PR policy, PR metadata policy, project slug, task integration, verification evidence | Always |

Do not write project-level workflow state under `.claude/` or `.codex/`. Those directories are agent-specific and do not share state.

**Note**: agent-specific hooks may still live under `.claude/hooks/` or `.codex/hooks/`. The batch commands in `openspec/opsxp.yaml` are for `/opsxp-apply` and `/opsxp-verify`.

---

## Steps

### 0. OpenSpec version + profile

```bash
openspec --version
```

If version < 1.2.0 → STOP and tell user:
```
OpenSpec ≥ 1.2.0 required for the modern archive flow.
Upgrade: npm install -g @fission-ai/openspec@latest
Then re-run /opsxp-setup.
```

```bash
openspec config list
```

If `profile: custom` (10 workflows):
- Print a non-blocking note: "OpenSpec profile is custom; core profile is usually simpler for this template."
- Do not ask or change the profile from setup. Setup should only prompt for PR target branch, draft PR policy, and Notion task integration.

If permission error on `openspec config`:
- Print: "Run `sudo chown -R $(whoami) ~/.config/openspec` then re-run setup."

---

### 1. Auto-detect verification commands

Read command sources in this order so Makefile-first projects and monorepos are handled before root manifest guesses:

1. Root `Makefile`
2. `package.json` at root and obvious app roots (`web/`, `frontend/`, `backend/`, `app/`)
3. `pyproject.toml` at root and obvious Python roots (`backend/`, `api/`, `server/`)

Fill slots **without asking**:

| Slot | Logic |
|---|---|
| test_full | Make target `test` / `check` → `make test` / `make check`; else package script `test` with the correct `npm --prefix <root> test` when not root; else `pytest` from the detected Python root; else `<not configured>` |
| test | same as `test_full` for backward compatibility with older skills |
| test_affected | Make target `test-affected` / `test-changed`; else package scripts `test:changed` / `test:affected`; else `<not configured>` |
| lint | Make target `lint`; else package script `lint`; else `ruff check <python-root>` if Python; else `<not configured>` |
| typecheck | Make target `typecheck`; else package script `typecheck`; else `mypy <python-root>` if Python; else `<not configured>` |
| build | Make target `build`; else package script `build`; else `<not configured>` |

Don't confirm each one. The user can edit `openspec/opsxp.yaml` later if a default is wrong.

Also write the discovery basis under `command_discovery`:
- `mode: auto`
- `roots`: roots actually inspected, always including `.`
- `prefer`: `Makefile`, `package.json`, `pyproject.toml`
- `monorepo_roots`: non-root app/package roots where commands were found

Command semantics:
- `/opsxp-apply` constructs targeted single-test commands from the stack and uses `test_affected` for scoped regression when configured.
- `/opsxp-apply` does not run `test_full`; full-suite release evidence belongs to `/opsxp-verify` unless the user explicitly asks for a full-suite apply run.
- `/opsxp-verify` owns `test_full` for release/archive readiness.
- Hooks should stay cheap and per-file; never configure edit hooks to run `test_full`.

---

### 2. Git and PR policy

First check whether the current checkout is inside Git:

```bash
git rev-parse --is-inside-work-tree
```

If Git is unavailable or this is not a Git worktree, set `git.required: false`, keep `pr_target_branch` and `branch_prefix` as defaults, and print that branch/PR automation will be skipped by downstream skills until enabled.

If Git is available, ask the user through the current runtime's input mechanism. Do not silently keep or infer the PR target branch:
```
PR 要合併到哪個 branch？
  A) main
  B) dev
  C) master
  Other → custom
```

If `openspec/opsxp.yaml` already has `git.pr_target_branch`, show that value as the default/recommended option, but still ask. This branch is used by `/opsxp-ff` when creating the feature branch and by `/opsxp-archive` when opening or updating the PR.

Set:
- `git.required: true` for normal branch/PR-backed repositories.
- `git.auto_commit: true` unless the user explicitly wants manual commits.
- `git.auto_push: when_pr_info_exists` unless the user explicitly wants manual pushes.

---

### 3. Project slug

Derive from `basename "$PWD"`; normalize underscores/spaces to kebab-case. Do not ask.

---

### 4. PR metadata and Notion task integration

Ask the user through the current runtime's input mechanism:
```
在 /opsxp-ff 建立 artifacts 後，要不要開 draft PR？
  A) 啟用 — /opsxp-ff 會在 Git 可用時開 draft PR，並把 PR metadata 寫進 pr.metadata_artifact
  B) 不啟用 — /opsxp-ff 只建立 OpenSpec artifacts；/opsxp-archive 之後再建立 regular PR

啟用 Notion 任務卡整合？
  A) 啟用 — 每次 /opsxp-ff 都會詢問該 change 的 Notion 任務卡 URL，透過可用的 Notion connector/API 讀取該頁面的 ID 欄位（例如 YSH-104），並把 Notion 欄位寫進 PR metadata；/opsxp-notion 才能把封存後的任務摘要寫回該卡片
  B) 不啟用
```

Store these project-level switches in `openspec/opsxp.yaml`:
- `pr.draft_on_ff`
- `pr.metadata_artifact`
- `task_integration.notion_enabled`

Important behavior downstream:
- If `pr.draft_on_ff` is `true`, `/opsxp-ff` opens a draft PR when Git and GitHub tooling are available, even when Notion is disabled.
- If `task_integration.notion_enabled` is `true`, `/opsxp-ff` MUST ask for the Notion task page URL on every new change.
- `/opsxp-ff` writes `project_slug`, `pr_number`, and `pr_url` to `pr.metadata_artifact`; when Notion is enabled, it also writes `notion_page_id` and `notion_task_url`.
- Notion's GitHub integration is responsible for associating the page with the PR; the OPSXP skills only store the page/PR metadata and mention the task in the PR.
- `/opsxp-notion` reads the archived `pr.metadata_artifact` after archive and writes the final task summary back to that same Notion card.
- Setup does not ask for a task page. Task pages are per-change, so they are collected by `/opsxp-ff`.
- If Notion is disabled but `pr.draft_on_ff` is enabled, `/opsxp-ff` still opens a draft PR and writes PR-only metadata.

---

### 5. GitHub connector / CLI health check

Check whether GitHub tooling is available in the current agent environment. Do not assume a specific connector or CLI exists.

Suggested checks:
- Inspect the current runtime's available tools, connectors, plugins, or app list.
- If tool discovery is available, use it to check for a GitHub connector/API.
- If no connector/API is available, check whether an authenticated GitHub CLI is available.

Report one of:
- ✓ Connected → print "GitHub connector ready"
- CLI ready → print "GitHub CLI ready"
- ✗ Failed → print reconnect instructions, continue setup
- Not installed / not available → print install/connect hint, continue setup

**Do NOT block on GitHub tooling failure** — `opsxp-archive` has a fallback to compare URL.

---

### 6. Write `openspec/opsxp.yaml`

```yaml
version: 1
project_slug: "<slug>"

git:
  required: <true | false>
  pr_target_branch: "<chosen branch>"
  branch_prefix: "change/"
  auto_commit: true
  auto_push: "when_pr_info_exists"

task_integration:
  notion_enabled: <true | false>

pr:
  draft_on_ff: <true | false>
  metadata_artifact: "openspec/changes/{change}/.pr-info.json"

command_discovery:
  mode: auto
  roots:
    - "."
  prefer:
    - Makefile
    - package.json
    - pyproject.toml
  monorepo_roots: []

commands:
  test: "<full test command or <not configured>>"
  test_affected: "<affected/scoped test command or <not configured>>"
  test_full: "<full test command or <not configured>>"
  lint: "<lint command or <not configured>>"
  typecheck: "<typecheck command or <not configured>>"
  build: "<build command or <not configured>>"
  stack: "<Node | Python | Polyglot>"

verification:
  apply_full_suite: never
  verify_profile: release
  archive_requires_full_suite: true
  evidence_artifact: "openspec/changes/{change}/.verification/latest.json"
```

Slots marked `<not configured>` are skipped by downstream skills, not errored.

---

### 7. Verify

```bash
test -f openspec/opsxp.yaml
```

---

## Output

```
## Project Setup Complete

**Stack**: <Node | Python | Polyglot>
**Git**: <required | optional>; auto_commit=<true | false>; auto_push=<policy>
**PR target branch**: <branch>
**Draft PR on /opsxp-ff**: <on | off>; metadata=<path>
**Notion**: <off | on — /opsxp-ff will ask for a task page per change>
**Verification**: apply=targeted/affected, verify=release, archive requires full suite, evidence=<path>
**GitHub tooling**: <connector ready | CLI ready | failed | not installed>

Ready. Run `/opsxp-explore` to think through your first change, or `/opsxp-ff` if you already know what to build.
```

---

## Idempotency

Re-running is safe:
- Auto-detects commands fresh from `package.json` / `pyproject.toml`
- Reads existing `openspec/opsxp.yaml` to pre-fill defaults
- Only prompts for git/PR policy, draft PR policy, and Notion task integration

---

## Guardrails

- Never edit user code or commit
- Never run the test/lint/build commands themselves — only record them
- If GitHub connector/CLI availability cannot be confirmed, continue — print warning only
- Only write `openspec/opsxp.yaml`; do not modify OpenSpec change/spec artifacts
