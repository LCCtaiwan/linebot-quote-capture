# Deployment Guide

## 1. 準備服務

需要：

- 一個 LINE Official Account 與 Messaging API channel。
- 一個 Gemini API key。
- 一份空白 Google Sheet。
- 兩個獨立的 Apps Script project。

請勿把任何 key、token、Sheet ID 或 deployment URL 寫入本專案檔案。

## 2. 建立共用 Google Sheet

1. 建立空白試算表。
2. 從網址複製 spreadsheet ID。
3. 工作表可保持空白；Webhook 專案的 `setupWebhookProject()` 會建立 `Quotes` 與 `Events`。

## 3. 建立 Webhook Project W

1. 新增 standalone Apps Script project。
2. 將 `webhook-app/src` 內所有 `.gs` 與 `appsscript.json` 上傳。
3. 在 Project Settings → Script Properties 新增：

| Property | 內容 |
| --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API channel access token |
| `GEMINI_API_KEY` | 由使用者自行建立並直接貼入此 Script Property；不要傳給代理、寫入檔案或 Sheet |
| `SPREADSHEET_ID` | 共用試算表 ID |
| `ALLOWED_LINE_USER_ID` | LINE Developers Basic settings 顯示的 Your user ID |
| `WEBHOOK_SECRET` | 自行產生的高強度 URL-safe 隨機字串 |
| `GEMINI_MODEL` | 預設 `gemini-3.6-flash`；可依可用模型調整 |
| `REVIEW_APP_URL` | Review project 部署完成後再填 |

4. 在 Apps Script 編輯器執行 `setupWebhookProject()` 並完成 Google 授權。
5. 確認 Sheet 已出現 `Quotes` 與 `Events`，且標題列正確。
6. Deploy → New deployment → Web app：
   - Execute as：Me。
   - Who has access：Anyone。
   - 上傳前確認 manifest `webapp` 為 `ANYONE_ANONYMOUS`／`USER_DEPLOYING`。
   - 確認 `urlFetchWhitelist` 只有 `https://api.line.me/`、`https://api-data.line.me/`、`https://generativelanguage.googleapis.com/`。
7. LINE Developers webhook URL 設為：

```text
WEBHOOK_DEPLOYMENT_URL?key=WEBHOOK_SECRET
```

8. 開啟 Use webhook，先使用 Verify 確認端點可回應。

Webhook 下載 LINE 圖片時使用 `api-data.line.me`；Gemini key 透過 `x-goog-api-key` header 傳送，不出現在 URL。程式使用 current `generationConfig.responseFormat.text` JSON Schema 結構化輸出與 minimal thinking，以降低同步預覽的延遲；Reply 無法送出時才改用 Push。

## 4. 建立 Review Project R

1. 新增另一個 standalone Apps Script project，不可與 Webhook project 共用同一個 script project。
2. 將 `review-app/src` 上傳。
3. 新增 Script Property：

| Property | 內容 |
| --- | --- |
| `SPREADSHEET_ID` | 與 Webhook project 相同的試算表 ID |

4. 執行 `setupReviewProject()` 並完成 Google 授權。
5. Deploy → New deployment → Web app：
   - Execute as：Me。
   - Who has access：Only myself。
   - 上傳前確認 manifest `webapp` 為 `MYSELF`／`USER_DEPLOYING`，且沒有 `urlFetchWhitelist`。
6. 開啟 deployment URL，確認 Google 登入後可看到空資料狀態。
7. 把這個 URL 寫入 Webhook project 的 `REVIEW_APP_URL`。

## 5. LINE 人工驗收

依序測試，每項記錄 `pass`、`revise` 或 `reject`：

1. 傳送一張有單一螢光標註的書頁。
2. 確認 Bot 回覆金句、固定分類與 2–5 個標籤。
3. 按「確認儲存」，確認 Sheet 只新增一列並回覆 `Q-####`。
4. 再次觸發相同確認，不得新增第二列。
5. 上傳另一張圖，按「修改金句」，輸入正確文字並確認重新分類結果。
6. 測試取消與超過 10 分鐘後的 postback。
7. 輸入 `回顧`，確認回傳 Review URL。
8. 在 Review 頁測試搜尋、六類篩選、標籤篩選與隨機回顧。
9. 使用非擁有者 Google 帳號開啟 Review URL，應被 Google 阻擋。

另測試：在已成功寫入後再次按相同確認，即使 Pending 已清除，也必須依 candidate ID 回傳同一個 `Q-####`；快速交錯操作舊候選與新圖片時，舊修改／取消不得覆寫或刪除新 Pending。

## 6. 安全驗收

- Git 追蹤檔沒有 token、API key、Sheet ID 或 deployment URL。
- Webhook project 不含任何讀取 Quotes 的 `doGet`。
- Review project 不含 `doPost`。
- Review HTML 沒有 CDN、外部字型或圖床。
- Drive 中沒有因此專案產生的原始圖片。
- Webhook／Review 實際 deployment access 與各自 manifest 一致；Webhook 的 outbound URL allowlist 沒有額外網域。

## 7. 目前驗證狀態

- C-002 離線測試：`npm test` 16/16 通過，包含 Gemini REST payload 與雙 manifest 部署契約測試。
- C-002 靜態驗證：`npm run verify` 通過。
- 尚未執行：真實 GAS 部署、LINE webhook、Gemini 圖像辨識、Google Sheet 寫入與 Review 帳號權限驗收。

## 8. 公開多人使用前

目前純 GAS 入口無法讀取 `x-line-signature`，不得直接當成公開多人服務。公開前要加入能驗證 LINE 簽章的 relay，並重新設計使用者隔離、配額與隱私政策。
