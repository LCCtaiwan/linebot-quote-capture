# CHANGELOG

## Unreleased

### C-001 — 2026-08-09

- 建立兩個獨立 Apps Script project 的單人金句收藏 MVP：匿名 LINE webhook 與僅本人 Review 頁共用同一 Sheet。
- 修正 LINE 圖片下載為 `api-data.line.me`；Gemini 改用 `x-goog-api-key`、current `responseFormat.text` JSON Schema wire shape 與 minimal thinking。
- 加入 Pending 條件式更新／刪除，避免交錯事件覆寫新候選；確認以 candidate ID 冪等，Pending 清除後重按仍回傳原 quote ID。
- 加入 Sheet schema、LINE 預覽長度、來源與標籤驗證，以及 Review 空結果顯示修正。
- 驗證：`npm test` 15/15 通過（包含 Gemini REST payload 契約）；`npm run verify` 通過。
- 尚未驗證：真實 GAS／LINE／Gemini／Google Sheet 整合與部署權限。
