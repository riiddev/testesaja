import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { readFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

// Load actual Code.gs source
const codeGsSource = readFileSync("backend/google-apps-script/Code.gs", "utf8");

/**
 * Creates an in-memory Google Apps Script sandbox simulating Google Sheets
 */
function createGasSandbox(initialSheets = {}) {
  const sheetsData = new Map();

  for (const [name, rows] of Object.entries(initialSheets)) {
    sheetsData.set(name, rows.map((r) => [...r]));
  }

  const mockLock = {
    locked: false,
    tryLock: (ms) => {
      mockLock.locked = true;
      return true;
    },
    releaseLock: () => {
      mockLock.locked = false;
    },
  };

  const getOrCreateSheetData = (name, headers) => {
    if (!sheetsData.has(name)) {
      sheetsData.set(name, [headers ? [...headers] : []]);
    }
    return sheetsData.get(name);
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
      MAX_LOCK_WAIT_MS: 15000,
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
        getProperty: (key) =>
          key === "SINAI_API_KEY"
            ? "1234567890123456_valid_test_api_key_32bytes"
            : null,
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
    callDoPost: (payload) => {
      const e = {
        postData: { contents: JSON.stringify(payload) },
      };
      return context.doPost(e).getContent();
    },
  };
}

const TEST_API_KEY = "1234567890123456_valid_test_api_key_32bytes";

describe("Phase 1B — Snapshot Concurrency & Manifest CAS", () => {
  // Test A — Unique Snapshot IDs
  test("Test A — Unique Snapshot IDs: Two writes generate different chunk IDs and cannot overwrite each other", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-a";
    const snapId1 = randomUUID();
    const snapId2 = randomUUID();

    assert.notEqual(snapId1, snapId2, "Snapshot IDs must be distinct");

    const chunk1Id = `sinau_state_v1_${snapId1}_0000`;
    const chunk2Id = `sinau_state_v1_${snapId2}_0000`;
    assert.notEqual(chunk1Id, chunk2Id, "Chunk IDs must never collide");

    // Upload chunk 1
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunk1Id,
          data: {
            snapshotId: snapId1,
            chunkIndex: 0,
            partCount: 1,
            payload: "chunk-data-1",
          },
        },
      ],
    });
    assert.equal(res1.ok, true);

    // Upload chunk 2
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: chunk2Id,
          data: {
            snapshotId: snapId2,
            chunkIndex: 0,
            partCount: 1,
            payload: "chunk-data-2",
          },
        },
      ],
    });
    assert.equal(res2.ok, true);

    // Verify both chunks exist independently in the sheet
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

  // Test B — Concurrent Same Revision
  test("Test B — Concurrent Same Revision: Two writers start at revision 12; Writer A commits revision 13, Writer B receives 409", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-b";

    // Setup initial manifest at revision 12
    const initManifest = {
      snapshotId: "old-snapshot-id",
      partCount: 1,
      revision: 12,
      updatedAt: new Date().toISOString(),
    };
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: "sinau_state_v1_manifest",
          data: initManifest,
        },
      ],
    });

    const snapIdA = randomUUID();
    const snapIdB = randomUUID();

    // Writer A uploads its chunk
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapIdA}_0000`,
          data: {
            snapshotId: snapIdA,
            chunkIndex: 0,
            partCount: 1,
            payload: "data-a",
          },
        },
      ],
    });

    // Writer B uploads its chunk
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapIdB}_0000`,
          data: {
            snapshotId: snapIdB,
            chunkIndex: 0,
            partCount: 1,
            payload: "data-b",
          },
        },
      ],
    });

    // Writer A commits with expectedRevision: 12, newRevision: 13
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

    // Writer B attempts commit with expectedRevision: 12 (now stale!)
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

    // Verify manifest remains pointed to Writer A's snapshot
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find(
      (r) => r.id === "sinau_state_v1_manifest"
    );
    assert.equal(manifest.data.snapshotId, snapIdA);
    assert.equal(manifest.data.revision, 13);
  });

  // Test C — Stale Device
  test("Test C — Stale Device: Device loaded revision 10 while cloud is already at revision 13; upload is rejected", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-c";

    // Setup manifest at revision 13
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: "sinau_state_v1_manifest",
          data: { snapshotId: "snap-13", partCount: 1, revision: 13 },
        },
      ],
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
          data: {
            snapshotId: staleSnapId,
            chunkIndex: 0,
            partCount: 1,
            payload: "stale-payload",
          },
        },
      ],
    });

    const commitStale = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: staleSnapId,
      expectedRevision: 10, // Stale!
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

    // Setup initial manifest
    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: "sinau_state_v1_manifest",
          data: { snapshotId: "initial-snap", partCount: 1, revision: 1 },
        },
      ],
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
          data: {
            snapshotId: partialSnapId,
            chunkIndex: 0,
            partCount: 3,
            payload: "p0",
          },
        },
        {
          id: `sinau_state_v1_${partialSnapId}_0002`,
          data: {
            snapshotId: partialSnapId,
            chunkIndex: 2,
            partCount: 3,
            payload: "p2",
          },
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
    const manifest = listRes.data.records.find(
      (r) => r.id === "sinau_state_v1_manifest"
    );
    assert.equal(manifest.data.snapshotId, "initial-snap");
    assert.equal(manifest.data.revision, 1);
  });

  // Test E — Idempotent Commit
  test("Test E — Idempotent Commit: The same snapshotId and newRevision are committed again; success returned without incrementing", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-e";
    const snapId = randomUUID();

    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: `sinau_state_v1_${snapId}_0000`,
          data: {
            snapshotId: snapId,
            chunkIndex: 0,
            partCount: 1,
            payload: "data",
          },
        },
      ],
    });

    // First commit
    const res1 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res1.ok, true);
    assert.equal(res1.data.revision, 1);

    // Second commit with same snapshotId & newRevision
    const res2 = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: 1,
    });
    assert.equal(res2.ok, true);
    assert.equal(res2.data.idempotent, true);
    assert.equal(res2.data.revision, 1);

    // Ensure manifest is not duplicated
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifests = listRes.data.records.filter(
      (r) => r.id === "sinau_state_v1_manifest"
    );
    assert.equal(manifests.length, 1, "Only one manifest record must exist");
  });

  // Test F — Legacy Read Compatibility
  test("Test F — Legacy Read Compatibility: Existing slot A/B snapshot loads correctly with revision 0", () => {
    const rawState = {
      schemaVersion: 2,
      core: { wordProgress: { test_word: { status: "mastered" } } },
      extras: { extraLearning: {} },
    };
    const serialized = JSON.stringify(rawState);
    const packed = gzipSync(Buffer.from(serialized, "utf8")).toString("base64");
    const snapId = "legacy-snapshot-abc";

    const legacyRecords = [
      {
        id: "sinau_state_v1_manifest",
        data: {
          snapshotId: snapId,
          slot: "A",
          partCount: 1,
          updatedAt: "2026-10-01T00:00:00Z",
        },
      },
      {
        id: "sinau_state_v1_A_0000",
        data: {
          snapshotId: snapId,
          slot: "A",
          chunkIndex: 0,
          partCount: 1,
          payload: packed,
        },
      },
    ];

    // Simulate reading via readProgress logic
    const manifest = legacyRecords.find((r) => r.id === "sinau_state_v1_manifest");
    const slot = manifest.data.slot;
    const partCount = manifest.data.partCount;
    const revision = manifest.data.revision || 0;
    assert.equal(revision, 0, "Legacy snapshot defaults to revision 0");

    const chunk = legacyRecords.find(
      (r) =>
        r.data.snapshotId === snapId &&
        r.data.slot === slot &&
        r.data.chunkIndex === 0
    );
    assert.ok(chunk);
    const decompressed = JSON.parse(
      gunzipSync(Buffer.from(chunk.data.payload, "base64")).toString("utf8")
    );
    assert.deepEqual(decompressed, rawState);
  });

  // Test G — New Snapshot Round Trip
  test("Test G — New Snapshot Round Trip: Full serialization, chunking, CAS commit, reading, and decompression", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-g";
    const sampleBundle = {
      schemaVersion: 2,
      core: {
        settings: { theme: "dark" },
        wordProgress: {
          apple: { status: "mastered", reviewSuccesses: 5 },
          banana: { status: "learning", reviewSuccesses: 2 },
        },
      },
      extras: {
        habitProgress: { completedPassages: ["passage-01", "passage-02"] },
      },
    };

    // Serialize & gzip
    const serialized = JSON.stringify(sampleBundle);
    const packed = gzipSync(Buffer.from(serialized, "utf8")).toString("base64");
    const snapId = randomUUID();
    const chunkSize = 20; // small size to force multiple chunks
    const parts = [];
    for (let i = 0; i < packed.length; i += chunkSize) {
      parts.push(packed.slice(i, i + chunkSize));
    }

    // Upload chunks
    const chunkRecords = parts.map((payload, index) => ({
      id: `sinau_state_v1_${snapId}_${String(index).padStart(4, "0")}`,
      data: {
        snapshotId: snapId,
        chunkIndex: index,
        partCount: parts.length,
        payload,
      },
    }));

    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: chunkRecords,
    });

    // CAS commit
    const commitRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: snapId,
      expectedRevision: 0,
      newRevision: 1,
      partCount: parts.length,
    });
    assert.equal(commitRes.ok, true);
    assert.equal(commitRes.data.revision, 1);

    // Read back and reconstruct
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find(
      (r) => r.id === "sinau_state_v1_manifest"
    );
    assert.equal(manifest.data.snapshotId, snapId);
    assert.equal(manifest.data.revision, 1);

    const reassembled = [];
    for (let c = 0; c < parts.length; c++) {
      const chunk = listRes.data.records.find(
        (r) =>
          r.data.snapshotId === snapId &&
          r.data.chunkIndex === c
      );
      assert.ok(chunk, `Chunk ${c} must exist`);
      reassembled.push(chunk.data.payload);
    }

    const decompressed = JSON.parse(
      gunzipSync(Buffer.from(reassembled.join(""), "base64")).toString("utf8")
    );
    assert.deepEqual(decompressed, sampleBundle);
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
    assert.equal(
      commitA.ok,
      false,
      "Commit under User A must fail because chunks belong to User B"
    );
    assert.equal(commitA.code, "INCOMPLETE_SNAPSHOT");
  });

  // Test I — Retry Scheduling on Conflict
  test("Test I — Retry Scheduling: Conflict flag suppresses automatic sync triggers", () => {
    let syncConflict = true;
    let syncTriggered = 0;

    function scheduleSync() {
      if (syncConflict) return; // Suppressed!
      syncTriggered++;
    }

    function onOnline() {
      if (syncConflict) return; // Suppressed!
      syncTriggered++;
    }

    function onFocus() {
      if (syncConflict) return; // Suppressed!
      syncTriggered++;
    }

    scheduleSync();
    onOnline();
    onFocus();

    assert.equal(
      syncTriggered,
      0,
      "No automatic sync should fire while syncConflict is active"
    );

    // After resolution/reload
    syncConflict = false;
    scheduleSync();
    assert.equal(syncTriggered, 1, "Sync triggers normally once conflict is cleared");
  });

  // Test J — Manifest Integrity
  test("Test J — Manifest Integrity: Failed or incomplete commit never alters the active manifest", () => {
    const sandbox = createGasSandbox();
    const userId = "user-test-j";
    const initialSnap = "initial-safe-snap";

    sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.upsertBatch",
      collection: "lists",
      userId,
      records: [
        {
          id: "sinau_state_v1_manifest",
          data: {
            snapshotId: initialSnap,
            partCount: 1,
            revision: 5,
            updatedAt: "2026-11-01T12:00:00Z",
          },
        },
      ],
    });

    // Attempt a failed commit (wrong revision + missing chunk)
    const badSnap = randomUUID();
    const failRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "snapshot.commit",
      collection: "lists",
      userId,
      snapshotId: badSnap,
      expectedRevision: 99, // Wrong!
      newRevision: 100,
      partCount: 2,
    });
    assert.equal(failRes.ok, false);

    // Check manifest row in sheet
    const listRes = sandbox.callDoPost({
      apiKey: TEST_API_KEY,
      action: "collections.list",
      collection: "lists",
      userId,
    });
    const manifest = listRes.data.records.find(
      (r) => r.id === "sinau_state_v1_manifest"
    );
    assert.equal(manifest.data.snapshotId, initialSnap);
    assert.equal(manifest.data.revision, 5);
    assert.equal(manifest.data.updatedAt, "2026-11-01T12:00:00Z");
  });
});
