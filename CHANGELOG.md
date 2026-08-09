# CHANGELOG

## Unreleased

### C-009 — 2026-08-09

- 依真實 Events 錯誤修正 Gemini 3.x structured output 的 `mimeType`，由 `application/json` 改為 API enum `APPLICATION_JSON`。
- 增加 Gemini HTTP 錯誤摘要，限制長度並遮罩 API key，方便從 `Events.note` 診斷而不暴露 credential。
- Webhook 已推送並更新至最新 deployment；`npm test` 22/22、`npm run verify` 通過。

### C-010 — 2026-08-09

- 建立 `docs/tutorial/` 教學內容計畫與風格決策，沿用既有 LINE Bot 教材的「任務工作台」方向。
- 教學涵蓋雙 GAS project、Sheet schema、Script Properties、LINE Webhook 開關、Gemini 預覽、確認寫入、Review 與開源安全檢查。
- 新增 `build.mjs`、單檔離線 `quote-capture-guide.html` 與 MIT `LICENSE`；內嵌 4 張不含機密的 LINE 操作截圖。
- 課程 validator 12/12 pass，無外部資源／缺失 DOM 參照；桌面導覽、勾選、講義模式與 Enter 操作 pass。GitHub 尚未推送。

### C-006 — 2026-08-09

- 使用者完成 Review OAuth 並在正確的 Review Apps Script project 儲存 `SPREADSHEET_ID`。
- 真實 Review deployment 已能讀取共用 Sheet，空資料狀態顯示「共 0 則收藏」；原本的缺少 Script Property 錯誤已消失。
- 驗證：Chrome 登入工作階段的實際部署頁 DOM 驗收通過；本輪只有文件更新，未重跑 C-005 的離線測試。

### C-005 — 2026-08-09

- Gemini 預設模型改為 `gemini-3.5-flash-lite`，用於文件擷取、結構化 JSON 與 minimal thinking；複雜版面品質不足時可手動覆寫為 `gemini-3.6-flash`。
- 新建 Sheet 在 Quotes／Events schema 成功後刪除本次 create 產生的空白預設分頁；既有 Sheet 的額外使用者分頁一律保留。
- OAuth 後 Sheet schema 與空白分頁清理通過；Webhook anonymous GET 200 且為預期 missing `doGet`，Review 未登入仍導向 Google login，兩個 access boundary 均 pass。
- 驗證：`npm test` 20/20 通過，`npm run verify` 通過；使用者回報已設定 Gemini key，代理未讀取或驗證內容；尚未執行 LINE／Gemini 真實整合。

### C-004 — 2026-08-09

- `setupWebhookProject()` 不再依賴 LINE／Gemini runtime secrets；缺少 `SPREADSHEET_ID` 時建立原生 `LINE 金句收藏庫` 並保存 ID，既有 ID 則重用。
- ScriptLock 保護 Sheet create／reuse 與 `Quotes`／`Events` schema setup，重複執行不建立第二份。
- 驗證：`npm test` 19/19 通過，`npm run verify` 通過；Gemini key 仍由使用者日後親自設定，本階段未接觸。
- HTTP：Review 未登入 302 至 Google login 為 pass；Webhook anonymous GET 403 為 revise，待 owner 首次 OAuth 後重測。

### C-003 — 2026-08-09

- 建立兩個獨立 standalone GAS projects，分別推送 Webhook 8 檔與 Review 4 檔。
- 兩個 project 均建立 @1 initial web app deployment。
- 尚未驗證 deployment HTTP access，也未建立 Sheet、執行 setup、設定 Script Properties 或建立 LINE channel。

### C-002 — 2026-08-09

- Webhook manifest 固定為匿名可呼叫、由 deployer 執行；Review manifest 固定為僅 deployer 可呼叫、由 deployer 執行。
- Webhook `urlFetchWhitelist` 僅允許 LINE API、LINE Data API 與 Gemini API 三個官方 HTTPS prefix；Review 不加入外部 fetch allowlist。
- 新增雙 manifest deployment 契約測試與靜態驗證；`npm test` 16/16 通過，`npm run verify` 通過。
- 尚未建立、推送或部署任何外部 GAS 資源。

### C-001 — 2026-08-09

- 建立兩個獨立 Apps Script project 的單人金句收藏 MVP：匿名 LINE webhook 與僅本人 Review 頁共用同一 Sheet。
- 修正 LINE 圖片下載為 `api-data.line.me`；Gemini 改用 `x-goog-api-key`、current `responseFormat.text` JSON Schema wire shape 與 minimal thinking。
- 加入 Pending 條件式更新／刪除，避免交錯事件覆寫新候選；確認以 candidate ID 冪等，Pending 清除後重按仍回傳原 quote ID。
- 加入 Sheet schema、LINE 預覽長度、來源與標籤驗證，以及 Review 空結果顯示修正。
- 驗證：`npm test` 15/15 通過（包含 Gemini REST payload 契約）；`npm run verify` 通過。
- 尚未驗證：真實 GAS／LINE／Gemini／Google Sheet 整合與部署權限。
