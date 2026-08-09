# 金句收藏助手教學

本目錄是「LINE 圖片 → Gemini → Google Sheet → Review」的離線教學來源與成品。

- `content.md`：可編輯的課程內容與逐頁互動契約
- `style-directions.md`：沿用既有 LINE Bot 教材的視覺方向與 Design Tokens
- `build.mjs`：讀取內容契約與既有、不含密值的操作截圖，產生單檔 HTML
- `quote-capture-guide.html`：可直接離線開啟的單檔教學成品

建置與驗證：

```bash
node docs/tutorial/build.mjs
node /Users/lcc/.codex/skills/build-interactive-html-course/scripts/validate_course.mjs \
  --html docs/tutorial/quote-capture-guide.html \
  --content docs/tutorial/content.md
```

教材不包含任何 API key、LINE token、Channel secret、Webhook secret、Sheet ID、deployment URL 或 `.clasp.json`。
