function geminiResponseSchema_() {
  return {
    type: 'object',
    properties: {
      quote: { type: 'string' },
      category: { type: 'string', enum: AppCore.CATEGORIES },
      tags: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: { type: 'string' }
      },
      sourceTitle: { type: 'string' },
      sourceAuthor: { type: 'string' },
      sourceType: { type: 'string', enum: AppCore.SOURCE_TYPES },
      extractionBasis: { type: 'string', enum: AppCore.EXTRACTION_BASES }
    },
    required: [
      'quote',
      'category',
      'tags',
      'sourceTitle',
      'sourceAuthor',
      'sourceType',
      'extractionBasis'
    ]
  };
}

function callGemini_(parts) {
  var config = getWebhookConfig_();
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(config.geminiModel) + ':generateContent';
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': config.geminiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ role: 'user', parts: parts }],
      generationConfig: {
        responseFormat: {
          text: {
            mimeType: 'application/json',
            schema: geminiResponseSchema_()
          }
        },
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: 'minimal' }
      }
    })
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Gemini API 失敗：' + response.getResponseCode());
  }
  var payload = JSON.parse(response.getContentText());
  var text = payload.candidates && payload.candidates[0] &&
    payload.candidates[0].content && payload.candidates[0].content.parts &&
    payload.candidates[0].content.parts[0] && payload.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini 未回傳可解析內容');
  return AppCore.parseGeminiCandidate(text);
}

function analyzeImage_(blob) {
  var prompt = [
    '你是繁體中文金句整理助手。請只產生一則金句。',
    '若圖片有螢光色、底線或框選，擷取最主要、最顯著的標註段落；',
    '若是沒有標註的書頁或閱讀器畫面，選一段最具代表性的原句；',
    '若是海報，擷取主要標題或標語。',
    '忠實轉錄，不可自行改寫、補句或翻譯。',
    '分類只能使用指定六類；標籤使用 2–5 個精簡繁體中文詞。',
    '書名與作者只有在圖片清楚可見時才填，否則留空。'
  ].join('\n');
  return callGemini_([
    { text: prompt },
    {
      inlineData: {
        mimeType: blob.getContentType() || 'image/jpeg',
        data: Utilities.base64Encode(blob.getBytes())
      }
    }
  ]);
}

function classifyEditedQuote_(quote, previousCandidate) {
  var prompt = [
    '以下是使用者親自修正的金句，請保持 quote 逐字完全相同，只重新產生分類與標籤。',
    '來源資訊沿用提供內容。',
    '',
    'quote：' + quote,
    'sourceTitle：' + (previousCandidate.sourceTitle || ''),
    'sourceAuthor：' + (previousCandidate.sourceAuthor || ''),
    'sourceType：' + (previousCandidate.sourceType || 'unknown'),
    'extractionBasis：' + (previousCandidate.extractionBasis || 'representative')
  ].join('\n');
  var candidate = callGemini_([{ text: prompt }]);
  candidate.quote = quote;
  return AppCore.normalizeCandidate(candidate);
}
