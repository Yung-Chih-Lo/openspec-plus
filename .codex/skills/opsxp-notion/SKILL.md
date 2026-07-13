---
name: opsxp-notion
description: Retry the six-section Notion writeback for an archived change without changing task status, Git, or PR state.
---

# OPSXP Notion

This is a retry-only recovery action when Archive could not write the linked task summary. Normal Archive already attempts the writeback.

## Steps

1. Read `openspec/opsxp.yaml`; require `task_integration.notion_enabled: true`, `writeback_on_archive: true`, `pr.metadata_artifact`, and `pr.metadata_schema`.
2. Use the named archived change, infer the single recent match, or ask once when ambiguous.
3. Derive the metadata path relative to `openspec/changes/{change}/`, append that relative path to the selected archive root, and validate the JSON against `pr.metadata_schema`. Do not hardcode `.pr-info.json`.
4. Require `task.id`, `task.page_id`, and `task.url`. Never search by title when canonical linkage exists.
5. Read archived proposal, design when present, tasks, specs, verification evidence, and PR metadata.
6. Rebuild the same six sections used by Archive:
   - `背景 / 為什麼做`
   - `做了什麼（變更摘要）`
   - `涉及檔案 / 模組`
   - `測試 / 驗證方式`
   - `PR / Commit`
   - `後續 / 待追蹤`
7. Fetch the existing task page with any available Notion connector or API.
8. Replace matching H2 sections in place; otherwise append them after the original task content. Preserve all unrelated content.
9. Read back the six headings to confirm the update.

Never update any Notion status or database property. Never create a replacement page, modify archived artifacts, run project tests, commit, push, or change PR state.

If no Notion capability is available, report the retry failure and exact linked task URL. Do not invent a local substitute artifact.

## Output

Report the archived change, task ID/URL, six updated sections, and readback result.
