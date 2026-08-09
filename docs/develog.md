# Development Log

## Current Goal

完成 C-009 Gemini 400 修正後的圖片端到端驗收，並製作可公開的金句收藏助手 HTML 教學與 GitHub 發佈準備。

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
- 2026-08-09 C-007：LINE Manager 原本 Webhook 關閉且自動回應開啟；已切換為 Webhook 開啟、預設自動回應停用，並確認自動回應頁顯示停用中。
- 2026-08-09 C-008：真實圖片事件寫入 `Events`，確認 Gemini 回傳 HTTP 400；加入限長且遮罩 key 的錯誤摘要，部署最新版本以取得可診斷訊息。
- 2026-08-09 C-009：依 `Events.note` 修正 Gemini 3.x `mimeType` 為 `APPLICATION_JSON`；`npm test` 22/22、`npm run verify` 通過，Webhook 已更新至最新 deployment。
- 2026-08-09 C-010：找到並研究既有 `clinical-automation-course` LINE Bot 教材，建立本專案 `docs/tutorial/content.md`、`style-directions.md` 與 README；沿用 C｜任務工作台。
- 2026-08-09 C-010：新增 `docs/tutorial/build.mjs` 與單檔 `quote-capture-guide.html`，內嵌 4 張不含機密的操作截圖；新增 MIT `LICENSE`。
- 2026-08-09 C-010：課程 validator 12/12 pass、無外部資源與缺失 DOM 參照；桌面導覽、勾選、講義模式、Enter 鍵操作 pass；CSS 760px breakpoint 已檢查，瀏覽器控制介面未提供 viewport 設定。
- 2026-08-09 C-011：使用者回報右側淺色資訊卡「有字但是空白」；確認原因是卡片沿用 body 的白字，加入深色文字覆寫，瀏覽器計算色彩與截圖驗收 pass。
- 2026-08-09 C-012：使用者回報不理解為何需要兩個 GAS project；將第 02 頁改成收件門／私人書櫃比喻，補上匿名 webhook 與私人 Review 的 manifest 風險對照。

## Accepted / Rejected Outputs

- Accepted：兩個獨立 GAS project 共用同一 Sheet。
- Rejected：同一 GAS project 以兩個 deployment 同時承載匿名 webhook 與私人 review。
- Rejected：用 CacheService 保存 10 分鐘 Pending。
- Rejected：v1 一圖多則金句。

## Current Checkpoint

- C-009 程式修正與離線驗證 pass；LINE Webhook 開關、預設自動回應、Properties、Sheet schema 與 Review access boundary 已完成。
- 仍待：重新圖片測試確認 `APPLICATION_JSON` 修正成功；確認後再按下 LINE postback，驗收 `Quotes`／`Events` 與 Review。
- GitHub blockers：沒有 `origin`，`gh auth status` 顯示既有 token 無效；不會在未重新登入與未確認 license 前推送。

## Recommended Next Step

1. 請使用者重新傳送同一張測試圖片，讀取新 `Events.note` 或預覽結果。
2. 預覽成功後按「確認儲存」，讀取 `Quotes`／`Events` 並驗收 Review。
3. 使用者重新登入 GitHub，確認 `LICENSE` 的 MIT 版權持有人文字與公開範圍後建立 remote 並推送。
4. 推送後把 GitHub URL 回填到教學與 README（不回填任何 deployment URL 或 secret）。

## Verification Status

- `npm test`：22/22 通過，包含 Gemini error diagnostic、`APPLICATION_JSON` wire shape、新建空白分頁清理、既有使用者分頁保留與原有 schema／lock 契約。
- `npm run verify`：通過。
- C-005 模型、Sheet 與 HTTP checkpoint 已同步。
- C-006 Review 真實部署頁：OAuth、`SPREADSHEET_ID` 與 Sheet 讀取 pass；空資料狀態顯示「共 0 則收藏」。
- 真實服務驗收：Sheet／HTTP boundary／Review runtime pass；LINE Webhook 已實際收到圖片；第一次 Gemini 呼叫因 `mimeType=application/json` 400，C-009 已修正，第二次成功結果尚待確認。
