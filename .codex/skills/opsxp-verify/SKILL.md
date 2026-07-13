---
name: opsxp-verify
description: Run the exact required release command profile once, including configured E2E, and persist reproducible READY or BLOCKED evidence.
---

# OPSXP Verify

Verify once before Archive. Write only the configured evidence artifact; fixes return to Apply or Update. Verdicts are `READY | BLOCKED`.

## Readiness gate

1. Read repo instructions; validate `openspec/opsxp.yaml` against `contract_schema` and load `verification.evidence_schema`.
2. Resolve the named or single clear active change, then run:
   ```bash
   openspec status --change "<change>" --json
   openspec instructions apply --change "<change>" --json
   openspec validate "<change>" --type change --strict --json
   ```
3. Require all apply artifacts and tasks complete.
4. Resolve every ID in `verification.required_commands` to exactly one unique `commands.verify` entry. A missing or duplicate ID is `BLOCKED` before project commands.
5. Read planning artifacts, changed implementation/tests, and affected long-term docs. Map each changed requirement to implementation and proof.
6. Review correctness and maintainability, adding only relevant security/data, UI/accessibility, runtime/deployment, or live-agent lenses.
7. With required Git, require committed implementation and record target, local HEAD, and working-tree state. With optional/no Git, use file evidence.

If readiness fails, write valid `BLOCKED` evidence and stop before expensive commands.

## Reproducible source evidence

Use `verification.hash_algorithm` and relative paths:

1. Hash the current `openspec/opsxp.yaml` bytes as `contract_fingerprint`.
2. Record each planning file and each implementation/test/doc file as `{path, scope, sha256}`; exclude PR metadata and `.verification`.
3. Sort records by scope then path.
4. Hash each scope's canonical lines `scope + NUL + path + NUL + sha256 + newline` as `artifact_fingerprint` and `implementation_fingerprint`. The empty manifest also has a deterministic SHA-256.

Archive must be able to recompute every fingerprint from this manifest.

## Full verification

Run required entries from `commands.verify` once each, in their configured order and exact `cwd`. Fail fast.

- Record ID, `covers`, exact command, `cwd`, exit code, and status.
- E2E runs here only when a required command covers `e2e`; React, Vite, Next.js, or shadcn alone never implies E2E.
- Do not run configured IDs outside `verification.required_commands` unless the current request or a risk-relevant repo rule explicitly requires them; record those as `required: false`.
- A required command that is missing, unavailable, skipped, or nonzero blocks READY.
- For model behavior, require a configured live replay when offline tests cannot prove the runtime contract.

On failure, stop and return the exact command plus the smallest Apply handoff. Do not edit code or collect unrelated failures.

## Evidence artifact

Write `verification.evidence_artifact` and validate it against `verification.evidence_schema`:

```json
{
  "schema_version": 1,
  "change": "<change>",
  "verdict": "READY",
  "source": {
    "mode": "git",
    "git_head": "<sha-or-null>",
    "working_tree_status": "clean",
    "hash_algorithm": "sha256",
    "contract_fingerprint": "<sha256>",
    "artifact_fingerprint": "<sha256>",
    "implementation_fingerprint": "<sha256>",
    "files": [{"path": "src/app.py", "scope": "implementation", "sha256": "<sha256>"}]
  },
  "commands": [{"id": "backend-tests", "covers": ["test_full"], "command": "python -m pytest -q", "cwd": "backend", "required": true, "status": "PASS", "exit_code": 0}],
  "findings": [],
  "generated_at": "<ISO-8601>"
}
```

READY requires every required ID recorded once with `PASS` and no blocking finding. An explicitly empty required profile may pass readiness but must be reported as having no project release commands.

Any later contract, implementation, test, doc, task, requirement, or design edit invalidates evidence. The evidence file may be the only new workflow file after Verify.

## Output

Report verdict, alignment, required commands/results, E2E coverage, findings, evidence path, and one action: Archive, Apply, or Update.
