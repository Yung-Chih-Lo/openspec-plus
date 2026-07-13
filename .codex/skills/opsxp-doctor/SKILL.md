---
name: opsxp-doctor
description: Diagnose the OPSXP installation, v3 contract, schemas, command profile, and release gates without changing files or running project tests.
---

# OPSXP Doctor

Run a fast read-only health check. Never repair automatically.

## Checks

1. Confirm `openspec/opsxp.yaml` parses, declares `version: 3`, and validates against `contract_schema`.
2. Validate Git policy, including the `manual | when_pr_active | always` auto-push enum.
3. Validate independent Notion, draft PR, metadata artifact, and metadata schema policy.
4. Validate discovery roots, stack profiles, and monorepo roots.
5. Validate command lists:
   - unique command IDs across both lists;
   - nonempty `run`, existing `cwd`, and nonempty Verify `covers`;
   - every `verification.required_commands` ID resolves to exactly one Verify entry;
   - no aggregate command duplicates leaf work.
6. Validate PR metadata and verification evidence schema files. Validate discovered active or archived artifacts against their schemas.
7. Require metadata/evidence templates under `openspec/changes/{change}/`; forbid Notion writeback without metadata.
8. Report an empty required profile as `WARN`, not an implicit success.
9. Report policy friction when `auto_commit`, `auto_push`, and draft/final PR behavior cannot publish an archive without a manual step; intentional manual policy is a `WARN`.
10. Confirm OpenSpec CLI availability/version; `1.6.0` or newer is expected.
11. Confirm active OPSXP skill frontmatter, verify official OpenSpec skills are not vendored, and check the legacy comparison baseline when present.
12. With required Git inspect branch/worktree state; with optional/no Git report file-based operation as valid.
13. Check configured executables and working directories without running commands.

Do not compare new OPSXP bodies with legacy bodies; they intentionally differ.

## Result

Return a compact table:

- `PASS`: usable now;
- `WARN`: explicit manual policy, empty release profile, or optional capability unavailable;
- `FAIL`: invalid schema, unresolved required command, or missing required capability.

End with the smallest repair actions. Never run tests, commit, push, create a PR, or modify permissions.
