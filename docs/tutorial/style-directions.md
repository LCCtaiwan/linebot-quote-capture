# 風格範本比較與決策

本教材沿用既有 `clinical-automation-course/modules/03-linebot/handouts/linebot-setup-guide/` 的三方向比較與 C 方向，因為使用者明確希望延續類似 LINE Bot 教材，且該教材已驗證任務勾選、手機版與講義模式。

## A｜官方文件路線

- **內容適配**：適合部署文件、課後查閱與列印。
- **資訊層級**：大標題 → 步驟 → 操作指令 → 驗收證據。
- **版型**：單欄長頁，程式碼與表格為主。
- **互動**：目錄跳轉、折疊錯誤說明。
- **取捨**：最穩定，但較不像帶著學員實作。

## B｜證據地圖

- **內容適配**：把 LINE、GAS、Gemini、Sheet 與 Review 的證據放在同一張資料流地圖。
- **資訊層級**：左側元件 → 中央事件流 → 右側驗收與風險。
- **版型**：桌面三欄、手機上下排列。
- **互動**：點元件顯示責任與失敗邊界。
- **取捨**：架構理解強，但零基礎學員一次看到的資訊較多。

## C｜任務工作台（沿用既有教材，推薦）

- **內容適配**：每頁只完成一個外部操作或驗收證據，適合手機跟做。
- **資訊層級**：上方進度 → 左側當步任務 → 右側畫面／資料流 → 底部導覽。
- **版型**：固定步驟欄、單一主卡片、完成勾選、最後安全閘門。
- **互動**：步驟導覽、localStorage 進度、開啟官方入口、情境切換、講義／操作模式。
- **取捨**：學員可能只勾選不實作，因此每一步都保留可驗證的結果與錯誤訊息。

## 鎖定的 Design Tokens

- Canvas：`#102A2A`
- Panel：`#F8FBF7`
- Primary：`#06C755`
- Warning：`#D68A1B`
- Danger：`#C94A4A`
- Text：`#153333`
- Font：`ui-sans-serif, system-ui, Noto Sans TC, sans-serif`
- Border：`1px solid #D5E4DC`
- Radius：`18px`
- Mobile breakpoint：`760px`
- Motion：`180ms`，尊重 `prefers-reduced-motion`
