var QUOTES_HEADERS = [
  'quote_id',
  'candidate_id',
  'created_at',
  'quote_text',
  'category',
  'tags',
  'source_title',
  'source_author',
  'source_type',
  'extraction_basis',
  'status'
];

var EVENTS_HEADERS = [
  'created_at',
  'webhook_event_id',
  'event_type',
  'action',
  'candidate_id',
  'quote_id',
  'status',
  'note'
];

function getWebhookConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    lineToken: properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
    geminiKey: properties.getProperty('GEMINI_API_KEY'),
    spreadsheetId: properties.getProperty('SPREADSHEET_ID'),
    allowedUserId: properties.getProperty('ALLOWED_LINE_USER_ID'),
    webhookSecret: properties.getProperty('WEBHOOK_SECRET'),
    geminiModel: properties.getProperty('GEMINI_MODEL') || 'gemini-3.6-flash',
    reviewAppUrl: properties.getProperty('REVIEW_APP_URL') || ''
  };

  var missing = Object.keys(config).filter(function (key) {
    return key !== 'reviewAppUrl' && !config[key];
  });
  if (missing.length) throw new Error('缺少 Script Properties：' + missing.join(', '));
  return config;
}

function setupWebhookProject() {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    var properties = PropertiesService.getScriptProperties();
    var spreadsheetId = properties.getProperty('SPREADSHEET_ID');
    var spreadsheet;

    if (spreadsheetId) {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } else {
      spreadsheet = SpreadsheetApp.create('LINE 金句收藏庫');
      spreadsheetId = spreadsheet.getId();
      properties.setProperty('SPREADSHEET_ID', spreadsheetId);
    }

    ensureSheet_(spreadsheet, 'Quotes', QUOTES_HEADERS);
    ensureSheet_(spreadsheet, 'Events', EVENTS_HEADERS);
    return {
      status: 'ready',
      spreadsheetUrl: spreadsheet.getUrl()
    };
  } finally {
    lock.releaseLock();
  }
}
