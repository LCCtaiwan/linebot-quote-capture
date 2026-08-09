const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const required = [
  'README.md',
  'SPEC.md',
  'PROGRESS.md',
  'CHANGELOG.md',
  'docs/SDD.md',
  'docs/DEPLOYMENT.md',
  'docs/develog.md',
  'webhook-app/src/Code.gs',
  'webhook-app/src/Core.gs',
  'webhook-app/src/appsscript.json',
  'review-app/src/Code.gs',
  'review-app/src/Index.html',
  'review-app/src/appsscript.json'
];

for (const file of required) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);
}

const webhookDir = path.join(root, 'webhook-app/src');
const reviewDir = path.join(root, 'review-app/src');
const webhookSources = fs.readdirSync(webhookDir)
  .filter((file) => file.endsWith('.gs'))
  .map((file) => fs.readFileSync(path.join(webhookDir, file), 'utf8'))
  .join('\n');
const webhookConfigSource = fs.readFileSync(path.join(webhookDir, 'Config.gs'), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing function: ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed function: ${name}`);
}

const setupWebhookSource = extractFunction(webhookConfigSource, 'setupWebhookProject');
assert.match(webhookConfigSource, /geminiModel:\s*properties\.getProperty\(['"]GEMINI_MODEL['"]\)\s*\|\|\s*['"]gemini-3\.5-flash-lite['"]/);
assert.doesNotMatch(setupWebhookSource, /getWebhookConfig_\s*\(/);
assert.match(setupWebhookSource, /LockService\.getScriptLock\s*\(/);
assert.match(setupWebhookSource, /lock\.waitLock\s*\(STATE_LOCK_WAIT_MS\)/);
assert.match(setupWebhookSource, /SpreadsheetApp\.create\s*\(/);
assert.match(setupWebhookSource, /setProperty\s*\(\s*['"]SPREADSHEET_ID['"]/);
assert.match(setupWebhookSource, /initialSheet\s*=\s*spreadsheet\.getSheets\(\)\[0\]/);
assert.match(setupWebhookSource, /initialSheet\s*&&\s*spreadsheet\.getSheets\(\)\.length\s*>\s*2/);
assert.match(setupWebhookSource, /spreadsheet\.deleteSheet\(initialSheet\)/);
assert.match(setupWebhookSource, /finally\s*\{/);
assert.match(setupWebhookSource, /lock\.releaseLock\s*\(/);
const reviewSources = fs.readdirSync(reviewDir)
  .filter((file) => file.endsWith('.gs'))
  .map((file) => fs.readFileSync(path.join(reviewDir, file), 'utf8'))
  .join('\n');

assert.doesNotMatch(webhookSources, /function\s+doGet\s*\(/, 'Webhook project must not expose doGet');
assert.doesNotMatch(reviewSources, /function\s+doPost\s*\(/, 'Review project must not expose doPost');
assert.doesNotMatch(webhookSources, /CacheService/, 'Pending state must not use CacheService');
assert.doesNotMatch(webhookSources, /DriveApp/, 'Original images must not be persisted to Drive');
assert.match(webhookSources, /https:\/\/api-data\.line\.me\/v2\/bot/, 'LINE content downloads must use api-data.line.me');
assert.match(webhookSources, /HtmlService\.createHtmlOutput\(['"]OK['"]\)/, 'Webhook must return HtmlService output to avoid ContentService redirects');
assert.doesNotMatch(webhookSources, /ContentService\.createTextOutput/, 'Webhook must not return ContentService output to LINE');
assert.doesNotMatch(webhookSources, /\btemperature\s*:/, 'Gemini request must not receive deprecated sampling parameters');
assert.match(webhookSources, /responseFormat\s*:\s*\{/, 'Gemini structured output must use responseFormat');
assert.match(webhookSources, /mimeType\s*:\s*['"]APPLICATION_JSON['"]/, 'Gemini responseFormat must request JSON');
assert.match(webhookSources, /schema\s*:\s*geminiResponseSchema_\(\)/, 'Gemini responseFormat must include the JSON Schema');
assert.doesNotMatch(webhookSources, /responseJsonSchema\s*:/, 'Legacy responseJsonSchema wire shape must not be used');

const webhookManifest = JSON.parse(fs.readFileSync(path.join(webhookDir, 'appsscript.json'), 'utf8'));
const reviewManifest = JSON.parse(fs.readFileSync(path.join(reviewDir, 'appsscript.json'), 'utf8'));
assert.equal(webhookManifest.runtimeVersion, 'V8');
assert.equal(reviewManifest.runtimeVersion, 'V8');
assert.deepEqual(webhookManifest.webapp, {
  access: 'ANYONE_ANONYMOUS',
  executeAs: 'USER_DEPLOYING'
});
assert.deepEqual(webhookManifest.urlFetchWhitelist, [
  'https://api.line.me/',
  'https://api-data.line.me/',
  'https://generativelanguage.googleapis.com/'
]);
assert.deepEqual(reviewManifest.webapp, {
  access: 'MYSELF',
  executeAs: 'USER_DEPLOYING'
});
assert.equal(reviewManifest.urlFetchWhitelist, undefined);

const reviewHtml = fs.readFileSync(path.join(reviewDir, 'Index.html'), 'utf8');
assert.doesNotMatch(reviewHtml, /<(?:script|link)[^>]+(?:src|href)=["']https?:/i, 'Review page must not load third-party resources');
const inlineScripts = Array.from(reviewHtml.matchAll(/<script>([\s\S]*?)<\/script>/gi));
inlineScripts.forEach((match, index) => {
  new vm.Script(match[1], { filename: `Index.inline-${index + 1}.js` });
});

const gasFiles = fs.readdirSync(webhookDir).filter((file) => file.endsWith('.gs'));
for (const file of gasFiles) {
  new vm.Script(fs.readFileSync(path.join(webhookDir, file), 'utf8'), { filename: file });
}
for (const file of fs.readdirSync(reviewDir).filter((item) => item.endsWith('.gs'))) {
  new vm.Script(fs.readFileSync(path.join(reviewDir, file), 'utf8'), { filename: file });
}

const trackedText = required
  .concat(gasFiles.map((file) => `webhook-app/src/${file}`))
  .concat(fs.readdirSync(reviewDir)
    .filter((file) => file.endsWith('.gs'))
    .map((file) => `review-app/src/${file}`))
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
assert.doesNotMatch(trackedText, /AIza[0-9A-Za-z_-]{20,}/, 'Possible Google API key found');
assert.doesNotMatch(trackedText, /Bearer\s+[A-Za-z0-9._-]{30,}/, 'Possible access token found');

console.log(`Verification passed: ${required.length} required artifacts, project boundary, manifests, syntax, no image persistence, no obvious secrets.`);
