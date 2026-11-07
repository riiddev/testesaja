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
import profileGetHandler from "../api/_handlers/profile/get.js";
import progressSyncHandler from "../api/_handlers/progress/sync.js";
import { getOfficialWords } from "../api/_lib/officialWordCatalog.js";

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

  const officialA1 = getOfficialWords().find((word) => word.level === "A1");
  const officialB2 = getOfficialWords().find((word) => word.level === "B2");
  assert.ok(officialA1 && officialB2, "Official A1 and B2 corpus entries must exist");

  const eventIds = [
    `evt_a_first_${Date.now()}`,
    ...Array.from({ length: 5 }, (_, index) => `evt_b2_review_${Date.now()}_${index}`)
  ];

  // TEST 2: forged client progress must not create an unlisted word or select its level/mastery.
  await t.test("2. Reject forged word IDs before writing any progress", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      token: tokenA,
      body: {
        updates: [{
          eventId: `evt_forged_${Date.now()}`,
          wordId: "not-an-oxford-headword",
          isCorrect: true,
          level: "B2",
          masteryStage: "mastered"
        }]
      }
    });

    await progressSyncHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 400);
    const rows = await db.select().from(schema.progress)
      .where(eq(schema.progress.userId, userAId));
    assert.equal(rows.length, 0, "Invalid word IDs must not create database progress");
  });

  // TEST 3: only answer correctness is sent; server calculates CEFR, counts, interval, mastery, and rewards.
  const batchUpdates = [
    {
      eventId: eventIds[0],
      wordId: officialA1.id,
      isCorrect: true,
      // Forged browser values must be ignored.
      level: "B2",
      masteryStage: "mastered",
      correctCount: 999,
      wrongCount: 0,
      intervalDays: 30
    },
    ...eventIds.slice(1).map((eventId) => ({
      eventId,
      wordId: officialB2.id,
      isCorrect: true,
      level: "A1",
      masteryStage: "fresh",
      correctCount: 0,
      wrongCount: 999,
      intervalDays: 1
    }))
  ];

  await t.test("3. Server derives progress, mastery, CEFR, XP and coins from official events", async () => {
    const beforeRows = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userAId))
      .limit(1);
    assert.equal(beforeRows[0].xp, 0);
    assert.equal(beforeRows[0].coins, 0);

    const { req, res } = createMockReqRes({
      method: "POST",
      token: tokenA,
      body: { updates: batchUpdates }
    });

    await progressSyncHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.count, 6);
    assert.deepEqual(result.body.data.processedEvents, eventIds);
    assert.equal(result.body.data.xpGranted, 22, "First word gets 5 XP; B2 first review gets 5 XP and four reviews get 3 XP");
    assert.equal(result.body.data.coinsGranted, 8, "New words get 2 coins each; four reviews get 1 coin each");
    assert.equal(result.body.data.totalXp, 22, "Sync response must expose the final server XP balance");
    assert.equal(result.body.data.totalCoins, 8, "Sync response must expose the final server coin balance");

    const progressRows = await db.select().from(schema.progress)
      .where(eq(schema.progress.userId, userAId));
    assert.equal(progressRows.length, 2, "Only two official words must exist in progress");
    const a1Progress = progressRows.find((row) => row.wordId === officialA1.id);
    const b2Progress = progressRows.find((row) => row.wordId === officialB2.id);
    assert.equal(a1Progress.level, "A1", "Server must use the official A1 level");
    assert.equal(a1Progress.correctCount, 1);
    assert.equal(a1Progress.masteryStage, "learning");
    assert.equal(a1Progress.intervalDays, 1);
    assert.equal(b2Progress.level, "B2", "Server must use the official B2 level");
    assert.equal(b2Progress.correctCount, 5);
    assert.equal(b2Progress.masteryStage, "mastered");
    assert.equal(b2Progress.intervalDays, 30);

    const statsRows = await db.select().from(schema.userStats)
      .where(eq(schema.userStats.userId, userAId));
    assert.equal(statsRows[0].totalReviews, 6);
    assert.equal(statsRows[0].wordsStarted, 2);
    assert.equal(statsRows[0].wordsMastered, 1);
    assert.equal(statsRows[0].b2Mastered, 1);

    const eventsRows = await db.select().from(schema.progressEvents)
      .where(eq(schema.progressEvents.userId, userAId));
    assert.equal(eventsRows.length, 6);
    assert.equal(eventsRows.filter((row) => row.activityType === "vocab_learn").length, 2);
    assert.equal(eventsRows.filter((row) => row.activityType === "srs_review").length, 4);

    // Database evidence for Fase 6.1: the account began at XP=0/Coins=0;
    // after the completed study batch, the canonical profile and ledger agree.
    const profileAfterStudy = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins, streak: schema.profiles.streak })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userAId))
      .limit(1);
    assert.equal(profileAfterStudy[0].xp, 22);
    assert.equal(profileAfterStudy[0].coins, 8);

    const transactionRows = await db.select({
      eventId: schema.transactions.eventId,
      source: schema.transactions.source,
      xpAmount: schema.transactions.xpAmount,
      coinsAmount: schema.transactions.coinsAmount,
      balanceAfterCoins: schema.transactions.balanceAfterCoins
    })
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userAId));
    assert.equal(transactionRows.length, 6, "Every accepted event has one unique ledger row");
    assert.equal(transactionRows.reduce((sum, row) => sum + row.xpAmount, 0), 22);
    assert.equal(transactionRows.reduce((sum, row) => sum + row.coinsAmount, 0), 8);
    assert.equal(new Set(transactionRows.map((row) => row.eventId)).size, 6);

    // The public profile read must expose the same canonical stats and balances
    // that were just committed to the progress and economy ledgers.
    const profileRequest = createMockReqRes({ method: "GET", token: tokenA });
    await profileGetHandler(profileRequest.req, profileRequest.res);
    const profileResult = profileRequest.res._getResult();
    assert.equal(profileResult.statusCode, 200);
    assert.equal(profileResult.body.success, true);
    assert.equal(profileResult.body.data.profile.xp, 22);
    assert.equal(profileResult.body.data.profile.coins, 8);
    assert.equal(profileResult.body.data.userStats.totalReviews, 6);
    assert.equal(profileResult.body.data.userStats.wordsStarted, 2);
    assert.equal(profileResult.body.data.userStats.wordsMastered, 1);
    assert.equal(profileResult.body.data.userStats.b2Mastered, 1);
  });

  // TEST 4: Idempotency — Re-sending the same batch must ACK without duplicates.
  await t.test("4. Idempotency: re-submitting the exact same events returns ACK without double counting", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      token: tokenA,
      body: { updates: batchUpdates }
    });

    await progressSyncHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.deepEqual(result.body.data.processedEvents, eventIds);
    assert.equal(result.body.data.xpGranted, 0);
    assert.equal(result.body.data.coinsGranted, 0);

    const statsRows = await db.select().from(schema.userStats)
      .where(eq(schema.userStats.userId, userAId));
    assert.equal(statsRows[0].totalReviews, 6);
    assert.equal(statsRows[0].wordsStarted, 2);

    const eventsRows = await db.select().from(schema.progressEvents)
      .where(eq(schema.progressEvents.userId, userAId));
    assert.equal(eventsRows.length, 6);

    const transactionsAfterReplay = await db.select().from(schema.transactions)
      .where(eq(schema.transactions.userId, userAId));
    assert.equal(transactionsAfterReplay.length, 6, "Replayed events must not add ledger rows");

    const balancesAfterReplay = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userAId))
      .limit(1);
    assert.equal(balancesAfterReplay[0].xp, 22);
    assert.equal(balancesAfterReplay[0].coins, 8);

    const beforeProfile = await db
      .select({ streak: schema.profiles.streak, lastActiveDate: schema.profiles.lastActiveDate })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userAId))
      .limit(1);

    // Multiple devices replaying the same acknowledged batch concurrently must
    // all receive ACKs without minting rewards or advancing the streak again.
    const retries = Array.from({ length: 3 }, () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        token: tokenA,
        body: { updates: batchUpdates }
      });
      return { req, res };
    });

    await Promise.all(retries.map(({ req, res }) => progressSyncHandler(req, res)));

    for (const { res } of retries) {
      const retryResult = res._getResult();
      assert.equal(retryResult.statusCode, 200);
      assert.equal(retryResult.body.data.count, 6);
      assert.equal(retryResult.body.data.newlyProcessedCount, 0);
      assert.equal(retryResult.body.data.xpGranted, 0);
      assert.equal(retryResult.body.data.coinsGranted, 0);
    }

    const afterProfile = await db
      .select({ streak: schema.profiles.streak, lastActiveDate: schema.profiles.lastActiveDate })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userAId))
      .limit(1);
    assert.equal(afterProfile[0].streak, beforeProfile[0].streak);
    assert.equal(afterProfile[0].lastActiveDate, beforeProfile[0].lastActiveDate);
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

