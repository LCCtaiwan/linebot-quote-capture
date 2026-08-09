# System Design Document

## 1. Architecture

系統拆成兩個獨立 Apps Script project，共用一份 Google Sheet：

- Webhook Project W：匿名 Web App，只處理 LINE `doPost`。程式不提供任何讀取收藏資料的 `doGet`。
- Review Project R：只有本人可存取的 Web App，只提供回顧頁 `doGet`，不接收 webhook。

此拆分避免匿名 webhook deployment 暴露回顧資料。

## 2. Webhook Data Flow

1. 以 query secret、LINE user ID allowlist 與 webhook event ID 檢查事件。
2. `recentEvents` 將事件標為 `P`；120 秒內的重送視為在途事件。
3. 從 LINE 專用資料端點 `api-data.line.me` 取得圖片 Blob，直接 inline 傳送 Gemini。
4. 以 `x-goog-api-key` header 呼叫 Gemini，使用 current `generationConfig.responseFormat.text` JSON Schema wire shape、`minimal` thinking 並在本地再次驗證結果；建立唯一 candidate ID 後先存入 Script Properties。
5. 用 LINE reply 傳預覽；reply 失敗時使用 Push API。
6. 確認時以 candidate ID 查詢 `Quotes`；不存在才新增。
7. `SpreadsheetApp.flush()` 成功後才清除 Pending；即使先前已寫入且 Pending 已清除，重複確認仍先以 candidate ID 查詢 `Quotes` 並回傳原 quote ID。

可預期錯誤會通知使用者重新上傳並將事件標為完成；非預期例外可上浮。正確性不依賴 LINE redelivery。

## 3. Candidate State

每位使用者只有一個 `pending_<userId>`：

- `PENDING`：等待確認、修改或取消。
- `AWAITING_EDIT`：下一則文字會取代金句並重新分類。
- 超過 10 分鐘：下次操作時清除並回覆逾時。
- Pending 的設定、條件式更新與條件式刪除由 Script Lock 保護；較舊的修改／取消事件不得覆寫或刪除新圖片建立的候選。

候選內容包含：candidate ID、建立時間、quote、category、tags、source title、source author、source type、extraction basis。

## 4. Event State

Script Property `recentEvents` 保存 JSON map：

```text
eventId -> [P|D, epochMs]
```

- `P`：Processing。
- `D`：Done。
- 每次更新時移除超過一小時者。
- 最多保留最新 100 筆。
- 由 Script Lock 保護讀改寫。

`Events` Sheet 僅供審計，不是正確性權威。

## 5. Sheet Schema

### Quotes

```text
quote_id, candidate_id, created_at, quote_text, category, tags,
source_title, source_author, source_type, extraction_basis, status
```

`candidate_id` 是冪等鍵；`Quotes` 是收藏是否存在的唯一權威。

### Events

```text
created_at, webhook_event_id, event_type, action,
candidate_id, quote_id, status, note
```

## 6. Gemini Contract

Gemini 必須回傳單一 JSON object：

```json
{
  "quote": "string",
  "category": "六個固定分類之一",
  "tags": ["2 至 5 個繁體中文標籤"],
  "sourceTitle": "string or empty",
  "sourceAuthor": "string or empty",
  "sourceType": "book_page | reader | poster | unknown",
  "extractionBasis": "highlight | underline | box | representative | poster_primary"
}
```

解析器會拒絕空金句、非法分類、少於 2 或多於 5 個標籤，以及非法 enum。

為確保 LINE 預覽能送出，金句上限為 3,000 字、來源欄位上限為 200 字、單一標籤上限為 40 字，標籤不得含逗號。Gemini 3.6 不傳送已 deprecated 的 sampling 參數；API key 僅由使用者自行存入 Webhook Script Properties。

## 7. Security

- 所有 secret 只放 Script Properties。
- Webhook 的 query secret 與 user allowlist 是私人 Bot 防護，不宣稱等同 LINE signature。
- Review project 以 Google deployment 權限限制為「只有我自己」。
- Review HTML 無 CDN、外部字型、圖床或外部連結。
- 圖片不保存，但仍會送往 Gemini API；不得處理敏感資料。

## 8. Failure Handling

- 圖片下載、Gemini、JSON schema 失敗：不建立 Pending，通知重新上傳。
- Reply 失敗：Push 同一預覽。
- Sheet append 失敗：保留 Pending。
- Append 成功但回覆失敗：下次確認依 candidate ID 找到原列，回同一 quote ID。
- Pending 不存在、不相符或逾時：不寫入並要求重新上傳。
- `Quotes`／`Events` 與 Review 讀取前會檢查標題 schema；欄位不符時停止，避免把資料寫入錯誤欄位。
