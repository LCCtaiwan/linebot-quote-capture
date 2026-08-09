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
  constructor(id, { withDefaultSheet = false } = {}) {
    this.id = id;
    this.sheets = {};
    if (withDefaultSheet) this.insertSheet('工作表1');
  }

  getId() {
    return this.id;
  }

  getUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.id}/edit`;
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    this.sheets[name] = new FakeSheet(name);
    return this.sheets[name];
  }

  getSheets() {
    return Object.values(this.sheets);
  }

  deleteSheet(sheet) {
    delete this.sheets[sheet.name];
  }
}

function createContext({ spreadsheetId = 'test-sheet', existingSheetNames = [] } = {}) {
  const propertyEntries = [
    ['LINE_CHANNEL_ACCESS_TOKEN', 'test-line-token'],
    ['GEMINI_API_KEY', 'test-gemini-key'],
    ['ALLOWED_LINE_USER_ID', 'test-user'],
    ['WEBHOOK_SECRET', 'test-secret'],
    ['GEMINI_MODEL', 'gemini-test']
  ];
  if (spreadsheetId) propertyEntries.push(['SPREADSHEET_ID', spreadsheetId]);
  const properties = new Map(propertyEntries);
  const spreadsheets = new Map();
  if (spreadsheetId) {
    const spreadsheet = new FakeSpreadsheet(spreadsheetId);
    existingSheetNames.forEach((name) => spreadsheet.insertSheet(name));
    spreadsheets.set(spreadsheetId, spreadsheet);
  }
  let createCount = 0;
  const createdTitles = [];
  const lockState = { waits: 0, releases: 0 };
  const lock = {
    waitLock() { lockState.waits += 1; },
    releaseLock() { lockState.releases += 1; }
  };
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
      openById: (id) => {
        if (!spreadsheets.has(id)) throw new Error(`Unknown spreadsheet: ${id}`);
        return spreadsheets.get(id);
      },
      create: (title) => {
        createCount += 1;
        createdTitles.push(title);
        const id = `created-sheet-${createCount}`;
        const spreadsheet = new FakeSpreadsheet(id, { withDefaultSheet: true });
        spreadsheets.set(id, spreadsheet);
        return spreadsheet;
      },
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
  const setupResult = context.setupWebhookProject();
  const activeId = properties.get('SPREADSHEET_ID');
  return {
    context,
    spreadsheet: spreadsheets.get(activeId),
    properties,
    setupResult,
    getCreateCount: () => createCount,
    createdTitles,
    lockState
  };
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
  const { context, spreadsheet, lockState } = createContext();
  spreadsheet.sheets.Quotes.rows[0][1] = 'wrong_candidate_header';
  assert.throws(() => context.setupWebhookProject(), /schema/);
  assert.equal(lockState.releases, 2);
});

test('setup creates a spreadsheet and stores its id when the property is missing', () => {
  const { spreadsheet, properties, setupResult, getCreateCount, createdTitles, lockState } =
    createContext({ spreadsheetId: null });
  assert.equal(getCreateCount(), 1);
  assert.deepEqual(createdTitles, ['LINE 金句收藏庫']);
  assert.equal(properties.get('SPREADSHEET_ID'), 'created-sheet-1');
  assert.equal(setupResult.status, 'ready');
  assert.match(setupResult.spreadsheetUrl, /created-sheet-1/);
  assert.deepEqual(spreadsheet.getSheets().map((sheet) => sheet.name), ['Quotes', 'Events']);
  assert.equal(lockState.waits, 1);
  assert.equal(lockState.releases, 1);
});

test('setup reuses an existing spreadsheet without creating another', () => {
  const { setupResult, getCreateCount } = createContext();
  assert.equal(getCreateCount(), 0);
  assert.match(setupResult.spreadsheetUrl, /test-sheet/);
});

test('setup preserves extra user tabs in an existing spreadsheet', () => {
  const { spreadsheet, getCreateCount } = createContext({ existingSheetNames: ['My Notes'] });
  assert.equal(getCreateCount(), 0);
  assert.deepEqual(spreadsheet.getSheets().map((sheet) => sheet.name), ['My Notes', 'Quotes', 'Events']);
});

test('running setup twice creates at most one spreadsheet', () => {
  const { context, getCreateCount } = createContext({ spreadsheetId: null });
  context.setupWebhookProject();
  assert.equal(getCreateCount(), 1);
});
