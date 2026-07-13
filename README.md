# OPSXP

OPSXP (OpenSpec Plus) is a lightweight project workflow for coding agents built on [OpenSpec](https://github.com/Fission-AI/OpenSpec). It adds explicit project policy for command discovery, targeted implementation proof, release verification evidence, Git/PR handling, and optional Notion task linkage.

This release is designed for **OpenSpec 1.6.0**. It does not vendor OpenSpec's official skills; install the upstream CLI separately.

## Why OPSXP

OpenSpec remains the source of truth for change artifacts and specifications. OPSXP adds the operational decisions that vary by project:

- discover Makefile, monorepo, manifest, lockfile, and CI commands during setup;
- keep Apply fast with a minimal RED -> GREEN loop and only targeted or unit proof;
- run full release commands and configured E2E once in Verify, then record reproducible `READY` or `BLOCKED` evidence;
- make Git, Notion, draft PRs, metadata artifacts, and auto-push independently configurable;
- connect a Notion task ID to a draft PR title/body without making Notion an implementation source of truth.

## Workflow

```text
Setup -> Explore -> FF -> Apply <-> Update -> Verify -> Archive -> human merge
                                              |                         |
                                              +-- evidence               +-- GitHub updates Notion status
```

| Stage | Responsibility |
| --- | --- |
| Setup | Creates or refreshes the project-specific `openspec/opsxp.yaml` v3 contract and schemas from repository evidence. |
| Explore | Read-only Socratic discovery. It reports evidence-backed `Clarity: N/5` before planning. |
| FF | Creates the smallest apply-ready OpenSpec change, branch, optional task linkage, metadata, and draft PR. One task is valid. |
| Apply | Uses minimal RED -> GREEN proof. It runs only the selected test or affected/unit commands, never the full release profile or E2E. |
| Update | Revises an existing change when implementation exposes a planning error. |
| Verify | Runs each configured release command once, including E2E only when the project explicitly configures it, and writes schema-valid evidence. |
| Archive | Consumes fresh `READY` evidence, archives with OpenSpec, updates the PR to ready after the remote/local HEAD gate, and writes a six-section Notion summary when configured. |
| Notion / Sync | Retry-only Notion writeback and explicit maintenance-only synchronization. Neither merges a PR. |

Archive never merges or waits for merge. The human-controlled GitHub merge is the event that updates the linked Notion status through the GitHub integration.

## Installation

1. Create a repository from this template, or copy the OPSXP files into an existing OpenSpec project.
2. Install the upstream OpenSpec CLI pinned to the compatible version:

   ```bash
   npm install -g @fission-ai/openspec@1.6.0
   openspec init
   ```

3. Make the active `.codex/skills/opsxp-*` skills available to your coding agent.
4. Run `opsxp-setup` once per project. It discovers project commands and writes `openspec/opsxp.yaml`, `openspec/opsxp.schema.json`, `openspec/pr-info.schema.json`, and `openspec/verification-evidence.schema.json`.
5. Use the workflow in order: `opsxp-explore`, `opsxp-ff`, `opsxp-apply`, `opsxp-verify`, and `opsxp-archive`. Use `opsxp-update` only when the plan must change.

Read the upstream [OpenSpec getting-started guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md) for OpenSpec commands, change artifacts, and CLI updates.

## Optional Notion and GitHub linkage

The four settings below are deliberately independent:

```yaml
task_integration:
  notion_enabled: true
  task_link_required_on_ff: false

pr:
  draft_on_ff: true
  metadata_artifact: "openspec/changes/{change}/.pr-info.json"

git:
  auto_push: when_pr_active # manual | when_pr_active | always
```

When Notion is enabled and a task link is supplied, FF reads the canonical task ID and can create a draft PR such as `[TASK-123] Add billing export`. The PR body contains `Completes TASK-123`, and the optional `.pr-info.json` preserves the linkage across sessions. Disabling Notion does not disable draft PRs, metadata, or push policy.

After Archive, OPSXP writes the six-section implementation summary back to Notion but does not change task status. The GitHub integration owns that status transition after the PR is merged.

## Versioning and rollback

- Tag `v1.6.0` means this OPSXP release is aligned with OpenSpec CLI `1.6.0`; it is not an upstream OpenSpec release.
- Active workflow skills live in `.codex/skills/opsxp-*`.
- `.claude/skills/opsxp-*` is the previous OPSXP baseline, retained only for rollback and comparison. Do not copy it into the active workflow automatically.
- Official OpenSpec skills are intentionally excluded. Download or update them from the upstream [OpenSpec repository](https://github.com/Fission-AI/OpenSpec) when needed.

## Verification

The repository verifies its workflow contract with:

```bash
node --test tests/opsxp-workflow-contract.test.mjs
```

The GitHub Actions workflow runs the same test on pushes and pull requests.

## License

OPSXP is released under the [MIT License](LICENSE). OpenSpec is an independent MIT-licensed upstream project; see [NOTICE](NOTICE).
