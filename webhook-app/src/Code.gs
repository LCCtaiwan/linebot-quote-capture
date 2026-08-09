function doPost(e) {
  var config = getWebhookConfig_();
  var providedSecret = e && e.parameter && e.parameter.key;
  if (!providedSecret || providedSecret !== config.webhookSecret) {
    return webhookOk_();
  }

  var body = JSON.parse(e.postData && e.postData.contents || '{}');
  (body.events || []).forEach(function (event) {
    handleWebhookEvent_(event, config);
  });
  return webhookOk_();
}

function webhookOk_() {
  return HtmlService.createHtmlOutput('OK');
}

function handleWebhookEvent_(event, config) {
  var userId = event.source && event.source.userId;
  if (!userId || userId !== config.allowedUserId) return;

  var eventId = event.webhookEventId || event.deliveryContext && event.deliveryContext.eventId;
  if (!eventId) eventId = Utilities.getUuid();
  var claim = claimWebhookEvent_(eventId);
  if (!claim.shouldProcess) return;

  try {
    routeWebhookEvent_(event, eventId, userId, config);
    markWebhookEventDone_(eventId);
  } catch (error) {
    var message = event.type === 'postback'
      ? '處理失敗，資料尚未遺失，請再操作一次。'
      : '辨識失敗，請重新上傳一次圖片。';
    var notified = replyOrPush_(event, [textMessage_(message)]);
    appendAuditEvent_({
      webhookEventId: eventId,
      eventType: event.type,
      action: 'error',
      status: notified ? 'notified' : 'unhandled',
      note: String(error && error.message || error)
    });
    if (notified) {
      markWebhookEventDone_(eventId);
      return;
    }
    releaseWebhookEvent_(eventId);
    throw error;
  }
}

function routeWebhookEvent_(event, eventId, userId, config) {
  if (event.type === 'message' && event.message && event.message.type === 'image') {
    handleImageEvent_(event, eventId, userId);
    return;
  }
  if (event.type === 'message' && event.message && event.message.type === 'text') {
    handleTextEvent_(event, userId, config);
    return;
  }
  if (event.type === 'postback') {
    handlePostbackEvent_(event, userId, config);
  }
}

function handleImageEvent_(event, eventId, userId) {
  var existing = getPending_(userId);
  if (existing && existing.originEventId === eventId) {
    if (!replyOrPush_(event, [previewMessage_(existing)])) {
      throw new Error('LINE 無法送出既有預覽');
    }
    return;
  }

  var blob = downloadLineImage_(event.message.id);
  var analyzed = analyzeImage_(blob);
  var candidate = {
    state: 'PENDING',
    candidateId: Utilities.getUuid(),
    originEventId: eventId,
    createdAt: Date.now(),
    quote: analyzed.quote,
    category: analyzed.category,
    tags: analyzed.tags,
    sourceTitle: analyzed.sourceTitle,
    sourceAuthor: analyzed.sourceAuthor,
    sourceType: analyzed.sourceType,
    extractionBasis: analyzed.extractionBasis
  };
  setPending_(userId, candidate);
  if (!replyOrPush_(event, [previewMessage_(candidate)])) {
    throw new Error('LINE 無法送出金句預覽');
  }
}

function handlePostbackEvent_(event, userId, config) {
  var data = AppCore.parsePostback(event.postback && event.postback.data);
  if (!data.candidate || ['confirm', 'edit', 'cancel'].indexOf(data.action) === -1) {
    replyOrPush_(event, [textMessage_('無法辨識這個操作，請重新上傳圖片。')]);
    return;
  }

  if (data.action === 'confirm') {
    var result = confirmCandidate_(userId, data.candidate);
    if (result.status === 'expired') {
      replyOrPush_(event, [textMessage_('此收藏已超過 10 分鐘，請重新上傳圖片。')]);
      return;
    }
    if (result.status !== 'confirmed') {
      replyOrPush_(event, [textMessage_('此收藏已失效或被新的圖片取代，請重新上傳。')]);
      return;
    }
    var suffix = config.reviewAppUrl ? '\n回顧：' + config.reviewAppUrl : '';
    replyOrPush_(event, [textMessage_('已收藏 ' + result.quoteId + suffix)]);
    return;
  }

  var pending = getPending_(userId);
  if (!pending || pending.candidateId !== data.candidate) {
    replyOrPush_(event, [textMessage_('此收藏已失效或被新的圖片取代，請重新上傳。')]);
    return;
  }
  if (AppCore.isExpired(pending.createdAt, Date.now(), PENDING_TTL_MS)) {
    clearPendingIfCandidate_(userId, data.candidate);
    replyOrPush_(event, [textMessage_('此收藏已超過 10 分鐘，請重新上傳圖片。')]);
    return;
  }

  if (data.action === 'cancel') {
    clearPendingIfCandidate_(userId, data.candidate);
    replyOrPush_(event, [textMessage_('已取消，沒有寫入收藏。')]);
    return;
  }
  if (data.action === 'edit') {
    pending.state = 'AWAITING_EDIT';
    if (!setPendingIfCandidate_(userId, data.candidate, pending)) {
      replyOrPush_(event, [textMessage_('此收藏已被新的圖片取代，請重新操作。')]);
      return;
    }
    replyOrPush_(event, [textMessage_('請直接輸入正確的金句文字；輸入「取消」可放棄。')]);
  }
}

function handleTextEvent_(event, userId, config) {
  var text = String(event.message.text || '').trim();
  if (text === '取消') {
    clearPending_(userId);
    replyOrPush_(event, [textMessage_('已取消目前操作。')]);
    return;
  }
  if (text === '回顧') {
    replyOrPush_(event, [textMessage_(config.reviewAppUrl || '尚未設定回顧頁網址。')]);
    return;
  }
  if (text === '說明') {
    replyOrPush_(event, [textMessage_('請上傳書頁、閱讀器截圖或海報。我會先回傳一則金句預覽，確認後才會收藏。')]);
    return;
  }

  var pending = getPending_(userId);
  if (pending && pending.state === 'AWAITING_EDIT') {
    if (AppCore.isExpired(pending.createdAt, Date.now(), PENDING_TTL_MS)) {
      clearPendingIfCandidate_(userId, pending.candidateId);
      replyOrPush_(event, [textMessage_('修改期限已過，請重新上傳圖片。')]);
      return;
    }
    if (!text || text.length > AppCore.MAX_QUOTE_LENGTH) {
      replyOrPush_(event, [textMessage_('金句需為 1–' + AppCore.MAX_QUOTE_LENGTH + ' 字，請重新輸入。')]);
      return;
    }
    var updated = classifyEditedQuote_(text, pending);
    pending.state = 'PENDING';
    pending.quote = text;
    pending.category = updated.category;
    pending.tags = updated.tags;
    if (!setPendingIfCandidate_(userId, pending.candidateId, pending)) {
      replyOrPush_(event, [textMessage_('此收藏已被新的圖片取代，請重新操作。')]);
      return;
    }
    replyOrPush_(event, [previewMessage_(pending)]);
    return;
  }

  replyOrPush_(event, [textMessage_('請上傳圖片，或輸入「說明」查看使用方式。')]);
}
