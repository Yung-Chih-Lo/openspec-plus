# AGENTS.md

## 目的與真相來源

這個 repository 是 AI-native project template。請把它視為可重用的作業契約，不是一次性的 app repo。

`CLAUDE.md` 只作為相容入口並指向本檔；不要維護第二份規則。

指令優先序：目前使用者指令 > 最近的 nested `AGENTS.md` > 本檔。實作現況以 current repo、OpenSpec artifacts、git、tests 與 shipped code 為準；Notion、memory 與舊對話只是線索。

## 專案地圖

| 路徑 | 何時讀取 |
| --- | --- |
| `docs/README.md` | 非 trivial 工作先讀；取得專案快照、文件狀態與閱讀順序 |
| `openspec/changes/<change>/` | 處理單一 change 時讀 proposal、spec、design 與 tasks |
| `openspec/opsxp.yaml` | 需要 commands、Git/PR、Notion 或 verification policy 時讀 |
| `openspec/*.schema.json` | 寫入 contract、PR metadata 或 verification evidence 前驗證 |
| `.codex/skills/opsxp-*` | 執行對應 workflow 階段時讀；具體程序只放在 skill |
| `.claude/skills/opsxp-*` | 舊版比較 baseline；不要套回目前流程 |
| `tests/` | 修改 workflow contract、schemas、skills 或 setup discovery 時讀 |

Official OpenSpec 是外部 dependency，版本與安裝方式以 `README.md` 為準；不要 vendoring 官方 `openspec-*` skills。

## 開始工作前

- 確認 `pwd`、最近的 nested `AGENTS.md` 與 relevant source of truth。
- 非 trivial 變更先界定 intent、scope、risk 與 verification。
- `git.required: true` 時確認 branch 與 `git status --short --branch`；Git optional 或非 git checkout 時改用 file evidence。
- 確認需要的 CLI、connector、package manager 與 test runner 實際存在。
- 保留 unrelated user changes；不要 reset、overwrite、auto-stash 或執行 destructive git commands，除非使用者明確要求。

## Workflow 邊界

- Setup 只負責 project contract、docs bootstrap 與 command discovery；不建立 change、不跑 project tests、不 commit/push。
- Explore 保持 read-only；FF 建立最小 apply-ready change，並依 contract 選擇 Notion linkage、metadata 與 draft PR。
- Apply 逐 task 使用最小 RED -> GREEN，只跑 targeted/unit proof 與最多一次 affected commands；不跑 release profile、完整 build 或 E2E。
- Update 只在 scope、design 或 tasks 已不正確時修 artifacts，再回 Apply。
- Verify 通過 readiness gate 後，各執行一次 `verification.required_commands`；E2E 只有明確配置才執行，並寫入 `READY` 或 `BLOCKED` evidence。
- Archive 只接受可重算的 fresh `READY` evidence，不重跑 project tests；它可將 PR 轉 ready，但不 merge、不切 branch、不 sync。

Notion、draft PR、PR metadata 與 auto-push 各自獨立。Notion status 由 GitHub integration 在 merge 後更新；agent 不直接改狀態。

## 文件規則

- `docs/` 保存長期、跨 change 的產品、架構、API、部署、維運與決策知識。
- `docs/README.md` 是唯一文件入口；Setup 首次初始化時建立有內容的 `01-prd.md` 與 `02-architecture.md`。
- API、deployment、operations 與 decision docs 只在相關能力存在時建立，不要提交空白 placeholder。
- 變更 architecture、API contract、runtime、deployment、operations、security posture 或 user-facing behavior 時，同步更新 relevant docs，或明講不需要更新的理由。
- 例行進度、聊天摘要、一次性 debug log、coverage、trace 與 build output 不放 `docs/`。
- 若 docs 與 current code/spec/tests 衝突，先依 current implementation 修正 docs。

## 工程與安全

- 優先最小有用變更；新增 package 前先確認既有 dependencies。
- 不要為一次性用途新增 helper、base class 或 abstraction。
- Bug fix 必須附 regression test，或說明 automated test 不可行的原因。
- Read-only task 必須保持 read-only；done 必須有實際 passing evidence。
- 不要提交 secrets、tokens、private keys、`.env` 或 local permission files。
- authentication、authorization、payments、webhooks、uploads、PII、logging、rate limits 或 admin tooling 的 Verify 必須包含 security/reliability lens。
- UI 變更先確認 desktop/mobile layout、scroll ownership 與互動結果；更細規則放在 frontend 最近的 nested `AGENTS.md`。

## Git、Monorepo 與維護

- 開 PR 前確認 branch、target freshness 與 working tree；release/tag 必須依 live remote tags 與實際 diff。
- Branch cleanup 只能在證明 merged 或 upstream gone 後做；target 被其他 worktree 使用時不要 force checkout。
- Root 規則只放全 repo 共通界線；package/app/worker/infra 的特殊 commands 與架構規則放最近的 nested `AGENTS.md`。
- 跨 package 變更先確認 shared contract、API boundary 與 affected tests。
- 重複的人工作業應移到 script；可判定的規則應移到 schema、test、lint 或 CI；task-specific 程序應放 skill。
- 定期刪除 stale paths、placeholder、重複規則與一次性 troubleshooting。
