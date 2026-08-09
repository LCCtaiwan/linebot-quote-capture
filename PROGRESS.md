# PROGRESS

## 目前狀態

- C-004（2026-08-09）：無 secret Sheet provisioning 切片完成，等待 owner 首次 OAuth 與真實 setup 驗收。
- 範圍：setup 自動建立／重用 Sheet、保存 `SPREADSHEET_ID`、建立／驗證兩個 schema，並以 ScriptLock 防止重複建立。
- 驗證：`npm test` 19/19 通過；`npm run verify` 通過。

## 進行中

- Owner 手動執行 setup／OAuth、Webhook HTTP 重測、runtime Properties、LINE 與 Gemini 整合驗收。

## 下一步

- Owner 在 Apps Script editor 手動執行 `setupWebhookProject()` 完成首次 OAuth 並取得 Sheet。
- 重測 Webhook anonymous access；通過後由使用者自行放入 `GEMINI_API_KEY`，再設定 LINE 並執行 P0–P3 驗收。

## 備註

- 真實 token、API key、Sheet ID 與部署 URL 不進入 Git。
- 原圖不持久保存。
- Review anonymous HTTP auth boundary 已 pass；Webhook GET 403 為 revise，需首次 OAuth 後重測。
- Gemini key 未接觸；setup、Sheet、runtime Properties 與 LINE 仍未實際完成。
