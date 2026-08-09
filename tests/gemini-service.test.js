const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function validResponse() {
  return {
    quote: '把複雜的事，做成下一個可驗證的小步驟。',
    category: '工作學習',
    tags: ['實作', '驗證'],
    sourceTitle: '',
    sourceAuthor: '',
    sourceType: 'book_page',
    extractionBasis: 'highlight'
  };
}

test('uses the current Gemini structured-output REST wire shape with a model override', () => {
  let capturedUrl;
  let capturedOptions;
  const context = {
    getWebhookConfig_: () => ({
      geminiModel: 'gemini-3.6-flash',
      geminiKey: 'test-only-api-key'
    }),
    UrlFetchApp: {
      fetch: (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify(validResponse()) }] } }]
          })
        };
      }
    }
  };
  vm.createContext(context);
  for (const file of ['Core.gs', 'GeminiService.gs']) {
    vm.runInContext(
      fs.readFileSync(path.join(root, 'webhook-app/src', file), 'utf8'),
      context,
      { filename: file }
    );
  }

  const result = context.callGemini_([{ text: 'test prompt' }]);
  const payload = JSON.parse(capturedOptions.payload);

  assert.equal(capturedUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
  assert.equal(capturedOptions.headers['x-goog-api-key'], 'test-only-api-key');
  assert.equal(payload.generationConfig.responseFormat.text.mimeType, 'application/json');
  assert.equal(payload.generationConfig.responseFormat.text.schema.type, 'object');
  assert.equal(payload.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
  assert.equal(payload.generationConfig.responseMimeType, undefined);
  assert.equal(payload.generationConfig.responseJsonSchema, undefined);
  assert.equal(payload.generationConfig.temperature, undefined);
  assert.equal(result.quote, validResponse().quote);
});
