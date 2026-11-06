/**
 * tests/progress-sync-fase5.test.mjs
 * 
 * Comprehensive automated test suite for Fase 5:
 * 1. GET /api/progress/get returns empty dict for clean slate user
 * 2. POST /api/progress/sync processes batch of learning updates atomically
 * 3. Idempotency: re-sending the same batch returns ACK without double counting or double rewards
 * 4. Statistics & Ledger: increments totalReviews, wordsStarted, wordsMastered, awards XP & Coins
 * 5. Cross-tenant isolation: User B cannot see or touch User A's progress
 */

import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, createSessionToken } from "../api/_lib/auth.js";

import progressGetHandler from "../api/_handlers/progress/get.js";
import progressSyncHandler from "../api/_handlers/progress/sync.js";

function createMockReqRes({ method = "GET", body = {}, token = null, url = "/" } = {}) {
  const req = {
    method,
    url,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body,
    socket: { remoteAddress: "127.0.0.1" }
  };

  let statusCode = 200;
  let headers = {};
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    writeHead(code, h) {
      statusCode = code;
      headers = { ...headers, ...h };
      return this;
    },
    setHeader(name, value) {
      headers[name] = value;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    end(str) {
      if (str && !responseData) {
        try {
          responseData = JSON.parse(str);
        } catch {
          responseData = str;
        }
      }
      return this;
    },
    _getResult() {
      return { statusCode, headers, body: responseData };
    }
  };

  return { req, res };
}

test("FASE 5 TEST SUITE — Offline-First Progress & SRS Ledger Sync", async (t) => {
  const userAId = `test_sync_a_${Date.now()}`;
  const userBId = `test_sync_b_${Date.now()}`;
  let tokenA = "";
  let tokenB = "";

  // Setup: Create two distinct test users in database
  await t.test("Setup test users A and B with clean slate", async () => {
    // User A
    const { hash: hashA, salt: saltA } = await hashPassword("PassA123!");
    await db.insert(schema.users).values({
      id: userAId,
      email: `${userAId}@example.com`,
      displayName: "User A",
      passwordHash: hashA,
      salt: saltA,
      role: "student"
    });
    await db.insert(schema.profiles).values({
      userId: userAId,
      displayName: "User A",
      xp: 0,
      coins: 0,
      streak: 0
    });
    await db.insert(schema.userStats).values({
      userId: userAId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0
    });

    const sessA = createSessionToken();
    await db.insert(schema.sessions).values({
      id: `sess_${Date.now()}_a`,
      userId: userAId,
      tokenHash: sessA.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });
    tokenA = sessA.rawToken;

    // User B
    const { hash: hashB, salt: saltB } = await hashPassword("PassB123!");
    await db.insert(schema.users).values({
      id: userBId,
      email: `${userBId}@example.com`,
      displayName: "User B",
      passwordHash: hashB,
      salt: saltB,
      role: "student"
    });
    await db.insert(schema.profiles).values({
      userId: userBId,
      displayName: "User B",
      xp: 0,
      coins: 0,
      streak: 0
    });
    await db.insert(schema.userStats).values({
      userId: userBId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0
    });

    const sessB = createSessionToken();
    await db.insert(schema.sessions).values({
      id: `sess_${Date.now()}_b`,
      userId: userBId,
      tokenHash: sessB.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });
    tokenB = sessB.rawToken;

    assert.ok(tokenA);
    assert.ok(tokenB);
  });

  // TEST 1: Initial GET progress returns empty object
  await t.test("1. GET /api/progress/get returns empty dict for new user", async () => {
    const { req, res } = createMockReqRes({
      method: "GET",
      token: tokenA
    });

    await progressGetHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.deepEqual(result.body.data.items, {});
    assert.equal(result.body.data.count, 0);
  });

  // TEST 2: POST /api/progress/sync processes a batch of learning updates
  const event1Id = `evt_a_word1_${Date.now()}`;
  const event2Id = `evt_a_word2_${Date.now()}`;

  await t.test("2. POST /api/progress/sync processes batch of 2 words and updates ledger & stats", async () => {
    const batchUpdates = [
      {
        eventId: event1Id,
        wordId: "abandon",
        level: "B2",
        masteryStage: "learning",
        intervalDays: 1,
        correctCount: 1,
        wrongCount: 0,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString()
      },
      {
        eventId: event2Id,
        wordId: "ability",
        level: "B2",
        masteryStage: "mastered",
        intervalDays: 30,
        correctCount: 5,
        wrongCount: 0,
        nextReviewAt: new Date(Date.now() + 30 * 86400000).toISOString()
      }
    ];

    const { req, res } = createMockReqRes({
      method: "POST",
      token: tokenA,
      body: { updates: batchUpdates }
    });

    await progressSyncHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.count, 2);
    assert.deepEqual(result.body.data.processedEvents, [event1Id, event2Id]);
    assert.equal(result.body.data.xpGranted, 6, "2 words * 3 XP = 6 XP");
    assert.equal(result.body.data.coinsGranted, 2, "2 words * 1 Coin = 2 Coins");

    // Verify database progress rows
    const progressRows = await db
      .select()
      .from(schema.progress)
      .where(eq(schema.progress.userId, userAId));
    assert.equal(progressRows.length, 2, "User A must have 2 words in progress");

    // Verify userStats
    const statsRow = await db
      .select()
      .from(schema.userStats)
      .where(eq(schema.userStats.userId, userAId));
    assert.equal(statsRow[0].totalReviews, 2);
    assert.equal(statsRow[0].wordsStarted, 2);
    assert.equal(statsRow[0].wordsMastered, 1);
    assert.equal(statsRow[0].b2Mastered, 1);

    // Verify progress_events ledger
    const eventsRows = await db
      .select()
      .from(schema.progressEvents)
      .where(eq(schema.progressEvents.userId, userAId));
    assert.equal(eventsRows.length, 2, "Must record 2 ledger event rows");
  });

  // TEST 3: Idempotency — Re-sending the same batch must ACK without duplicates
  await t.test("3. Idempotency: Re-submitting the exact same events returns ACK without double counting", async () => {
    const duplicateBatch = [
      {
        eventId: event1Id,
        wordId: "abandon",
        level: "B2",
        masteryStage: "learning"
      },
      {
        eventId: event2Id,
        wordId: "ability",
        level: "B2",
        masteryStage: "mastered"
      }
    ];

    const { req, res } = createMockReqRes({
      method: "POST",
      token: tokenA,
      body: { updates: duplicateBatch }
    });

    await progressSyncHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.deepEqual(result.body.data.processedEvents, [event1Id, event2Id]);
    assert.equal(result.body.data.xpGranted, 0, "No duplicate XP awarded");
    assert.equal(result.body.data.coinsGranted, 0, "No duplicate coins awarded");

    // Verify stats were NOT incremented again
    const statsRow = await db
      .select()
      .from(schema.userStats)
      .where(eq(schema.userStats.userId, userAId));
    assert.equal(statsRow[0].totalReviews, 2, "totalReviews remains 2");
    assert.equal(statsRow[0].wordsStarted, 2, "wordsStarted remains 2");

    // Verify events ledger did NOT duplicate
    const eventsRows = await db
      .select()
      .from(schema.progressEvents)
      .where(eq(schema.progressEvents.userId, userAId));
    assert.equal(eventsRows.length, 2, "progress_events remains 2");
  });

  // TEST 4: Cross-tenant isolation — User B cannot see User A's progress
  await t.test("4. Cross-tenant isolation: User B's GET request sees 0 records from User A", async () => {
    const { req, res } = createMockReqRes({
      method: "GET",
      token: tokenB
    });

    await progressGetHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.deepEqual(result.body.data.items, {}, "User B progress is completely empty!");
    assert.equal(result.body.data.count, 0);
  });

  // Teardown: Clean up test users
  await t.test("Teardown test users and cascade delete records", async () => {
    await db.delete(schema.users).where(eq(schema.users.id, userAId));
    await db.delete(schema.users).where(eq(schema.users.id, userBId));
  });
});

