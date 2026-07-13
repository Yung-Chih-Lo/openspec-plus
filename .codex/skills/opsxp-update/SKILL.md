---
name: opsxp-update
description: Revise existing OpenSpec planning artifacts after scope or design changes without editing implementation code.
---

# OPSXP Update

Reconcile an existing change when Apply or the user discovers that the plan is wrong or incomplete.

## Steps

1. Read repo instructions and `openspec/opsxp.yaml`.
2. Use the named change or infer the single clear active change. If several are plausible, list them and ask once.
3. Inspect the change:
   ```bash
   openspec status --change "<change>" --json
   ```
4. Read every relevant file from `artifactPaths.<id>.existingOutputPaths`. Never treat a glob `resolvedOutputPath` as a concrete file.
5. Apply the requested decision across all existing artifacts that would otherwise contradict it.
6. Keep requirements, scenarios, design, and tasks mutually consistent; remove stale tasks rather than appending compensating text.
7. Re-read the edited artifacts and status before finishing.

The user's requested revision is sufficient approval. Ask only when multiple product or architecture choices remain; do not require confirmation for each artifact edit.

## Boundaries

- Planning artifacts only. Never edit implementation code or mark implementation tasks complete.
- Edit only existing artifact paths; do not create the next artifact or invent files under a glob.
- Preserve the configured `pr.metadata_artifact`, the current branch, and the existing PR.
- Do not run project tests, commit, push, or update Notion unless the user explicitly requests that separate action.
- If the change's core intent has been replaced rather than refined, recommend a new change instead of hiding it in a rewrite.

## Output

Report the revised artifacts, the decision now reflected, and one next action: continue Apply, finish FF if an artifact is missing, or Verify.
