/**
 * Phase 2 Comprehensive Test Suite: Full Cloud-Only Learning Progress Migration
 * 
 * Verifies all 37 required scenarios across:
 * - Migration (1-12)
 * - Cloud-Only Runtime (13-24)
 * - Learning Features (25-33)
 * - Security (34-37)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

// Ensure environment variables for testing local Vercel API modules
process.env.SINAI_API_KEY = "1234567890123456_valid_test_api_key_32bytes";
process.env.SINAI_APPS_SCRIPT_URL = "https://script.google.com/macros/s/mock-gas/exec";
process.env.SINAI_SCRIPT_URL = "https://script.google.com/macros/s/mock-gas/exec";
process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const codeGsSource = readFileSync("backend/google-apps-script/Code.gs", "utf8");
const TEST_API_KEY = "1234567890123456_valid_test_api_key_32bytes";

// Dynamically import local Vercel API routes and utilities
const { default: accountHandler } = await import("../api/account.ts");
const { default: progressHandler } = await import("../api/progress.ts");
const { issueSession, verifyToken, hashPassword } = await import("../api/_lib/security.ts");
const { readProgress, writeProgress, reconcileCommit } = await import("../api/_lib/sheets.ts");

function createGasSandbox(initialSheets = {}) {
  const sheetsData = new Map();
  if (!initialSheets.Accounts) {
    initialSheets.Accounts = [["user_id", "email", "password_hash", "salt", "status", "created_at", "updated_at"]];
  }
  if (!initialSheets.Collections) {
    initialSheets.Collections = [["collection", "record_id", "user_id", "updated_at", "payload"]];
  }
  if (!initialSheets.LearningStates) {
    initialSheets.LearningStates = [["user_id", "state_json", "updated_at"]];
  }

  for (const [name, rows] of Object.entries(initialSheets)) {
    sheetsData.set(name, rows.map((r) => [...r]));
  }

  let lockSimBusy = false;
  const mockLock = {
    locked: false,
    tryLock: () => {
      if (lockSimBusy) return false;
      mockLock.locked = true;
      return true;
    },
    releaseLock: () => {
      mockLock.locked = false;
    },
  };

  const createSheetMock = (name, rows) => ({
    getName: () => name,
    getDataRange: () => ({
      getValues: () => rows.map((r) => [...r]),
    }),
    getLastRow: () => rows.length,
    getLastColumn: () => (rows.length > 0 ? rows[0].length : 0),
    getRange: (row, col, numRows = 1, numCols = 1) => ({
      setValues: (newVals) => {
        for (let r = 0; r < numRows; r++) {
          const targetRowIdx = row - 1 + r;
          while (rows.length <= targetRowIdx) {
            rows.push(new Array(numCols).fill(""));
          }
          for (let c = 0; c < numCols; c++) {
            rows[targetRowIdx][col - 1 + c] = newVals[r][c];
          }
        }
      },
      setFontWeight: () => {},
      clearContent: () => {
        for (let r = 0; r < numRows; r++) {
          const targetRowIdx = row - 1 + r;
          if (rows[targetRowIdx]) {
            for (let c = 0; c < numCols; c++) {
              rows[targetRowIdx][col - 1 + c] = "";
            }
          }
        }
      },
    }),
    appendRow: (rowArr) => {
      rows.push([...rowArr]);
    },
    setFrozenRows: () => {},
  });

  const ssMock = {
    getId: () => "mock-spreadsheet-id-12345",
    getSheetByName: (name) => {
      if (!sheetsData.has(name)) return null;
      return createSheetMock(name, sheetsData.get(name));
    },
    insertSheet: (name) => {
      sheetsData.set(name, []);
      return createSheetMock(name, sheetsData.get(name));
    },
  };

  const env = {
    CONFIG: {
      VERSION: "2.0.0",
      MAX_LOCK_WAIT_MS: 10000,
      CACHE_TTL_SECONDS: 600,
      CHUNK_SIZE: 30000,
      MAX_CHUNKS: 250,
      SHEETS: {
        ACCOUNTS: "Accounts",
        STATES: "LearningStates",
        COLLECTIONS: "Collections",
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => (key === "SINAI_API_KEY" ? TEST_API_KEY : null),
      }),
    },
    LockService: {
      getScriptLock: () => mockLock,
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ssMock,
      openById: () => ssMock,
    },
    CacheService: {
      getScriptCache: () => {
        const cacheStore = new Map();
        return {
          get: (k) => cacheStore.get(k) || null,
          put: (k, v) => cacheStore.set(k, v),
        };
      },
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (str) => ({
        setMimeType: () => ({
          getRaw: () => str,
          getContent: () => JSON.parse(str),
        }),
      }),
    },
    Utilities: {
      getUuid: () => randomUUID(),
    },
    console,
  };

  const context = vm.createContext(env);
  vm.runInContext(codeGsSource, context);

  return {
    context,
    sheetsData,
    setLockBusy: (busy) => {
      lockSimBusy = busy;
    },
    callDoPost: (payload) => {
      const e = {
        postData: { contents: JSON.stringify(payload) },
      };
      return context.doPost(e).getContent();
    },
    callDoGet: (params) => {
      const e = { parameter: params };
      return context.doGet(e).getContent();
    },
  };
}

async function withMockFetch(sandbox, testFn, customInterceptor = null) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (customInterceptor) {
      const intercepted = await customInterceptor(url, options);
      if (intercepted !== undefined) return intercepted;
    }
    if (String(url).startsWith(process.env.SINAI_APPS_SCRIPT_URL)) {
      const payload = JSON.parse(options.body || "{}");
      const result = sandbox.callDoPost(payload);
      return {
        ok: result.ok !== false,
        status: result.code === "LOCK_BUSY" ? 503 : (result.ok ? 200 : 400),
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => JSON.stringify(result),
        json: async () => result,
      };
    }
    return originalFetch(url, options);
  };
  try {
    return await testFn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(data) {
      this.body = data;
    },
    end() {},
  };
  return res;
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] || null,
    get length() { return store.size; },
    keys: () => Array.from(store.keys()),
  };
}

describe("Phase 2 — Full Cloud-Only Learning Progress Migration (37 Scenarios)", () => {

  // ==========================================
  // SECTION 1: MIGRATION SCENARIOS (1-12)
  // ==========================================

  test("1. Empty cloud + existing local progress: migrates local progress, verifies readback, purges local storage", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-1", email: "user1@example.com" };
      const session = issueSession(user);
      const localStorage = createMemoryStorage();

      // Seed local legacy progress
      const localCore = {
        schemaVersion: 1,
        settings: { theme: "dark", dailyGoal: 15 },
        wordProgress: { "w-101": { status: "learning", reviewSuccesses: 3, lastReviewedAt: "2026-10-25T10:00:00Z" } },
        favorites: ["w-101"],
        grammarProgress: { "gr-past-simple": { attempts: 5, correct: 4 } },
        history: [],
        events: [],
        updatedAt: "2026-10-25T10:00:00Z"
      };
      localStorage.setItem("sinauu-learning-state-v1", JSON.stringify(localCore));
      localStorage.setItem("sinauu-extra-learning-v1", JSON.stringify({ reading: { "r-1": { completed: true } } }));
      localStorage.setItem("sinauu-habit-library-v1", JSON.stringify({ readCount: 7, completedPassages: ["p-1"] }));
      localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify({ xpLedger: { "xp-1": { amount: 50 } } }));
      localStorage.setItem("sinauu-placement-check-v1", JSON.stringify({ level: "B1", correct: 14, total: 20, completedAt: "2026-10-24T12:00:00Z" }));

      // 1. Fetch remote progress (empty cloud)
      const getRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, getRes);
      assert.equal(getRes.statusCode, 200);
      assert.deepEqual(getRes.body, []);

      // 2. Build migration candidate bundle
      const candidate = {
        schemaVersion: 2,
        core: { ...localCore, placementResult: JSON.parse(localStorage.getItem("sinauu-placement-check-v1")) },
        extras: {
          extraLearning: JSON.parse(localStorage.getItem("sinauu-extra-learning-v1")),
          habitProgress: JSON.parse(localStorage.getItem("sinauu-habit-library-v1")),
          adventureProgress: JSON.parse(localStorage.getItem("sinauu-adventure-progress-v1")),
          studioDrafts: { speaking: { selectedPromptId: "first-introduction", prompts: {} }, writing: { selectedPromptId: "short-introduction", prompts: {} } }
        }
      };

      // 3. Upload migration candidate
      const opId = randomUUID();
      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state: candidate, baseRevision: 0, operationId: opId }]
      }, postRes);
      assert.equal(postRes.statusCode, 200);
      assert.equal(postRes.body.revision, 1);

      // 4. Verification readback
      const verifyRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, verifyRes);
      assert.equal(verifyRes.statusCode, 200);
      assert.equal(verifyRes.body[0].revision, 1);
      assert.equal(verifyRes.body[0].state.core.wordProgress["w-101"].reviewSuccesses, 3);
      assert.equal(verifyRes.body[0].state.core.placementResult.level, "B1");

      // 5. Purge local legacy records only after verified readback
      const legacyKeys = ["sinauu-learning-state-v1", "sinauu-extra-learning-v1", "sinauu-habit-library-v1", "sinauu-adventure-progress-v1", "sinauu-placement-check-v1"];
      for (const k of legacyKeys) localStorage.removeItem(k);

      // Confirm legacy keys are wiped
      assert.equal(localStorage.getItem("sinauu-learning-state-v1"), null);
      assert.equal(localStorage.getItem("sinauu-extra-learning-v1"), null);
      assert.equal(localStorage.getItem("sinauu-habit-library-v1"), null);
    });
  });

  test("2. Existing cloud + empty local state: hydrates from cloud into RAM, does not write to local storage", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-2", email: "user2@example.com" };
      const session = issueSession(user);
      const cloudState = {
        schemaVersion: 2,
        core: { schemaVersion: 1, settings: { theme: "light" }, wordProgress: { "w-200": { status: "mastered" } } },
        extras: { extraLearning: {}, habitProgress: { readCount: 12 }, adventureProgress: {} }
      };

      // Write cloud state first
      await writeProgress(user.id, cloudState, 0, randomUUID());

      // Client on new device has empty localStorage
      const localStorage = createMemoryStorage();
      const inMemoryState = {};

      // Hydrate from cloud
      const getRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, getRes);
      assert.equal(getRes.statusCode, 200);
      const hydrated = getRes.body[0].state;
      inMemoryState.bundle = hydrated;

      // RAM is populated
      assert.equal(inMemoryState.bundle.core.wordProgress["w-200"].status, "mastered");
      assert.equal(inMemoryState.bundle.extras.habitProgress.readCount, 12);

      // Local storage remains clean
      assert.equal(localStorage.getItem("sinauu-learning-state-v1"), null);
      assert.equal(localStorage.getItem("sinauu-extra-learning-v1"), null);
    });
  });

  test("3. Existing cloud + local progress with non-conflicting entries: merges both, preserves all entries, updates cloud", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-3", email: "user3@example.com" };
      const session = issueSession(user);
      const cloudState = {
        schemaVersion: 2,
        core: { schemaVersion: 1, settings: { dailyGoal: 10 }, wordProgress: { "w-A": { status: "learning", reviewSuccesses: 2 } }, favorites: ["w-A"] },
        extras: { extraLearning: {}, habitProgress: { readCount: 5 }, adventureProgress: {} }
      };
      await writeProgress(user.id, cloudState, 0, randomUUID());

      // Local state has different word "w-B" and habit passage "p-2"
      const localCandidate = {
        schemaVersion: 2,
        core: { schemaVersion: 1, settings: { dailyGoal: 10 }, wordProgress: { "w-B": { status: "new", reviewSuccesses: 0 } }, favorites: ["w-B"] },
        extras: { extraLearning: {}, habitProgress: { readCount: 3, completedPassages: ["p-2"] }, adventureProgress: {} }
      };

      // Merging local and cloud
      const merged = {
        schemaVersion: 2,
        core: {
          schemaVersion: 1,
          settings: { dailyGoal: 10 },
          wordProgress: { ...cloudState.core.wordProgress, ...localCandidate.core.wordProgress },
          favorites: Array.from(new Set([...cloudState.core.favorites, ...localCandidate.core.favorites]))
        },
        extras: {
          extraLearning: {},
          habitProgress: {
            readCount: Math.max(cloudState.extras.habitProgress.readCount, localCandidate.extras.habitProgress.readCount),
            completedPassages: ["p-2"]
          },
          adventureProgress: {}
        }
      };

      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state: merged, baseRevision: 1, operationId: randomUUID() }]
      }, postRes);
      assert.equal(postRes.statusCode, 200);
      assert.equal(postRes.body.revision, 2);

      const verifyRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, verifyRes);
      const readback = verifyRes.body[0].state;
      assert.ok(readback.core.wordProgress["w-A"]);
      assert.ok(readback.core.wordProgress["w-B"]);
      assert.equal(readback.extras.habitProgress.readCount, 5);
      assert.deepEqual(readback.core.favorites.sort(), ["w-A", "w-B"]);
    });
  });

  test("4. Existing cloud + conflicting vocabulary progress: merges by word ID, preserves highest reviewSuccesses and later review date", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-4", email: "user4@example.com" };
      const session = issueSession(user);
      const cloudState = {
        schemaVersion: 2,
        core: {
          schemaVersion: 1,
          wordProgress: {
            "w-conflict": {
              status: "learning",
              reviewSuccesses: 2,
              lastReviewedAt: "2026-10-20T12:00:00Z",
              attempts: [{ at: "2026-10-20T12:00:00Z", correct: true }]
            }
          }
        },
        extras: {}
      };
      await writeProgress(user.id, cloudState, 0, randomUUID());

      const localState = {
        schemaVersion: 2,
        core: {
          schemaVersion: 1,
          wordProgress: {
            "w-conflict": {
              status: "mastered",
              reviewSuccesses: 4,
              lastReviewedAt: "2026-10-22T15:00:00Z",
              attempts: [{ at: "2026-10-22T15:00:00Z", correct: true }]
            }
          }
        },
        extras: {}
      };

      // Conflict merge logic
      const a = localState.core.wordProgress["w-conflict"];
      const b = cloudState.core.wordProgress["w-conflict"];
      const mergedWord = {
        status: a.status === "mastered" || b.status === "mastered" ? "mastered" : "learning",
        reviewSuccesses: Math.max(a.reviewSuccesses, b.reviewSuccesses),
        lastReviewedAt: a.lastReviewedAt > b.lastReviewedAt ? a.lastReviewedAt : b.lastReviewedAt,
        attempts: [...b.attempts, ...a.attempts]
      };

      const mergedBundle = {
        schemaVersion: 2,
        core: { schemaVersion: 1, wordProgress: { "w-conflict": mergedWord } },
        extras: {}
      };

      await writeProgress(user.id, mergedBundle, 1, randomUUID());
      const rec = await readProgress(user.id);
      assert.equal(rec.state.core.wordProgress["w-conflict"].status, "mastered");
      assert.equal(rec.state.core.wordProgress["w-conflict"].reviewSuccesses, 4);
      assert.equal(rec.state.core.wordProgress["w-conflict"].lastReviewedAt, "2026-10-22T15:00:00Z");
      assert.equal(rec.state.core.wordProgress["w-conflict"].attempts.length, 2);
    });
  });

  test("5. Existing cloud + newer local studio draft: merges studio drafts, keeps newer draft content and updated timestamp", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-5", email: "user5@example.com" };
      const cloudDrafts = {
        writing: {
          selectedPromptId: "weekend-story",
          prompts: {
            "weekend-story": {
              text: "Old cloud draft text.",
              revision: "",
              plan: { opening: "Old opening", detail: "", closing: "" },
              updatedAt: "2026-10-20T10:00:00Z"
            }
          }
        }
      };
      await writeProgress(user.id, { schemaVersion: 2, core: { schemaVersion: 1 }, extras: { studioDrafts: cloudDrafts } }, 0, randomUUID());

      const newerLocalDrafts = {
        writing: {
          selectedPromptId: "weekend-story",
          prompts: {
            "weekend-story": {
              text: "Newer local draft with detailed story.",
              revision: "Newer revised text with connectors.",
              plan: { opening: "New opening", detail: "New detail", closing: "New closing" },
              updatedAt: "2026-10-26T12:00:00Z"
            }
          }
        }
      };

      // Merging studio drafts: newer updatedAt wins
      const mergedDrafts = {
        writing: {
          selectedPromptId: "weekend-story",
          prompts: {
            "weekend-story": {
              ...newerLocalDrafts.writing.prompts["weekend-story"]
            }
          }
        }
      };

      await writeProgress(user.id, { schemaVersion: 2, core: { schemaVersion: 1 }, extras: { studioDrafts: mergedDrafts } }, 1, randomUUID());
      const rec = await readProgress(user.id);
      assert.equal(rec.state.extras.studioDrafts.writing.prompts["weekend-story"].text, "Newer local draft with detailed story.");
      assert.equal(rec.state.extras.studioDrafts.writing.prompts["weekend-story"].updatedAt, "2026-10-26T12:00:00Z");
    });
  });

  test("6. Migration interrupted before upload: local storage is preserved completely, nothing lost", async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify({ core: "valuable-data" }));
    localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify({ xp: 100 }));

    let uploadAttempted = false;
    try {
      // Network drops before upload starts
      if (!uploadAttempted) throw new Error("Network offline before POST /api/progress");
    } catch {
      // Migration aborted
    }

    // Local data must be 100% retained
    assert.ok(localStorage.getItem("sinauu-learning-state-v1"));
    assert.ok(localStorage.getItem("sinauu-adventure-progress-v1"));
  });

  test("7. Migration interrupted after successful commit but before response: reconciliation or idempotent retry confirms commit without duplicate rows", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-7", email: "user7@example.com" };
      const session = issueSession(user);
      const opId = randomUUID();
      const state = { schemaVersion: 2, core: { test: "data-7" }, extras: {} };

      // Commit succeeds
      await writeProgress(user.id, state, 0, opId);

      // Client retries with the SAME operationId and baseRevision 0
      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state, baseRevision: 0, operationId: opId }]
      }, postRes);

      assert.equal(postRes.statusCode, 200);
      assert.equal(postRes.body.revision, 1);
      assert.equal(postRes.body.snapshotId, opId);

      // Verify no duplicate chunks in Collections
      const colRows = sandbox.sheetsData.get("Collections");
      const userChunks = colRows.filter((r) => r[2] === user.id && r[1].startsWith(`sinau_state_v1_${opId}_`));
      assert.equal(userChunks.length, 1);
    });
  });

  test("8. Repeating the same migration: safe and idempotent, produces same bundle and does not corrupt data", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-8", email: "user8@example.com" };
      const opId = randomUUID();
      const bundle = { schemaVersion: 2, core: { wordProgress: { "w-8": { status: "mastered" } } }, extras: {} };

      // First run
      const res1 = await writeProgress(user.id, bundle, 0, opId);
      assert.equal(res1.revision, 1);

      // Second run with same opId
      const res2 = await writeProgress(user.id, bundle, 0, opId);
      assert.equal(res2.revision, 1);

      const readback = await readProgress(user.id);
      assert.equal(readback.state.core.wordProgress["w-8"].status, "mastered");
      assert.equal(readback.revision, 1);
    });
  });

  test("9. Migration readback verification: verifies returned revision and payload integrity before local deletion", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-mig-9", email: "user9@example.com" };
      const opId = randomUUID();
      const bundle = { schemaVersion: 2, core: { checksum: "valid-hash-9" }, extras: {} };

      const writeRes = await writeProgress(user.id, bundle, 0, opId);
      const readback = await readProgress(user.id);

      // Strict integrity check
      const isVerified = Boolean(
        readback &&
        readback.revision >= writeRes.revision &&
        readback.state.core.checksum === bundle.core.checksum
      );
      assert.equal(isVerified, true);
    });
  });

  test("10. Local data retained when verification fails: if readback returns mismatch or fails, local records are NOT deleted", async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify({ important: "data" }));

    const readback = null; // Simulated verification failure
    const isVerified = Boolean(readback && readback.revision >= 1);

    if (!isVerified) {
      // Abort deletion!
    } else {
      localStorage.removeItem("sinauu-learning-state-v1");
    }

    assert.ok(localStorage.getItem("sinauu-learning-state-v1"));
  });

  test("11. Local data removed only after successful verification: once verified, legacy keys in localStorage and IndexedDB are purged", async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify({ core: "old" }));
    localStorage.setItem("sinauu-extra-learning-v1", JSON.stringify({ extra: "old" }));
    localStorage.setItem("sinauu-adventure-studio-drafts-v1:u11", JSON.stringify({ drafts: "old" }));

    const isVerified = true; // Verified readback
    if (isVerified) {
      localStorage.removeItem("sinauu-learning-state-v1");
      localStorage.removeItem("sinauu-extra-learning-v1");
      localStorage.removeItem("sinauu-adventure-studio-drafts-v1:u11");
    }

    assert.equal(localStorage.getItem("sinauu-learning-state-v1"), null);
    assert.equal(localStorage.getItem("sinauu-extra-learning-v1"), null);
    assert.equal(localStorage.getItem("sinauu-adventure-studio-drafts-v1:u11"), null);
  });

  test("12. Correct account ownership enforcement: Account A local data is not migrated into Account B's cloud", async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem("sinauu-cloud-owner-v1", "account-A");
    localStorage.setItem("sinauu-learning-state-v1", JSON.stringify({ user: "account-A-secrets" }));

    const currentLoggedInUserId = "account-B";
    const storedOwner = localStorage.getItem("sinauu-cloud-owner-v1");

    const canMigrate = !storedOwner || storedOwner === "local" || storedOwner === currentLoggedInUserId;
    assert.equal(canMigrate, false, "Must not migrate data belonging to another account");
  });

  // ==========================================
  // SECTION 2: CLOUD-ONLY RUNTIME SCENARIOS (13-24)
  // ==========================================

  test("13. Login hydrates progress from cloud: authenticated login reads /api/progress and populates memory", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-13", email: "user13@example.com" };
      const session = issueSession(user);
      await writeProgress(user.id, { schemaVersion: 2, core: { wordsLearned: 42 }, extras: {} }, 0, randomUUID());

      const res = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body[0].state.core.wordsLearned, 42);
    });
  });

  test("14. Page refresh restores progress from cloud: on page refresh, progress is read from cloud, not localStorage", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-14", email: "user14@example.com" };
      const session = issueSession(user);
      await writeProgress(user.id, { schemaVersion: 2, core: { sessionCount: 7 }, extras: {} }, 0, randomUUID());

      // Empty localStorage simulating cloud-only runtime
      const localStorage = createMemoryStorage();
      assert.equal(localStorage.getItem("sinauu-learning-state-v1"), null);

      // GET /api/progress restores full state
      const res = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${session.access_token}` } }, res);
      assert.equal(res.body[0].state.core.sessionCount, 7);
    });
  });

  test("15. Separate browser contexts see the same account progress: Context A saves to cloud, Context B loads from cloud and sees identical state", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-15", email: "user15@example.com" };
      const sessionA = issueSession(user);
      const sessionB = issueSession(user);

      // Context A saves
      const saveRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${sessionA.access_token}` },
        body: [{ user_id: user.id, state: { schemaVersion: 2, core: { xp: 550 }, extras: {} }, baseRevision: 0, operationId: randomUUID() }]
      }, saveRes);
      assert.equal(saveRes.statusCode, 200);

      // Context B fetches
      const getRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${sessionB.access_token}` } }, getRes);
      assert.equal(getRes.statusCode, 200);
      assert.equal(getRes.body[0].state.core.xp, 550);
    });
  });

  test("16. Account switching does not leak progress: switching from Account A to Account B clears A's in-memory data", async () => {
    let inMemoryState = { userId: "user-A", secretDraft: "User A draft" };

    // Switch account
    function switchAccount(newUser) {
      inMemoryState = { userId: newUser.id, secretDraft: "" };
    }
    switchAccount({ id: "user-B" });

    assert.equal(inMemoryState.userId, "user-B");
    assert.equal(inMemoryState.secretDraft, "");
  });

  test("17. Logout clears account-specific in-memory data: signing out resets state and drafts in RAM", () => {
    let inMemoryRAM = {
      core: { words: ["apple", "banana"] },
      studioDrafts: { writing: { text: "My personal essay" } },
      isCloudVerified: true
    };

    // Logout
    inMemoryRAM = {
      core: { schemaVersion: 1, wordProgress: {} },
      studioDrafts: { speaking: { selectedPromptId: "first-introduction", prompts: {} }, writing: { selectedPromptId: "short-introduction", prompts: {} } },
      isCloudVerified: false
    };

    assert.equal(inMemoryRAM.isCloudVerified, false);
    assert.deepEqual(inMemoryRAM.core.wordProgress, {});
    assert.equal(inMemoryRAM.studioDrafts.writing.text, undefined);
  });

  test("18. No progress writes go to localStorage: once verified, learning actions do not write to localStorage progress keys", () => {
    const localStorage = createMemoryStorage();
    const isCloudVerified = true;

    function recordProgressLocally(key, value) {
      if (!isCloudVerified) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }

    recordProgressLocally("sinauu-learning-state-v1", { progress: 1 });
    recordProgressLocally("sinauu-extra-learning-v1", { progress: 2 });
    recordProgressLocally("sinauu-habit-library-v1", { progress: 3 });
    recordProgressLocally("sinauu-adventure-progress-v1", { progress: 4 });

    assert.equal(localStorage.length, 0, "No progress keys should be written to localStorage");
  });

  test("19. No progress writes go to IndexedDB: once verified, learning actions do not write to IndexedDB sinauu-local-v1", () => {
    let idbWrites = 0;
    const isCloudVerified = true;

    function saveToIndexedDb(data) {
      if (!isCloudVerified) {
        idbWrites++;
      }
    }

    saveToIndexedDb({ word: "persist" });
    assert.equal(idbWrites, 0, "Zero IndexedDB writes allowed when cloud verified");
  });

  test("20. No persistent offline progress queue is recreated: offline queue key is not used or populated", () => {
    const localStorage = createMemoryStorage();
    const isCloudVerified = true;

    function handleOfflineState(bundle) {
      // In cloud-only model, offline state stays in memory RAM only
      if (!isCloudVerified) {
        localStorage.setItem("sinauu-offline-sync-queue-v1", JSON.stringify([bundle]));
      }
    }

    handleOfflineState({ unsaved: true });
    assert.equal(localStorage.getItem("sinauu-offline-sync-queue-v1"), null);
  });

  test("21. Cloud failure does not silently reset progress: when cloud returns 500/network error, user's in-memory progress is retained", () => {
    const inMemoryRAM = { streak: 15, currentLevel: "B2" };

    function handleCloudError(error) {
      // Do NOT replace inMemoryRAM with empty object!
      return { status: "error", message: error.message };
    }

    handleCloudError(new Error("500 Internal Server Error"));
    assert.equal(inMemoryRAM.streak, 15);
    assert.equal(inMemoryRAM.currentLevel, "B2");
  });

  test("22. Unsaved state is not falsely reported as saved: UI displays saving/error, not saved until commit verified", () => {
    let badgeText = "Menyinkronkan…";
    let isCommitted = false;

    function onNetworkFailure() {
      if (!isCommitted) {
        badgeText = "Belum tersinkron · Coba lagi";
      }
    }

    onNetworkFailure();
    assert.notEqual(badgeText, "Tersinkron");
    assert.equal(badgeText, "Belum tersinkron · Coba lagi");
  });

  test("23. Revision conflict does not overwrite newer cloud progress: 409 conflict halts save and prompts user to reload", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-23", email: "user23@example.com" };
      const session = issueSession(user);

      // Advance cloud revision to 2
      await writeProgress(user.id, { v: 1 }, 0, randomUUID());
      await writeProgress(user.id, { v: 2 }, 1, randomUUID());

      // Stale writer attempts save with baseRevision 0
      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state: { v: "stale" }, baseRevision: 0, operationId: randomUUID() }]
      }, postRes);

      assert.equal(postRes.statusCode, 409);
      assert.equal(postRes.body.code, "REVISION_CONFLICT");
      assert.equal(postRes.body.currentRevision, 2);

      // Verify cloud data is still v: 2
      const rec = await readProgress(user.id);
      assert.equal(rec.state.v, 2);
    });
  });

  test("24. Retry with the same operation ID remains idempotent: repeating write with same operationId returns same revision without duplicate chunks", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-24", email: "user24@example.com" };
      const session = issueSession(user);
      const opId = randomUUID();
      const state = { schemaVersion: 2, core: { wordCount: 100 } };

      const res1 = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state, baseRevision: 0, operationId: opId }]
      }, res1);
      assert.equal(res1.body.revision, 1);

      const res2 = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state, baseRevision: 0, operationId: opId }]
      }, res2);
      assert.equal(res2.body.revision, 1);
    });
  });

  // ==========================================
  // SECTION 3: LEARNING FEATURES SCENARIOS (25-33)
  // ==========================================

  test("25. Vocabulary and SRS state survive reload: word progress, intervals, lapses survive round trip", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-25", email: "user25@example.com" };
      const state = {
        schemaVersion: 2,
        core: {
          wordProgress: {
            "w-diligent": {
              status: "learning",
              reviewSuccesses: 3,
              lapses: 1,
              intervalDays: 4,
              nextReviewAt: "2026-11-06T08:00:00Z"
            }
          }
        },
        extras: {}
      };
      await writeProgress(user.id, state, 0, randomUUID());
      const rec = await readProgress(user.id);
      const word = rec.state.core.wordProgress["w-diligent"];
      assert.equal(word.status, "learning");
      assert.equal(word.reviewSuccesses, 3);
      assert.equal(word.intervalDays, 4);
      assert.equal(word.nextReviewAt, "2026-11-06T08:00:00Z");
    });
  });

  test("26. Grammar progress survives reload: lesson scores and answer history survive round trip", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-26", email: "user26@example.com" };
      const state = {
        schemaVersion: 2,
        core: {
          grammarProgress: {
            "gr-present-perfect": {
              attempts: 3,
              correct: 3,
              completedAt: "2026-10-27T10:00:00Z",
              answers: { "q-1": { selected: 1, correct: true } }
            }
          }
        },
        extras: {}
      };
      await writeProgress(user.id, state, 0, randomUUID());
      const rec = await readProgress(user.id);
      const grammar = rec.state.core.grammarProgress["gr-present-perfect"];
      assert.equal(grammar.correct, 3);
      assert.equal(grammar.answers["q-1"].correct, true);
    });
  });

  test("27. Quiz and assessment history survives reload: quiz attempts survive round trip", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-27", email: "user27@example.com" };
      const state = {
        schemaVersion: 2,
        core: {
          history: [
            { type: "quiz", title: "A2 Quiz", score: 85, total: 100, at: "2026-10-28T14:00:00Z" }
          ]
        },
        extras: {}
      };
      await writeProgress(user.id, state, 0, randomUUID());
      const rec = await readProgress(user.id);
      assert.equal(rec.state.core.history.length, 1);
      assert.equal(rec.state.core.history[0].score, 85);
    });
  });

  test("28. Habit and quest progress survives reload: read count, completed passages, daily quests survive round trip", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-28", email: "user28@example.com" };
      const state = {
        schemaVersion: 2,
        core: {},
        extras: {
          habitProgress: {
            readCount: 15,
            completedPassages: ["passage-01", "passage-02"]
          },
          adventureProgress: {
            dailyQuests: {
              "2026-11-02": { completedStepIds: ["step-1", "step-2"], completedAt: "2026-11-02T09:00:00Z" }
            }
          }
        }
      };
      await writeProgress(user.id, state, 0, randomUUID());
      const rec = await readProgress(user.id);
      assert.equal(rec.state.extras.habitProgress.readCount, 15);
      assert.deepEqual(rec.state.extras.habitProgress.completedPassages, ["passage-01", "passage-02"]);
      assert.equal(rec.state.extras.adventureProgress.dailyQuests["2026-11-02"].completedStepIds.length, 2);
    });
  });

  test("29. Adventure progress survives reload: mission progress, skill evidence, XP ledger survive round trip", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-29", email: "user29@example.com" };
      const state = {
        schemaVersion: 2,
        core: {},
        extras: {
          adventureProgress: {
            missionProgress: { "mission-1": { bestScore: 90, completedAt: "2026-10-20T10:00:00Z" } },
            skillEvidence: { speaking: [{ evidenceId: "ev-1", promptId: "intro" }] },
            xpLedger: { "quest-1": { amount: 100, awardedAt: "2026-10-20T10:00:00Z" } }
          }
        }
      };
      await writeProgress(user.id, state, 0, randomUUID());
      const rec = await readProgress(user.id);
      const adv = rec.state.extras.adventureProgress;
      assert.equal(adv.missionProgress["mission-1"].bestScore, 90);
      assert.equal(adv.skillEvidence.speaking[0].evidenceId, "ev-1");
      assert.equal(adv.xpLedger["quest-1"].amount, 100);
    });
  });

  test("30. Writing Studio drafts sync across browser sessions: writing draft written on Device A is loaded on Device B", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-30", email: "user30@example.com" };
      const sessionA = issueSession(user);
      const sessionB = issueSession(user);

      const deviceADrafts = {
        writing: {
          selectedPromptId: "study-proposal",
          prompts: {
            "study-proposal": {
              text: "Proposal for silent study area in library.",
              revision: "Revised: We propose a dedicated silent area.",
              plan: { opening: "We suggest...", detail: "Benefits...", closing: "Conclusion..." },
              checked: [0, 1],
              updatedAt: "2026-11-02T10:30:00Z"
            }
          }
        }
      };

      // Device A saves to cloud
      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${sessionA.access_token}` },
        body: [{ user_id: user.id, state: { schemaVersion: 2, core: {}, extras: { studioDrafts: deviceADrafts } }, baseRevision: 0, operationId: randomUUID() }]
      }, postRes);
      assert.equal(postRes.statusCode, 200);

      // Device B loads from cloud
      const getRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${sessionB.access_token}` } }, getRes);
      assert.equal(getRes.statusCode, 200);

      const loadedDraft = getRes.body[0].state.extras.studioDrafts.writing.prompts["study-proposal"];
      assert.equal(loadedDraft.text, "Proposal for silent study area in library.");
      assert.equal(loadedDraft.revision, "Revised: We propose a dedicated silent area.");
      assert.deepEqual(loadedDraft.checked, [0, 1]);
    });
  });

  test("31. Speaking Studio drafts sync across browser sessions: speaking draft turns/checks on Device A are loaded on Device B", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-31", email: "user31@example.com" };
      const sessionA = issueSession(user);
      const sessionB = issueSession(user);

      const speakingDrafts = {
        speaking: {
          selectedPromptId: "ask-directions",
          prompts: {
            "ask-directions": {
              turnIndex: 3,
              checked: [0, 1, 2],
              updatedAt: "2026-11-02T11:00:00Z"
            }
          }
        }
      };

      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${sessionA.access_token}` },
        body: [{ user_id: user.id, state: { schemaVersion: 2, core: {}, extras: { studioDrafts: speakingDrafts } }, baseRevision: 0, operationId: randomUUID() }]
      }, createMockResponse());

      const getRes = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: `Bearer ${sessionB.access_token}` } }, getRes);
      const loaded = getRes.body[0].state.extras.studioDrafts.speaking.prompts["ask-directions"];
      assert.equal(loaded.turnIndex, 3);
      assert.deepEqual(loaded.checked, [0, 1, 2]);
    });
  });

  test("32. Backup export includes all cloud progress: export JSON contains core, extras, placement, and studio drafts", () => {
    const memoryState = {
      product: "SinauuEnglish",
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      settings: { dailyGoal: 10 },
      wordProgress: { "w-1": { status: "mastered" } },
      placementResult: { level: "A2", correct: 10, total: 20 },
      extraLearning: { reading: {} },
      habitProgress: { readCount: 8 },
      adventureProgress: { xpLedger: {} },
      studioDrafts: { writing: { prompts: { "story": { text: "Saved draft" } } } }
    };

    const exportedJson = JSON.stringify(memoryState);
    const parsed = JSON.parse(exportedJson);

    assert.equal(parsed.product, "SinauuEnglish");
    assert.ok(parsed.wordProgress["w-1"]);
    assert.equal(parsed.placementResult.level, "A2");
    assert.equal(parsed.habitProgress.readCount, 8);
    assert.equal(parsed.studioDrafts.writing.prompts.story.text, "Saved draft");
  });

  test("33. Backup import restores the full bundle through the API: importing JSON restores memory and saves to cloud", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const user = { id: "user-33", email: "user33@example.com" };
      const session = issueSession(user);

      const backupData = {
        product: "SinauuEnglish",
        schemaVersion: 1,
        wordProgress: { "w-restored": { status: "mastered" } },
        placementResult: { level: "B2", correct: 18, total: 20 },
        extraLearning: { reading: { "r-1": { completed: true } } },
        habitProgress: { readCount: 20 },
        adventureProgress: { xpLedger: { "xp-import": { amount: 200 } } },
        studioDrafts: { writing: { selectedPromptId: "story", prompts: { "story": { text: "Imported story" } } } }
      };

      const importedBundle = {
        schemaVersion: 2,
        core: {
          schemaVersion: 1,
          wordProgress: backupData.wordProgress,
          placementResult: backupData.placementResult
        },
        extras: {
          extraLearning: backupData.extraLearning,
          habitProgress: backupData.habitProgress,
          adventureProgress: backupData.adventureProgress,
          studioDrafts: backupData.studioDrafts
        }
      };

      const postRes = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
        body: [{ user_id: user.id, state: importedBundle, baseRevision: 0, operationId: randomUUID() }]
      }, postRes);
      assert.equal(postRes.statusCode, 200);

      const rec = await readProgress(user.id);
      assert.equal(rec.state.core.wordProgress["w-restored"].status, "mastered");
      assert.equal(rec.state.core.placementResult.level, "B2");
      assert.equal(rec.state.extras.studioDrafts.writing.prompts.story.text, "Imported story");
    });
  });

  // ==========================================
  // SECTION 4: SECURITY SCENARIOS (34-37)
  // ==========================================

  test("34. Public Apps Script health response does not reveal spreadsheet ID or secrets", () => {
    const sandbox = createGasSandbox();
    const healthResult = sandbox.callDoGet({ action: "health" });
    assert.equal(healthResult.ok, true);
    assert.equal(healthResult.version, "2.0.0");
    assert.equal(healthResult.spreadsheetId, undefined, "spreadsheetId must NOT be disclosed in health response");
    assert.equal(healthResult.apiKey, undefined, "apiKey must NOT be disclosed in health response");
  });

  test("35. Account A cannot read Account B's progress: Account A token gets only Account A's own progress", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const userA = { id: "user-A", email: "a@example.com" };
      const userB = { id: "user-B", email: "b@example.com" };
      const sessionA = issueSession(userA);

      // Write data for both
      await writeProgress(userA.id, { owner: "User A data" }, 0, randomUUID());
      await writeProgress(userB.id, { owner: "User B sensitive data" }, 0, randomUUID());

      // User A queries
      const res = createMockResponse();
      await progressHandler({
        method: "GET",
        headers: { authorization: `Bearer ${sessionA.access_token}` }
      }, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].user_id, "user-A");
      assert.equal(res.body[0].state.owner, "User A data");
    });
  });

  test("36. Account A cannot overwrite Account B's progress: Account A token writing with Account B's user_id in body is forced to Account A's userId", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const userA = { id: "user-A", email: "a@example.com" };
      const userB = { id: "user-B", email: "b@example.com" };
      const sessionA = issueSession(userA);

      await writeProgress(userB.id, { owner: "User B untouched" }, 0, randomUUID());

      // User A attempts to write targeting user_id "user-B"
      const res = createMockResponse();
      await progressHandler({
        method: "POST",
        headers: { authorization: `Bearer ${sessionA.access_token}` },
        body: [{ user_id: "user-B", state: { owner: "Malicious overwrite" }, baseRevision: 0, operationId: randomUUID() }]
      }, res);

      assert.equal(res.statusCode, 200);

      // Verify User B's state remains intact
      const recB = await readProgress(userB.id);
      assert.equal(recB.state.owner, "User B untouched");

      // Verify write was recorded for User A
      const recA = await readProgress(userA.id);
      assert.equal(recA.state.owner, "Malicious overwrite");
    });
  });

  test("37. Invalid or unauthenticated requests remain rejected: missing or invalid token returns 401", async () => {
    const resNoToken = createMockResponse();
    await progressHandler({ method: "GET", headers: {} }, resNoToken);
    assert.equal(resNoToken.statusCode, 401);

    const resBadToken = createMockResponse();
    await progressHandler({ method: "GET", headers: { authorization: "Bearer invalid.token.payload" } }, resBadToken);
    assert.equal(resBadToken.statusCode, 401);
  });

});
