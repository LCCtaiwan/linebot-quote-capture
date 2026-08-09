import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const screenshotDir = resolve(here, '../../../clinical-automation-course/modules/03-linebot/handouts/linebot-setup-guide/screenshots');
const htmlEscape = (value) => String(value).replace(/[&<>\"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const image = (file, alt) => ({
  src: `data:image/png;base64,${readFileSync(join(screenshotDir, file)).toString('base64')}`,
  alt
});

const shots = {
  messaging: image('05-enable-messaging-api.png', 'LINE Official Account Manager 啟用 Messaging API 的畫面'),
  enabled: image('07-messaging-api-enabled.png', 'Messaging API 已啟用的畫面'),
  webhook: image('11-webhook-url.png', 'LINE Developers Console 設定 Webhook URL 的畫面'),
  webhookOn: image('12-enable-webhook.png', 'LINE Developers Console 開啟 Use webhook 的畫面')
};

const pages = [
  {
    id: 'goal', number: '01', kicker: 'START / 先看成果', title: '這個專案要解決什麼？',
    intro: '把書頁或海報送進 LINE，完成辨識、預覽、確認、分類與回顧。',
    bullets: ['LINE 傳書頁／海報。', 'Gemini 擷取金句、分類與 2–5 個標籤。', '只有按下確認後才寫入 Google Sheet。', 'Review 頁登入後可搜尋、篩選與隨機回顧。'],
    note: 'v1 是單人自用 MVP；原圖只在執行期間傳給 Gemini，不保存到 Drive、Sheet 或 GitHub。',
    checks: ['我知道預覽不等於收藏，必須確認才會寫入。']
  },
  {
    id: 'architecture', number: '02', kicker: 'ARCHITECTURE / 先看邊界', title: '為什麼要分成兩個 GAS project？',
    intro: '匿名的 LINE webhook 與需要 Google 登入的 Review 頁，不應共用同一個匿名讀取入口。',
    columns: [
      ['Webhook GAS', ['匿名接收 LINE、呼叫 Gemini、寫入 Sheet', '沒有讀取收藏的 doGet']],
      ['Review GAS', ['只限本人登入、讀取同一份 Sheet', '沒有匿名 doPost']],
      ['Google Sheet', ['Quotes：收藏權威資料', 'Events：事件與錯誤審計紀錄']]
    ],
    note: '兩個 project 共用同一份 Sheet；分開部署是安全邊界，不是重複程式。',
    checks: ['我能說出 Webhook、Review、Sheet 各自的責任。']
  },
  {
    id: 'line', number: '03', kicker: 'LINE / 準備帳號', title: '建立 Official Account 與 Messaging API',
    intro: '先在 Official Account Manager 啟用 Messaging API，再到 Developers Console 管理 channel。',
    bullets: ['Business ID → Official Account → Manager 啟用 Messaging API。', '在 Developers Console 完成 Developer info，找到 Messaging API channel。', '不要在教材、聊天室或 GitHub 放 channel secret、access token。'],
    image: shots.messaging,
    note: '若 LINE 只回覆「感謝您的訊息」，先檢查 Manager 的 Webhook 是否開啟、預設自動回應是否停用。',
    checks: ['我已啟用 Messaging API 並看得到 channel。']
  },
  {
    id: 'deploy', number: '04', kicker: 'GAS / 部署與授權', title: '部署兩個 Apps Script project',
    intro: '把本機兩個資料夾分別推到兩個獨立的 Apps Script project，第一次使用各自完成 OAuth。',
    columns: [
      ['webhook-app/src', ['Webhook project', '匿名可呼叫、由部署者執行']],
      ['review-app/src', ['Review project', '只有本人、由部署者執行']]
    ],
    code: ['clasp push', 'clasp deploy --deploymentId <WEBHOOK_DEPLOYMENT_ID>', 'clasp deploy --deploymentId <REVIEW_DEPLOYMENT_ID>'],
    note: '`.clasp.json` 只放在本機並由 `.gitignore` 排除；不要把 scriptId 提交到公開 repo。',
    checks: ['Webhook project 已完成 OAuth。', 'Review project 已完成 OAuth。']
  },
  {
    id: 'sheet', number: '05', kicker: 'SHEET / 建立收藏庫', title: '執行 setupWebhookProject()',
    intro: '第一次執行會建立或重用收藏庫，並確保 Quotes／Events schema 正確。',
    code: ['setupWebhookProject()'],
    columns: [
      ['Quotes', ['quote_id、text、category、tags、source、status', '收藏的權威資料']],
      ['Events', ['event_id、created_at、type、status、note', 'Webhook／Gemini／確認的審計紀錄']]
    ],
    note: 'ScriptLock 保護整段 setup；只有本次新建的空白預設分頁會清除，既有使用者分頁保留。',
    checks: ['我在 Sheet 看到了 Quotes 與 Events。', '兩個 tab 的第一列欄位符合 schema。']
  },
  {
    id: 'properties', number: '06', kicker: 'SECURITY / 設定名稱', title: 'Script Properties 只放在 GAS 專案設定',
    intro: '教材只列名稱，不列任何真實值。API key、token、secret 必須由帳號擁有人親自輸入。',
    table: [
      ['Webhook project', '`GEMINI_API_KEY`、`GEMINI_MODEL`、`SPREADSHEET_ID`'],
      ['Webhook project', '`LINE_CHANNEL_ACCESS_TOKEN`、`ALLOWED_LINE_USER_ID`、`WEBHOOK_SECRET`、`REVIEW_APP_URL`'],
      ['Review project', '`SPREADSHEET_ID`']
    ],
    warning: '禁止放入：README、HTML、Markdown、Sheet、截圖、`.gs`、`.clasp.json` 或聊天訊息。',
    checks: ['我已設定 property 名稱和值，但沒有把值貼到公開文件。']
  },
  {
    id: 'webhook', number: '07', kicker: 'LINE / WEBHOOK', title: '設定 Webhook URL 與兩個開關',
    intro: '使用 Webhook deployment 的 `/exec` URL，不要使用 `/dev` 或 Apps Script 編輯器網址。',
    code: ['<WEBHOOK_DEPLOYMENT_URL>?key=<WEBHOOK_SECRET>'],
    image: shots.webhook,
    bullets: ['LINE Manager：Webhook 開啟。', 'LINE Manager：預設自動回應訊息停用。', 'Messaging API channel：Use webhook 開啟。', '按 Verify，確認設定成功後再傳圖片。'],
    image2: shots.webhookOn,
    note: 'Webhook URL 本身屬於部署資訊；公開教學只放 placeholder，真實 URL 留在你的 LINE 設定中。',
    checks: ['Webhook 開啟。', '預設自動回應停用。', 'Use webhook 開啟且 Verify 成功。']
  },
  {
    id: 'test', number: '08', kicker: 'E2E / 傳第一張圖', title: '傳圖片，驗收 Gemini 預覽',
    intro: '用清楚、沒有個資的書頁或海報測試，等待 LINE 回傳金句、分類與標籤。',
    bullets: ['建議圖片正向、文字清晰、避免反光與過度裁切。', '成功回覆應包含「我讀到的金句」、分類與 2–5 個標籤。', '失敗先看 Events.note；不要重新索取或貼出 token。'],
    columns: [
      ['成功', ['LINE 收到預覽', 'Events 記錄 Gemini 成功']],
      ['失敗', ['先檢查 webhook／圖片下載', '再看 Gemini 400 或 quota 訊息']]
    ],
    note: '圖片不會保存到 Drive、Sheet 或 repo；若內容包含病人或其他敏感資料，請改用測試圖片。',
    checks: ['我收到 Gemini 預覽。', 'Events 有對應事件紀錄。']
  },
  {
    id: 'confirm', number: '09', kicker: 'FLOW / 確認狀態', title: '確認、修改或取消預覽',
    intro: '預覽完成後，使用者決定是否收藏；Pending 只保留短時間，避免誤寫入。',
    columns: [
      ['確認儲存', ['寫入 Quotes', '追加 Events']],
      ['修改金句', ['輸入正確文字', '只重新分類，不重抓圖片']],
      ['取消', ['清除 Pending', '不寫入收藏']]
    ],
    note: '同一 candidate 重複確認會回傳同一個 quote ID，不會重複新增；Pending 超過 10 分鐘失效。',
    checks: ['我測過確認或取消其中一條路徑。']
  },
  {
    id: 'review', number: '10', kicker: 'VERIFY / 兩份證據', title: '在 Sheet 與 Review 驗收落地',
    intro: '用兩個獨立證據確認資料真的寫入，而不是只看 LINE 回覆。',
    columns: [
      ['Quotes', ['有 quote ID、原文、分類、標籤、來源、status']],
      ['Events', ['有收到事件、Gemini、確認與錯誤審計']],
      ['Review', ['登入後搜尋、篩選、隨機回顧', '未登入應導向 Google 登入']]
    ],
    image: shots.enabled,
    checks: ['Quotes 出現已確認金句。', 'Review 登入後看得到同一筆金句。']
  },
  {
    id: 'opensource', number: '11', kicker: 'OPEN SOURCE / 公開前', title: '開源前先過安全閘門',
    intro: '公開的是程式、測試與方法，不是任何帳號存取權。',
    columns: [
      ['可以公開', ['.gs、HTML、README、SPEC、測試、部署步驟']],
      ['不可公開', ['Gemini key、LINE token、channel secret', 'Webhook secret、Sheet ID、deployment URL、.clasp.json']]
    ],
    code: ['npm test', 'npm run verify', 'git status --short'],
    warning: '沒有 LICENSE 的公開 repo 不等於可自由重用；本專案預設採 MIT，請確認版權持有人文字後再推送。',
    checks: ['我已跑測試與 verify。', '我已檢查 Git status 與 secret scan。', '我確認公開內容沒有真實值。']
  },
  {
    id: 'finish', number: '12', kicker: 'DONE / 驗收總表', title: '完成標準與下一步',
    intro: '先完成單人流程，再考慮多人、relay、佇列或原圖保存。',
    columns: [
      ['P0', ['白名單、冪等、雙專案邊界']],
      ['P1', ['Gemini 預覽、分類、標籤與來源']],
      ['P2', ['確認／修改／取消／逾時']],
      ['P3', ['Review 登入、搜尋、篩選、隨機回顧']]
    ],
    note: '多人服務需要可驗證 LINE signature 的 relay；RAG、向量搜尋、每日推播不在 v1 驗收範圍。',
    checks: ['P0–P3 都已完成，或我已記下尚未完成的項目。']
  }
];

const list = (items) => items?.length ? `<ul class="bullet-list">${items.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>` : '';
const code = (items) => items?.length ? `<pre class="code-card"><code>${items.map((item) => htmlEscape(item)).join('\n')}</code></pre>` : '';
const notes = (text, kind = 'note') => text ? `<div class="notice ${kind}"><span>${kind === 'warning' ? '!' : 'i'}</span><p>${htmlEscape(text)}</p></div>` : '';
const columns = (items) => items?.length ? `<div class="info-grid">${items.map(([title, values]) => `<article class="info-card" style="color:var(--text)"><h3>${htmlEscape(title)}</h3>${list(values)}</article>`).join('')}</div>` : '';
const table = (rows) => rows?.length ? `<div class="property-table"><div class="property-head"><span>專案</span><span>Property names</span></div>${rows.map(([project, values]) => `<div class="property-row"><b>${htmlEscape(project)}</b><span>${values}</span></div>`).join('')}</div>` : '';
const shot = (item) => item ? `<figure class="shot"><img src="${item.src}" alt="${htmlEscape(item.alt)}"><figcaption>${htmlEscape(item.alt)}</figcaption></figure>` : '';
const checks = (items, id) => `<div class="completion"><h3>這一步的驗收</h3>${(items || []).map((item, index) => `<label class="check-row"><input type="checkbox" data-check="${id}-${index}"><span>${htmlEscape(item)}</span></label>`).join('')}</div>`;

const pageHtml = pages.map((page, index) => {
  const visual = `${columns(page.columns)}${shot(page.image)}${shot(page.image2)}`;
  return `<section class="step-page slide" id="slide-${index + 1}" data-step="${page.id}" data-index="${index}" hidden>
    <div class="step-kicker">${htmlEscape(page.kicker)}</div>
    <div class="step-heading"><span class="step-number">${page.number}</span><div><h2>${htmlEscape(page.title)}</h2><p class="step-intro">${htmlEscape(page.intro)}</p></div></div>
    <div class="task-grid"><div class="task-copy">${list(page.bullets)}${table(page.table)}${code(page.code)}${notes(page.warning, 'warning')}${notes(page.note)}${checks(page.checks, page.id)}</div><div class="visual-column">${visual || '<div class="empty-visual">這一步以文字與驗收卡完成。</div>'}</div></div>
  </section>`;
}).join('\n');

const navigation = pages.map((page, index) => `<button class="step-nav" type="button" data-nav="${index}" aria-current="false"><span class="nav-num">${page.number}</span><span class="nav-title">${htmlEscape(page.title)}</span></button>`).join('');
const stepsJson = JSON.stringify(pages.map(({ id, title }) => ({ id, title })));
const css = `
:root{--canvas:#102a2a;--panel:#f8fbf7;--panel2:#edf6f0;--text:#153333;--muted:#58716b;--primary:#06c755;--warning:#d68a1b;--danger:#c94a4a;--line:#d5e4dc;--shadow:0 18px 50px rgba(5,27,24,.18);font-family:ui-sans-serif,system-ui,"Noto Sans TC",sans-serif;color:var(--text)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--canvas)}body{color:var(--panel);background:linear-gradient(135deg,var(--canvas),#0b2020 72%)}button,input{font:inherit}.app{min-height:100vh;display:grid;grid-template-columns:280px 1fr;grid-template-rows:auto 1fr}.topbar{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding:18px 28px;border-bottom:1px solid rgba(255,255,255,.12);background:rgba(16,42,42,.94);position:sticky;top:0;z-index:8}.brand{display:flex;gap:12px;align-items:center}.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--primary);color:var(--canvas);font-weight:900}.brand h1{font-size:16px;margin:0}.brand p{margin:2px 0 0;color:#a9c3bc;font-size:12px}.top-actions{display:flex;gap:8px}.top-actions button,.bottom-nav button{border:1px solid rgba(255,255,255,.26);background:transparent;color:var(--panel);padding:9px 13px;border-radius:10px;cursor:pointer}.sidebar{padding:26px 18px 100px;border-right:1px solid rgba(255,255,255,.1);background:rgba(16,42,42,.45)}.progress-label{display:flex;justify-content:space-between;color:#cce2d9;font-size:12px}.progress-track{height:8px;background:#31534e;border-radius:99px;overflow:hidden;margin:9px 0 22px}.progress-fill{height:100%;width:0;background:var(--primary);transition:width .18s}.steps-nav{display:grid;gap:6px}.step-nav{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;text-align:left;width:100%;padding:10px;border:1px solid transparent;border-radius:12px;background:transparent;color:#a9c3bc;cursor:pointer}.step-nav[aria-current=true]{border-color:rgba(6,199,85,.68);background:rgba(6,199,85,.12);color:#fff}.nav-num{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#244944;color:#d4ebe1;font-size:11px;font-weight:800}.nav-title{font-size:13px;line-height:1.3}.main{padding:clamp(24px,4vw,54px) clamp(20px,5vw,72px) 110px;min-width:0}.content-width{max-width:1180px;margin:auto}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:28px}.hero-card,.hero-side{border:1px solid rgba(255,255,255,.14);border-radius:24px;background:linear-gradient(145deg,rgba(248,251,247,.12),rgba(248,251,247,.04));padding:clamp(24px,4vw,56px)}.hero-card h2{font-size:clamp(36px,6vw,78px);line-height:1.05;margin:16px 0}.hero-card p{color:#cfe2da;font-size:clamp(17px,2vw,22px);line-height:1.6}.eyebrow,.step-kicker{color:var(--primary);font-size:12px;font-weight:900;letter-spacing:.16em}.hero-side h3{margin:0 0 14px;font-size:22px}.hero-side ul{margin:0;padding-left:20px;color:#d9ebe4;line-height:1.9}.primary-button{border:0;background:var(--primary)!important;color:#092720!important;font-weight:900;padding:13px 18px;border-radius:12px;cursor:pointer;box-shadow:0 7px 0 #038d41}.hero-side .primary-button{width:100%;margin-top:24px}.step-heading{display:flex;gap:18px;align-items:flex-start;margin:14px 0 30px}.step-number{display:grid;place-items:center;flex:0 0 52px;height:52px;border-radius:15px;background:var(--primary);color:#092720;font-weight:900}.step-heading h2{margin:0;font-size:clamp(30px,4.5vw,58px);line-height:1.08}.step-intro{margin:12px 0 0;color:#cfe2da;font-size:clamp(16px,1.7vw,20px);line-height:1.6}.task-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(340px,1.1fr);gap:34px;align-items:start}.task-copy{padding:clamp(20px,3vw,34px);border-radius:18px;background:var(--panel);box-shadow:var(--shadow);color:var(--text);min-width:0}.visual-column{display:grid;gap:16px;min-width:0}.bullet-list{padding-left:21px;line-height:1.75}.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:18px 0}.info-card{padding:14px;border:1px solid var(--line);border-radius:13px;background:var(--panel2)}.info-card h3{margin:0;font-size:15px}.info-card ul{margin-bottom:0}.property-table{margin:18px 0;border:1px solid var(--line);border-radius:14px;overflow:hidden}.property-head,.property-row{display:grid;grid-template-columns:.8fr 2fr;gap:12px;padding:13px 14px}.property-head{background:#dff2e7;font-size:13px;font-weight:900}.property-row{border-top:1px solid var(--line);font-size:13px;line-height:1.55}.code-card{padding:16px;border-radius:13px;background:#102a2a;color:#d9f8e8;overflow:auto;line-height:1.7;font-size:13px}.notice{display:flex;gap:11px;align-items:flex-start;padding:14px;margin:18px 0;border-radius:13px;line-height:1.55}.notice span{display:grid;place-items:center;flex:0 0 24px;height:24px;border-radius:50%;font-weight:900}.notice p{margin:0}.notice.note{background:#eaf5ef;color:#265247;border:1px solid #cfe4d7}.notice.note span{background:#2f8b6b;color:#fff}.notice.warning{background:#fff4df;color:#74420d;border:1px solid #f2d194}.notice.warning span{background:var(--warning);color:#fff}.shot{margin:0;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:#fff;box-shadow:var(--shadow);color:var(--muted)}.shot img{display:block;width:100%;height:auto;max-height:560px;object-fit:contain;border-radius:10px;background:#f5f7f4}.shot figcaption{font-size:12px;line-height:1.45;padding:10px 4px 0}.empty-visual{padding:30px;border:1px dashed rgba(255,255,255,.3);border-radius:18px;color:#cfe2da;line-height:1.6}.completion{margin-top:24px;padding-top:19px;border-top:1px solid var(--line)}.completion h3{margin:0 0 11px;font-size:18px}.check-row{display:flex;gap:10px;align-items:flex-start;padding:11px 0;cursor:pointer;line-height:1.5}.check-row input{width:18px;height:18px;margin-top:2px;accent-color:var(--primary)}.check-row:has(input:checked){color:#2b7559}.check-row:has(input:checked) span{text-decoration:line-through;text-decoration-color:#67ae8d}.bottom-nav{position:fixed;right:0;bottom:0;left:280px;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 28px;background:rgba(9,31,30,.94);border-top:1px solid rgba(255,255,255,.12);z-index:7}.bottom-nav button:disabled{opacity:.4;cursor:not-allowed}.status{font-size:13px;color:#b8d1c7}.finish{display:block;padding:10px 12px;border-radius:10px;background:rgba(6,199,85,.15);border:1px solid rgba(6,199,85,.4);color:#d8ffe6}@media(max-width:960px){.app{grid-template-columns:220px 1fr}.bottom-nav{left:220px}.task-grid{grid-template-columns:1fr}.visual-column{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.app{display:block}.topbar{padding:14px 16px}.brand p{display:none}.sidebar{display:none}.main{padding:22px 14px 106px}.hero{display:block}.hero-side{margin-top:14px}.step-heading{gap:12px}.step-number{flex-basis:42px;height:42px}.step-heading h2{font-size:32px}.task-grid{display:block}.visual-column{display:block;margin-top:16px}.shot{margin-bottom:14px}.info-grid{grid-template-columns:1fr}.bottom-nav{left:0;padding:10px 14px}.bottom-nav button{font-size:13px}.status{font-size:11px}}@media(prefers-reduced-motion:reduce){*{transition-duration:0s!important;scroll-behavior:auto!important}}@media print{.sidebar,.bottom-nav,.top-actions,.hero{display:none!important}.app{display:block}.main{padding:0}.step-page,.step-page[hidden]{display:block!important;margin:0 0 20mm;break-after:page}.task-grid{grid-template-columns:1fr 1fr}.task-copy{border:1px solid #d5e4dc}.shot{border:1px solid #d5e4dc;break-inside:avoid}}
.handout .sidebar,.handout .bottom-nav,.handout .hero{display:none!important}.handout .app{display:block}.handout .main{padding:24px}.handout .step-page,.handout .step-page[hidden]{display:block!important;max-width:1180px;margin:0 auto 42px}.handout .task-grid{grid-template-columns:1fr 1fr}.handout .topbar{position:sticky;top:0;background:#fff}.handout .top-actions button{color:#153333;border-color:#b8cec4}html.handout,body.handout{background:#fff;color:#153333}.handout .topbar{background:#fff;border-bottom-color:#d5e4dc}.handout .brand h1{color:#153333}.handout .brand p,.handout .step-intro{color:#31544b}
`;
const script = `
const steps=${stepsJson};
const key='quote-capture-tutorial-v1';
let state={current:0,started:false,checks:{}};
try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
const qs=(s)=>document.querySelector(s), qsa=(s)=>[...document.querySelectorAll(s)];
const pages=qsa('.step-page'), nav=qs('#stepsNav'), prev=qs('#prev'), next=qs('#next'), status=qs('#status'), fill=qs('#progressFill'), progress=qs('#progressText');
function save(){localStorage.setItem(key,JSON.stringify(state))}
function completed(id){const boxes=qsa('[data-check^="'+id+'-"]');return boxes.length>0&&boxes.every((box)=>box.checked)}
function render(){pages.forEach((page,index)=>page.hidden=index!==state.current);qsa('[data-nav]').forEach((button)=>{button.setAttribute('aria-current',String(Number(button.dataset.nav)===state.current));button.onclick=()=>{state.current=Number(button.dataset.nav);state.started=true;save();render();window.scrollTo({top:0,behavior:'smooth'})}});const total=steps.length-1;progress.textContent=state.current+' / '+total;fill.style.width=(state.current/total*100)+'%';prev.disabled=!state.started||state.current===0;next.disabled=!state.started||state.current===steps.length-1;status.textContent=!state.started?'先按「開始實作」':state.current===steps.length-1?'最後一步：完成驗收':completed(steps[state.current].id)?'本頁驗收已完成，可以前進':'可以直接前進；勾選會保存到本機';qsa('input[data-check]').forEach((box)=>{box.checked=!!state.checks[box.dataset.check];box.onchange=()=>{state.checks[box.dataset.check]=box.checked;save();render()}})}
qs('#start').addEventListener('click',()=>{state.started=true;state.current=0;save();render();window.scrollTo({top:0,behavior:'smooth'})});
prev.addEventListener('click',()=>{if(state.current>0){state.current-=1;save();render()}});
next.addEventListener('click',()=>{if(state.current<steps.length-1){state.current+=1;save();render()}});
qs('#reset').addEventListener('click',()=>{if(confirm('清除本機進度並從頭開始？')){state={current:0,started:false,checks:{}};save();render()}});
qs('#handout').addEventListener('click',(event)=>{document.body.classList.toggle('handout');event.currentTarget.textContent=document.body.classList.contains('handout')?'操作模式':'講義模式';render()});
render();
`;
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="金句收藏助手：LINE 圖片、Gemini、Google Sheet 與 Review 的離線實作教學"><title>金句收藏助手｜實作教學</title><style>${css}</style></head><body><div class="app"><header class="topbar"><div class="brand"><span class="brand-mark">Q</span><div><h1>金句收藏助手｜實作教學</h1><p>LINE 圖片 → Gemini → Google Sheet → Review</p></div></div><div class="top-actions"><button type="button" id="handout">講義模式</button><button type="button" id="reset">重設進度</button></div></header><aside class="sidebar"><div class="progress-label"><span>目前進度</span><span id="progressText">0 / ${pages.length - 1}</span></div><div class="progress-track"><div class="progress-fill" id="progressFill"></div></div><nav class="steps-nav" id="stepsNav" aria-label="步驟導覽">${navigation}</nav></aside><main class="main"><div class="content-width"><section class="hero"><div class="hero-card"><div class="eyebrow">LINE × GEMINI × SHEET</div><h2>把一張書頁<br>變成可回顧的金句</h2><p>每次只完成一個外部操作。看圖、設定、驗收；勾選只會保存於這台裝置。</p></div><div class="hero-side"><h3>這次會完成</h3><ul><li>LINE Official Account 與 Messaging API</li><li>Webhook／Review 兩個 GAS project</li><li>Gemini 預覽、Sheet 寫入與 Review 驗收</li></ul><button class="primary-button" id="start" type="button">開始實作 →</button></div></section>${pageHtml}</div></main><footer class="bottom-nav"><button id="prev" type="button">← 上一步</button><span class="status" id="status" role="status" aria-live="polite">先按「開始實作」</span><button class="primary-button" id="next" type="button" disabled>下一步 →</button></footer></div><script>${script}</script></body></html>`;
writeFileSync(join(here, 'quote-capture-guide.html'), html);
console.log(`built quote-capture-guide.html: ${Math.round(html.length / 1024)} KiB, ${pages.length} pages, 4 embedded screenshots`);
