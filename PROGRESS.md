# PROGRESS

## 目前狀態

- C-002（2026-08-09）：本地 GAS web app deployment 設定完成，等待外部建立與部署。
- 範圍：Webhook／Review manifest access、執行身分、Webhook outbound URL allowlist 與契約驗證。
- 驗證：`npm test` 16/16 通過；`npm run verify` 通過。

## 進行中

- 真實 GAS、LINE、Gemini、Google Sheet 與 Review deployment 整合驗收。

## 下一步

- 由使用者自行把 `GEMINI_API_KEY` 放入 Webhook Script Properties。
- 建立並設定實際 LINE、Google Sheet 與兩個 GAS project，依 `docs/DEPLOYMENT.md` 執行 P0–P3 人工驗收。

## 備註

- 真實 token、API key、Sheet ID 與部署 URL 不進入 Git。
- 原圖不持久保存。
- 尚未建立或部署任何外部資源，也未執行真實 API 呼叫。
