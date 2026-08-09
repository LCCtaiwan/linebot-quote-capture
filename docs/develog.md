# Development Log

## Current Goal

準備 LINE 金句收藏 MVP 的雙 GAS web app deployment 設定，並以本地契約測試鎖定匿名 Webhook 與私人 Review 的安全邊界。

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

## Accepted / Rejected Outputs

- Accepted：兩個獨立 GAS project 共用同一 Sheet。
- Rejected：同一 GAS project 以兩個 deployment 同時承載匿名 webhook 與私人 review。
- Rejected：用 CacheService 保存 10 分鐘 Pending。
- Rejected：v1 一圖多則金句。

## Current Checkpoint

- C-002 本地 deployment 設定與文件同步完成；外部資源尚未建立或部署。
- 真實 GAS、LINE、Gemini、Google Sheet 與 Review 權限整合尚未執行。

## Recommended Next Step

- 由使用者自行設定 `GEMINI_API_KEY`，再依 `docs/DEPLOYMENT.md` 建立外部資源並執行 P0–P3 人工驗收。

## Verification Status

- `npm test`：16/16 通過，包含 Gemini REST payload 與雙 manifest deployment 契約測試。
- `npm run verify`：通過。
- 文件已同步 C-001 的實作、風險修正與驗證狀態。
- 真實服務驗收：未執行。
