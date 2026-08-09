# Course Content Plan

## Course Brief

- **課程主題**：金句收藏助手：LINE 圖片 → Gemini 辨識 → Google Sheet → Review
- **對象與先備知識**：會使用 LINE、Google 帳號與瀏覽器的零基礎學員；不預設懂 GAS、API、Provider 或 Webhook
- **時間**：導覽 15 分鐘；實作與驗收 30–45 分鐘
- **學習目標**：看懂雙 Apps Script project 架構、完成必要 OAuth／Script Properties／LINE Webhook 設定、用一張圖片驗收辨識與收藏流程
- **學員最後產物**：一個私人 LINE 金句收藏助手、共用 `Quotes`／`Events` Sheet，以及只限本人登入的 Review 頁
- **允許來源**：本專案的 `README.md`、`SPEC.md`、`docs/SDD.md`、`docs/DEPLOYMENT.md`、`PROGRESS.md`、`docs/develog.md`；既有 LINE 教材的操作風格；LINE Developers、Google Apps Script、Gemini API 官方文件
- **排除來源**：任何真實 token、API key、Webhook secret、Sheet ID、deployment URL；未驗證的第三方教學；需要多人公開服務的進階 relay
- **交付模式**：單檔離線 HTML／桌面／手機／列印講義

## Course Flow

1. 先看懂資料流與安全邊界。
2. 完成 LINE Official Account／Messaging API 與 Webhook 開關。
3. 完成 Webhook／Review 兩個 GAS project 的 OAuth 與 properties。
4. 用圖片驗收 Gemini 預覽、確認寫入 Sheet 與 Review 顯示。
5. 以開源檢查清單確認沒有把 secret 帶入 GitHub。

## 01｜這個專案要解決什麼

**頁面目的**：理解「傳圖、預覽、確認、回顧」的完整成果與範圍。

**建議版型**：成果流程卡＋不保存原圖的安全提醒。

**畫面文字**

- LINE 傳書頁／海報
- Gemini 擷取一則金句、分類與標籤
- 使用者確認後才寫入 Google Sheet
- Review 頁搜尋、篩選與隨機回顧
- v1 單人自用；原圖不保存

**講者補充**：這不是公開多人服務；`WEBHOOK_SECRET` 與白名單 user ID 是自用防護，不等同 LINE 簽章驗證。

**互動**：點「開始實作」→ 顯示資料流；鍵盤 Enter／Space 可啟動；離線版以文字流程呈現。

## 02｜先看懂雙專案架構

**頁面目的**：知道為什麼 Webhook 與 Review 必須分開。

**建議版型**：左右雙欄架構圖，中間連到同一份 Sheet。

**畫面文字**

- LINE webhook 是「收件門」：LINE 必須能把事件送進來，不能要求 Google 登入
- Review 是「私人書櫃」：會顯示收藏內容，只允許本人 Google 登入
- Webhook GAS 沒有讀取收藏的 `doGet`；Review GAS 沒有匿名寫入的 `doPost`
- Google Sheet：`Quotes` 是收藏權威；`Events` 是審計紀錄

**講者補充**：如果把兩者放進同一個匿名 project，為了讓 LINE 進得來，Review 也可能被同一扇匿名門暴露；分成兩個 project，才能在 Apps Script manifest 層固定「Webhook 任何人可呼叫、Review 只有我自己」。兩個 project 只共享 Sheet，不共享公開入口。

**互動**：點 Webhook／Review／Sheet 節點→ 顯示各自允許與禁止的操作；列印版保留完整架構圖。

## 03｜準備 LINE Official Account 與 Messaging API

**頁面目的**：完成帳號、Provider、Messaging API channel 的正確先後順序。

**建議版型**：五段時間線＋舊流程警告。

**畫面文字**

- Business ID → Official Account → Manager 啟用 Messaging API → Developers Console → token／Webhook
- 官方帳號名稱：金句收藏助手
- 不要在教材或 GitHub 放 Channel secret 或 access token

**講者補充**：先建立 Official Account，再從 Manager 啟用 Messaging API；不要照過時流程在 Console 直接建立 channel。

**互動**：點流程節點→ 顯示該節點的責任；若學員只做本機離線閱讀，可跳過外部連結。

## 04｜部署兩個 GAS project 並完成 OAuth

**頁面目的**：知道程式檔案要放到哪裡，以及第一次授權發生在哪裡。

**建議版型**：本機資料夾與 Apps Script 專案對照卡。

**畫面文字**

- `webhook-app/src` → Webhook project
- `review-app/src` → Review project
- Webhook manifest：匿名可呼叫、由部署者執行
- Review manifest：只有本人、由部署者執行
- 兩個 project 各自完成第一次 OAuth

**講者補充**：不要把兩組程式合成同一個匿名 deployment；`.clasp.json` 只放本機且不提交。

**互動**：點兩個 project 卡片→ 顯示「可做／不可做」清單；勾選「已完成 OAuth」留下本機紀錄。

## 05｜建立或重用 LINE 金句收藏庫

**頁面目的**：完成 Sheet 建立、schema 與空白預設分頁清理。

**建議版型**：函式操作步驟＋Sheet schema 對照表。

**畫面文字**

- 在 Webhook editor 執行 `setupWebhookProject()`
- 沒有 `SPREADSHEET_ID`：建立 `LINE 金句收藏庫`
- 建立／驗證 `Quotes` 與 `Events`
- 只有本次新建的空白預設分頁會清除；既有使用者分頁保留

**講者補充**：整段 setup 由 ScriptLock 保護，重跑不會建立第二份 Sheet。

**互動**：點 `Quotes`／`Events` 標籤→ 顯示欄位用途；勾選 schema 驗收項目。

## 06｜設定 Script Properties：只放名稱，不放值

**頁面目的**：完成 runtime 設定而不把秘密帶進教材或 GitHub。

**建議版型**：安全的 property 名稱表＋紅色禁止區。

**畫面文字**

| Project | Property names |
| --- | --- |
| Webhook | `GEMINI_API_KEY`、`GEMINI_MODEL`、`SPREADSHEET_ID` |
| Webhook | `LINE_CHANNEL_ACCESS_TOKEN`、`ALLOWED_LINE_USER_ID`、`WEBHOOK_SECRET`、`REVIEW_APP_URL` |
| Review | `SPREADSHEET_ID` |

- API key、token、secret 只由帳號擁有人親自輸入 Script Properties
- 不要貼到聊天室、Markdown、截圖、Sheet 或 `.gs`

**講者補充**：教學只展示 property 名稱與驗證方法，不展示任何真實值。

**互動**：點「安全位置」→ 顯示允許範例；點「公開位置」→ 顯示阻擋警告；密值欄位永遠不提供複製功能。

## 07｜設定 LINE Webhook：開啟 Webhook、停用預設自動回應

**頁面目的**：避免 LINE 只回傳罐頭訊息而沒有交給 GAS。

**建議版型**：LINE Manager 設定畫面對照＋兩個開關驗收卡。

**畫面文字**

- Webhook URL：`WEBHOOK_DEPLOYMENT_URL?key=WEBHOOK_SECRET`
- LINE Manager → 回應設定：Webhook 開啟
- LINE Manager → 自動回應訊息：停用
- Messaging API：Use webhook 開啟
- 更新後再用圖片測試，不使用 `/dev` 或編輯器網址

**講者補充**：Webhook 開關關閉時，LINE 可能只回覆預設「感謝您的訊息」；這是設定問題，不是 Gemini 問題。

**互動**：切換「Webhook／自動回應」情境→ 顯示正確與錯誤結果；勾選兩個開關後才顯示下一步提示。

## 08｜傳圖片，驗收 Gemini 預覽

**頁面目的**：驗證圖片已進入 LINE、LINE Data API 與 Gemini vision。

**建議版型**：手機聊天室示意＋執行紀錄證據卡。

**畫面文字**

- 傳清楚的書頁、閱讀器截圖或海報
- 等待回覆：「我讀到的金句」＋分類＋2–5 個標籤
- 失敗時先看 `Events.note`，不要重發 token
- 請勿上傳病人個資或其他敏感資料

**講者補充**：圖片只在執行期間送到 Gemini，不保存到 Drive、Sheet 或 repo。

**互動**：點擊「成功預覽」→ 展開欄位解讀；點擊「失敗」→ 顯示依序檢查 Webhook、圖片下載、Gemini 400 與 API quota。

## 09｜確認、修改或取消

**頁面目的**：理解預覽不等於收藏，並練習三種 postback 路徑。

**建議版型**：三按鈕決策樹＋Pending 狀態卡。

**畫面文字**

- 確認儲存：寫入 `Quotes`，追加 `Events`
- 修改金句：輸入正確文字，只重新分類，不重抓圖片
- 取消：清除 Pending，不寫入收藏
- Pending 超過 10 分鐘失效

**講者補充**：同一 candidate 重複確認只回傳同一個 quote ID，不會重複新增。

**互動**：點三個按鈕→ 顯示對應狀態變化；鍵盤可用 Tab 與 Enter 操作。

## 10｜在 Sheet 與 Review 驗收結果

**頁面目的**：用兩個獨立證據確認資料真的完成落地。

**建議版型**：Sheet `Quotes`／`Events` 對照＋Review 頁卡片。

**畫面文字**

- `Quotes`：quote ID、原文、分類、標籤、來源、status
- `Events`：收到事件、錯誤、確認與審計
- Review：登入後可搜尋、分類／標籤篩選、隨機回顧
- Review 未登入應導向 Google 登入

**講者補充**：`Quotes` 是收藏權威；`Events` 用來追查 webhook 或 Gemini 失敗原因。

**互動**：點 `Quotes`／`Events`／Review→ 顯示「應看到什麼」與「看到什麼代表失敗」。

## 11｜開源前安全檢查

**頁面目的**：確保 GitHub 公開的是程式與方法，不是帳號存取權。

**建議版型**：公開／禁止雙欄檢查清單＋最後通過卡。

**畫面文字**

- 可以公開：`.gs`、HTML、README、SPEC、測試、部署步驟
- 不可公開：Gemini key、LINE token、Channel secret、Webhook secret、Sheet ID、deployment URL、`.clasp.json`
- 跑 `npm test` 與 `npm run verify`
- 確認 Git status、secret scan 與文件中的例值

**講者補充**：本專案是單人自用 MVP；要開放多人，需加入可驗證 LINE signature 的 relay。

**互動**：所有安全項目勾選後顯示「可以準備公開」；任何 secret 項目未清除則顯示阻擋。

## 12｜完成與下一步

**頁面目的**：讓學員知道本次完成標準與後續擴充邊界。

**建議版型**：P0–P3 驗收總表＋下一步箭頭。

**畫面文字**

- P0：白名單、冪等、雙專案邊界
- P1：Gemini 預覽、標籤與來源
- P2：確認／修改／取消／逾時
- P3：Review 登入、搜尋、篩選、隨機回顧
- 後續：多人、LINE signature relay、佇列與原圖保存（不在 v1）

**講者補充**：不要在第一版同時加入 RAG、向量搜尋或每日推播；先保留可驗收的單人流程。

**互動**：全部驗收勾選後顯示完成狀態；提供「重新跑一次」與「開啟 README」按鈕。
