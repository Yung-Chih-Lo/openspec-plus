---
name: opsxp-archive
description: Consume fresh READY evidence, archive with the official CLI, safely finalize the remote PR, and write the linked Notion summary.
---

# OPSXP Archive

Archive is cheap finalization after Verify. It never repeats release tests.

## 1. Require fresh READY evidence

1. Read repo instructions, validate `openspec/opsxp.yaml`, and resolve the named or single clear active change.
2. Run `openspec status --change "<change>" --json`; require complete apply artifacts/tasks and resolve the active `changeRoot`.
3. Resolve configured PR metadata inside that `changeRoot`, validate it against `pr.metadata_schema`, and record its path relative to `changeRoot`.
4. Read the configured evidence, validate it against `verification.evidence_schema`, and require:
   - matching change and `READY` verdict;
   - current contract, planning, and implementation manifests matching all recorded fingerprints using `hash_algorithm`;
   - every current `verification.required_commands` ID recorded exactly once as required `PASS`;
   - current local HEAD matching `source.git_head` when Git was used.
5. Permit only the evidence file and unchanged pre-existing user files outside this change. Later contract, code, test, doc, or artifact edits return to Verify.

No prompt override may bypass missing or stale evidence.

## 2. Archive once

With delta specs:

```bash
openspec archive -y "<change>"
```

Without delta specs:

```bash
openspec archive -y --skip-specs "<change>"
```

Never replace failure with a manual move. After success run:

```bash
openspec validate --specs --strict --json
```

Do not run project tests, lint, typecheck, build, or E2E. Resolve archived metadata and evidence from the archive root plus their recorded relative paths.

## 3. Build one final summary

Use archived artifacts, evidence, Git diff, and metadata to produce the same six sections for PR and Notion:

1. `背景 / 為什麼做`
2. `做了什麼（變更摘要）`
3. `涉及檔案 / 模組`
4. `測試 / 驗證方式`
5. `PR / Commit`
6. `後續 / 待追蹤`

Never reconstruct verification from conversation memory.

## 4. Commit, publish, and finalize PR

1. With Git and `auto_commit: true`, stage only archive-generated paths and create one archive commit.
2. Apply `auto_push`: `manual` does not push; `when_pr_active` pushes when updating or creating a PR; `always` pushes.
3. Before any ready transition, require the archive changes committed and require remote branch HEAD to equal local HEAD. If commit, push, or equality proof is missing, do not mark the PR ready; preserve the local archive and report one manual action.
4. After that gate, update or create the PR, render task linkage when present, replace the stub body with the final summary, and mark the PR ready for review.
5. Use any available Git-host capability. If unavailable, report the PR/compare URL and manual ready action.

When PR identity must be added to archived metadata, commit and push that metadata before repeating the remote/local HEAD gate. Never make a post-ready local-only commit.

## 5. Write back to Notion

When Notion, Archive writeback, and linked metadata are enabled:

1. Resolve the canonical task page.
2. Append the six sections, or replace only those sections on retry.
3. Never change task status; the GitHub/Notion integration owns post-merge status.

Notion writeback is independent of PR readiness. A failure reports `Run OPSXP Notion to retry` and never rolls back Archive.

## Stop boundary

- Do not merge or wait for merge.
- Do not switch, synchronize, or delete branches.
- Always stay on the feature branch.
- The next FF synchronizes target before the next change.

## Output

Report archive path, spec sync mode, evidence consumed, commit/push/remote gate, PR state, Notion result, and at most one manual action.
