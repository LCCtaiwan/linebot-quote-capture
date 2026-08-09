# PROGRESS

## 目前狀態

- C-006（2026-08-09）：Review OAuth、`SPREADSHEET_ID` 與真實 Sheet 讀取驗收完成。
- 範圍：已登入的 Review deployment 可正常載入收藏頁；空資料狀態顯示「共 0 則收藏」，不再出現缺少 Script Property 錯誤。
- 驗證：Chrome 真實部署頁 DOM 驗收 pass；C-005 的 `npm test` 20/20 與 `npm run verify` 結果維持有效，本輪僅更新文件、未重跑程式測試。

## 進行中

- 剩餘 Webhook runtime Properties、LINE 與 Gemini 整合驗收。

## 下一步

- 設定剩餘 LINE token、allowed user、webhook secret、Review URL 等 runtime Properties 與 LINE，再執行 P0–P3 驗收。
- 若複雜版面辨識不足，以 `GEMINI_MODEL=gemini-3.6-flash` 做受控 override 比較。

## 備註

- 真實 token、API key、Sheet ID 與部署 URL 不進入 Git。
- 原圖不持久保存。
- Review anonymous HTTP auth boundary 與登入後真實 Sheet 讀取均 pass；Webhook anonymous GET 200 且為預期 missing `doGet`，access boundary 已 pass。
- 使用者已回報將 `GEMINI_API_KEY` 存入 Webhook Script Properties；代理未讀取或驗證內容。setup／Sheet schema 已完成，剩餘 Webhook runtime Properties、LINE 與 Gemini 真實辨識仍未完成。
