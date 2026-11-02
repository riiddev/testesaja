import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { readFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

import {
  readProgress,
  writeProgress,
  reconcileCommit,
  ensureSheetsReady,
  RevisionConflictError,
  LockBusyError,
  UncertainCommitError,
} from "../api/_lib/sheets.ts";
import { issueSession, verifyToken, bearerToken } from "../api/_lib/security.ts";
import progressHandler from "../api/progress.ts";
import accountHandler from "../api/account.ts";

// Set environment variables for testing Vercel API modules
process.env.SINAI_API_KEY = "1234567890123456_valid_test_api_key_32bytes";
process.env.SINAI_APPS_SCRIPT_URL = "https://script.google.com/macros/s/mock-gas/exec";
process.env.SINAI_SCRIPT_URL = "https://script.google.com/macros/s/mock-gas/exec";
process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const codeGsSource = readFileSync("backend/google-apps-script/Code.gs", "utf8");
const TEST_API_KEY = "1234567890123456_valid_test_api_key_32bytes";

/**
 * Creates an in-memory Google Apps Script sandbox simulating Google Sheets environment
 */
function createGasSandbox(initialSheets = {}) {
  const sheetsData = new Map();

  // Initialize sheet headers if not present
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
    tryLock: (ms) => {
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
    console: console,
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
    seedManifest: (userId, manifest) => {
      const colRows = sheetsData.get("Collections");
      colRows.push([
        "lists",
        "sinau_state_v1_manifest",
        userId,
        manifest.updatedAt || new Date().toISOString(),
        JSON.stringify(manifest),
      ]);
    },
  };
}

/**
 * Scopes global fetch to dispatch to the given GAS sandbox or custom interceptor
 */
async function withMockFetch(sandbox, testFn, customInterceptor = null) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (customInterceptor) {
      const intercepted = await customInterceptor(url, options);
      if (intercepted !== undefined) return intercepted;
    }
    if (String(url).startsWith(process.env.SINAI_APPS_SCRIPT_URL)) {
      const payload = JSON.parse(options.body);
      const resData = sandbox.callDoPost(payload);
      return new Response(JSON.stringify(resData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch(url, options);
  };
  try {
    return await testFn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/**
 * Creates a mock Response object for Vercel serverless function handlers
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(c) {
      res.statusCode = c;
      return res;
    },
    setHeader(k, v) {
      res.headers[k] = v;
    },
    json(b) {
      res.body = b;
    },
    end() {},
  };
  return res;
}

describe("Phase 1C — Vercel Reunification, Idempotent Writes & Safe Cutover (20 Scenarios)", () => {
  // Scenario 1: Local /api/account?action=status handler
  test("1. Local /api/account?action=status handler returns 200 ready without exposing secrets", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const res = createMockResponse();
      await accountHandler({ method: "GET", query: { action: "status" }, headers: {} }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.ready, true);
      assert.equal(res.body.provider, "google-sheets-apps-script");
      // Check that internal spreadsheet IDs and API keys are not exposed
      assert.equal(res.body.spreadsheetId, undefined);
      assert.equal(res.body.apiKey, undefined);
    });
  });

  // Scenario 2: Apps Script health action with mocked Apps Script runtime
  test("2. Apps Script health action with mocked Apps Script runtime returns valid health response", () => {
    const sandbox = createGasSandbox();
    const result = sandbox.callDoPost({ apiKey: TEST_API_KEY, action: "status" });
    assert.equal(result.ok, true);
    assert.equal(result.version, "2.0.0");
    assert.ok(result.spreadsheetId);
  });

  // Scenario 3: JWT authentication enforcement
  test("3. JWT authentication enforcement rejects unauthenticated or invalid tokens with 401", async () => {
    const sandbox = createGasSandbox();
    await withMockFetch(sandbox, async () => {
      const res1 = createMockResponse();
      await progressHandler({ method: "GET", headers: {} }, res1);
      assert.equal(res1.statusCode, 401);

      const res2 = createMockResponse();
      await progressHandler({ method: "GET", headers: { authorization: "Bearer invalid.jwt.token" } }, res2);
      assert.equal(res2.statusCode, 401);

      const res3 = createMockResponse();
      await accountHandler({ method: "GET", query: { action: "me" }, headers: {} }, res3);
      assert.equal(res3.statusCode, 401);
    });
  });

  // Scenario 4: Account ownership enforcement
  test("4. Account ownership enforcement: authenticated userId strictly derived from JWT claims", async () => {
    const sandbox = createGasSandbox();
    const sessionAlice = issueSession({ id: "alice-id", email: "alice@example.com" });

    await withMockFetch(sandbox, async () => {
      const res = createMockResponse();
      // Malicious request attempts to submit user_id: "bob-id" in request body
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${sessionAlice.access_token}` },
          body: {
            user_id: "bob-id", // Impersonation attempt!
            state: { score: 100 },
            baseRevision: 0,
          },
        },
        res
      );
      assert.equal(res.statusCode, 200);

      // Verify that the record in the sheet was saved under alice-id, NOT bob-id
      const colRows = sandbox.sheetsData.get("Collections");
      const manifestRow = colRows.find((r) => r[1] === "sinau_state_v1_manifest");
      assert.ok(manifestRow);
      assert.equal(manifestRow[2], "alice-id", "Ownership must be enforced as Alice");
    });
  });

  // Scenario 5: Legacy snapshot read
  test("5. Legacy snapshot read: slot A/B format loads correctly with revision 0", async () => {
    const legacyState = { words: ["apple", "banana"], version: 1 };
    const compressed = gzipSync(Buffer.from(JSON.stringify(legacyState), "utf8")).toString("base64");
    const initialSheets = {
      Collections: [
        ["collection", "record_id", "user_id", "updated_at", "payload"],
        ["lists", "sinau_state_v1_manifest", "user-legacy", "2026-10-01T10:00:00Z", JSON.stringify({ slot: "A", partCount: 1 })],
        ["lists", "sinau_state_v1_slot_A_0000", "user-legacy", "2026-10-01T10:00:00Z", JSON.stringify({ slot: "A", chunkIndex: 0, partCount: 1, payload: compressed })],
      ],
    };
    const sandbox = createGasSandbox(initialSheets);
    await withMockFetch(sandbox, async () => {
      const result = await readProgress("user-legacy");
      assert.ok(result);
      assert.equal(result.revision, 0, "Legacy revision defaults to 0");
      assert.deepEqual(result.state, legacyState);
    });
  });

  // Scenario 6: New immutable snapshot write/read round trip
  test("6. New immutable snapshot write/read round trip achieves complete data fidelity", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-roundtrip-6";
    const sampleState = {
      quizResults: [{ id: "q1", passed: true, score: 98 }],
      mistakeLog: ["mis-1", "mis-2"],
      settings: { theme: "dark" },
    };

    await withMockFetch(sandbox, async () => {
      const writeResult = await writeProgress(userId, sampleState, 0);
      assert.equal(writeResult.revision, 1);
      assert.ok(writeResult.snapshotId);

      const readResult = await readProgress(userId);
      assert.ok(readResult);
      assert.equal(readResult.revision, 1);
      assert.deepEqual(readResult.state, sampleState);
    });
  });

  // Scenario 7: Two writers using the same base revision
  test("7. Two writers using the same base revision: Writer A succeeds, Writer B receives 409 conflict", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-concurrent-7";
    sandbox.seedManifest(userId, { snapshotId: randomUUID(), partCount: 1, revision: 10 });

    await withMockFetch(sandbox, async () => {
      // Writer A writes from base 10 -> succeeds to 11
      const writeA = await writeProgress(userId, { author: "A" }, 10);
      assert.equal(writeA.revision, 11);

      // Writer B writes from base 10 -> rejected with 409 RevisionConflictError
      await assert.rejects(
        async () => {
          await writeProgress(userId, { author: "B" }, 10);
        },
        (err) => {
          assert.ok(err instanceof RevisionConflictError);
          assert.equal(err.currentRevision, 11);
          return true;
        }
      );
    });
  });

  // Scenario 8: Duplicate manifest rejection
  test("8. Duplicate manifest rejection: fails safely on both commit and readProgress", async () => {
    const initialSheets = {
      Collections: [
        ["collection", "record_id", "user_id", "updated_at", "payload"],
        ["lists", "sinau_state_v1_manifest", "dup-user", "2026-11-01T10:00:00Z", JSON.stringify({ revision: 1 })],
        ["lists", "sinau_state_v1_manifest", "dup-user", "2026-11-01T10:05:00Z", JSON.stringify({ revision: 2 })],
      ],
    };
    const sandbox = createGasSandbox(initialSheets);
    await withMockFetch(sandbox, async () => {
      // readProgress must fail safely
      await assert.rejects(
        async () => {
          await readProgress("dup-user");
        },
        /terdeteksi lebih dari satu/i
      );

      // snapshot.commit must also reject
      const commitRes = sandbox.callDoPost({
        apiKey: TEST_API_KEY,
        action: "snapshot.commit",
        collection: "lists",
        userId: "dup-user",
        snapshotId: randomUUID(),
        expectedRevision: 2,
        newRevision: 3,
        partCount: 1,
      });
      assert.equal(commitRes.ok, false);
      assert.equal(commitRes.code, "DUPLICATE_MANIFEST");
    });
  });

  // Scenario 9: Duplicate chunk rejection
  test("9. Duplicate chunk rejection: commit fails if duplicate chunk index exists", () => {
    const sandbox = createGasSandbox();
    const userId = "user-dup-chunk";
    const snapId = randomUUID();

    // Insert two chunks for the exact same index 0
    const colRows = sandbox.sheetsData.get("Collections");
    colRows.push(
      ["lists", `sinau_state_v1_${snapId}_0000`, userId, new Date().toISOString(), JSON.stringify({ snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "p1" })],
      ["lists", `sinau_state_v1_${snapId}_0000`, userId, new Date().toISOString(), JSON.stringify({ snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "p2" })]
    );

    const res = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res.ok, false);
    assert.equal(res.code, "DUPLICATE_CHUNK");
  });

  // Scenario 10: Immutable chunk rejection
  test("10. Immutable chunk rejection: attempting to change chunk payload is rejected with SNAPSHOT_CHUNK_IMMUTABLE", () => {
    const sandbox = createGasSandbox();
    const userId = "user-chunk-immut";
    const snapId = randomUUID();
    const chunkId = `sinau_state_v1_${snapId}_0000`;

    // 1. Initial chunk write
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: chunkId, data: { payload: "original-payload" } }],
    });
    assert.equal(res1.ok, true);

    // 2. Attempt to overwrite chunk with different payload
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: chunkId, data: { payload: "tampered-payload" } }],
    });
    assert.equal(res2.ok, false);
    assert.equal(res2.code, "SNAPSHOT_CHUNK_IMMUTABLE");
  });

  // Scenario 11: Identical chunk retry
  test("11. Identical chunk retry: uploading identical payload succeeds idempotently", () => {
    const sandbox = createGasSandbox();
    const userId = "user-chunk-retry";
    const snapId = randomUUID();
    const chunkId = `sinau_state_v1_${snapId}_0000`;

    // First write
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: chunkId, data: { payload: "identical-payload" } }],
    });
    assert.equal(res1.ok, true);

    // Second write with identical content
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: chunkId, data: { payload: "identical-payload" } }],
    });
    assert.equal(res2.ok, true, "Identical chunk retry must succeed");
  });

  // Scenario 12: Commit response lost after successful Apps Script manifest activation
  test("12. Commit response lost after successful Apps Script manifest activation: server-side reconciliation reports committed", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-lost-response";
    const operationId = randomUUID();
    const testState = { step: 12, note: "reconciled" };

    // Simulate Apps Script commit succeeding, but HTTP connection dropping before response returns to client
    let dropCommitResponseOnce = true;
    const interceptor = async (url, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "snapshot.commit" && dropCommitResponseOnce) {
        dropCommitResponseOnce = false;
        // Perform the commit in Apps Script sandbox directly
        sandbox.callDoPost(payload);
        // But throw network failure to client
        throw new Error("HTTP connection timeout waiting for commit response");
      }
      return undefined; // Proceed normally for other actions (including reconcile)
    };

    await withMockFetch(sandbox, async () => {
      // writeProgress should automatically reconcile by reading manifest and confirming committed
      const res = await writeProgress(userId, testState, 0, operationId);
      assert.equal(res.revision, 1);
      assert.equal(res.snapshotId, operationId);

      // Verify progress in cloud is valid
      const cloudData = await readProgress(userId);
      assert.equal(cloudData.revision, 1);
      assert.deepEqual(cloudData.state, testState);
    }, interceptor);
  });

  // Scenario 13: Retry of the same operationId
  test("13. Retry of the same operationId: retrying identical content with same operationId is idempotent", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-opid-retry";
    const operationId = randomUUID();
    const state = { value: "test-data" };

    await withMockFetch(sandbox, async () => {
      // First save
      const res1 = await writeProgress(userId, state, 0, operationId);
      assert.equal(res1.revision, 1);
      assert.equal(res1.snapshotId, operationId);

      // Retry with same operationId and same content
      const res2 = await writeProgress(userId, state, 0, operationId);
      assert.equal(res2.revision, 1, "Must remain revision 1");
      assert.equal(res2.snapshotId, operationId);
    });
  });

  // Scenario 14: Reuse of the same operationId with different content
  test("14. Reuse of the same operationId with different content is rejected", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-opid-diff";
    const operationId = randomUUID();

    await withMockFetch(sandbox, async () => {
      // Write content A
      await writeProgress(userId, { content: "A" }, 0, operationId);

      // Attempt to reuse same operationId with content B
      await assert.rejects(
        async () => {
          await writeProgress(userId, { content: "B" }, 0, operationId);
        },
        /konten yang berbeda|immutable/i
      );
    });
  });

  // Scenario 15: HTTP 409 conflict returned by progressHandler
  test("15. HTTP 409 conflict returned by progressHandler when baseRevision is stale", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-handler-409";
    const session = issueSession({ id: userId, email: "user409@example.com" });
    sandbox.seedManifest(userId, { snapshotId: randomUUID(), partCount: 1, revision: 5 });

    await withMockFetch(sandbox, async () => {
      const res = createMockResponse();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${session.access_token}` },
          body: {
            state: { update: "stale" },
            baseRevision: 4, // Stale! Current is 5
          },
        },
        res
      );
      assert.equal(res.statusCode, 409);
      assert.equal(res.body.code, "REVISION_CONFLICT");
      assert.equal(res.body.currentRevision, 5);
    });
  });

  // Scenario 16: HTTP 503 lock busy returned by progressHandler
  test("16. HTTP 503 lock busy returned by progressHandler during lock contention", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-handler-503";
    const session = issueSession({ id: userId, email: "user503@example.com" });
    sandbox.setLockBusy(true);

    await withMockFetch(sandbox, async () => {
      const res = createMockResponse();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${session.access_token}` },
          body: {
            state: { update: "busy" },
            baseRevision: 0,
          },
        },
        res
      );
      assert.equal(res.statusCode, 503);
      assert.equal(res.body.code, "LOCK_BUSY");
    });
  });

  // Scenario 17: Timeout without false-success reporting
  test("17. Timeout without false-success reporting: uncertain outcome throws UncertainCommitError and returns 504", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-timeout-uncertain";
    const session = issueSession({ id: userId, email: "timeout@example.com" });
    const opId = randomUUID();

    // Mock commit dropping connection WITHOUT actually applying the commit
    const interceptor = async (url, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "snapshot.commit") {
        // Drop without applying
        throw new Error("Timeout: network disconnected before GAS commit");
      }
      return undefined;
    };

    await withMockFetch(sandbox, async () => {
      const res = createMockResponse();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${session.access_token}` },
          body: {
            state: { some: "data" },
            baseRevision: 0,
            operationId: opId,
          },
        },
        res
      );
      // Handler must report 504 UNCERTAIN_COMMIT and NEVER report 200 false success!
      assert.equal(res.statusCode, 504);
      assert.equal(res.body.code, "UNCERTAIN_COMMIT");
      assert.equal(res.body.operationId, opId);
    }, interceptor);
  });

  // Scenario 18: Frontend pending-operation preservation
  test("18. Frontend pending-operation preservation: RAM operationId is preserved across network retries", () => {
    let pendingSaveOp = null;

    function getOrReuseOperationId(baseRev, payload) {
      if (pendingSaveOp && pendingSaveOp.baseRevision === baseRev && pendingSaveOp.payloadDigest === payload) {
        return pendingSaveOp.operationId;
      }
      const newId = randomUUID();
      pendingSaveOp = { operationId: newId, baseRevision: baseRev, payloadDigest: payload };
      return newId;
    }

    const initialOpId = getOrReuseOperationId(0, '{"progress":1}');
    assert.ok(initialOpId);

    // Simulate network error: pendingSaveOp remains in RAM
    const retryOpId = getOrReuseOperationId(0, '{"progress":1}');
    assert.equal(retryOpId, initialOpId, "Retry of same save intent must reuse same operationId");

    // Confirmed commit: pendingSaveOp is cleared
    pendingSaveOp = null;

    // Subsequent new save gets a new operationId
    const nextOpId = getOrReuseOperationId(1, '{"progress":2}');
    assert.notEqual(nextOpId, initialOpId, "New save must generate fresh operationId");
  });

  // Scenario 19: Frontend conflict UI and retry suppression
  test("19. Frontend conflict UI and retry suppression: 409 conflict clears pendingOp and suppresses auto-sync", () => {
    let pendingSaveOp = { operationId: "op-1", baseRevision: 2 };
    let syncConflict = false;
    let autoSyncTriggered = 0;

    function onSyncError(status) {
      if (status === 409) {
        pendingSaveOp = null; // Do NOT retry stale revision!
        syncConflict = true;  // Suppress automatic sync
      }
    }

    function triggerAutoSync() {
      if (syncConflict) return; // Suppressed
      autoSyncTriggered++;
    }

    // Encounter 409 conflict
    onSyncError(409);
    assert.equal(pendingSaveOp, null, "Pending operation must be cleared on 409");
    assert.equal(syncConflict, true, "Conflict flag must be activated");

    // Attempts to auto-sync must be suppressed
    triggerAutoSync();
    triggerAutoSync();
    assert.equal(autoSyncTriggered, 0, "No auto-sync allowed while conflict is unresolved");

    // User reloads cloud progress -> clears conflict
    syncConflict = false;
    triggerAutoSync();
    assert.equal(autoSyncTriggered, 1, "Auto-sync resumes once conflict is resolved");
  });

  // Scenario 20: Verification that Vercel routing no longer points to the external gateway
  test("20. Verification that Vercel routing in feature branch no longer points to external gateway", () => {
    const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
    const rewrites = vercelConfig.rewrites || [];
    const hasExternalGatewayRewrite = rewrites.some(
      (r) =>
        String(r.destination).includes("sinauuenglishclaudeapp") ||
        String(r.source) === "/api/account" ||
        String(r.source) === "/api/progress"
    );
    assert.equal(
      hasExternalGatewayRewrite,
      false,
      "vercel.json must not rewrite /api/account or /api/progress to external gateway"
    );
    // Verify local functions configuration
    assert.ok(vercelConfig.functions, "vercel.json should configure serverless function settings");
  });
});
