---
name: opsxp-setup
description: Create or refresh project docs, the OPSXP v3 contract, schemas, integrations, Git policy, and manifest-proven FastAPI, Vite, Next.js, or monorepo commands.
---

# OPSXP Setup

Run after project creation, then only when layout or policy changes.

## Outputs

- `docs/README.md`: project snapshot and documentation map.
- `docs/01-prd.md`: durable product intent created on first setup.
- `docs/02-architecture.md`: durable system map created on first setup.
- `openspec/opsxp.yaml`: project runtime contract.
- `openspec/opsxp.schema.json`: contract schema.
- `openspec/pr-info.schema.json`: PR/task linkage schema.
- `openspec/verification-evidence.schema.json`: Verify evidence schema.

Canonical contract and docs templates live under `assets/`. Deterministic command candidates come from `scripts/discover-command-profile.mjs`; command policy lives in `references/command-discovery.md`.

## Rules

- Treat repo instructions, manifests, Makefiles, lockfiles, and CI as source of truth.
- Write only the outputs above. Conditional docs remain absent until relevant.
- Do not run project tests, create a change, commit, push, or open a PR.
- Do not install or scaffold FastAPI, Vite, Next.js, shadcn, or another framework.
- Do not assume a named connector, prompt API, Git-host CLI, package manager, or test runner.
- Preserve explicit user choices and unknown future contract keys.

## 1. Bootstrap or migrate

1. Read `assets/opsxp.yaml`, `assets/opsxp.schema.json`, `assets/pr-info.schema.json`, and `assets/verification-evidence.schema.json`.
2. Create the `openspec/` directory when needed.
3. If `openspec/opsxp.yaml` is missing, create it from the bundled v3 contract.
4. If version 3 exists, merge missing canonical keys without deleting unknown keys.
5. To migrate v2 to v3:
   - map `git.auto_push: when_pr_info_exists` to `when_pr_active` and preserve other explicit policies;
   - turn each configured `test_affected` object into a list entry;
   - turn configured lint, typecheck, test_full, build, and E2E objects into `commands.verify` entries with stable IDs and matching `covers` values;
   - omit `"<not configured>"` placeholders and place migrated Verify IDs in `verification.required_commands`;
   - turn a scalar stack into a list, then set version 3 and schema paths.
6. Stop on unsupported versions instead of guessing.
7. Write the bundled schemas to their default paths. Validate custom configured schema paths instead of overwriting them.

## 2. Bootstrap project knowledge

1. Read the three templates under `assets/docs/`.
2. On first setup, derive the project purpose, stack/package roots, runtime, data stores, and external services from the user request, current README, manifests, deployment files, and code.
3. Ask one compact question only when product purpose, target users, scope, or non-goals cannot be established. Do not invent them.
4. Replace the template `docs/README.md` with a truthful project snapshot and reading map. Create `docs/01-prd.md` and `docs/02-architecture.md` when missing.
5. Preserve authored docs. Update only facts proven stale by current source of truth, and report material conflicts.
6. Never write unresolved `{{...}}` markers. Do not create `03-api.md` through `06-decisions.md` unless their documented trigger exists.

## 3. Discover commands

1. Read `references/command-discovery.md`.
2. Run `node <this-skill>/scripts/discover-command-profile.mjs --root .` to produce deterministic candidates. Confirm every candidate against current manifests, Makefile, CI, and repo instructions before writing it.
3. If the helper cannot parse a supported file, follow the reference manually and report the gap; do not guess.
4. Record exact command, `cwd`, stable ID, and `covers` values for each discovery root.
5. Use one proven aggregate command or its leaf commands, never both. Do not duplicate aggregate coverage.
6. Put reliable affected-suite commands in `commands.test_affected`; RED selectors remain dynamic in Apply.
7. Put release commands in `commands.verify` and every release-gating ID in `verification.required_commands`.
8. Do not infer frontend tests or E2E from React, Vite, Next.js, or shadcn alone.
9. Check and report the OpenSpec version; do not install or upgrade it.

If no release command is proven, leave both lists empty, report the coverage gap, and obtain an explicit decision before treating Setup as complete.

## 4. Confirm policy

Ask only for values discovery cannot determine:

- Git required/optional, target, branch prefix, auto-commit, and `manual | when_pr_active | always` auto-push;
- draft PR creation and metadata persistence;
- Notion enablement, required task linkage, and Archive writeback;
- whether an ambiguous discovered command belongs in the required release profile.

Notion, draft PR creation, metadata, and auto-push are independent. `when_pr_active` means push only when creating or updating a PR; it never depends on metadata existence.

## 5. Validate and report

1. Validate `opsxp.yaml` against `contract_schema` and both artifact schemas as JSON Schema 2020-12.
2. Require unique command IDs, existing `cwd` values, nonempty `covers`, and every required ID to resolve to one Verify command.
3. Require configured metadata and evidence artifacts to remain under `openspec/changes/{change}/`.
4. Require `docs/README.md`, `docs/01-prd.md`, and `docs/02-architecture.md` to contain project facts rather than template markers.
5. Report docs created or preserved, Git/PR/Notion policy, stack, required release profile with `cwd`, and unresolved gaps only.
