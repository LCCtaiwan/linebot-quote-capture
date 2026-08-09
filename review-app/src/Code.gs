function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('LINE 金句收藏庫')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function getQuoteCards() {
  var sheet = validateReviewQuotesSheet_(getReviewSpreadsheet_().getSheetByName('Quotes'));
  if (sheet.getLastRow() < 2) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, REVIEW_QUOTES_HEADERS.length).getValues();
  return rows.filter(function (row) {
    return String(row[10] || 'active') === 'active';
  }).map(function (row) {
    var createdAt = row[2] instanceof Date ? row[2] : new Date(row[2]);
    return {
      id: String(row[0] || ''),
      createdAt: isNaN(createdAt.getTime()) ? '' : Utilities.formatDate(createdAt, 'Asia/Taipei', 'yyyy-MM-dd'),
      quote: String(row[3] || ''),
      category: String(row[4] || ''),
      tags: String(row[5] || '').split(',').map(function (tag) {
        return tag.trim();
      }).filter(Boolean),
      sourceTitle: String(row[6] || ''),
      sourceAuthor: String(row[7] || '')
    };
  }).reverse();
}
