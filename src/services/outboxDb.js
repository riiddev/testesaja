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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFallbackOutbox(userId, items) {
  try {
    localStorage.setItem(`sinau_outbox_${userId}`, JSON.stringify(items));
  } catch (e) {}
}

/**
 * Enqueue a new event to the persistent outbox
 */
export async function enqueueOutboxEvent(userId, event) {
  if (!userId || !event || !event.eventId) return;

  const db = await openOutboxDb();
  if (!db) {
    const list = getFallbackOutbox(userId);
    // Replace if same eventId exists, else push
    const filtered = list.filter((it) => it.eventId !== event.eventId);
    filtered.push(event);
    saveFallbackOutbox(userId, filtered);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      store.put(event);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn("[OutboxDB] tx put error, using fallback");
        const list = getFallbackOutbox(userId);
        const filtered = list.filter((it) => it.eventId !== event.eventId);
        filtered.push(event);
        saveFallbackOutbox(userId, filtered);
        resolve(true);
      };
    } catch (err) {
      resolve(false);
    }
  });
}

/**
 * Retrieve pending events for a user, ordered by createdAt
 */
export async function getPendingOutboxEvents(userId, limit = 50) {
  if (!userId) return [];

  const db = await openOutboxDb();
  if (!db) {
    return getFallbackOutbox(userId).slice(0, limit);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by createdAt ascending
        results.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        resolve(results.slice(0, limit));
      };

      request.onerror = () => {
        resolve(getFallbackOutbox(userId).slice(0, limit));
      };
    } catch (e) {
      resolve(getFallbackOutbox(userId).slice(0, limit));
    }
  });
}

/**
 * Remove confirmed eventIds from the outbox after server ACK
 */
export async function removeConfirmedEvents(userId, eventIds = []) {
  if (!userId || !eventIds.length) return;

  const idSet = new Set(eventIds);
  const db = await openOutboxDb();

  if (!db) {
    const list = getFallbackOutbox(userId);
    const remaining = list.filter((it) => !idSet.has(it.eventId));
    saveFallbackOutbox(userId, remaining);
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);

      for (const id of eventIds) {
        store.delete(id);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        const list = getFallbackOutbox(userId);
        const remaining = list.filter((it) => !idSet.has(it.eventId));
        saveFallbackOutbox(userId, remaining);
        resolve(true);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Get total count of pending items in outbox for a user
 */
export async function getOutboxCount(userId) {
  if (!userId) return 0;

  const db = await openOutboxDb();
  if (!db) {
    return getFallbackOutbox(userId).length;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const index = store.index("userId");
      const request = index.count(userId);

      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(getFallbackOutbox(userId).length);
    } catch (e) {
      resolve(getFallbackOutbox(userId).length);
    }
  });
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

