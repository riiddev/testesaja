/**
 * SINAUENGLISH V2 — Offline-First IndexedDB Outbox Engine
 * 
 * Provides persistent, resilient queuing for all learning events:
 * - Namespaced per userId
 * - Strictly deletes items ONLY after server confirms receipt (ACK)
 * - Transparent fallback to localStorage if IndexedDB is unavailable
 */

const DB_NAME = "sinau_offline_db";
const DB_VERSION = 1;
const STORE_OUTBOX = "outbox";
const STORE_PROGRESS = "progress_cache";

let dbInstance = null;

function isIndexedDBAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

/**
 * Open or initialize the IndexedDB instance
 */
export function openOutboxDb() {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Outbox Store (Pending learning & SRS events)
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const outboxStore = db.createObjectStore(STORE_OUTBOX, { keyPath: "eventId" });
          outboxStore.createIndex("userId", "userId", { unique: false });
          outboxStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // 2. Progress Cache Store (Local offline cache of learned words)
        if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
          db.createObjectStore(STORE_PROGRESS, { keyPath: "userId" });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn("[OutboxDB] IndexedDB error, using fallback:", event.target.error);
        resolve(null);
      };
    } catch (e) {
      console.warn("[OutboxDB] Exception opening IndexedDB:", e);
      resolve(null);
    }
  });
}

/**
 * Fallback helpers for localStorage when IndexedDB is blocked
 */
function getFallbackOutbox(userId) {
  try {
    const raw = localStorage.getItem(`sinau_outbox_${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    // The localStorage key is user-scoped. Restore the namespace for older
    // records, but never accept records that explicitly belong to another user.
    return parsed
      .filter((item) => item && typeof item.eventId === "string")
      .filter((item) => !item.userId || item.userId === userId)
      .map((item) => ({ ...item, userId }));
  } catch (e) {
    return [];
  }
}

function saveFallbackOutbox(userId, items) {
  try {
    localStorage.setItem(`sinau_outbox_${userId}`, JSON.stringify(items));
    return true;
  } catch (e) {
    console.warn("[OutboxDB] localStorage fallback unavailable:", e?.message || e);
    return false;
  }
}

function mergeOutboxEvents(userId, indexedEvents = [], fallbackEvents = [], limit = 50) {
  const byId = new Map();

  for (const item of [...indexedEvents, ...fallbackEvents]) {
    if (!item || typeof item.eventId !== "string" || item.userId !== userId) continue;
    byId.set(item.eventId, item);
  }

  return [...byId.values()]
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .slice(0, limit);
}

/**
 * Enqueue a new event to the persistent outbox
 */
export async function enqueueOutboxEvent(userId, event) {
  if (
    typeof userId !== "string" ||
    !userId ||
    !event ||
    typeof event.eventId !== "string" ||
    !event.eventId ||
    (event.userId && event.userId !== userId)
  ) {
    return false;
  }

  const normalizedEvent = { ...event, userId };
  const db = await openOutboxDb();

  if (!db) {
    const list = getFallbackOutbox(userId).filter((item) => item.eventId !== normalizedEvent.eventId);
    list.push(normalizedEvent);
    return saveFallbackOutbox(userId, list);
  }

  const indexedWriteSucceeded = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      tx.oncomplete = () => finish(true);
      tx.onerror = () => finish(false);
      tx.onabort = () => finish(false);
      tx.objectStore(STORE_OUTBOX).put(normalizedEvent);
    } catch (err) {
      finish(false);
    }
  });

  if (indexedWriteSucceeded) return true;

  // Keep failed IndexedDB writes in localStorage. Readers merge both stores,
  // so fallback records remain visible even while IndexedDB is still available.
  const fallback = getFallbackOutbox(userId).filter((item) => item.eventId !== normalizedEvent.eventId);
  fallback.push(normalizedEvent);
  return saveFallbackOutbox(userId, fallback);
}

/**
 * Retrieve pending events from both durable stores. Merge by eventId to avoid
 * duplicate delivery if one event exists in IndexedDB and in the fallback.
 */
export async function getPendingOutboxEvents(userId, limit = 50) {
  if (!userId) return [];

  const fallbackEvents = getFallbackOutbox(userId);
  const db = await openOutboxDb();
  if (!db) {
    return mergeOutboxEvents(userId, [], fallbackEvents, limit);
  }

  const indexedEvents = await new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const request = tx.objectStore(STORE_OUTBOX).index("userId").getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });

  return mergeOutboxEvents(userId, indexedEvents, fallbackEvents, limit);
}

/**
 * Remove acknowledged IDs from every local store. If IndexedDB deletion fails,
 * return false; the remaining copy can be replayed safely because the server is
 * idempotent.
 */
export async function removeConfirmedEvents(userId, eventIds = []) {
  if (!userId || !Array.isArray(eventIds) || !eventIds.length) return false;

  const ids = [...new Set(eventIds.filter((id) => typeof id === "string" && id))];
  if (!ids.length) return false;

  const fallbackEvents = getFallbackOutbox(userId);
  const fallbackSaved = saveFallbackOutbox(
    userId,
    fallbackEvents.filter((item) => !ids.includes(item.eventId))
  );

  const db = await openOutboxDb();
  if (!db) return fallbackSaved;

  const indexedDeleteSucceeded = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      tx.oncomplete = () => finish(true);
      tx.onerror = () => finish(false);
      tx.onabort = () => finish(false);

      const store = tx.objectStore(STORE_OUTBOX);
      for (const id of ids) store.delete(id);
    } catch (e) {
      finish(false);
    }
  });

  return indexedDeleteSucceeded && fallbackSaved;
}

/**
 * Count merged, de-duplicated pending events so fallback records are not hidden
 * when IndexedDB remains available but one of its writes previously failed.
 */
export async function getOutboxCount(userId) {
  if (!userId) return 0;
  return (await getPendingOutboxEvents(userId, Number.MAX_SAFE_INTEGER)).length;
}

/**
 * Save user progress map to offline cache
 */
export async function saveProgressToCache(userId, progressMap = {}) {
  if (!userId) return;

  try {
    localStorage.setItem(`sinau_progress_${userId}`, JSON.stringify(progressMap));
  } catch (e) {}

  const db = await openOutboxDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROGRESS, "readwrite");
      tx.objectStore(STORE_PROGRESS).put({
        userId,
        progressMap,
        updatedAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Load user progress map from offline cache
 */
export async function loadProgressFromCache(userId) {
  if (!userId) return {};

  const db = await openOutboxDb();
  if (!db) {
    try {
      const raw = localStorage.getItem(`sinau_progress_${userId}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROGRESS, "readonly");
      const req = tx.objectStore(STORE_PROGRESS).get(userId);

      req.onsuccess = () => {
        if (req.result && req.result.progressMap) {
          resolve(req.result.progressMap);
        } else {
          try {
            const raw = localStorage.getItem(`sinau_progress_${userId}`);
            resolve(raw ? JSON.parse(raw) : {});
          } catch (e) {
            resolve({});
          }
        }
      };
      req.onerror = () => resolve({});
    } catch (e) {
      resolve({});
    }
  });
}

/**
 * Wipe all cached data and pending outbox for user (upon logout / switch account)
 */
export async function clearAllUserData(userId, { preserveOutbox = false } = {}) {
  if (!userId) return;

  try {
    // 1. Clear namespaced localStorage items. Pending events survive logout
    // so an offline learner does not lose work before the next sign-in.
    const prefixes = [
      ...(!preserveOutbox ? [`sinau_outbox_${userId}`] : []),
      `sinau_progress_${userId}`,
      `sinau_local_profile_${userId}`,
      `sinau_local_inventory_${userId}`,
      `sinau_avatar_url_${userId}`,
      `sinau_avatar_updated_at_${userId}`,
      `sinau_habit_read_history_${userId}`,
      `sinau_grammar_history_${userId}`
    ];

    prefixes.forEach((k) => localStorage.removeItem(k));

    // Also clear generic non-namespaced keys
    localStorage.removeItem("sinau_local_profile");
    localStorage.removeItem("sinau_local_inventory");
    localStorage.removeItem("sinau_avatar_url");
    localStorage.removeItem("sinau_avatar_updated_at");

    // Remove any user quest keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      const isPreservedOutbox = preserveOutbox && key === `sinau_outbox_${userId}`;
      if (key && !isPreservedOutbox && (key.includes(userId) || key.startsWith("sinau_daily_quests_"))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {}

  // 2. Clear IndexedDB records for this user
  const db = await openOutboxDb();
  if (!db) return;

  try {
    const stores = preserveOutbox
      ? [STORE_PROGRESS]
      : [STORE_OUTBOX, STORE_PROGRESS];
    const tx = db.transaction(stores, "readwrite");

    if (!preserveOutbox) {
      const outboxStore = tx.objectStore(STORE_OUTBOX);
      const index = outboxStore.index("userId");
      const req = index.getAllKeys(userId);
      req.onsuccess = () => {
        const keys = req.result || [];
        for (const k of keys) outboxStore.delete(k);
      };
    }

    tx.objectStore(STORE_PROGRESS).delete(userId);
  } catch (e) {}
}

