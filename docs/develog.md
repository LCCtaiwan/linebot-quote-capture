# Development Log

## Current Goal

完成 C-006 Review OAuth、Property 與真實 Sheet 讀取驗收，準備 LINE 與 Gemini runtime 整合。

## Stack And Run Commands

- Google Apps Script V8
- LINE Messaging API
- Gemini multimodal API
- Google Sheets
- Node.js built-in test runner

```bash
npm test
npm run verify
```

## Brainstorming Summary

- 主要價值是把使用者已標註的句子快速轉成可回顧資料，而不是完整 OCR 書頁。
- 正常路徑維持「傳圖、確認」兩步。
- v1 一圖一則，降低 LINE 預覽與修改複雜度。
- 不保存原圖；人工確認是辨識品質的必要驗收。
- 匿名 webhook 與私人回顧頁必須物理拆成兩個 Apps Script project。

## SDD

- `docs/SDD.md` 已定義架構、狀態、schema、安全與錯誤處理。
- `Quotes` 是收藏權威；`Events` 只供審計。
- Pending 使用 Script Properties，不使用無保證的 CacheService。

## Important Project Rules

- 不提交任何 secret 或部署網址。
- Webhook project 不得提供回顧資料 `doGet`。
- Review project 不得提供匿名寫入 `doPost`。
- 圖片不得寫入 Drive、Sheet 或 repo。

## Completed Work

- 2026-08-09 C-001：完成 brainstorming、SPEC 與 SDD 初稿。
- 2026-08-09 C-001：完成 Webhook／Review 雙 GAS 專案、LINE／Gemini／Sheet adapter、回顧頁與離線測試。
- 2026-08-09 C-001：修正 LINE Content API domain、Gemini 3.6 current `responseFormat.text` 結構化輸出與低延遲設定、Pending 競態及 candidate ID 重複確認。
- 2026-08-09 C-001：加入 Sheet schema、預覽長度與輸入欄位驗證；Gemini key 明定由使用者自行直接放入 Script Properties。
- 2026-08-09 C-002：依官方 manifest schema 加入 Webhook `ANYONE_ANONYMOUS`、Review `MYSELF` 與共同 `USER_DEPLOYING` 設定。
- 2026-08-09 C-002：Webhook outbound URL allowlist 限於 LINE API、LINE Data API 與 Gemini API；新增 manifest 契約測試與 verify assertions。
- 2026-08-09 C-003：建立兩個獨立 standalone GAS projects，推送 Webhook 8 檔與 Review 4 檔，並各建立 @1 initial web app deployment。
- 2026-08-09 C-004：setup 可在無任何 property 時建立原生 `LINE 金句收藏庫`、保存 ID 並建立／驗證 Quotes、Events；ScriptLock 防止重複建立。
- 2026-08-09 C-004：Review anonymous auth 302 Google login 為 pass；Webhook GET 403 為 revise，待 owner 首次 OAuth 後重測；Gemini key 未接觸。
- 2026-08-09 C-005：Gemini 預設改為 `gemini-3.5-flash-lite`；複雜版面可手動覆寫 `gemini-3.6-flash`。
- 2026-08-09 C-005：新建 Sheet 的空白預設分頁只在 Quotes／Events schema 成功後清除；既有 Sheet 額外分頁保留。
- 2026-08-09 C-005：OAuth 後 Sheet schema／空白分頁清理、Webhook anonymous GET 200 expected missing `doGet`、Review auth boundary 均 pass。
- 2026-08-09 C-006：Review OAuth 與 `SPREADSHEET_ID` 設定完成；真實 deployment 成功讀取 Sheet，顯示「共 0 則收藏」。

## Accepted / Rejected Outputs

- Accepted：兩個獨立 GAS project 共用同一 Sheet。
- Rejected：同一 GAS project 以兩個 deployment 同時承載匿名 webhook 與私人 review。
- Rejected：用 CacheService 保存 10 分鐘 Pending。
- Rejected：v1 一圖多則金句。

## Current Checkpoint

- C-005 本地程式與測試完成；真實 Sheet schema、雙 deployment access boundary 與 Review 登入後讀取均 pass。
- 使用者已回報將 `GEMINI_API_KEY` 存入 Webhook Script Properties；代理未讀取或驗證內容。剩餘 Webhook runtime Properties、LINE、Gemini 真實辨識尚未完成。

## Recommended Next Step

- 設定剩餘 LINE token、allowed user、webhook secret、Review URL 等 runtime Properties，再完成 LINE 與 P0–P3 驗收。

## Verification Status

- `npm test`：20/20 通過，包含新建空白分頁清理、既有使用者分頁保留與原有 schema／lock 契約。
- `npm run verify`：通過。
- C-005 模型、Sheet 與 HTTP checkpoint 已同步。
- C-006 Review 真實部署頁：OAuth、`SPREADSHEET_ID` 與 Sheet 讀取 pass；空資料狀態顯示「共 0 則收藏」。
- 真實服務驗收：Sheet／HTTP boundary／Review runtime pass；LINE／Gemini runtime 未執行。
