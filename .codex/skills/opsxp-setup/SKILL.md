---
name: opsxp-setup
description: Create or refresh the project-specific OPSXP v3 contract, schemas, integrations, Git policy, and manifest-proven FastAPI, Vite, Next.js, or monorepo commands.
---

# OPSXP Setup

Run after project creation, then only when layout or policy changes.

## Outputs

- `openspec/opsxp.yaml`: project runtime contract.
- `openspec/opsxp.schema.json`: contract schema.
- `openspec/pr-info.schema.json`: PR/task linkage schema.
- `openspec/verification-evidence.schema.json`: Verify evidence schema.

Canonical files live under this skill's `assets/`. Command heuristics live in `references/command-discovery.md`; read it only during discovery or migration.

## Rules

- Treat repo instructions, manifests, Makefiles, lockfiles, and CI as source of truth.
- Write only the four outputs above.
- Do not run project tests, create a change, commit, push, or open a PR.
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

## 2. Discover commands

1. Read `references/command-discovery.md`.
2. Derive `project_slug`, stack entries, package roots, package manager, and default Git target from current files.
3. Inspect each discovery root and record exact command, `cwd`, stable ID, and `covers` values.
4. Use one proven aggregate command or its leaf commands, never both. Do not duplicate work already covered by an aggregate.
5. Put reliable affected-suite commands in `commands.test_affected`; RED test selectors remain dynamic in Apply.
6. Put release commands in `commands.verify` and list every release-gating ID in `verification.required_commands`.
7. Do not infer frontend tests or E2E from React, Vite, Next.js, or shadcn alone.
8. Check and report the OpenSpec version; do not install or upgrade it.

If no release command is proven, leave both lists empty, report the coverage gap, and obtain an explicit decision before treating Setup as complete.

## 3. Confirm policy

Ask only for values discovery cannot determine:

- Git required/optional, target, branch prefix, auto-commit, and `manual | when_pr_active | always` auto-push;
- draft PR creation and metadata persistence;
- Notion enablement, required task linkage, and Archive writeback;
- whether an ambiguous discovered command belongs in the required release profile.

Notion, draft PR creation, metadata, and auto-push are independent. `when_pr_active` means push only when creating or updating a PR; it never depends on metadata existence.

## 4. Validate and report

1. Validate `opsxp.yaml` against `contract_schema` and both artifact schemas as JSON Schema 2020-12.
2. Require unique command IDs, existing `cwd` values, nonempty `covers`, and every required ID to resolve to one Verify command.
3. Require configured metadata and evidence artifacts to remain under `openspec/changes/{change}/`.
4. Report Git/PR/Notion policy, stack, required release profile with `cwd`, and unresolved gaps only.
