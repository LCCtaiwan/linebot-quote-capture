const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'webhook-app/src/Core.gs'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);
const core = context.AppCore;

function validCandidate(overrides = {}) {
  return {
    quote: '閱讀不是為了記住全部，而是為了在需要時想起。',
    category: '工作學習',
    tags: ['閱讀', '學習'],
    sourceTitle: '示例書名',
    sourceAuthor: '示例作者',
    sourceType: 'book_page',
    extractionBasis: 'highlight',
    ...overrides
  };
}

test('parses a valid Gemini JSON candidate', () => {
  const result = core.parseGeminiCandidate(JSON.stringify(validCandidate()));
  assert.equal(result.category, '工作學習');
  assert.deepEqual(Array.from(result.tags), ['閱讀', '學習']);
});

test('accepts JSON wrapped in a markdown code fence', () => {
  const text = `\`\`\`json\n${JSON.stringify(validCandidate())}\n\`\`\``;
  assert.equal(core.parseGeminiCandidate(text).quote, validCandidate().quote);
});

test('rejects a category outside the fixed six categories', () => {
  assert.throws(
    () => core.normalizeCandidate(validCandidate({ category: '未定義分類' })),
    /分類/
  );
});

test('rejects fewer than two unique tags', () => {
  assert.throws(
    () => core.normalizeCandidate(validCandidate({ tags: ['閱讀', '閱讀'] })),
    /2–5/
  );
});

test('rejects candidates that cannot fit in a LINE preview', () => {
  assert.throws(
    () => core.normalizeCandidate(validCandidate({ quote: '字'.repeat(3001) })),
    /3000/
  );
  assert.throws(
    () => core.normalizeCandidate(validCandidate({ tags: ['閱讀,學習', '整理'] })),
    /逗號/
  );
});

test('prunes expired events and keeps only the newest maximum entries', () => {
  const now = 10_000;
  const events = {
    expired: ['D', 1_000],
    a: ['D', 8_000],
    b: ['P', 9_000],
    c: ['D', 9_500]
  };
  const result = core.pruneRecentEvents(events, now, 3_000, 2);
  assert.deepEqual(Object.keys(result), ['b', 'c']);
});

test('claims new events and skips done or in-flight events', () => {
  const now = 100_000;
  const events = {};
  assert.equal(core.claimEvent(events, 'new', now, 120_000).shouldProcess, true);
  assert.equal(core.claimEvent(events, 'new', now + 1_000, 120_000).reason, 'processing');
  events.new = ['D', now + 2_000];
  assert.equal(core.claimEvent(events, 'new', now + 3_000, 120_000).reason, 'done');
});

test('reclaims a stale processing event', () => {
  const events = { old: ['P', 1_000] };
  const claim = core.claimEvent(events, 'old', 200_000, 120_000);
  assert.equal(claim.shouldProcess, true);
  assert.deepEqual(Array.from(events.old), ['P', 200_000]);
});

test('parses LINE postback data', () => {
  assert.deepEqual(
    { ...core.parsePostback('action=confirm&candidate=a%2Fb') },
    { action: 'confirm', candidate: 'a/b' }
  );
});

test('expires pending candidates only after the configured duration', () => {
  assert.equal(core.isExpired(1_000, 10_000, 10_000), false);
  assert.equal(core.isExpired(1_000, 12_000, 10_000), true);
});

test('preview includes quote, category, tags, and visible source', () => {
  const preview = core.buildPreviewText(validCandidate());
  assert.match(preview, /閱讀不是為了記住全部/);
  assert.match(preview, /分類：工作學習/);
  assert.match(preview, /標籤：閱讀、學習/);
  assert.match(preview, /示例書名｜示例作者/);
});
