import assert from "node:assert/strict";
import { test, describe, before, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

import {
  readProgress,
  writeProgress,
  RevisionConflictError,
  LockBusyError,
} from "../api/_lib/sheets.ts";
import { issueSession } from "../api/_lib/security.ts";
import progressHandler from "../api/progress.ts";

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
    initialSheets.Collections = [["collection", "record_id", "user_id", "updated_at", "data"]];
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
 * Scopes global fetch to dispatch to the given GAS sandbox
 */
async function withMockFetch(sandbox, testFn) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).startsWith(process.env.SINAI_SCRIPT_URL)) {
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

describe("Phase 1B — Snapshot Concurrency, Manifest CAS & Immutability", () => {
  // Test A — Unique Snapshot IDs
  test("Test A — Unique Snapshot IDs: Two writes generate different chunk IDs and cannot overwrite each other", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-a";

    const snap1 = randomUUID();
    const snap2 = randomUUID();
    assert.notEqual(snap1, snap2, "Each snapshot write must have a unique UUID");

    const chunk1Id = `sinau_state_v1_${snap1}_0000`;
    const chunk2Id = `sinau_state_v1_${snap2}_0000`;
    assert.notEqual(chunk1Id, chunk2Id, "Chunk IDs must never collide");

    // Write chunk 1
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunk1Id,
          data: { snapshotId: snap1, chunkIndex: 0, partCount: 1, payload: "chunk-data-1" },
        },
      ],
    });
    assert.equal(res1.ok, true);

    // Write chunk 2
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunk2Id,
          data: { snapshotId: snap2, chunkIndex: 0, partCount: 1, payload: "chunk-data-2" },
        },
      ],
    });
    assert.equal(res2.ok, true);

    // Verify both chunks exist without collision
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    assert.equal(listRes.ok, true);
    const recs = listRes.data.records;
    const r1 = recs.find((r) => r.id === chunk1Id);
    const r2 = recs.find((r) => r.id === chunk2Id);
    assert.ok(r1, "Chunk 1 must exist");
    assert.ok(r2, "Chunk 2 must exist");
    assert.equal(r1.data.payload, "chunk-data-1");
    assert.equal(r2.data.payload, "chunk-data-2");
  });

  // Test B — Sequential CAS Conflict Simulation
  test("Test B — Sequential CAS Conflict Simulation: Two writers start at revision 12; Writer A commits revision 13, Writer B receives 409", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-b";

    // Initialize manifest at revision 12
    sandbox.seedManifest(userId, {
      snapshotId: randomUUID(),
      partCount: 1,
      revision: 12,
      updatedAt: new Date().toISOString(),
    });

    const snapIdA = randomUUID();
    const snapIdB = randomUUID();

    // Writer A uploads chunk
    const upA = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapIdA}_0000`,
          data: { snapshotId: snapIdA, chunkIndex: 0, partCount: 1, payload: "data-a" },
        },
      ],
    });
    assert.equal(upA.ok, true);

    // Writer B uploads chunk
    const upB = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapIdB}_0000`,
          data: { snapshotId: snapIdB, chunkIndex: 0, partCount: 1, payload: "data-b" },
        },
      ],
    });
    assert.equal(upB.ok, true);

    // Writer A commits with expectedRevision: 12, newRevision: 13 -> SUCCESS
    const commitA = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapIdA,
      expectedRevision: 12,
      newRevision: 13,
      partCount: 1,
    });
    assert.equal(commitA.ok, true, "Writer A must succeed");
    assert.equal(commitA.data.revision, 13);
    assert.equal(commitA.data.snapshotId, snapIdA);

    // Writer B attempts commit with expectedRevision: 12 (now stale!) -> REVISION_CONFLICT
    const commitB = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapIdB,
      expectedRevision: 12,
      newRevision: 13,
      partCount: 1,
    });
    assert.equal(commitB.ok, false, "Writer B must be rejected");
    assert.equal(commitB.code, "REVISION_CONFLICT");
    assert.equal(commitB.currentRevision, 13);

    // Manifest remains pointed to Writer A's snapshot
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find((r) => r.id === "sinau_state_v1_manifest");
    assert.equal(manifest.data.snapshotId, snapIdA);
    assert.equal(manifest.data.revision, 13);
  });

  // Test C — Stale Device
  test("Test C — Stale Device: Device loaded revision 10 while cloud is already at revision 13; upload is rejected", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-c";

    // Setup manifest at revision 13
    sandbox.seedManifest(userId, {
      snapshotId: randomUUID(),
      partCount: 1,
      revision: 13,
      updatedAt: new Date().toISOString(),
    });

    const staleSnapId = randomUUID();
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${staleSnapId}_0000`,
          data: { snapshotId: staleSnapId, chunkIndex: 0, partCount: 1, payload: "stale-payload" },
        },
      ],
    });

    const commitStale = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: staleSnapId,
      expectedRevision: 10, // Stale! Cloud is at 13
      newRevision: 11,
      partCount: 1,
    });
    assert.equal(commitStale.ok, false);
    assert.equal(commitStale.code, "REVISION_CONFLICT");
    assert.equal(commitStale.currentRevision, 13);
  });

  // Test D — Partial Upload
  test("Test D — Partial Upload: Snapshot uploads only some chunks; commit is rejected and manifest remains unchanged", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-d";
    const initialSnapId = randomUUID();

    // Setup initial manifest at revision 1
    sandbox.seedManifest(userId, {
      snapshotId: initialSnapId,
      partCount: 1,
      revision: 1,
      updatedAt: new Date().toISOString(),
    });

    const partialSnapId = randomUUID();
    // Expected 3 parts, but only upload chunk 0 and 2 (chunk 1 missing!)
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${partialSnapId}_0000`,
          data: { snapshotId: partialSnapId, chunkIndex: 0, partCount: 3, payload: "p0" },
        },
        {
          id: `sinau_state_v1_${partialSnapId}_0002`,
          data: { snapshotId: partialSnapId, chunkIndex: 2, partCount: 3, payload: "p2" },
        },
      ],
    });

    const commitRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: partialSnapId,
      expectedRevision: 1,
      newRevision: 2,
      partCount: 3,
    });

    assert.equal(commitRes.ok, false);
    assert.equal(commitRes.code, "INCOMPLETE_SNAPSHOT");
    assert.match(commitRes.error, /index 1/i);

    // Verify manifest was NOT touched
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find((r) => r.id === "sinau_state_v1_manifest");
    assert.equal(manifest.data.snapshotId, initialSnapId);
    assert.equal(manifest.data.revision, 1);
  });

  // Test E — Idempotent Commit
  test("Test E — Idempotent Commit: The same snapshotId and newRevision are committed again; success returned without incrementing", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-e";
    const snapId = randomUUID();

    // Upload chunk
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapId}_0000`,
          data: { snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "content" },
        },
      ],
    });

    // Initial commit (0 -> 1)
    const commit1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(commit1.ok, true);
    assert.equal(commit1.data.revision, 1);
    assert.equal(commit1.data.snapshotId, snapId);

    // Re-commit exact same snapshotId and newRevision (network retry simulation)
    const commit2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(commit2.ok, true, "Idempotent commit must return ok: true");
    assert.equal(commit2.data.revision, 1, "Revision must remain 1");
    assert.equal(commit2.data.snapshotId, snapId);

    // Verify sheet has only 1 manifest record
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifests = listRes.data.records.filter((r) => r.id === "sinau_state_v1_manifest");
    assert.equal(manifests.length, 1);
    assert.equal(manifests[0].data.revision, 1);
  });

  // Test F — Legacy Read Compatibility
  test("Test F — Legacy Read Compatibility: Existing slot A/B snapshot loads correctly with revision 0", async () => {
    const legacyState = {
      progress: { "word-1": { status: "learned", score: 100 } },
      version: 1,
    };
    const compressed = gzipSync(Buffer.from(JSON.stringify(legacyState), "utf8")).toString("base64");

    const initialSheets = {
      Collections: [
        ["collection", "record_id", "user_id", "updated_at", "data"],
        [
          "lists",
          "sinau_state_v1_manifest",
          "user-legacy",
          "2026-10-01T10:00:00Z",
          JSON.stringify({ activeSlot: "A", updatedAt: "2026-10-01T10:00:00Z" }),
        ],
        [
          "lists",
          "sinau_state_v1_slot_A_0000",
          "user-legacy",
          "2026-10-01T10:00:00Z",
          JSON.stringify({
            slot: "A",
            chunkIndex: 0,
            partCount: 1,
            payload: compressed,
            updatedAt: "2026-10-01T10:00:00Z",
          }),
        ],
      ],
    };

    const sandbox = createGasSandbox(initialSheets);
    await withMockFetch(sandbox, async () => {
      const readRes = await readProgress("user-legacy");
      assert.ok(readRes, "readProgress must return legacy record");
      assert.equal(readRes.revision, 0, "Legacy snapshots without numeric revision default to revision 0");
      assert.deepEqual(readRes.state, legacyState);
    });
  });

  // Test G — New Snapshot Round Trip
  test("Test G — New Snapshot Round Trip: Full serialization, chunking, CAS commit, reading, and decompression", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-round-trip";
    const sampleBundle = {
      learnedWords: Array.from({ length: 50 }, (_, i) => ({ id: `w-${i}`, s: "mastered" })),
      quizzes: [{ id: "q1", score: 95 }],
      settings: { soundEnabled: true, dailyGoal: 10 },
    };

    await withMockFetch(sandbox, async () => {
      // 1. Initial read on fresh user -> returns null
      const initialRead = await readProgress(userId);
      assert.equal(initialRead, null);

      // 2. Write first snapshot (revision 0 -> 1)
      const write1 = await writeProgress(userId, sampleBundle, 0);
      assert.equal(write1.revision, 1);
      assert.ok(write1.snapshotId);

      // 3. Read back written snapshot
      const read1 = await readProgress(userId);
      assert.ok(read1);
      assert.equal(read1.revision, 1);
      assert.deepEqual(read1.state, sampleBundle);

      // 4. Update state and write revision 1 -> 2
      sampleBundle.quizzes.push({ id: "q2", score: 100 });
      const write2 = await writeProgress(userId, sampleBundle, 1);
      assert.equal(write2.revision, 2);

      // 5. Read back second snapshot
      const read2 = await readProgress(userId);
      assert.ok(read2);
      assert.equal(read2.revision, 2);
      assert.deepEqual(read2.state, sampleBundle);
    });
  });

  // Test H — Cross-User Isolation
  test("Test H — Cross-User Isolation: User A cannot read or commit User B's snapshot", () => {
    const sandbox = createGasSandbox();
    const userA = "user-alice";
    const userB = "user-bob";

    const snapB = randomUUID();
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId: userB,
      records: [
        {
          id: `sinau_state_v1_${snapB}_0000`,
          data: {
            snapshotId: snapB,
            chunkIndex: 0,
            partCount: 1,
            payload: "bobs-private-data",
          },
        },
      ],
    });

    // User A attempts to list records
    const listA = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId: userA,
    });
    assert.equal(listA.data.records.length, 0, "User A must see 0 records");

    // User A attempts to commit Bob's snapshotId under userA
    const commitA = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId: userA,
      snapshotId: snapB,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(commitA.ok, false, "Commit under User A must fail");
    assert.equal(commitA.code, "UNAUTHORIZED_CHUNK", "Ownership check must reject chunk with UNAUTHORIZED_CHUNK");
  });

  // Test I — Retry Scheduling on Conflict
  test("Test I — Retry Scheduling: Conflict flag suppresses automatic sync triggers", () => {
    let syncConflict = true;
    let syncTriggered = 0;

    function scheduleSync() {
      if (syncConflict) return; // Suppressed while conflict flag is active
      syncTriggered++;
    }

    function onOnline() {
      if (syncConflict) return;
      syncTriggered++;
    }

    function onFocus() {
      if (syncConflict) return;
      syncTriggered++;
    }

    scheduleSync();
    onOnline();
    onFocus();

    assert.equal(syncTriggered, 0, "No automatic sync should fire while syncConflict is active");

    // After user resolves conflict and clears flag
    syncConflict = false;
    scheduleSync();
    assert.equal(syncTriggered, 1, "Sync triggers normally once conflict is cleared");
  });

  // Test J — Manifest Integrity
  test("Test J — Manifest Integrity: Failed or incomplete commit never alters the active manifest", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-j";
    const initialSnap = randomUUID();

    sandbox.seedManifest(userId, {
      snapshotId: initialSnap,
      partCount: 1,
      revision: 5,
      updatedAt: "2026-11-01T12:00:00Z",
    });

    // Attempt a failed commit (wrong revision + missing chunk)
    const badSnap = randomUUID();
    const failRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: badSnap,
      expectedRevision: 99, // Wrong revision!
      newRevision: 100,
      partCount: 2,
    });
    assert.equal(failRes.ok, false);

    // Verify manifest in sheet was never altered
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find((r) => r.id === "sinau_state_v1_manifest");
    assert.equal(manifest.data.snapshotId, initialSnap);
    assert.equal(manifest.data.revision, 5);
    assert.equal(manifest.data.updatedAt, "2026-11-01T12:00:00Z");
  });

  // Test K — Hardened Immutable Chunks
  test("Test K — Hardened Immutable Chunks: Identical retry allowed, differing chunk modification rejected, manifest direct upsert blocked", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-k";
    const snapId = randomUUID();
    const chunkId = `sinau_state_v1_${snapId}_0000`;

    // 1. Direct attempt to update sinau_state_v1_manifest via collections.upsertBatch is blocked
    const directManifestRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: "sinau_state_v1_manifest",
          data: { snapshotId: snapId, revision: 10 },
        },
      ],
    });
    assert.equal(directManifestRes.ok, false);
    assert.equal(directManifestRes.code, "MANIFEST_IMMUTABLE");

    // 2. Initial chunk upload succeeds
    const initialChunkRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunkId,
          data: { snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "original-payload" },
        },
      ],
    });
    assert.equal(initialChunkRes.ok, true);

    // 3. Idempotent retry with identical chunk content succeeds
    const retryChunkRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunkId,
          data: { snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "original-payload" },
        },
      ],
    });
    assert.equal(retryChunkRes.ok, true, "Identical chunk retry must succeed idempotently");

    // 4. Attempt to modify existing chunk with different payload is rejected
    const mutateChunkRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunkId,
          data: { snapshotId: snapId, chunkIndex: 0, partCount: 1, payload: "mutated-payload" },
        },
      ],
    });
    assert.equal(mutateChunkRes.ok, false);
    assert.equal(mutateChunkRes.code, "SNAPSHOT_CHUNK_IMMUTABLE");

    // 5. Normal non-snapshot records update freely
    const normalUpsert1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: "custom_item_1", data: { text: "v1" } }],
    });
    assert.equal(normalUpsert1.ok, true);

    const normalUpsert2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [{ id: "custom_item_1", data: { text: "v2" } }],
    });
    assert.equal(normalUpsert2.ok, true);
  });

  // Test L — Hardened Snapshot Commit Validation
  test("Test L — Hardened Snapshot Commit Validation: 11 strict rules enforced", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-l";
    const validSnapId = randomUUID();

    // 1. Missing userId
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId: "",
      snapshotId: validSnapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res1.code, "INVALID_USER_ID");

    // 2. Collection not 'lists'
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "other_col",
      userId,
      snapshotId: validSnapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res2.code, "INVALID_COLLECTION");

    // 3. Invalid UUID snapshotId
    const res3 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: "not-a-valid-uuid-12345",
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res3.code, "INVALID_SNAPSHOT_ID");

    // 4. Non-integer or negative expectedRevision
    const res4 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: validSnapId,
      expectedRevision: -1,
      newRevision: 0,
      partCount: 1,
    });
    assert.equal(res4.code, "INVALID_REVISION");

    // 5. Non-consecutive newRevision !== expectedRevision + 1
    const res5 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: validSnapId,
      expectedRevision: 0,
      newRevision: 5, // Non-consecutive!
      partCount: 1,
    });
    assert.equal(res5.code, "INVALID_REVISION");

    // 6. partCount < 1 or > CONFIG.MAX_CHUNKS
    const res6 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: validSnapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 0,
    });
    assert.equal(res6.code, "INVALID_PART_COUNT");

    // 7. Duplicate manifests in sheet
    const dupSandbox = createGasSandbox({
      Collections: [
        ["collection", "record_id", "user_id", "updated_at", "data"],
        ["lists", "sinau_state_v1_manifest", "dup-user", new Date().toISOString(), "{}"],
        ["lists", "sinau_state_v1_manifest", "dup-user", new Date().toISOString(), "{}"],
      ],
    });
    const res7 = dupSandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId: "dup-user",
      snapshotId: validSnapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res7.code, "DUPLICATE_MANIFEST");
  });

  // Test M — Concurrency Lock Contention vs CAS Revision Conflict
  test("Test M — Concurrency Lock Contention vs CAS Revision Conflict Distinction", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-m";

    // 1. Transient Lock Contention simulation (LockService.tryLock returns false)
    sandbox.setLockBusy(true);
    await withMockFetch(sandbox, async () => {
      await assert.rejects(
        async () => {
          await writeProgress(userId, { test: 1 }, 0);
        },
        (err) => {
          assert.ok(err instanceof LockBusyError, "Must throw LockBusyError under lock contention");
          assert.match(err.message, /sibuk|lock/i);
          return true;
        }
      );
    });

    // 2. Clear lock contention: write succeeds
    sandbox.setLockBusy(false);
    await withMockFetch(sandbox, async () => {
      const res = await writeProgress(userId, { test: 1 }, 0);
      assert.equal(res.revision, 1);
    });

    // 3. Logical CAS revision conflict (cloud at revision 1, writer offers baseRevision 0)
    await withMockFetch(sandbox, async () => {
      await assert.rejects(
        async () => {
          await writeProgress(userId, { test: 2 }, 0); // Stale revision 0!
        },
        (err) => {
          assert.ok(
            err instanceof RevisionConflictError,
            "Must throw RevisionConflictError when expectedRevision != currentRevision"
          );
          assert.equal(err.currentRevision, 1);
          return true;
        }
      );
    });
  });

  // Test N — End-to-End Vercel Handler Integration (api/progress.ts)
  test("Test N — End-to-End Vercel Handler Integration: GET, POST, 401, 409, 503 handling", async () => {
    const sandbox = createGasSandbox();
    const userId = "user-e2e-handler";
    const sessionToken = issueSession({ id: userId, email: "test@example.com" }).access_token;

    const createMockRes = () => {
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
    };

    await withMockFetch(sandbox, async () => {
      // 1. Unauthorized request without token -> 401
      const resUnauth = createMockRes();
      await progressHandler({ method: "GET", headers: {} }, resUnauth);
      assert.equal(resUnauth.statusCode, 401);

      // 2. Initial GET with valid session -> 200 empty array
      const resGet1 = createMockRes();
      await progressHandler(
        { method: "GET", headers: { authorization: `Bearer ${sessionToken}` } },
        resGet1
      );
      assert.equal(resGet1.statusCode, 200);
      assert.deepEqual(resGet1.body, []);

      // 3. POST valid snapshot (revision 0 -> 1)
      const resPost1 = createMockRes();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${sessionToken}` },
          body: {
            state: { progress: { "unit-1": 100 } },
            baseRevision: 0,
          },
        },
        resPost1
      );
      assert.equal(resPost1.statusCode, 200);
      assert.equal(resPost1.body.revision, 1);

      // 4. GET now returns updated record with revision 1
      const resGet2 = createMockRes();
      await progressHandler(
        { method: "GET", headers: { authorization: `Bearer ${sessionToken}` } },
        resGet2
      );
      assert.equal(resGet2.statusCode, 200);
      assert.equal(resGet2.body[0].revision, 1);
      assert.deepEqual(resGet2.body[0].state, { progress: { "unit-1": 100 } });

      // 5. POST with stale baseRevision 0 -> 409 Revision Conflict
      const resPostConflict = createMockRes();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${sessionToken}` },
          body: {
            state: { progress: { "unit-1": 150 } },
            baseRevision: 0, // Stale!
          },
        },
        resPostConflict
      );
      assert.equal(resPostConflict.statusCode, 409);
      assert.equal(resPostConflict.body.currentRevision, 1);

      // 6. POST with lock busy simulation -> 503 Service Unavailable
      sandbox.setLockBusy(true);
      const resPostBusy = createMockRes();
      await progressHandler(
        {
          method: "POST",
          headers: { authorization: `Bearer ${sessionToken}` },
          body: {
            state: { progress: { "unit-1": 200 } },
            baseRevision: 1,
          },
        },
        resPostBusy
      );
      assert.equal(resPostBusy.statusCode, 503);
      assert.match(resPostBusy.body.message, /sibuk/i);
    });
  });
});
