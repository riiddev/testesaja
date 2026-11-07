/**
 * tests/economy-fase4.test.mjs
 * 
 * Comprehensive automated test suite for Fase 4:
 * 1. updateProfile ignores forged XP/coins/streak
 * 2. buyItem verifies balance, level, and catalog; deducts coins atomically
 * 3. equipItem properly equips item
 * 4. reward/grant (Butir A Habit Reading deterministic 1x reward)
 * 5. quests/claim validates completion and prevents double-claims
 * 6. Streak calculation (consecutive, same-day, gap with/without freeze)
 */

import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, createSessionToken } from "../api/_lib/auth.js";
import { evaluateAndRecordStreak } from "../api/_lib/streak.js";
import { recordLedgerTransaction } from "../api/_lib/ledger.js";
import { getWibDateStr, getWibYesterdayStr } from "../api/_lib/wibDate.js";
import habitReadingLibrary from "../src/data/habit-reading-library.json" with { type: "json" };

import profileGetHandler from "../api/_handlers/profile/get.js";
import profileUpdateHandler from "../api/_handlers/profile/update.js";
import catalogHandler from "../api/_handlers/economy/catalog.js";
import inventoryHandler from "../api/_handlers/economy/inventory.js";
import buyHandler from "../api/_handlers/economy/buy.js";
import equipHandler from "../api/_handlers/economy/equip.js";
import grantHandler from "../api/_handlers/reward/grant.js";
import questsGetHandler from "../api/_handlers/quests/get.js";
import questsUpdateHandler from "../api/_handlers/quests/update.js";
import questsClaimHandler from "../api/_handlers/quests/claim.js";

// Helper to simulate request / response
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

test("FASE 4 TEST SUITE — Server-Authoritative Economy, Quests, Streaks & Rewards", async (t) => {
  const testUserId = `test_fase4_${Date.now()}`;
  const testEmail = `${testUserId}@example.com`;
  let sessionToken = "";

  // Setup: Create test user, profile, stats, and session in Neon DB
  await t.test("Setup test user and clean slate profile (0 XP, 0 Coins, 0 Streak)", async () => {
    const { hash, salt } = await hashPassword("TestPass123!");
    await db.insert(schema.users).values({
      id: testUserId,
      email: testEmail,
      displayName: "Fase4 Tester",
      passwordHash: hash,
      salt,
      role: "student"
    });

    await db.insert(schema.profiles).values({
      userId: testUserId,
      displayName: "Fase4 Tester",
      activeTitle: "",
      xp: 0,
      coins: 0,
      streak: 0,
      avatarKey: "avatar_1"
    });

    await db.insert(schema.userStats).values({
      userId: testUserId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0,
      grammarCompleted: 0,
      readingCompleted: 0,
      storiesCompleted: 0,
      matchingCompleted: 0
    });

    const { rawToken, tokenHash } = createSessionToken();
    await db.insert(schema.sessions).values({
      id: `sess_${Date.now()}_${rawToken.slice(0, 8)}`,
      userId: testUserId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    sessionToken = rawToken;
    assert.ok(sessionToken, "Session token created");
  });

  // TEST 1: updateProfile ignores forged XP, coins, streak
  await t.test("1. updateProfile modifies allowed fields, strictly discards client-sent XP/coins/streak", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: {
        displayName: "Tester Renamed",
        avatarKey: "avatar_2",
        // Client attempting to forge economy values:
        xp: 99999,
        coins: 88888,
        streak: 777
      }
    });

    await profileUpdateHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 200, "Update profile returned 200");
    assert.equal(result.body.success, true);

    // Verify in database that XP, coins, and streak remain 0
    const profileInDb = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, testUserId))
      .limit(1);

    assert.equal(profileInDb[0].displayName, "Tester Renamed");
    assert.equal(profileInDb[0].avatarKey, "avatar_2");
    assert.equal(profileInDb[0].xp, 0, "XP must strictly remain 0!");
    assert.equal(profileInDb[0].coins, 0, "Coins must strictly remain 0!");
    assert.equal(profileInDb[0].streak, 0, "Streak must strictly remain 0!");
  });

  // TEST 2: buyItem rejects if level requirement not met
  await t.test("2a. buyItem rejects purchase when level requirement is not met", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { itemId: "border_emas" } // Requires Level 6, user is Level 1
    });

    await buyHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 400, "Should return 400 validation error");
    assert.equal(result.body.success, false);
    assert.match(result.body.error, /Level cendekiawanmu belum mencukupi/i);
  });

  await t.test("2c. Equip API mounts and unmounts an owned collection item", async () => {
    const borderRows = await db
      .select({ id: schema.catalog.id })
      .from(schema.catalog)
      .where(eq(schema.catalog.type, "border"))
      .limit(1);
    assert.ok(borderRows.length > 0, "A border item must exist in the seeded catalog");
    const borderId = borderRows[0].id;

    await db.insert(schema.inventory).values({
      userId: testUserId,
      itemId: borderId,
      equipped: false
    });

    const { req: equipReq, res: equipRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { itemId: borderId, type: "border" }
    });
    await equipHandler(equipReq, equipRes);
    assert.equal(equipRes._getResult().statusCode, 200);
    assert.equal(equipRes._getResult().body.success, true);

    let owned = await db.select({ equipped: schema.inventory.equipped })
      .from(schema.inventory)
      .where(and(
        eq(schema.inventory.userId, testUserId),
        eq(schema.inventory.itemId, borderId)
      ));
    assert.equal(owned[0].equipped, true);

    const { req: removeReq, res: removeRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { itemId: "none", type: "border" }
    });
    await equipHandler(removeReq, removeRes);
    assert.equal(removeRes._getResult().statusCode, 200);
    assert.equal(removeRes._getResult().body.success, true);
    assert.equal(removeRes._getResult().body.data.equipped, false);

    owned = await db.select({ equipped: schema.inventory.equipped })
      .from(schema.inventory)
      .where(and(
        eq(schema.inventory.userId, testUserId),
        eq(schema.inventory.itemId, borderId)
      ));
    assert.equal(owned[0].equipped, false);
  });

  // TEST 3: Butir A Habit Reading deterministic 1x reward
  await t.test("3. Butir A: Habit Reading grants reward ONCE ever; re-reading gives 0 reward without duplicate tx", async () => {
    const articleRef = habitReadingLibrary.passages?.[0]?.id;
    assert.ok(articleRef, "Official HABIT article must be available for reward tests");

    // First completion
    const { req: req1, res: res1 } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: {
        source: "reading_complete",
        refId: articleRef
      }
    });

    await grantHandler(req1, res1);
    const result1 = res1._getResult();
    assert.equal(result1.statusCode, 200);
    assert.equal(result1.body.success, true);
    assert.equal(result1.body.data.alreadyRewarded, false);
    assert.equal(result1.body.data.earnedXp, 40);
    assert.equal(result1.body.data.earnedCoins, 20);
    assert.equal(result1.body.data.totalXp, 40);
    assert.equal(result1.body.data.totalCoins, 20);

    // Verify reading_completed statistic incremented
    const stats1 = await db
      .select({ readingCompleted: schema.userStats.readingCompleted })
      .from(schema.userStats)
      .where(eq(schema.userStats.userId, testUserId));
    assert.equal(stats1[0].readingCompleted, 1);

    // Second completion for the SAME article (Reading again)
    const { req: req2, res: res2 } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: {
        source: "reading_complete",
        refId: articleRef
      }
    });

    await grantHandler(req2, res2);
    const result2 = res2._getResult();
    assert.equal(result2.statusCode, 200);
    assert.equal(result2.body.success, true);
    assert.equal(result2.body.data.alreadyRewarded, true, "Must flag alreadyRewarded: true");
    assert.equal(result2.body.data.earnedXp, 0, "Must grant 0 XP on re-read");
    assert.equal(result2.body.data.earnedCoins, 0, "Must grant 0 coins on re-read");
    assert.equal(result2.body.data.totalCoins, 20, "Total coins must not increase");

    // Verify transactions ledger has ONLY 1 transaction row for this article
    const txRows = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, testUserId),
          eq(schema.transactions.eventId, `reading:${articleRef}:first_complete`)
        )
      );
    assert.equal(txRows.length, 1, "Must have exactly 1 ledger record, no duplicates!");
  });

  // TEST 3b: buyItem rejects purchase when level requirement is met, but coins are insufficient
  await t.test("3b. buyItem rejects purchase when level is met but coins are insufficient", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { itemId: "streak_freeze" } // Requires Level 2 (met: 40 XP = Level 2), costs 80 coins (user only has 20 coins)
    });

    await buyHandler(req, res);
    const result = res._getResult();
    assert.equal(result.statusCode, 400, "Should return 400 validation error");
    assert.equal(result.body.success, false);
    assert.match(result.body.error, /Sinau Coin tidak mencukupi/i);
  });

  // TEST 4: buyItem succeeds when coins are sufficient
  await t.test("4. buyItem succeeds when coins are sufficient, records ledger deduction, and equips", async () => {
    // Top up coins directly via server ledger so user can afford streak_freeze (80 coins)
    await recordLedgerTransaction({
      userId: testUserId,
      eventId: `admin_topup:${Date.now()}`,
      source: "quest_vocab_10",
      xpEarned: 100,
      coinsEarned: 100 // Total coins now: 20 + 100 = 120
    });

    const { req: buyReq, res: buyRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { itemId: "streak_freeze" } // Price is 80 coins
    });

    await buyHandler(buyReq, buyRes);
    const buyResult = buyRes._getResult();
    assert.equal(buyResult.statusCode, 200);
    assert.equal(buyResult.body.success, true);
    assert.equal(buyResult.body.data.remainingCoins, 40, "120 - 80 = 40 coins remaining");

    // Verify item is present in user's inventory
    const { req: invReq, res: invRes } = createMockReqRes({
      method: "GET",
      token: sessionToken
    });

    await inventoryHandler(invReq, invRes);
    const invResult = invRes._getResult();
    assert.equal(invResult.statusCode, 200);
    const hasFreeze = invResult.body.data.inventory.some((i) => i.itemId === "streak_freeze");
    assert.ok(hasFreeze, "Inventory must contain purchased streak_freeze");
  });

  // TEST 5: Daily quests get, update progress, claim validation & double-claim prevention
  await t.test("5. Quests: get, update progress, and validate server claim prevents double claims", async () => {
    // 5a. Get quests for today (auto-generates templates)
    const { req: qGetReq, res: qGetRes } = createMockReqRes({
      method: "GET",
      token: sessionToken
    });

    await questsGetHandler(qGetReq, qGetRes);
    const qGetResult = qGetRes._getResult();
    assert.equal(qGetResult.statusCode, 200);
    assert.ok(qGetResult.body.data.quests.length >= 3, "At least 3 quests generated");
    const targetQuest = qGetResult.body.data.quests[0];

    // 5b. Attempt to claim while progress is 0 -> Must be rejected
    const { req: earlyClaimReq, res: earlyClaimRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { questId: targetQuest.questId }
    });

    await questsClaimHandler(earlyClaimReq, earlyClaimRes);
    const earlyClaimResult = earlyClaimRes._getResult();
    assert.equal(earlyClaimResult.statusCode, 400);
    assert.match(earlyClaimResult.body.error, /belum selesai/i);

    // 5c. Forged progress from the browser must be ignored by the server.
    const { req: forgedUpdateReq, res: forgedUpdateRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: {
        questId: targetQuest.questId,
        progress: targetQuest.target,
        target: targetQuest.target
      }
    });

    await questsUpdateHandler(forgedUpdateReq, forgedUpdateRes);
    const forgedUpdateResult = forgedUpdateRes._getResult();
    assert.equal(forgedUpdateResult.statusCode, 200);
    const forgedQuest = forgedUpdateResult.body.data.quests.find(
      (quest) => quest.questId === targetQuest.questId
    );
    assert.equal(forgedQuest.progress, 0, "Client-supplied progress must not be trusted");
    assert.equal(forgedQuest.isCompleted, false, "A forged completion must not unlock rewards");

    // 5d. Seed server-written learning events matching this official mission.
    const activityTypeByQuest = {
      quest_vocab_new_5: "vocab_learn",
      quest_srs_review_8: "srs_review",
      quest_grammar_quiz_1: "grammar",
      quest_habit_reading_1: "reading_quiz",
      quest_study_focus_3: "matching",
      quest_adventure_explore_1: "story"
    };
    const questActivityType = activityTypeByQuest[targetQuest.questId];
    assert.ok(questActivityType, "Official quest must have a server progress source");

    if (questActivityType === "vocab_learn" || questActivityType === "srs_review") {
      await db.insert(schema.progressEvents).values(
        Array.from({ length: targetQuest.target }, (_, index) => ({
          userId: testUserId,
          eventId: "quest_event_" + Date.now() + "_" + index,
          activityType: questActivityType
        }))
      );
    } else {
      await db.insert(schema.activityLog).values(
        Array.from({ length: targetQuest.target }, (_, index) => ({
          id: "quest_activity_" + Date.now() + "_" + index,
          userId: testUserId,
          activityType: questActivityType,
          title: "Server-verified quest fixture",
          score: 1,
          totalQuestions: 1,
          accuracyPercent: 100,
          durationSeconds: 0,
          xpEarned: 0,
          coinsEarned: 0
        }))
      );
    }

    // Refresh the snapshot: it must now report completion from server evidence.
    const { req: verifiedUpdateReq, res: verifiedUpdateRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: {}
    });
    await questsUpdateHandler(verifiedUpdateReq, verifiedUpdateRes);
    const verifiedUpdateResult = verifiedUpdateRes._getResult();
    assert.equal(verifiedUpdateResult.statusCode, 200);
    const verifiedQuest = verifiedUpdateResult.body.data.quests.find(
      (quest) => quest.questId === targetQuest.questId
    );
    assert.equal(verifiedQuest.progress, targetQuest.target);
    assert.equal(verifiedQuest.isCompleted, true);

    // 5d. Claim quest reward -> Must succeed
    const { req: validClaimReq, res: validClaimRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { questId: targetQuest.questId }
    });

    await questsClaimHandler(validClaimReq, validClaimRes);
    const validClaimResult = validClaimRes._getResult();
    assert.equal(validClaimResult.statusCode, 200);
    assert.equal(validClaimResult.body.success, true);
    assert.ok(validClaimResult.body.data.earnedXp > 0);
    assert.ok(validClaimResult.body.data.earnedCoins > 0);

    // 5e. Attempt to double-claim the same quest -> Must be rejected!
    const { req: dupClaimReq, res: dupClaimRes } = createMockReqRes({
      method: "POST",
      token: sessionToken,
      body: { questId: targetQuest.questId }
    });

    await questsClaimHandler(dupClaimReq, dupClaimRes);
    const dupClaimResult = dupClaimRes._getResult();
    assert.equal(dupClaimResult.statusCode, 400);
    assert.match(dupClaimResult.body.error, /sudah diklaim/i);
  });

  // TEST 6: Streak calculation & Pelindung Streak (streak_freeze) consumption
  await t.test("6. Streak: consecutive increment, same-day no-op, gap consumption of streak_freeze", async () => {
    const todayWib = getWibDateStr(new Date());
    const yesterdayWib = getWibYesterdayStr(new Date());

    // Set lastActiveDate to yesterday and streak to 5
    await db
      .update(schema.profiles)
      .set({
        streak: 5,
        lastActiveDate: yesterdayWib
      })
      .where(eq(schema.profiles.userId, testUserId));

    // Evaluating streak today should increment to 6
    const [res1, res2] = await Promise.all([
      evaluateAndRecordStreak(testUserId),
      evaluateAndRecordStreak(testUserId)
    ]);
    assert.equal(res1.streak, 6, "Concurrent same-day activity must increment streak only once");
    assert.equal(res2.streak, 6, "Concurrent same-day activity must see the locked profile state");

    // Simulate 2-day gap (lastActiveDate = 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const gapDate = getWibDateStr(threeDaysAgo);

    await db
      .update(schema.profiles)
      .set({
        streak: 6,
        lastActiveDate: gapDate
      })
      .where(eq(schema.profiles.userId, testUserId));

    // User already bought streak_freeze in Test 4, so it should consume freeze and preserve streak (6 + 1 = 7)
    const [res3, res4] = await Promise.all([
      evaluateAndRecordStreak(testUserId),
      evaluateAndRecordStreak(testUserId)
    ]);
    assert.equal(
      [res3, res4].filter((result) => result.freezeUsed).length,
      1,
      "Two concurrent streak checks must consume exactly one freeze"
    );
    assert.equal(res3.streak, 7, "Streak preserved and incremented to 7");
    assert.equal(res4.streak, 7, "Concurrent streak check must observe the final streak");

    // Verify streak_freeze was deleted from inventory
    const freezeCount = await db
      .select()
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.userId, testUserId),
          eq(schema.inventory.itemId, "streak_freeze")
        )
      );
    assert.equal(freezeCount.length, 0, "streak_freeze must have been consumed from inventory");
  });

  await t.test("7. Ledger concurrency: duplicate and distinct events never lose or double-mint balance", async () => {
    const beforeRows = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, testUserId))
      .limit(1);
    const before = beforeRows[0];
    const duplicateEventId = "concurrent_duplicate_" + Date.now();

    const duplicateResults = await Promise.all(
      Array.from({ length: 8 }, () => recordLedgerTransaction({
        userId: testUserId,
        eventId: duplicateEventId,
        source: "concurrency_test",
        xpEarned: 7,
        coinsEarned: 3
      }))
    );

    assert.equal(
      duplicateResults.filter((result) => !result.alreadyProcessed).length,
      1,
      "Exactly one concurrent duplicate request may apply the event"
    );

    const duplicateRows = await db
      .select()
      .from(schema.transactions)
      .where(and(
        eq(schema.transactions.userId, testUserId),
        eq(schema.transactions.eventId, duplicateEventId)
      ));
    assert.equal(duplicateRows.length, 1, "Unique ledger event must have one row");

    const distinctResults = await Promise.all(
      Array.from({ length: 6 }, (_, index) => recordLedgerTransaction({
        userId: testUserId,
        eventId: "concurrent_distinct_" + Date.now() + "_" + index,
        source: "concurrency_test",
        xpEarned: 1,
        coinsEarned: 1
      }))
    );
    assert.equal(distinctResults.filter((result) => !result.alreadyProcessed).length, 6);

    const afterRows = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, testUserId))
      .limit(1);
    assert.equal(Number(afterRows[0].xp), Number(before.xp) + 13);
    assert.equal(Number(afterRows[0].coins), Number(before.coins) + 9);
  });

  // Teardown: Clean up test user
  await t.test("Teardown test user and related records", async () => {
    await db.delete(schema.users).where(eq(schema.users.id, testUserId));
  });
});
