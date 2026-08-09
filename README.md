# LINE 金句收藏庫

這是一個單人自用、可開源的 LINE Bot。使用者上傳書頁、閱讀器截圖或海報後，Gemini 會擷取一則金句、分類與標籤；使用者在 LINE 確認後，內容才會寫入 Google Sheet，並可在另一個受 Google 帳號保護的 GAS Web App 回顧。

## 核心流程

1. LINE 圖片送到匿名部署的 Webhook GAS 專案。
2. 圖片只在記憶體中交給 Gemini，不保存到 Google Drive。
3. Bot 回覆金句預覽，提供確認、修改、取消。
4. 確認後寫入 `Quotes` 工作表並回覆收藏編號。
5. Review GAS 專案以「只有我自己」部署，提供搜尋、分類／標籤篩選與隨機回顧。

## 專案結構

- `webhook-app/`：匿名 LINE webhook；不含可讀取收藏資料的 `doGet`。
- `review-app/`：僅本人可開啟的回顧頁；不含 `doPost`。
- `docs/SDD.md`：系統與資料設計。
- `docs/DEPLOYMENT.md`：雙 GAS 專案設定、部署與人工驗收。
- `docs/develog.md`：開發決策與驗證紀錄。
- `tests/`：可在本機執行的純邏輯測試。

## 本機驗證

需要 Node.js 18 以上，不需安裝第三方套件。

```bash
npm test
npm run verify
```

C-002 的離線結果為 `npm test` 16/16 通過、`npm run verify` 通過。測試會檢查 Gemini 3.6 的 current `responseFormat.text` REST payload，以及 Webhook／Review 的 web app access、執行身分與 outbound URL allowlist；不會呼叫 LINE、Gemini、Google Sheet 或已部署的 GAS，真實整合仍須依部署指南人工驗收。

## 部署摘要

1. 建立一份 Google Sheet。
2. 分別建立兩個 Apps Script project，將 `webhook-app/src` 與 `review-app/src` 上傳。
3. 使用者自行把 Gemini API key 與其他設定加入 Webhook 專案的 Script Properties，再執行 `setupWebhookProject()`；key 不應傳入對話、檔案或 Sheet。
4. Webhook manifest 固定為 `ANYONE_ANONYMOUS`／`USER_DEPLOYING`，並只允許存取 LINE API、LINE Data API 與 Gemini API；部署時核對 UI 為「執行身分：我；誰可以存取：任何人」。
5. Review 專案設定 `SPREADSHEET_ID`；manifest 固定為 `MYSELF`／`USER_DEPLOYING`，部署時核對 UI 為「執行身分：我；誰可以存取：只有我自己」。
6. 把 Review URL 寫入 Webhook 專案的 `REVIEW_APP_URL`。
7. LINE Developers webhook URL 使用：`WEBHOOK_DEPLOYMENT_URL?key=WEBHOOK_SECRET`。

完整設定與驗收步驟見 `docs/DEPLOYMENT.md`。目前真實 LINE、Gemini 與部署驗收尚未執行。

## 安全限制

- GAS `doPost(e)` 無法讀取 LINE 的 `x-line-signature`，v1 只適合私人 Bot。
- `WEBHOOK_SECRET` 與 `ALLOWED_LINE_USER_ID` 是自用防護，不等同 LINE 簽章驗證。
- 若日後開放多人使用，必須加入可驗證 LINE 簽章的 relay。
- LINE token、Gemini key、Sheet ID 與部署 URL 只存於 Script Properties，不可提交 Git。
- 圖片仍會傳送至 Gemini API；請勿上傳病人個資或其他敏感資料。
