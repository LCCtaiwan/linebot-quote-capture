# Deployment Guide

## 1. 準備服務

需要：

- 一個 LINE Official Account 與 Messaging API channel。
- 一個 Gemini API key。
- 一份由 setup 自動建立或重用的 Google Sheet。
- 兩個獨立的 Apps Script project。

請勿把任何 key、token、Sheet ID 或 deployment URL 寫入本專案檔案。

## 2. 建立共用 Google Sheet

不需先手動建立試算表。首次執行 Webhook 專案的 `setupWebhookProject()` 時：

1. 若沒有 `SPREADSHEET_ID`，建立原生 `LINE 金句收藏庫` 並把新 ID 寫入 Script Properties。
2. 若已有 `SPREADSHEET_ID`，重用該 Sheet，不建立第二份。
3. 建立或驗證 `Quotes` 與 `Events`；整段流程由 ScriptLock 保護。

## 3. 建立 Webhook Project W

1. 新增 standalone Apps Script project。
2. 將 `webhook-app/src` 內所有 `.gs` 與 `appsscript.json` 上傳。
3. 在 Apps Script editor 手動執行 `setupWebhookProject()`，完成 owner 首次 OAuth。這一步不需要 LINE token、Gemini key、user ID 或 webhook secret；回傳 ready 狀態與 Sheet URL。
4. 確認 Sheet 已出現 `Quotes` 與 `Events`，且標題列正確。
5. 在 Project Settings → Script Properties 補上 runtime 設定：

| Property | 內容 |
| --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API channel access token |
| `GEMINI_API_KEY` | 由使用者自行建立並直接貼入此 Script Property；不要傳給代理、寫入檔案或 Sheet |
| `SPREADSHEET_ID` | setup 已自動寫入；只有要改用既有 Sheet 時才預先設定 |
| `ALLOWED_LINE_USER_ID` | LINE Developers Basic settings 顯示的 Your user ID |
| `WEBHOOK_SECRET` | 自行產生的高強度 URL-safe 隨機字串 |
| `GEMINI_MODEL` | 預設 `gemini-3.6-flash`；可依可用模型調整 |
| `REVIEW_APP_URL` | Review project 部署完成後再填 |

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

- C-004 離線測試：`npm test` 19/19 通過；靜態驗證：`npm run verify` 通過。
- C-004 setup 不依賴任何 secret；Gemini key 仍由使用者日後親自放入 Script Properties，本階段未接觸。
- C-003：兩個 standalone GAS projects 已建立；Webhook 8 檔與 Review 4 檔已推送；兩邊 @1 deployment 已建立成功。
- Review 未登入 HTTP 302 至 Google login：`pass`。
- Webhook anonymous GET 403 access denied：`revise`。Owner 必須先在 editor 手動執行 setup 完成新增 scopes 的首次 OAuth，再重測；授權後結果仍需實測，不預先歸因於帳號政策。
- 尚未執行：setup 真實建立 Sheet、runtime Script Properties、LINE webhook、Gemini 圖像辨識與 Sheet 寫入驗收。

## 8. 公開多人使用前

目前純 GAS 入口無法讀取 `x-line-signature`，不得直接當成公開多人服務。公開前要加入能驗證 LINE 簽章的 relay，並重新設計使用者隔離、配額與隱私政策。
