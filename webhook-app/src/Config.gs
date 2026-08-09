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
  var config = getWebhookConfig_();
  var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  ensureSheet_(spreadsheet, 'Quotes', QUOTES_HEADERS);
  ensureSheet_(spreadsheet, 'Events', EVENTS_HEADERS);
  return 'Webhook project ready';
}
