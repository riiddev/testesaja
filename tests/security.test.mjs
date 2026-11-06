/**
 * tests/security.test.mjs
 * 
 * Comprehensive Security & Integrity Test Suite for Fase 8:
 * 1. Invalid login fails with 401 (no fake session)
 * 2. Zero-mock production verification: failed requests never fall back to mock data
 * 3. Client tampering prevention: updateProfile strictly discards client-forged XP, coins, streak
 * 4. Quest integrity: reject claim on uncompleted quests
 * 5. Double claim prevention: idempotent claim rejection on previously claimed quests
 * 6. Economy balance check: reject store purchase when coins are insufficient
 * 7. Cross-tenant isolation: User A cannot read or modify User B's records
 * 8. Expired session token handling: rejected with 401
 * 9. Ledger idempotency: duplicate event_id never mints double XP/Coins
 */

import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, createSessionToken } from "../api/_lib/auth.js";
import { recordLedgerTransaction } from "../api/_lib/ledger.js";

// Handler imports
import loginHandler from "../api/_handlers/auth/login.js";
import profileUpdateHandler from "../api/_handlers/profile/update.js";
import profileGetHandler from "../api/_handlers/profile/get.js";
import questsGetHandler from "../api/_handlers/quests/get.js";
import questsUpdateHandler from "../api/_handlers/quests/update.js";
import questsClaimHandler from "../api/_handlers/quests/claim.js";
import buyItemHandler from "../api/_handlers/economy/buy.js";
import progressGetHandler from "../api/_handlers/progress/get.js";

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
    }
  };

  return { req, res, getStatus: () => statusCode, getHeaders: () => headers, getData: () => responseData };
}

test("FASE 8 SECURITY SUITE — Zero-Trust, Anti-Tamper & Isolation Checks", async (t) => {
  const userAId = `sec_user_a_${Date.now()}`;
  const userBId = `sec_user_b_${Date.now()}`;
  const emailA = `${userAId}@security.test`;
  const emailB = `${userBId}@security.test`;
  const password = "SecPassword123!";

  let tokenA = null;
  let tokenB = null;

  await t.test("Setup security test users A and B", async () => {
    const { hash: hashA, salt: saltA } = await hashPassword(password);
    const { hash: hashB, salt: saltB } = await hashPassword(password);

    await db.insert(schema.users).values([
      { id: userAId, email: emailA, displayName: "Scholar Alice", passwordHash: hashA, salt: saltA, role: "student" },
      { id: userBId, email: emailB, displayName: "Scholar Bob", passwordHash: hashB, salt: saltB, role: "student" }
    ]);

    await db.insert(schema.profiles).values([
      { userId: userAId, displayName: "Scholar Alice", xp: 0, coins: 0, streak: 0, avatarKey: "avatar_1" },
      { userId: userBId, displayName: "Scholar Bob", xp: 0, coins: 0, streak: 0, avatarKey: "avatar_1" }
    ]);

    const sessA = createSessionToken();
    tokenA = sessA.rawToken;
    await db.insert(schema.sessions).values({
      id: `sess_a_${Date.now()}`,
      userId: userAId,
      tokenHash: sessA.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    const sessB = createSessionToken();
    tokenB = sessB.rawToken;
    await db.insert(schema.sessions).values({
      id: `sess_b_${Date.now()}`,
      userId: userBId,
      tokenHash: sessB.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    assert.ok(tokenA && tokenB);
  });

  await t.test("1. Invalid login fails with 401 and zero session token", async () => {
    const mockLogin = createMockReqRes({
      method: "POST",
      url: "/api/auth/login",
      body: { email: emailA, password: "WrongPassword999!" }
    });
    await loginHandler(mockLogin.req, mockLogin.res);
    assert.equal(mockLogin.getStatus(), 401);
    const data = mockLogin.getData();
    assert.equal(data.success, false);
    assert.equal(data.data, undefined);
  });

  await t.test("2. Zero mock in production: server never serves fake mock user on 401", async () => {
    const mockUnauth = createMockReqRes({
      method: "GET",
      url: "/api/profile/get",
      token: "invalid_bearer_token_xyz"
    });
    await profileGetHandler(mockUnauth.req, mockUnauth.res);
    assert.equal(mockUnauth.getStatus(), 401);
    assert.equal(mockUnauth.getData().success, false);
  });

  await t.test("3. Anti-Tampering: client-forged XP, coins, streak are discarded", async () => {
    const mockForged = createMockReqRes({
      method: "POST",
      url: "/api/profile/update",
      token: tokenA,
      body: {
        displayName: "Alice Master",
        xp: 999999,
        coins: 888888,
        streak: 777
      }
    });
    await profileUpdateHandler(mockForged.req, mockForged.res);
    assert.equal(mockForged.getStatus(), 200);

    // Verify in database that XP, coins, streak remained at 0
    const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userAId));
    assert.equal(profile.displayName, "Alice Master");
    assert.equal(profile.xp, 0, "Server XP must not be altered by client injection");
    assert.equal(profile.coins, 0, "Server Coins must not be altered by client injection");
    assert.equal(profile.streak, 0, "Server Streak must not be altered by client injection");
  });

  await t.test("4. Quest Integrity: reject claim on uncompleted quests", async () => {
    // Generate daily quests for User A
    const mockGetQ = createMockReqRes({ method: "GET", token: tokenA, url: "/api/quests/get" });
    await questsGetHandler(mockGetQ.req, mockGetQ.res);
    assert.equal(mockGetQ.getStatus(), 200);
    const targetQuest = mockGetQ.getData().data.quests[0];

    const mockClaim = createMockReqRes({
      method: "POST",
      url: "/api/quests/claim",
      token: tokenA,
      body: { questId: targetQuest.questId }
    });
    await questsClaimHandler(mockClaim.req, mockClaim.res);
    assert.equal(mockClaim.getStatus(), 400);
    assert.match(mockClaim.getData().error, /misi belum selesai/i);
  });

  await t.test("5. Double claim prevention: second claim attempt is rejected", async () => {
    // Get target quest
    const mockGetQ = createMockReqRes({ method: "GET", token: tokenA, url: "/api/quests/get" });
    await questsGetHandler(mockGetQ.req, mockGetQ.res);
    const targetQuest = mockGetQ.getData().data.quests[0];

    // Complete the quest
    const mockUpdateQ = createMockReqRes({
      method: "POST",
      token: tokenA,
      url: "/api/quests/update",
      body: { questId: targetQuest.questId, progress: targetQuest.target }
    });
    await questsUpdateHandler(mockUpdateQ.req, mockUpdateQ.res);

    // First claim: Success
    const mockClaim1 = createMockReqRes({
      method: "POST",
      url: "/api/quests/claim",
      token: tokenA,
      body: { questId: targetQuest.questId }
    });
    await questsClaimHandler(mockClaim1.req, mockClaim1.res);
    assert.equal(mockClaim1.getStatus(), 200);
    assert.equal(mockClaim1.getData().success, true);

    // Second claim: Rejected with 400
    const mockClaim2 = createMockReqRes({
      method: "POST",
      url: "/api/quests/claim",
      token: tokenA,
      body: { questId: targetQuest.questId }
    });
    await questsClaimHandler(mockClaim2.req, mockClaim2.res);
    assert.equal(mockClaim2.getStatus(), 400);
    assert.match(mockClaim2.getData().error, /sudah diklaim/i);
  });

  await t.test("6. Insufficient balance check: reject store purchase when coins = 0", async () => {
    // Give User A 50 XP (Level 2) so level requirement is met, but 0 coins
    await db.update(schema.profiles).set({ xp: 50, coins: 0 }).where(eq(schema.profiles.userId, userAId));

    const mockBuy = createMockReqRes({
      method: "POST",
      url: "/api/economy/buy",
      token: tokenA,
      body: { itemId: "streak_freeze" } // requires Level 2, costs 80 coins
    });
    await buyItemHandler(mockBuy.req, mockBuy.res);
    assert.equal(mockBuy.getStatus(), 400);
    assert.match(mockBuy.getData().error, /Sinau Coin tidak mencukupi/i);
  });

  await t.test("7. Cross-tenant isolation: User B cannot access User A's data", async () => {
    const mockAProgress = createMockReqRes({
      method: "GET",
      url: "/api/progress/get",
      token: tokenB // User B token
    });
    await progressGetHandler(mockAProgress.req, mockAProgress.res);
    assert.equal(mockAProgress.getStatus(), 200);
    const progressData = mockAProgress.getData().data;
    assert.deepEqual(progressData, { count: 0, items: {} }, "User B must receive only their own (empty) progress");
  });

  await t.test("8. Expired token handling: rejected with 401", async () => {
    const expiredSess = createSessionToken();
    await db.insert(schema.sessions).values({
      id: `sess_exp_${Date.now()}`,
      userId: userAId,
      tokenHash: expiredSess.tokenHash,
      expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
    });

    const mockExpired = createMockReqRes({
      method: "GET",
      url: "/api/profile/get",
      token: expiredSess.rawToken
    });
    await profileGetHandler(mockExpired.req, mockExpired.res);
    assert.equal(mockExpired.getStatus(), 401);
    assert.match(mockExpired.getData().error, /telah kedaluwarsa|sesi tidak valid/i);
  });

  await t.test("9. Ledger Idempotency: duplicate event_id prevents double minting", async () => {
    const eventId = `tx_sec_test_${Date.now()}`;
    
    // First transaction
    const tx1 = await recordLedgerTransaction({
      userId: userAId,
      eventId,
      source: "quest_complete",
      xpEarned: 50,
      coinsEarned: 25
    });
    assert.equal(tx1.alreadyProcessed, false);
    assert.equal(tx1.xpEarned, 50);
    assert.equal(tx1.coinsEarned, 25);

    // Duplicate transaction with exact same eventId
    const tx2 = await recordLedgerTransaction({
      userId: userAId,
      eventId,
      source: "quest_complete",
      xpEarned: 50,
      coinsEarned: 25
    });
    assert.equal(tx2.alreadyProcessed, true, "Duplicate transaction must return alreadyProcessed: true");
    assert.equal(tx2.xpEarned, 0, "No duplicate XP can be granted");
    assert.equal(tx2.coinsEarned, 0, "No duplicate Coins can be granted");
  });

  await t.test("Teardown security test users and cascade delete", async () => {
    await db.delete(schema.transactions).where(eq(schema.transactions.userId, userAId));
    await db.delete(schema.questClaims).where(eq(schema.questClaims.userId, userAId));
    await db.delete(schema.dailyQuests).where(eq(schema.dailyQuests.userId, userAId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, userAId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, userBId));
    await db.delete(schema.profiles).where(eq(schema.profiles.userId, userAId));
    await db.delete(schema.profiles).where(eq(schema.profiles.userId, userBId));
    await db.delete(schema.users).where(eq(schema.users.id, userAId));
    await db.delete(schema.users).where(eq(schema.users.id, userBId));
  });
});
