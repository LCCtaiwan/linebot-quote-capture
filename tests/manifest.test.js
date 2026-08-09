const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function manifest(project) {
  return JSON.parse(fs.readFileSync(path.join(root, project, 'src/appsscript.json'), 'utf8'));
}

test('locks web app access and outbound URL boundaries for both projects', () => {
  const webhook = manifest('webhook-app');
  const review = manifest('review-app');

  assert.deepEqual(webhook.webapp, {
    access: 'ANYONE_ANONYMOUS',
    executeAs: 'USER_DEPLOYING'
  });
  assert.deepEqual(webhook.urlFetchWhitelist, [
    'https://api.line.me/',
    'https://api-data.line.me/',
    'https://generativelanguage.googleapis.com/'
  ]);
  assert.ok(webhook.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'));

  assert.deepEqual(review.webapp, {
    access: 'MYSELF',
    executeAs: 'USER_DEPLOYING'
  });
  assert.equal(review.urlFetchWhitelist, undefined);
  assert.ok(!review.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'));
});
