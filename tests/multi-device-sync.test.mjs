/**
 * tests/multi-device-sync.test.mjs
 * 
 * Verifies multi-device synchronization across 2 concurrent sessions/devices:
 * 1. Device 1 and Device 2 authenticate as the same user with separate session tokens.
 * 2. Device 1 records progress for words and syncs to server outbox.
 * 3. Device 2 polls/gets progress and receives the updated SRS states immediately.
 * 4. Device 2 reviews a word further and syncs.
 * 5. Device 1 fetches latest progress and verifies stage advancement.
 */

import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, createSessionToken } from "../api/_lib/auth.js";
import { getOfficialWord } from "../api/_lib/officialWordCatalog.js";

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
    }
  };

  return { req, res, getStatus: () => statusCode, getHeaders: () => headers, getData: () => responseData };
}

test("FASE 8 MULTI-DEVICE SYNC — Concurrent Device Consistency", async (t) => {
  const userId = `sync_user_${Date.now()}`;
  const email = `${userId}@multisync.test`;
  let device1Token = null;
  let device2Token = null;

  await t.test("Setup user with 2 independent device sessions", async () => {
    const { hash, salt } = await hashPassword("SyncPass123!");
    await db.insert(schema.users).values({
      id: userId,
      email,
      displayName: "MultiDevice Scholar",
      passwordHash: hash,
      salt,
      role: "student"
    });

    await db.insert(schema.profiles).values({
      userId,
      displayName: "MultiDevice Scholar",
      xp: 0,
      coins: 0,
      streak: 0,
      avatarKey: "avatar_1"
    });

    await db.insert(schema.userStats).values({
      userId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0,
      grammarCompleted: 0,
      readingCompleted: 0,
      storiesCompleted: 0,
      matchingCompleted: 0
    });

    // Session for Device 1 (e.g. Laptop)
    const sess1 = createSessionToken();
    device1Token = sess1.rawToken;
    await db.insert(schema.sessions).values({
      id: `sess_dev1_${Date.now()}`,
      userId,
      tokenHash: sess1.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    // Session for Device 2 (e.g. Phone)
    const sess2 = createSessionToken();
    device2Token = sess2.rawToken;
    await db.insert(schema.sessions).values({
      id: `sess_dev2_${Date.now()}`,
      userId,
      tokenHash: sess2.tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    assert.ok(device1Token && device2Token, "Both device sessions must be active");
  });

  await t.test("1. Initial state: Both devices see 0 words learned", async () => {
    const mockDev1 = createMockReqRes({ method: "GET", token: device1Token, url: "/api/progress/get" });
    await progressGetHandler(mockDev1.req, mockDev1.res);
    assert.equal(mockDev1.getStatus(), 200);
    assert.deepEqual(mockDev1.getData().data.items, {});

    const mockDev2 = createMockReqRes({ method: "GET", token: device2Token, url: "/api/progress/get" });
    await progressGetHandler(mockDev2.req, mockDev2.res);
    assert.equal(mockDev2.getStatus(), 200);
    assert.deepEqual(mockDev2.getData().data.items, {});
  });

  const officialAbandon = getOfficialWord("abandon");
  const officialAbility = getOfficialWord("ability");
  assert.ok(officialAbandon && officialAbility, "Official vocabulary records must be present");

  await t.test("2. Device 1 studies 2 words and syncs to server", async () => {
    const updates = [
      {
        eventId: `ev_dev1_w1_${Date.now()}`,
        wordId: officialAbandon.id,
        level: "B2",
        isCorrect: true,
        masteryStage: "mastered",
        correctCount: 999,
        wrongCount: 0,
        intervalDays: 30,
        nextReviewAt: new Date(Date.now() + 30 * 86400000).toISOString()
      },
      {
        eventId: `ev_dev1_w2_${Date.now()}`,
        wordId: officialAbility.id,
        level: "B2",
        isCorrect: true,
        masteryStage: "learning",
        correctCount: 1,
        wrongCount: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString()
      }
    ];

    const mockSync = createMockReqRes({
      method: "POST",
      token: device1Token,
      url: "/api/progress/sync",
      body: { updates }
    });
    await progressSyncHandler(mockSync.req, mockSync.res);
    assert.equal(mockSync.getStatus(), 200, `Device 1 sync response: ${JSON.stringify(mockSync.getData())}`);
    assert.equal(mockSync.getData().data.count, 2);
  });

  await t.test("3. Device 2 fetches progress and sees Device 1's updates immediately", async () => {
    const mockDev2 = createMockReqRes({ method: "GET", token: device2Token, url: "/api/progress/get" });
    await progressGetHandler(mockDev2.req, mockDev2.res);
    assert.equal(mockDev2.getStatus(), 200);
    const items = mockDev2.getData().data.items;
    assert.equal(Object.keys(items).length, 2);
    assert.equal(items[officialAbandon.id].correctCount, 1);
    assert.equal(items[officialAbility.id].correctCount, 1);
  });

  await t.test("4. Device 2 advances 'abandon' to stage 2 and syncs", async () => {
    const updates = [
      {
        eventId: `ev_dev2_w1_adv_${Date.now()}`,
        wordId: officialAbandon.id,
        level: "A1",
        isCorrect: true,
        masteryStage: "fresh",
        correctCount: 0,
        wrongCount: 999,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString()
      }
    ];

    const mockSyncDev2 = createMockReqRes({
      method: "POST",
      token: device2Token,
      url: "/api/progress/sync",
      body: { updates }
    });
    await progressSyncHandler(mockSyncDev2.req, mockSyncDev2.res);
    assert.equal(mockSyncDev2.getStatus(), 200, `Device 2 sync response: ${JSON.stringify(mockSyncDev2.getData())}`);
    assert.equal(mockSyncDev2.getData().data.count, 1);
  });

  await t.test("5. Device 1 fetches progress and sees advanced review interval (3 days)", async () => {
    const mockDev1 = createMockReqRes({ method: "GET", token: device1Token, url: "/api/progress/get" });
    await progressGetHandler(mockDev1.req, mockDev1.res);
    assert.equal(mockDev1.getStatus(), 200);
    const items = mockDev1.getData().data.items;
    assert.equal(items[officialAbandon.id].correctCount, 2);
    assert.equal(items[officialAbandon.id].intervalDays, 3);
  });

  await t.test("Teardown test user and related sessions", async () => {
    await db.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
    await db.delete(schema.progressEvents).where(eq(schema.progressEvents.userId, userId));
    await db.delete(schema.progress).where(eq(schema.progress.userId, userId));
    await db.delete(schema.userStats).where(eq(schema.userStats.userId, userId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
    await db.delete(schema.profiles).where(eq(schema.profiles.userId, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  });
});
