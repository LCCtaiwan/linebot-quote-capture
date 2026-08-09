# PROGRESS

## 目前狀態

- C-009（2026-08-09）：修正 Gemini 3.x structured output 的 `mimeType` enum，Webhook 已部署至最新版本；真實 Events 已確認原先 400 原因。
- C-006：Review OAuth、`SPREADSHEET_ID` 與真實 Sheet 讀取驗收完成；空資料狀態顯示「共 0 則收藏」。
- 教學：已建立 `docs/tutorial/content.md`、`style-directions.md`、`build.mjs` 與單檔 `quote-capture-guide.html`，沿用既有 LINE Bot 教材的「任務工作台」方向；課程 validator 與桌面互動驗收 pass。
- C-011：已修正淺色資訊卡白字造成的空白感，重新建置 HTML 並確認文字色可讀。
- C-012：已重寫第 02 頁，用「收件門／私人書櫃」與合併風險解釋雙 project 必要性。
- C-013：Review 頁已改為私人閱讀書房視覺，並補上 UTF-8／viewport 宣告；桌面版面與中文顯示驗收 pass。
- Review 線上 deployment 已更新至 C-013 版本 2；匿名開啟導向 Google 登入 pass，登入後內容尚待使用者工作階段確認。
- 驗證：`npm test` 22/22、`npm run verify` pass；Webhook／Review／Sheet schema 與 LINE 開關已完成，Gemini 修正後的成功圖片流程待再次確認。

## 進行中

- 重新傳送一張測試圖片，確認 Gemini 預覽、確認寫入 `Quotes`／`Events` 與 Review 顯示。
- GitHub 發佈：目前尚無 `origin`，GitHub CLI 登入 token 已失效。

## 下一步

- 先通過 Gemini 圖片與 Sheet／Review 端到端驗收。
- 使用者重新登入 GitHub 後，確認 `LICENSE` 的 MIT 版權持有人文字與公開範圍，再建立 remote、commit、push。

## 備註

- 真實 token、API key、Sheet ID 與部署 URL 不進入 Git。
- 原圖不持久保存。
- Review anonymous HTTP auth boundary 與登入後真實 Sheet 讀取均 pass；Webhook anonymous GET 200 且為預期 missing `doGet`，access boundary 已 pass。
- 使用者已回報將 `GEMINI_API_KEY` 存入 Webhook Script Properties；代理未讀取或回顯內容。真實 LINE Webhook 已開啟、預設自動回應已停用；Gemini 曾回傳 400，Events 已記錄具體 `mimeType` enum 錯誤，C-009 已修正並部署。
- `quote-capture-guide.html` 內嵌 4 張不含機密的 LINE 操作截圖；課程 validator：12/12、無外部資源；桌面 1280px DOM／導覽／勾選／講義模式／Enter 操作 pass。手機 breakpoint 已在 CSS 與內容檢查，瀏覽器控制介面未提供可設定 viewport 的通道。
