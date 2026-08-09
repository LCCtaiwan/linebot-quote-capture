var AppCore = (function () {
  var CATEGORIES = [
    '工作學習',
    '健康醫療',
    '人際生活',
    '理財投資',
    '創意靈感',
    '其他'
  ];

  var SOURCE_TYPES = ['book_page', 'reader', 'poster', 'unknown'];
  var EXTRACTION_BASES = [
    'highlight',
    'underline',
    'box',
    'representative',
    'poster_primary'
  ];
  var MAX_QUOTE_LENGTH = 3000;
  var MAX_SOURCE_LENGTH = 200;
  var MAX_TAG_LENGTH = 40;

  function contains_(items, value) {
    return items.indexOf(value) !== -1;
  }

  function stripCodeFence_(text) {
    var value = String(text || '').trim();
    if (value.indexOf('```') !== 0) return value;
    return value
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  function normalizeTags_(tags) {
    if (!Array.isArray(tags)) throw new Error('tags 必須是陣列');
    var seen = {};
    var normalized = [];
    tags.forEach(function (tag) {
      var value = String(tag || '').trim();
      if (!value || seen[value]) return;
      if (value.length > MAX_TAG_LENGTH || /[,，]/.test(value)) {
        throw new Error('tag 不可超過 ' + MAX_TAG_LENGTH + ' 字，且不可含逗號');
      }
      seen[value] = true;
      normalized.push(value);
    });
    if (normalized.length < 2 || normalized.length > 5) {
      throw new Error('tags 必須有 2–5 個不重複項目');
    }
    return normalized;
  }

  function normalizeCandidate_(input) {
    if (!input || typeof input !== 'object') throw new Error('AI 結果必須是物件');
    var quote = String(input.quote || '').trim();
    var category = String(input.category || '').trim();
    var sourceType = String(input.sourceType || 'unknown').trim();
    var extractionBasis = String(input.extractionBasis || '').trim();

    if (!quote) throw new Error('金句不可為空');
    if (quote.length > MAX_QUOTE_LENGTH) {
      throw new Error('金句不可超過 ' + MAX_QUOTE_LENGTH + ' 字');
    }
    if (!contains_(CATEGORIES, category)) throw new Error('分類不在固定六類內');
    if (!contains_(SOURCE_TYPES, sourceType)) throw new Error('來源類型不合法');
    if (!contains_(EXTRACTION_BASES, extractionBasis)) {
      throw new Error('擷取依據不合法');
    }

    var sourceTitle = String(input.sourceTitle || '').trim();
    var sourceAuthor = String(input.sourceAuthor || '').trim();
    if (sourceTitle.length > MAX_SOURCE_LENGTH || sourceAuthor.length > MAX_SOURCE_LENGTH) {
      throw new Error('來源欄位不可超過 ' + MAX_SOURCE_LENGTH + ' 字');
    }

    return {
      quote: quote,
      category: category,
      tags: normalizeTags_(input.tags),
      sourceTitle: sourceTitle,
      sourceAuthor: sourceAuthor,
      sourceType: sourceType,
      extractionBasis: extractionBasis
    };
  }

  function parseGeminiCandidate_(text) {
    return normalizeCandidate_(JSON.parse(stripCodeFence_(text)));
  }

  function pruneRecentEvents_(events, nowMs, ttlMs, maxEntries) {
    var entries = Object.keys(events || {}).map(function (eventId) {
      return [eventId, events[eventId]];
    }).filter(function (entry) {
      var state = entry[1];
      return Array.isArray(state) && nowMs - Number(state[1]) <= ttlMs;
    });

    entries.sort(function (a, b) {
      return Number(a[1][1]) - Number(b[1][1]);
    });
    if (entries.length > maxEntries) {
      entries = entries.slice(entries.length - maxEntries);
    }

    var result = {};
    entries.forEach(function (entry) {
      result[entry[0]] = entry[1];
    });
    return result;
  }

  function claimEvent_(events, eventId, nowMs, processingTtlMs) {
    var state = events[eventId];
    if (state && state[0] === 'D') {
      return { shouldProcess: false, reason: 'done', events: events };
    }
    if (state && state[0] === 'P' && nowMs - Number(state[1]) < processingTtlMs) {
      return { shouldProcess: false, reason: 'processing', events: events };
    }
    events[eventId] = ['P', nowMs];
    return { shouldProcess: true, reason: 'claimed', events: events };
  }

  function parsePostback_(data) {
    var result = {};
    String(data || '').split('&').forEach(function (part) {
      if (!part) return;
      var pair = part.split('=');
      result[decodeURIComponent(pair[0] || '')] = decodeURIComponent(pair.slice(1).join('=') || '');
    });
    return result;
  }

  function isExpired_(createdAtMs, nowMs, ttlMs) {
    return !createdAtMs || nowMs - Number(createdAtMs) > ttlMs;
  }

  function buildPreviewText_(candidate) {
    var source = [candidate.sourceTitle, candidate.sourceAuthor]
      .filter(function (value) { return Boolean(value); })
      .join('｜');
    return [
      '我讀到的金句：',
      '「' + candidate.quote + '」',
      '',
      '分類：' + candidate.category,
      '標籤：' + candidate.tags.join('、'),
      source ? '來源：' + source : '來源：圖片未顯示'
    ].join('\n');
  }

  return {
    CATEGORIES: CATEGORIES,
    SOURCE_TYPES: SOURCE_TYPES,
    EXTRACTION_BASES: EXTRACTION_BASES,
    MAX_QUOTE_LENGTH: MAX_QUOTE_LENGTH,
    normalizeCandidate: normalizeCandidate_,
    parseGeminiCandidate: parseGeminiCandidate_,
    pruneRecentEvents: pruneRecentEvents_,
    claimEvent: claimEvent_,
    parsePostback: parsePostback_,
    isExpired: isExpired_,
    buildPreviewText: buildPreviewText_
  };
})();
