const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'webhook-app/src/Code.gs'),
  'utf8'
);

test('webhook returns HtmlService output to avoid ContentService redirects', () => {
  assert.match(source, /function webhookOk_\(\)\s*\{[\s\S]*HtmlService\.createHtmlOutput\(['"]OK['"]\)/);
  assert.doesNotMatch(source, /ContentService\.createTextOutput/);
});
