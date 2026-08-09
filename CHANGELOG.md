# CHANGELOG

## Unreleased

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
