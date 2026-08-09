var REVIEW_QUOTES_HEADERS = [
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

function getReviewSpreadsheet_() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('缺少 Script Property：SPREADSHEET_ID');
  return SpreadsheetApp.openById(spreadsheetId);
}

function validateReviewQuotesSheet_(sheet) {
  if (!sheet) throw new Error('找不到 Quotes 工作表；請先執行 webhook project setup');
  if (sheet.getLastRow() === 0) throw new Error('Quotes 工作表沒有標題列');
  var actual = sheet.getRange(1, 1, 1, REVIEW_QUOTES_HEADERS.length).getValues()[0];
  var mismatch = REVIEW_QUOTES_HEADERS.some(function (header, index) {
    return String(actual[index] || '') !== header;
  });
  if (mismatch) throw new Error('Quotes 工作表欄位與預期 schema 不符');
  return sheet;
}

function setupReviewProject() {
  var spreadsheet = getReviewSpreadsheet_();
  validateReviewQuotesSheet_(spreadsheet.getSheetByName('Quotes'));
  return 'Review project ready';
}
