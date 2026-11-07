import test from "node:test";
import assert from "node:assert/strict";

function createMemoryStorage({ failWrites = false } = {}) {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) {
      if (failWrites) throw new Error("QuotaExceededError");
      values.set(String(key), String(value));
    },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); }
  };
}

function createFakeIndexedDB({ failOutboxWrites = false } = {}) {
  const stores = {
    outbox: new Map(),
    progress_cache: new Map()
  };
  const storeNames = new Set();
  let upgraded = false;

  const db = {
    objectStoreNames: { contains: (name) => storeNames.has(name) },
    createObjectStore(name, options = {}) {
      storeNames.add(name);
      return { createIndex() {}, keyPath: options.keyPath };
    },
    transaction(storeName) {
      const names = Array.isArray(storeName) ? storeName : [storeName];
      const tx = {
        error: null,
        objectStore(name) {
          if (!names.includes(name) || !stores[name]) throw new Error("Invalid object store");
          const records = stores[name];
          const keyFor = (value) => name === "progress_cache" ? value.userId : value.eventId;
          const request = (resolveValue) => {
            const req = {};
            queueMicrotask(() => {
              req.result = resolveValue();
              req.onsuccess?.({ target: req });
            });
            return req;
          };

          return {
            put(value) {
              queueMicrotask(() => {
                if (name === "outbox" && failOutboxWrites) {
                  tx.error = new Error("IndexedDB write failed");
                  tx.onerror?.({ target: tx });
                  tx.onabort?.({ target: tx });
                  return;
                }
                records.set(keyFor(value), structuredClone(value));
                tx.oncomplete?.({ target: tx });
              });
            },
            get(key) {
              return request(() => records.get(key));
            },
            delete(key) {
              queueMicrotask(() => {
                records.delete(key);
                tx.oncomplete?.({ target: tx });
              });
            },
            index(indexName) {
              if (indexName !== "userId") throw new Error("Unknown index");
              return {
                getAll(userId) {
                  return request(() => [...records.values()]
                    .filter((item) => item.userId === userId)
                    .map((item) => structuredClone(item)));
                },
                count(userId) {
                  return request(() => [...records.values()]
                    .filter((item) => item.userId === userId).length);
                },
                getAllKeys(userId) {
                  return request(() => [...records.values()]
                    .filter((item) => item.userId === userId)
                    .map((item) => keyFor(item)));
                }
              };
            }
          };
        }
      };
      return tx;
    }
  };

  return {
    open() {
      const req = {};
      queueMicrotask(() => {
        req.result = db;
        if (!upgraded) {
          req.onupgradeneeded?.({ target: { result: db } });
          upgraded = true;
        }
        req.onsuccess?.({ target: { result: db } });
      });
      return req;
    },
    stores
  };
}

function installBrowserStorage({ indexedDB, localStorage = createMemoryStorage() } = {}) {
  const previous = {
    window: globalThis.window,
    indexedDB: globalThis.indexedDB,
    localStorage: globalThis.localStorage
  };

  if (indexedDB) {
    globalThis.indexedDB = indexedDB;
    globalThis.window = { indexedDB };
  } else {
    delete globalThis.indexedDB;
    delete globalThis.window;
  }
  globalThis.localStorage = localStorage;

  return {
    localStorage,
    restore() {
      if (previous.window === undefined) delete globalThis.window;
      else globalThis.window = previous.window;
      if (previous.indexedDB === undefined) delete globalThis.indexedDB;
      else globalThis.indexedDB = previous.indexedDB;
      if (previous.localStorage === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = previous.localStorage;
    }
  };
}

test("IndexedDB outbox survives a module reload and isolates users", async () => {
  const idb = createFakeIndexedDB();
  const env = installBrowserStorage({ indexedDB: idb });
  try {
    const firstLoad = await import("../src/services/outboxDb.js?outbox-idb-first");
    assert.equal(await firstLoad.enqueueOutboxEvent("user-a", {
      eventId: "evt-a-1",
      userId: "user-a",
      wordId: "abandon",
      isCorrect: true,
      createdAt: "2026-11-07T01:00:00.000Z"
    }), true);
    assert.equal(await firstLoad.enqueueOutboxEvent("user-b", {
      eventId: "evt-b-1",
      userId: "user-b",
      wordId: "ability",
      isCorrect: false,
      createdAt: "2026-11-07T02:00:00.000Z"
    }), true);

    // A new module instance models a fresh page load using the same browser DB.
    const secondLoad = await import("../src/services/outboxDb.js?outbox-idb-reload");
    assert.deepEqual(
      (await secondLoad.getPendingOutboxEvents("user-a")).map((item) => item.eventId),
      ["evt-a-1"]
    );
    assert.equal(await secondLoad.getOutboxCount("user-a"), 1);
    assert.equal(await secondLoad.getOutboxCount("user-b"), 1);

    assert.equal(await secondLoad.removeConfirmedEvents("user-a", ["evt-a-1"]), true);
    assert.deepEqual(await secondLoad.getPendingOutboxEvents("user-a"), []);
    assert.equal((await secondLoad.getPendingOutboxEvents("user-b"))[0].eventId, "evt-b-1");
  } finally {
    env.restore();
  }
});

test("fallback events remain visible when IndexedDB is available but a write fails", async () => {
  const idb = createFakeIndexedDB({ failOutboxWrites: true });
  const env = installBrowserStorage({ indexedDB: idb });
  try {
    const outbox = await import("../src/services/outboxDb.js?outbox-idb-failure");
    const event = {
      eventId: "evt-fallback-1",
      userId: "user-a",
      wordId: "ability",
      isCorrect: false,
      createdAt: "2026-11-07T03:00:00.000Z"
    };

    assert.equal(await outbox.enqueueOutboxEvent("user-a", event), true);
    assert.deepEqual(
      (await outbox.getPendingOutboxEvents("user-a")).map((item) => item.eventId),
      ["evt-fallback-1"]
    );
    assert.equal(await outbox.getOutboxCount("user-a"), 1);

    // The server ACK removes the fallback copy; the IndexedDB delete is also
    // attempted so retries cannot leave an acknowledged event behind.
    assert.equal(await outbox.removeConfirmedEvents("user-a", ["evt-fallback-1"]), true);
    assert.equal(await outbox.getOutboxCount("user-a"), 0);
  } finally {
    env.restore();
  }
});

test("localStorage-only fallback is durable and refuses to report failed writes as success", async () => {
  const env = installBrowserStorage();
  try {
    const outbox = await import("../src/services/outboxDb.js?outbox-local-fallback");
    assert.equal(await outbox.enqueueOutboxEvent("user-a", {
      eventId: "evt-local-1",
      userId: "user-a",
      wordId: "analysis",
      isCorrect: true,
      createdAt: "2026-11-07T04:00:00.000Z"
    }), true);
    assert.equal(await outbox.getOutboxCount("user-a"), 1);
    assert.equal(await outbox.getOutboxCount("user-b"), 0);
    assert.equal(await outbox.removeConfirmedEvents("user-a", ["evt-local-1"]), true);
    assert.equal(await outbox.getOutboxCount("user-a"), 0);
  } finally {
    env.restore();
  }

  const blockedEnv = installBrowserStorage({ localStorage: createMemoryStorage({ failWrites: true }) });
  try {
    const blockedOutbox = await import("../src/services/outboxDb.js?outbox-storage-blocked");
    assert.equal(await blockedOutbox.enqueueOutboxEvent("user-a", {
      eventId: "evt-not-persisted",
      userId: "user-a",
      wordId: "analysis",
      isCorrect: true
    }), false);
  } finally {
    blockedEnv.restore();
  }
});
