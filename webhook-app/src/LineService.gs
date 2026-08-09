var LINE_API_BASE = 'https://api.line.me/v2/bot';
var LINE_DATA_API_BASE = 'https://api-data.line.me/v2/bot';

function lineRequest_(url, options) {
  var config = getWebhookConfig_();
  var request = options || {};
  request.headers = request.headers || {};
  request.headers.Authorization = 'Bearer ' + config.lineToken;
  request.muteHttpExceptions = true;
  return UrlFetchApp.fetch(url, request);
}

function downloadLineImage_(messageId) {
  var response = lineRequest_(LINE_DATA_API_BASE + '/message/' + encodeURIComponent(messageId) + '/content', {
    method: 'get'
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('LINE 圖片下載失敗：' + response.getResponseCode());
  }
  return response.getBlob();
}

function sendLineMessages_(endpoint, payload) {
  var response = lineRequest_(LINE_API_BASE + endpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
  var ok = response.getResponseCode() >= 200 && response.getResponseCode() < 300;
  if (!ok) console.warn('LINE API failed', response.getResponseCode(), response.getContentText());
  return ok;
}

function replyLine_(replyToken, messages) {
  if (!replyToken) return false;
  return sendLineMessages_('/message/reply', {
    replyToken: replyToken,
    messages: messages
  });
}

function pushLine_(userId, messages) {
  if (!userId) return false;
  return sendLineMessages_('/message/push', {
    to: userId,
    messages: messages
  });
}

function replyOrPush_(event, messages) {
  if (replyLine_(event.replyToken, messages)) return true;
  return pushLine_(event.source && event.source.userId, messages);
}

function textMessage_(text) {
  return { type: 'text', text: String(text) };
}

function previewMessage_(candidate) {
  var candidateId = candidate.candidateId;
  return {
    type: 'text',
    text: AppCore.buildPreviewText(candidate) + '\n\n請確認是否正確。',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '確認儲存',
            data: 'action=confirm&candidate=' + encodeURIComponent(candidateId),
            displayText: '確認儲存'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '修改金句',
            data: 'action=edit&candidate=' + encodeURIComponent(candidateId),
            displayText: '修改金句'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '取消',
            data: 'action=cancel&candidate=' + encodeURIComponent(candidateId),
            displayText: '取消'
          }
        }
      ]
    }
  };
}
