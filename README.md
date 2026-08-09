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
- `docs/tutorial/`：金句收藏助手的可編輯教學內容與離線 HTML 成品。
- `docs/develog.md`：開發決策與驗證紀錄。
- `tests/`：可在本機執行的純邏輯測試。

## 本機驗證

需要 Node.js 18 以上，不需安裝第三方套件。

```bash
npm test
npm run verify
node docs/tutorial/build.mjs
node /Users/lcc/.codex/skills/build-interactive-html-course/scripts/validate_course.mjs \
  --html docs/tutorial/quote-capture-guide.html \
  --content docs/tutorial/content.md
```

C-009 的離線結果為 `npm test` 22/22 通過、`npm run verify` 通過。`setupWebhookProject()` 可在沒有任何 secret 或既有 Script Property 時建立原生 `LINE 金句收藏庫`、保存 `SPREADSHEET_ID` 並建立／驗證 `Quotes`、`Events`；只有本次新建的 Sheet 會清除其空白預設分頁，既有 Sheet 的使用者分頁一律保留。

## 部署摘要

1. 分別建立兩個 Apps Script project，將 `webhook-app/src` 與 `review-app/src` 上傳。
2. Webhook owner 在 Apps Script editor 手動執行 `setupWebhookProject()` 並完成首次 OAuth；程式會建立或重用 Sheet，不需先提供 LINE／Gemini secrets。
3. 使用者日後自行把 Gemini API key 與其他 runtime 設定加入 Webhook Script Properties；預設模型為 `gemini-3.5-flash-lite`，複雜版面品質不足時可用 `GEMINI_MODEL` 覆寫為 `gemini-3.6-flash`。key 不應傳入對話、檔案或 Sheet。
4. Webhook manifest 固定為 `ANYONE_ANONYMOUS`／`USER_DEPLOYING`，並只允許存取 LINE API、LINE Data API 與 Gemini API；部署時核對 UI 為「執行身分：我；誰可以存取：任何人」。
5. Review 專案設定 `SPREADSHEET_ID`；manifest 固定為 `MYSELF`／`USER_DEPLOYING`，部署時核對 UI 為「執行身分：我；誰可以存取：只有我自己」。
6. 把 Review URL 寫入 Webhook 專案的 `REVIEW_APP_URL`。
7. LINE Developers webhook URL 使用：`WEBHOOK_DEPLOYMENT_URL?key=WEBHOOK_SECRET`。

完整設定與驗收步驟見 `docs/DEPLOYMENT.md`。OAuth 後 Sheet schema 與空白預設分頁清理均通過；Review 未登入請求 302 導向 Google login，權限邊界 `pass`；Webhook anonymous GET 回 200 且顯示預期的 missing `doGet`，匿名 access 邊界 `pass`。

教學成品是 `docs/tutorial/quote-capture-guide.html`，可直接離線開啟；公開授權見 `LICENSE`。

## 安全限制

- GAS `doPost(e)` 無法讀取 LINE 的 `x-line-signature`，v1 只適合私人 Bot。
- `WEBHOOK_SECRET` 與 `ALLOWED_LINE_USER_ID` 是自用防護，不等同 LINE 簽章驗證。
- 若日後開放多人使用，必須加入可驗證 LINE 簽章的 relay。
- LINE token、Gemini key、Sheet ID 與部署 URL 只存於 Script Properties，不可提交 Git。
- 圖片仍會傳送至 Gemini API；請勿上傳病人個資或其他敏感資料。
