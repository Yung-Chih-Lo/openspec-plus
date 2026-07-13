# AGENTS.md

## 目的

這個 repository 是 AI-native project template。請把它視為從 `project_template` 初始化專案時可重用的作業契約，而不是一次性的 app repo。

`CLAUDE.md` 只作為相容入口並指向本檔；不要維護第二份分歧規則。

## 指令優先序

1. 使用者在目前對話中的明確指令。
2. 最近的 nested `AGENTS.md`，也就是最接近被編輯檔案的指令。
3. 本 repo root `AGENTS.md`。
4. `openspec/` artifacts、git state、tests、shipped code。

如果指令互相衝突，先遵守較高優先序；仍不清楚時，先停下來說明衝突與建議路徑。

## 專案導覽

| 路徑 | 用途 |
| --- | --- |
| `AGENTS.md` | repo-level agent contract；只放穩定、可執行、會影響 agent 行為的規則 |
| `CLAUDE.md` | 相容入口；應指向 `AGENTS.md` |
| `openspec/` | OpenSpec source of truth：change artifacts、specs、archive 後 canonical specs |
| `openspec/opsxp.yaml` | OPSXP runtime contract：command discovery、Git/PR policy、verification evidence |
| `openspec/opsxp.schema.json` | `opsxp.yaml` v3 的 machine-readable contract |
| `openspec/pr-info.schema.json` | per-change `.pr-info.json` 的 machine-readable contract |
| `openspec/verification-evidence.schema.json` | Verify evidence 與 fingerprint manifest 的 contract |
| Official OpenSpec | 外部 dependency：安裝 `@fission-ai/openspec@1.6.0`；不 vendoring `.codex/skills/openspec-*` |
| `.codex/skills/opsxp-*` | 目前使用的精簡 OPSXP workflow |
| `.claude/skills/opsxp-*` | 舊 OPSXP 比較 baseline；不要直接複製回新版流程 |
| `tests/opsxp-workflow-contract.test.mjs` | workflow contract regression test |
| `docs/` | 長期專案文件：PRD、architecture、API、deployment、operations、decision records |

## 事前檢查

在非 trivial 變更前：

- 確認 `pwd`。
- 閱讀本檔、最近的 nested `AGENTS.md`，以及 `openspec/opsxp.yaml`。
- 如果 `openspec/opsxp.yaml` 有 `git.required: true`，確認 branch 與 `git status --short --branch`。
- 如果 Git optional 或目前 checkout 不是 git repo，明講並改用 file-based evidence。
- 確認需要的 runtime capabilities 存在，不要假設 `openspec`、特定 connector、Git hosting CLI、package manager 或 test runner 一定可用。
- 若 working tree dirty，保留 user changes；不要 reset、overwrite 或 auto-stash，除非使用者明確要求。

## OPSXP 主流程

1. 新專案只需執行一次 Setup；建立 v3 contract 與 schemas，並從 Makefile、manifest、lockfile、CI 發現 Git、Notion、PR 與 command policy。
2. Explore 保持 read-only，採蘇格拉底式一次處理一個關鍵問題；進 FF 前以 Problem、Scope、Behavior、Constraints、Proof 顯示 evidence-based `Clarity: N/5`。
3. FF 先同步 target branch，再建立 change、最少且可獨立驗證的單句 tasks、feature branch，以及選用的 Notion linkage 與 draft PR；一個 task 也有效。
4. Apply 逐 task 保留最小 RED → GREEN，只跑 targeted/unit proof，最多執行一次相關 package 的 affected commands；不執行 release profile、完整 build 或 E2E。
5. 若實作證明 plan 有誤，用 Update 修既有 artifacts，再回 Apply。
6. Verify 先做 readiness gate，再各執行一次 `verification.required_commands` 指定的 release commands；E2E 只在 profile 明確配置時執行，結果寫成 schema-valid `READY` 或 `BLOCKED` evidence。
7. Archive 只接受 fingerprints 可重算的 fresh `READY` evidence；不重跑 project tests，完成 official archive 後必須證明 remote branch HEAD 等於 local archive HEAD，才能把 PR 轉 ready。
8. 使用者自行 merge；Archive 不等待、不 merge、不切 branch、不 sync。下一次 FF 自動同步 target branch。

Notion、draft PR、PR metadata 與 auto-push 各自獨立。`git.auto_push` 只接受 `manual`、`when_pr_active`、`always`，不得依 metadata 是否存在決定。啟用 metadata 時，artifact 必須位於 change root 並符合 `pr.metadata_schema`。Notion status 由 GitHub integration 在 merge 後更新，agent 不直接改狀態。`opsxp-notion` 只重試 archive writeback；`opsxp-sync` 只做明確要求的 maintenance。

Setup 的初始 discovery profiles 是 FastAPI/Python、React/Vite、Next.js。Python tests 只有在 pytest 可被 manifest、設定或 CI 證明時加入；前端只採用實際存在的 package scripts；shadcn 不代表 test runner；E2E 只在 script、config、CI 或 repo instruction 明確存在時加入。

## 文件與 `/docs`

- `/docs` 放長期、跨 change 的專案知識；`openspec/changes/<change>/` 放 per-change artifacts，兩者不要混用。
- 新專案應先建立或更新 `docs/README.md` 作為文件入口。
- 當變更影響 architecture、API contract、deployment、runtime constraints、operations、security posture 或 user-facing behavior 時，同步更新 `/docs`，或明確說明不需要更新的理由。
- 例行進度、聊天摘要、一次性 debug log 不放 `/docs`。
- 大型 generated artifacts、coverage、trace、build output 不提交到 `/docs`，除非它們是刻意維護的文件 artifact。
- 如果 `/docs` 與 OpenSpec/git/tests/shipped code 衝突，先信 OpenSpec/git/tests/shipped code，再修文件。

常見文件格式：

| 文件 | 內容 |
| --- | --- |
| `docs/README.md` | 文件索引與閱讀順序 |
| `docs/01-prd.md` | 產品目的、使用者、範圍、非目標、風險 |
| `docs/02-architecture.md` | 系統邊界、核心資料流、模組責任、外部依賴 |
| `docs/03-api.md` | API contract、request/response、錯誤語意、相容性 |
| `docs/04-deployment.md` | env、build、migration、deploy、rollback |
| `docs/05-operations.md` | runbook、監控、排障、資料修復 |
| `docs/06-decisions.md` | ADR/decision log；只記錄會長期影響架構或流程的決策 |

## 專案快照

從 template 初始化專案後，請填入：

- Frontend：`<framework / package path / key commands>`
- Backend：`<framework / package path / key commands>`
- Data store：`<database / migrations / seed strategy>`
- Runtime：`<local dev / deploy target / workers / queues>`
- External services：`<payments / auth / storage / third-party APIs>`

不要讓 template placeholder 長期留在正式專案。

## 工程規則

- 優先最小有用變更；不要為一次性用途新增 helper、base class、abstraction 或 dependency。
- 新增 package 前先檢查現有 dependencies。
- Bug fix 必須有 regression test 或清楚說明為何不能用 automated test。
- Read-only task 必須保持 read-only。
- 搜尋優先用 `rg` / `rg --files`。
- 保留 unrelated user changes；不要執行 destructive git commands，除非使用者明確要求。
- 不要只因 intent 或修改完成就宣稱 done；done 必須有 passing evidence。

## Security 與 Secrets

- 不要提交 secrets、tokens、private keys、`.env` 或 local permission files。
- `.env*.local`、`.env`、`.claude/settings.local.json` 應保持 local-only。
- 若變更 authentication、authorization、payments、webhooks、file upload、PII、logging、rate limits 或 admin tooling，verify 必須包含 security/reliability lens。
- 對外部服務 fallback、manual steps、credential assumptions 要明確寫出，不要默默假設。

## UI/UX 規則

在實作 interactive UI 前，先描述並取得確認：

- 使用者一開始會看到什麼。
- 互動後會發生什麼變化。
- 哪個 container 負責 scroll 或 overflow。

其他 UI constraints：

- Scroll 只套用在 data container，不要套用到整個 page。
- 用真實 viewport size 驗證 mobile/responsive layout。
- 改 layout 前先檢查相關 components，避免修好一個 view 但破壞另一個。
- 使用真實 labels 與 task language，不要使用 generic placeholder copy。

## Git / PR / Release

- 開 PR 前確認 branch、target branch、remote freshness、working tree status。
- PR title/body、release notes、handoff comment 預設使用繁體中文，除非 repo 或對象要求英文。
- Release/tag 建議必須先查 live remote tags 與實際 diff。
- Branch cleanup 只能在證明 merged 或 upstream gone 後做。
- 如果 target branch 被其他 worktree checkout，先用 `git worktree list` 判斷 ownership，不要 force checkout。

## Monorepo 與 Nested AGENTS

- Root `AGENTS.md` 只放全 repo 共通規則、source-of-truth map、workflow 與安全界線。
- 子專案、package、app、worker、infra 若有不同 build/test/deploy 規則，應在該目錄新增 nested `AGENTS.md`。
- 編輯檔案時，以最近的 `AGENTS.md` 為準；明確 user prompt 優先於所有 repo instructions。
- 若 write set 橫跨多個子專案，先確認 shared contract、API boundary 與 affected tests，再實作。

## AGENTS.md 維護規則

- 只記錄穩定、專案特有、會影響 agent 行為的規則。
- 避免重複 linter/formatter 已能強制的細節。
- 避免把 task-specific skill instruction 放進 root `AGENTS.md`；改放到 skill 或 nested file。
- 避免只列路徑不說用途；每個 reference 都要說明何時讀、讀它能解決什麼問題。
- 定期刪除 stale placeholders、已不存在的檔案、衝突規則與一次性 troubleshooting。

## 常見失敗模式

- 錯誤：把 Notion 當作 source of truth。正確：先確認 repo/OpenSpec/git/tests/shipped code，再同步 Notion。
- 錯誤：Verify 失敗後直接 ad hoc 編輯。正確：implementation 問題回 Apply，artifact 問題回 Update。
- 錯誤：沒有 disjoint ownership 就多 agents 同時寫同一 repo。正確：同一專案預設 serial。
- 錯誤：為方便新增 dependency。正確：先檢查目前 stack。
- 錯誤：對 failing command 用猜的。正確：在 Apply 用最小 reproducer 證明 root cause。
