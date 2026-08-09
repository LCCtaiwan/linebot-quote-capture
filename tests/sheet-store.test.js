const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class FakeSheet {
  constructor(name, rows = []) {
    this.name = name;
    this.rows = rows.map((row) => row.slice());
  }

  getLastRow() {
    return this.rows.length;
  }

  getRange(startRow, startColumn, rowCount, columnCount) {
    return {
      getValues: () => Array.from({ length: rowCount }, (_, rowOffset) =>
        Array.from({ length: columnCount }, (_, columnOffset) =>
          (this.rows[startRow - 1 + rowOffset] || [])[startColumn - 1 + columnOffset] ?? ''
        )
      ),
      setValues: (values) => {
        values.forEach((row, rowOffset) => {
          const targetIndex = startRow - 1 + rowOffset;
          this.rows[targetIndex] = this.rows[targetIndex] || [];
          row.forEach((value, columnOffset) => {
            this.rows[targetIndex][startColumn - 1 + columnOffset] = value;
          });
        });
      }
    };
  }

  appendRow(row) {
    this.rows.push(row.slice());
  }

  setFrozenRows() {}
}

class FakeSpreadsheet {
  constructor() {
    this.sheets = {};
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    this.sheets[name] = new FakeSheet(name);
    return this.sheets[name];
  }
}

function createContext() {
  const properties = new Map([
    ['LINE_CHANNEL_ACCESS_TOKEN', 'test-line-token'],
    ['GEMINI_API_KEY', 'test-gemini-key'],
    ['SPREADSHEET_ID', 'test-sheet'],
    ['ALLOWED_LINE_USER_ID', 'test-user'],
    ['WEBHOOK_SECRET', 'test-secret'],
    ['GEMINI_MODEL', 'gemini-test']
  ]);
  const spreadsheet = new FakeSpreadsheet();
  const lock = { waitLock() {}, releaseLock() {} };
  const context = {
    console,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties.get(key) ?? null,
        setProperty: (key, value) => properties.set(key, value),
        deleteProperty: (key) => properties.delete(key)
      })
    },
    LockService: { getScriptLock: () => lock },
    SpreadsheetApp: {
      openById: () => spreadsheet,
      flush() {}
    },
    Utilities: {
      formatString: (_format, number) => String(number).padStart(4, '0')
    }
  };
  vm.createContext(context);
  for (const file of ['Core.gs', 'Config.gs', 'StateStore.gs', 'SheetStore.gs']) {
    const source = fs.readFileSync(path.join(root, 'webhook-app/src', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  context.setupWebhookProject();
  return { context, spreadsheet };
}

function pending(candidateId, createdAt = Date.now()) {
  return {
    state: 'PENDING',
    candidateId,
    createdAt,
    quote: '先做最小可驗證的一步。',
    category: '工作學習',
    tags: ['實作', '驗證'],
    sourceTitle: '',
    sourceAuthor: '',
    sourceType: 'book_page',
    extractionBasis: 'highlight'
  };
}

test('repeated confirmation returns the same quote id without another row', () => {
  const { context, spreadsheet } = createContext();
  context.setPending_('test-user', pending('candidate-1'));

  const first = context.confirmCandidate_('test-user', 'candidate-1');
  const second = context.confirmCandidate_('test-user', 'candidate-1');

  assert.equal(first.quoteId, 'Q-0001');
  assert.equal(first.alreadyExisted, false);
  assert.equal(second.quoteId, 'Q-0001');
  assert.equal(second.alreadyExisted, true);
  assert.equal(spreadsheet.getSheetByName('Quotes').getLastRow(), 2);
  assert.equal(context.getPending_('test-user'), null);
});

test('an expired candidate is cleared without writing a quote', () => {
  const { context, spreadsheet } = createContext();
  context.setPending_('test-user', pending('candidate-old', Date.now() - 11 * 60 * 1000));

  const result = context.confirmCandidate_('test-user', 'candidate-old');

  assert.equal(result.status, 'expired');
  assert.equal(spreadsheet.getSheetByName('Quotes').getLastRow(), 1);
  assert.equal(context.getPending_('test-user'), null);
});

test('setup rejects an existing Quotes sheet with the wrong schema', () => {
  const { context, spreadsheet } = createContext();
  spreadsheet.sheets.Quotes.rows[0][1] = 'wrong_candidate_header';
  assert.throws(() => context.setupWebhookProject(), /schema/);
});
