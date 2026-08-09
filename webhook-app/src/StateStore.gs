var RECENT_EVENTS_KEY = 'recentEvents';
var EVENT_TTL_MS = 60 * 60 * 1000;
var PROCESSING_TTL_MS = 120 * 1000;
var MAX_RECENT_EVENTS = 100;
var PENDING_TTL_MS = 10 * 60 * 1000;
var STATE_LOCK_WAIT_MS = 30000;

function pendingKey_(userId) {
  return 'pending_' + userId;
}

function getPending_(userId) {
  var raw = PropertiesService.getScriptProperties().getProperty(pendingKey_(userId));
  return raw ? JSON.parse(raw) : null;
}

function setPending_(userId, pending) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    setPendingUnlocked_(userId, pending);
  } finally {
    lock.releaseLock();
  }
}

function clearPending_(userId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    clearPendingUnlocked_(userId);
  } finally {
    lock.releaseLock();
  }
}

function setPendingUnlocked_(userId, pending) {
  PropertiesService.getScriptProperties().setProperty(
    pendingKey_(userId),
    JSON.stringify(pending)
  );
}

function clearPendingUnlocked_(userId) {
  PropertiesService.getScriptProperties().deleteProperty(pendingKey_(userId));
}

function setPendingIfCandidate_(userId, candidateId, pending) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    var current = getPending_(userId);
    if (!current || current.candidateId !== candidateId) return false;
    setPendingUnlocked_(userId, pending);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function clearPendingIfCandidate_(userId, candidateId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    var current = getPending_(userId);
    if (!current || current.candidateId !== candidateId) return false;
    clearPendingUnlocked_(userId);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function mutateRecentEvents_(mutator) {
  var lock = LockService.getScriptLock();
  lock.waitLock(STATE_LOCK_WAIT_MS);
  try {
    var properties = PropertiesService.getScriptProperties();
    var now = Date.now();
    var raw = properties.getProperty(RECENT_EVENTS_KEY);
    var events = raw ? JSON.parse(raw) : {};
    events = AppCore.pruneRecentEvents(events, now, EVENT_TTL_MS, MAX_RECENT_EVENTS);
    var result = mutator(events, now);
    events = AppCore.pruneRecentEvents(result.events || events, now, EVENT_TTL_MS, MAX_RECENT_EVENTS);
    properties.setProperty(RECENT_EVENTS_KEY, JSON.stringify(events));
    return result.value;
  } finally {
    lock.releaseLock();
  }
}

function claimWebhookEvent_(eventId) {
  return mutateRecentEvents_(function (events, now) {
    var claim = AppCore.claimEvent(events, eventId, now, PROCESSING_TTL_MS);
    return { events: claim.events, value: claim };
  });
}

function markWebhookEventDone_(eventId) {
  mutateRecentEvents_(function (events, now) {
    events[eventId] = ['D', now];
    return { events: events, value: true };
  });
}

function releaseWebhookEvent_(eventId) {
  mutateRecentEvents_(function (events) {
    delete events[eventId];
    return { events: events, value: true };
  });
}
