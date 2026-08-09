function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var mismatch = headers.some(function (header, index) {
    return String(actual[index] || '') !== header;
  });
  if (mismatch) throw new Error(name + ' 工作表欄位與預期 schema 不符');
  return sheet;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getWebhookConfig_().spreadsheetId);
}

function findQuoteByCandidateId_(sheet, candidateId) {
  if (sheet.getLastRow() < 2) return null;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, QUOTES_HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i][1]) === String(candidateId)) {
      return { row: i + 2, quoteId: String(rows[i][0]) };
    }
  }
  return null;
}

function nextQuoteId_(sheet) {
  var max = 0;
  if (sheet.getLastRow() >= 2) {
    var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    ids.forEach(function (row) {
      var match = String(row[0] || '').match(/^Q-(\d+)$/);
      if (match) max = Math.max(max, Number(match[1]));
    });
  }
  return 'Q-' + Utilities.formatString('%04d', max + 1);
}

function confirmCandidate_(userId, candidateId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    var spreadsheet = getSpreadsheet_();
    var quotes = ensureSheet_(spreadsheet, 'Quotes', QUOTES_HEADERS);
    var existing = findQuoteByCandidateId_(quotes, candidateId);
    if (existing) {
      var current = getPending_(userId);
      if (current && current.candidateId === candidateId) clearPendingUnlocked_(userId);
      appendAuditEvent_({
        eventType: 'postback',
        action: 'confirm',
        candidateId: candidateId,
        quoteId: existing.quoteId,
        status: 'already_exists',
        note: ''
      });
      return { status: 'confirmed', quoteId: existing.quoteId, alreadyExisted: true };
    }

    var pending = getPending_(userId);
    if (!pending || pending.candidateId !== candidateId) {
      return { status: 'missing' };
    }
    if (AppCore.isExpired(pending.createdAt, Date.now(), PENDING_TTL_MS)) {
      clearPendingUnlocked_(userId);
      return { status: 'expired' };
    }

    var quoteId = nextQuoteId_(quotes);

    quotes.appendRow([
      quoteId,
      pending.candidateId,
      new Date(),
      pending.quote,
      pending.category,
      pending.tags.join(', '),
      pending.sourceTitle,
      pending.sourceAuthor,
      pending.sourceType,
      pending.extractionBasis,
      'active'
    ]);
    SpreadsheetApp.flush();

    clearPendingUnlocked_(userId);
    appendAuditEvent_({
      eventType: 'postback',
      action: 'confirm',
      candidateId: candidateId,
      quoteId: quoteId,
      status: 'created',
      note: ''
    });
    return { status: 'confirmed', quoteId: quoteId, alreadyExisted: false };
  } finally {
    lock.releaseLock();
  }
}

function appendAuditEvent_(event) {
  try {
    var spreadsheet = getSpreadsheet_();
    var sheet = ensureSheet_(spreadsheet, 'Events', EVENTS_HEADERS);
    sheet.appendRow([
      new Date(),
      event.webhookEventId || '',
      event.eventType || '',
      event.action || '',
      event.candidateId || '',
      event.quoteId || '',
      event.status || '',
      event.note || ''
    ]);
  } catch (error) {
    console.warn('Audit write failed', error);
  }
}
