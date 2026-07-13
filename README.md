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
| Setup | Creates or refreshes project docs, the `openspec/opsxp.yaml` v3 contract, schemas, and command profile from repository evidence. |
| Explore | Read-only Socratic discovery. It reports evidence-backed `Clarity: N/5` before planning. |
| FF | Creates the smallest apply-ready OpenSpec change, branch, optional task linkage, metadata, and draft PR. One task is valid. |
| Apply | Uses minimal RED -> GREEN proof. It runs only the selected test or affected/unit commands, never the full release profile or E2E. |
| Update | Revises an existing change when implementation exposes a planning error. |
| Verify | Runs each configured release command once, including E2E only when the project explicitly configures it, and writes schema-valid evidence. |
| Archive | Consumes fresh `READY` evidence, archives with OpenSpec, updates the PR to ready after the remote/local HEAD gate, and writes a six-section Notion summary when configured. |
| Notion / Sync | Retry-only Notion writeback and explicit maintenance-only synchronization. Neither merges a PR. |

Archive never merges or waits for merge. The human-controlled GitHub merge is the event that updates the linked Notion status through the GitHub integration.

## Installation

1. Install the upstream OpenSpec CLI pinned to the compatible version:

   ```bash
   npm install -g @fission-ai/openspec@1.6.0
   openspec --version
   ```

   OPSXP uses this CLI for official operations such as `openspec status`, `openspec validate`, and `openspec archive`. It does not vendor or replace the upstream CLI.

2. Start your project from OPSXP. Use GitHub's **Use this template** button, or clone this repository:

   ```bash
   git clone https://github.com/Yung-Chih-Lo/openspec-plus.git <project-name>
   cd <project-name>
   ```

   Do **not** run `openspec init` after creating or cloning an OPSXP project. This template already provides the `openspec/` contract and active OPSXP skills; `openspec init` generates upstream OpenSpec artifacts and skills that are intentionally not part of this repository.

3. For a new application, scaffold one stack using the recipes below. Existing applications keep their current layout.
4. Make the active `.codex/skills/opsxp-*` skills available to your coding agent.
5. Run `opsxp-setup` once per project. It bootstraps project docs, discovers commands, and writes the OPSXP contract and schemas.
6. Use the workflow in order: `opsxp-explore`, `opsxp-ff`, `opsxp-apply`, `opsxp-verify`, and `opsxp-archive`. Use `opsxp-update` only when the plan must change.

Read the upstream [OpenSpec getting-started guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md) for CLI commands, change artifacts, and CLI updates. In an OPSXP checkout, skip its initialization step.

## Scaffold an application

OPSXP intentionally ships without an application framework, dependency manifest, or lockfile. After cloning, choose only the stack the project needs, scaffold it with the upstream tool, then run `opsxp-setup` so commands come from the generated manifests and CI.

Recommended package roots are `apps/web` for one frontend and `apps/api` for a separate backend:

The examples use pnpm; use the package manager selected for the project.

```bash
# Next.js
pnpm create next-app@latest apps/web --yes

# React with Vite
pnpm create vite@latest apps/web --template react-ts
```

Do not generate both Next.js and Vite unless the product genuinely has two web applications. For an API-only FastAPI project, scaffold `apps/api` with the project's chosen Python package manager and current [FastAPI guidance](https://fastapi.tiangolo.com/). For the opinionated FastAPI + React/Vite + shadcn stack, use the official [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template) as the application scaffold source rather than vendoring it into OPSXP.

On first setup, OPSXP replaces the template `docs/README.md` and creates truthful `docs/01-prd.md` and `docs/02-architecture.md`. API, deployment, operations, and decision docs are added only when those concerns exist.

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
node --test tests/*.test.mjs
```

The suite covers the written contract, fixture-based FastAPI/Vite/Next.js/monorepo command discovery, and a real OpenSpec 1.6.0 `validate -> archive -> validate` smoke flow. GitHub Actions installs the pinned CLI and runs the same suite on pushes and pull requests.

## License

OPSXP is released under the [MIT License](LICENSE). OpenSpec is an independent MIT-licensed upstream project; see [NOTICE](NOTICE).
