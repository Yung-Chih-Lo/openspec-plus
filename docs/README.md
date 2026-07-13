# 文件索引

這個目錄放長期、跨 change 的專案文件。從 `project_template` 初始化新專案後，請依實際需要建立或刪除下列文件。

| 文件 | 用途 |
| --- | --- |
| `01-prd.md` | 產品目的、使用者、範圍、非目標、主要風險 |
| `02-architecture.md` | 系統邊界、核心資料流、模組責任、外部依賴 |
| `03-api.md` | API contract、request/response、錯誤語意、相容性 |
| `04-deployment.md` | env、build、migration、deploy、rollback |
| `05-operations.md` | runbook、監控、排障、資料修復 |
| `06-decisions.md` | ADR/decision log；只記錄會長期影響架構或流程的決策 |

不要把例行進度、聊天摘要、一次性 debug log、coverage、trace 或 build output 放進這裡。Per-change artifacts 應放在 `openspec/changes/<change>/`。
