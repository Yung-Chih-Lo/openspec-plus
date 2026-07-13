# 文件初始化

這個 checkout 仍是 OPSXP template，因此刻意不包含虛構的 app PRD 或 architecture。從 template 建立實際專案後，執行 `opsxp-setup`，用目前 repo evidence 與明確產品 intent 取代本頁。

Setup 首次完成時必須建立有內容的：

| 文件 | 內容 |
| --- | --- |
| `README.md` | 一句話目的、stack/package roots、runtime、外部服務、文件狀態與閱讀順序 |
| `01-prd.md` | 問題、使用者、範圍、非目標、主要行為與風險 |
| `02-architecture.md` | 系統邊界、核心資料流、模組責任、資料與外部依賴 |

下列文件只在對應能力存在時建立：

| 文件 | 建立條件 |
| --- | --- |
| `03-api.md` | 有 public、cross-service 或 compatibility-sensitive API contract |
| `04-deployment.md` | 已知 build、migration、deploy 或 rollback 流程 |
| `05-operations.md` | 有 production runbook、監控、排障或資料修復責任 |
| `06-decisions.md` 或 `decisions/` | 有需要長期保存的 architecture/product decision |

不要留下空白 placeholder，也不要把 per-change artifacts、例行進度、聊天摘要、debug log、coverage、trace 或 build output 放進這裡。Per-change artifacts 屬於 `openspec/changes/<change>/`。
