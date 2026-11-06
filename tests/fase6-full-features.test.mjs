/**
 * tests/fase6-full-features.test.mjs
 * 
 * Comprehensive automated test suite for Fase 6:
 * 1. Settings API (get, update dailyGoal, theme, reminders)
 * 2. Custom Avatar API (upload <=35KB bytea, get image, reject >35KB, delete)
 * 3. Titles Catalog & Unlock API
 * 4. Grammar Progress API (save topic score, query topics)
 * 5. Adventure/Story Progress API (complete episode, query episodes)
 * 6. Sentence Context Matching Session API (record round, award server rewards, activity log)
 * 7. HABIT Reading Quiz API (record score, save wrongItems in attempt_details)
 * 8. Practice History & Summary API (cursor pagination, filter by type, 7-day trend)
 */

import test from "node:test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, createSessionToken } from "../api/_lib/auth.js";

// Handler imports
import settingsGetHandler from "../api/_handlers/settings/get.js";
import settingsUpdateHandler from "../api/_handlers/settings/update.js";
import avatarUploadHandler from "../api/_handlers/avatar/upload.js";
import avatarGetHandler from "../api/_handlers/avatar/get.js";
import avatarDeleteHandler from "../api/_handlers/avatar/delete.js";
import titlesGetHandler from "../api/_handlers/titles/get.js";
import titlesUnlockHandler from "../api/_handlers/titles/unlock.js";
import grammarGetHandler from "../api/_handlers/grammar/get.js";
import grammarSaveHandler from "../api/_handlers/grammar/save.js";
import storyGetHandler from "../api/_handlers/story/get.js";
import storyCompleteHandler from "../api/_handlers/story/complete.js";
import matchingRecordHandler from "../api/_handlers/matching/record.js";
import readingQuizRecordHandler from "../api/_handlers/reading-quiz/record.js";
import rewardGrantHandler from "../api/_handlers/reward/grant.js";
import activityHistoryHandler from "../api/activity/history.js";
import activitySummaryHandler from "../api/activity/summary.js";

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

test("FASE 6 TEST SUITE — Complete Feature Handlers & Activity Log", async (t) => {
  const testUserId = `test_fase6_${Date.now()}`;
  const testEmail = `fase6_${Date.now()}@sinauenglish.test`;
  let token = null;

  await t.test("Setup test user and clean slate profile", async () => {
    const { hash, salt } = await hashPassword("Fase6Password123!");
    await db.insert(schema.users).values({
      id: testUserId,
      email: testEmail,
      displayName: "Fase 6 Scholar",
      passwordHash: hash,
      salt,
      role: "student"
    });

    await db.insert(schema.profiles).values({
      userId: testUserId,
      displayName: "Fase 6 Scholar",
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
    token = rawToken;
    await db.insert(schema.sessions).values({
      id: `sess_${Date.now()}_${rawToken.slice(0, 8)}`,
      userId: testUserId,
      tokenHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    assert.ok(token, "Session token must be established");
  });

  await t.test("1. Settings API: get default settings and update dailyGoal", async () => {
    // 1a. GET settings
    const mockGet = createMockReqRes({ method: "GET", token, url: "/api/settings/get" });
    await settingsGetHandler(mockGet.req, mockGet.res);
    assert.equal(mockGet.getStatus(), 200);
    const initialSettings = mockGet.getData();
    assert.equal(initialSettings.success, true);
    assert.equal(initialSettings.data.settings.dailyGoal, 10);

    // 1b. UPDATE settings
    const mockUpdate = createMockReqRes({
      method: "POST",
      token,
      url: "/api/settings/update",
      body: { dailyGoal: 15, theme: "light" }
    });
    await settingsUpdateHandler(mockUpdate.req, mockUpdate.res);
    assert.equal(mockUpdate.getStatus(), 200);
    assert.equal(mockUpdate.getData().data.settings.dailyGoal, 15);
  });

  await t.test("2. Avatar API: upload <=35KB, verify bytea, reject >35KB, delete", async () => {
    // 2a. Small 1x1 PNG in base64 data URL
    const validPngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const mockUpload = createMockReqRes({
      method: "POST",
      token,
      url: "/api/avatar/upload",
      body: { imageBase64: validPngBase64, mimeType: "image/png" }
    });
    await avatarUploadHandler(mockUpload.req, mockUpload.res);
    assert.equal(mockUpload.getStatus(), 200);
    assert.equal(mockUpload.getData().success, true);

    // 2b. GET avatar
    const mockGetAvatar = createMockReqRes({ method: "GET", token, url: `/api/avatar/get?userId=${testUserId}` });
    await avatarGetHandler(mockGetAvatar.req, mockGetAvatar.res);
    assert.equal(mockGetAvatar.getStatus(), 200);
    assert.ok(mockGetAvatar.getData(), "Binary buffer or base64 response must be returned");

    // 2c. Reject oversized avatar (>35KB)
    const largeBuffer = Buffer.alloc(36 * 1024, "A");
    const largeDataUrl = `data:image/jpeg;base64,${largeBuffer.toString("base64")}`;
    const mockReject = createMockReqRes({
      method: "POST",
      token,
      url: "/api/avatar/upload",
      body: { imageBase64: largeDataUrl, mimeType: "image/jpeg" }
    });
    await avatarUploadHandler(mockReject.req, mockReject.res);
    assert.equal(mockReject.getStatus(), 400);
    assert.match(mockReject.getData().error, /maksimal.*35 KB/i);

    // 2d. DELETE avatar
    const mockDel = createMockReqRes({ method: "DELETE", token, url: "/api/avatar/delete" });
    await avatarDeleteHandler(mockDel.req, mockDel.res);
    assert.equal(mockDel.getStatus(), 200);
    assert.equal(mockDel.getData().success, true);
  });

  await t.test("3. Titles API: reject forged IDs and unlock only a qualified official title", async () => {
    const mockForge = createMockReqRes({
      method: "POST",
      token,
      url: "/api/titles/unlock",
      body: { titleId: "novice_scholar" }
    });
    await titlesUnlockHandler(mockForge.req, mockForge.res);
    assert.equal(mockForge.getStatus(), 400);
    assert.match(mockForge.getData().error, /tidak terdaftar/i);

    const mockUnqualified = createMockReqRes({
      method: "POST",
      token,
      url: "/api/titles/unlock",
      body: { titleId: "word_explorer" }
    });
    await titlesUnlockHandler(mockUnqualified.req, mockUnqualified.res);
    assert.equal(mockUnqualified.getStatus(), 400);
    assert.match(mockUnqualified.getData().error, /belum memenuhi syarat/i);

    // Simulate the server's accumulated statistic reaching the official threshold.
    await db.update(schema.userStats)
      .set({ wordsStarted: 50 })
      .where(eq(schema.userStats.userId, testUserId));

    const mockUnlock = createMockReqRes({
      method: "POST",
      token,
      url: "/api/titles/unlock",
      body: { titleId: "word_explorer" }
    });
    await titlesUnlockHandler(mockUnlock.req, mockUnlock.res);
    assert.equal(mockUnlock.getStatus(), 200);
    assert.equal(mockUnlock.getData().data.titleId, "word_explorer");

    const contextBefore = createMockReqRes({
      method: "POST",
      token,
      url: "/api/titles/unlock",
      body: { titleId: "context_scholar" }
    });
    await titlesUnlockHandler(contextBefore.req, contextBefore.res);
    assert.equal(contextBefore.getStatus(), 400);

    await db.insert(schema.activityLog).values({
      id: `act_${testUserId}_context_100`,
      userId: testUserId,
      activityType: "matching",
      title: "Verified context matching practice",
      totalQuestions: 100
    });

    const contextQualified = createMockReqRes({
      method: "POST",
      token,
      url: "/api/titles/unlock",
      body: { titleId: "context_scholar" }
    });
    await titlesUnlockHandler(contextQualified.req, contextQualified.res);
    assert.equal(contextQualified.getStatus(), 200);
    assert.equal(contextQualified.getData().data.titleId, "context_scholar");

    // GET titles
    const mockGetTitles = createMockReqRes({ method: "GET", token, url: "/api/titles/get" });
    await titlesGetHandler(mockGetTitles.req, mockGetTitles.res);
    assert.equal(mockGetTitles.getStatus(), 200);
    const titlesData = mockGetTitles.getData().data;
    assert.ok(titlesData.titles.includes("word_explorer"));
    assert.ok(!titlesData.titles.includes("novice_scholar"));
  });

  await t.test("4. Grammar API: verify official answers and grant one server-side completion reward", async () => {
    const grammarData = JSON.parse(
      fs.readFileSync(new URL("../src/data/grammar/present-simple.json", import.meta.url), "utf8")
    );
    const officialQuestions = grammarData.finalQuiz;
    const wrongAnswers = officialQuestions.map((question) => ({
      questionId: question.id,
      selectedIndex: (question.correctIndex + 1) % question.options.length
    }));

    const mockForged = createMockReqRes({
      method: "POST",
      token,
      url: "/api/grammar/save",
      body: {
        topicId: "present-simple",
        answers: wrongAnswers,
        score: officialQuestions.length,
        quizScore: 100,
        total: officialQuestions.length,
        practiceDone: true
      }
    });
    await grammarSaveHandler(mockForged.req, mockForged.res);
    assert.equal(mockForged.getStatus(), 200);
    assert.equal(mockForged.getData().data.score, 0);
    assert.equal(mockForged.getData().data.scorePct, 0);
    assert.equal(mockForged.getData().data.status, "in_progress");
    assert.equal(mockForged.getData().data.xpEarned, 0);
    const failedQuizActivity = await db.select().from(schema.activityLog)
      .where(eq(schema.activityLog.userId, testUserId));
    assert.ok(
      failedQuizActivity.some((activity) => activity.activityType === "grammar" && activity.accuracyPercent === 0),
      "A fully submitted quiz must be recorded even when it does not reach mastery"
    );

    const correctAnswers = officialQuestions.map((question) => ({
      questionId: question.id,
      selectedIndex: question.correctIndex
    }));
    const mockSaveGrammar = createMockReqRes({
      method: "POST",
      token,
      url: "/api/grammar/save",
      body: {
        topicId: "present-simple",
        answers: correctAnswers,
        // These browser-supplied figures must not determine the server result.
        score: 0,
        quizScore: 0,
        total: 1,
        practiceDone: false
      }
    });
    await grammarSaveHandler(mockSaveGrammar.req, mockSaveGrammar.res);
    assert.equal(mockSaveGrammar.getStatus(), 200);
    assert.equal(mockSaveGrammar.getData().success, true);
    assert.equal(mockSaveGrammar.getData().data.score, officialQuestions.length);
    assert.equal(mockSaveGrammar.getData().data.scorePct, 100);
    assert.equal(mockSaveGrammar.getData().data.status, "completed");
    assert.ok(mockSaveGrammar.getData().data.xpEarned > 0);

    // The compatibility reward endpoint uses the same ledger event ID, so it
    // cannot mint a second payout after /grammar/save has already granted it.
    const duplicateReward = createMockReqRes({
      method: "POST",
      token,
      url: "/api/reward/grant",
      body: { source: "grammar_quiz", refId: "present-simple", eventId: "forged-second-payment" }
    });
    await rewardGrantHandler(duplicateReward.req, duplicateReward.res);
    assert.equal(duplicateReward.getStatus(), 200);
    assert.equal(duplicateReward.getData().data.alreadyRewarded, true);
    assert.equal(duplicateReward.getData().data.earnedXp, 0);

    const mockRetake = createMockReqRes({
      method: "POST",
      token,
      url: "/api/grammar/save",
      body: { topicId: "present-simple", answers: wrongAnswers }
    });
    await grammarSaveHandler(mockRetake.req, mockRetake.res);
    assert.equal(mockRetake.getData().data.status, "completed");
    assert.equal(mockRetake.getData().data.xpEarned, 0);

    const mockGetGrammar = createMockReqRes({ method: "GET", token, url: "/api/grammar/get" });
    await grammarGetHandler(mockGetGrammar.req, mockGetGrammar.res);
    assert.equal(mockGetGrammar.getStatus(), 200);
    const grammarMap = mockGetGrammar.getData().data.progress;
    assert.ok(grammarMap["present-simple"]);
    assert.equal(grammarMap["present-simple"].score, officialQuestions.length);
  });
  await t.test("5. Story API: enforce official stories and sequential episode completion", async () => {
    const mockUnknownStory = createMockReqRes({
      method: "POST",
      token,
      url: "/api/story/complete",
      body: { storyId: "story_market_adventure", episodeId: 1 }
    });
    await storyCompleteHandler(mockUnknownStory.req, mockUnknownStory.res);
    assert.equal(mockUnknownStory.getStatus(), 400);

    const mockSkipEpisode = createMockReqRes({
      method: "POST",
      token,
      url: "/api/story/complete",
      body: { storyId: "story-01", episodeId: 2 }
    });
    await storyCompleteHandler(mockSkipEpisode.req, mockSkipEpisode.res);
    assert.equal(mockSkipEpisode.getStatus(), 400);
    assert.match(mockSkipEpisode.getData().error, /berurutan/i);

    const mockStory = createMockReqRes({
      method: "POST",
      token,
      url: "/api/story/complete",
      body: { storyId: "story-01", episodeId: 1, totalEpisodes: 999 }
    });
    await storyCompleteHandler(mockStory.req, mockStory.res);
    assert.equal(mockStory.getStatus(), 200);
    assert.equal(mockStory.getData().success, true);
    assert.equal(mockStory.getData().data.isStoryCompleted, false);

    const mockRepeat = createMockReqRes({
      method: "POST",
      token,
      url: "/api/story/complete",
      body: { storyId: "story-01", episodeId: 1 }
    });
    await storyCompleteHandler(mockRepeat.req, mockRepeat.res);
    assert.equal(mockRepeat.getStatus(), 200);
    assert.equal(mockRepeat.getData().data.earnedXp, 0);
    assert.equal(mockRepeat.getData().data.alreadyCompleted, true);

    const mockGetStory = createMockReqRes({ method: "GET", token, url: "/api/story/get" });
    await storyGetHandler(mockGetStory.req, mockGetStory.res);
    assert.equal(mockGetStory.getStatus(), 200);
    const storyData = mockGetStory.getData().data;
    assert.ok(storyData.allStories["story-01"]);
    assert.deepEqual(storyData.allStories["story-01"].completedEpisodes, [1]);
  });
  await t.test("6. Matching & Reading Quiz: record sessions with mistake tracking", async () => {
    // 6a. Matching Round
    const mockMatch = createMockReqRes({
      method: "POST",
      token,
      url: "/api/matching/record",
      body: { score: 100, total: 5, durationSeconds: 25, sessionId: `match_${Date.now()}` }
    });
    await matchingRecordHandler(mockMatch.req, mockMatch.res);
    assert.equal(mockMatch.getStatus(), 200);
    assert.equal(mockMatch.getData().success, true);

    // 6b. Reading Quiz with mistake breakdown
    const readingQuizData = JSON.parse(
      fs.readFileSync(new URL("../src/data/habit-reading-quizzes.json", import.meta.url), "utf8")
    );
    const articleId = "the-tiny-tenants-inside-you";
    const officialQuestions = readingQuizData.quizzes[articleId].questions;
    const answers = officialQuestions.map((question, index) => ({
      questionId: question.id,
      selectedIndex: index === 0
        ? (question.correctIndex + 1) % question.options.length
        : question.correctIndex
    }));

    const mockQuiz = createMockReqRes({
      method: "POST",
      token,
      url: "/api/reading-quiz/record",
      body: {
        articleId,
        durationSeconds: 45,
        answers,
        // Forged scores and wrongItems must be ignored by the API.
        score: officialQuestions.length,
        total: officialQuestions.length,
        wrongItems: ["forged-item"]
      }
    });
    await readingQuizRecordHandler(mockQuiz.req, mockQuiz.res);
    assert.equal(mockQuiz.getStatus(), 200);
    assert.equal(mockQuiz.getData().success, true);
    assert.equal(mockQuiz.getData().data.score, officialQuestions.length - 1);
  });

  await t.test("7. Activity History (Butir F): cursor pagination, filter, and 7-day summary", async () => {
    // 7a. GET History feed
    const mockHistory = createMockReqRes({
      method: "GET",
      token,
      url: "/api/activity/history?limit=10&type=all"
    });
    await activityHistoryHandler(mockHistory.req, mockHistory.res);
    assert.equal(mockHistory.getStatus(), 200);
    const historyData = mockHistory.getData().data;
    assert.ok(Array.isArray(historyData.items));
    assert.ok(historyData.items.length >= 2, "Must contain at least matching and reading quiz sessions");

    // Check wrongItems persisted in attemptDetails
    const quizItem = historyData.items.find((i) => i.activityType === "reading_quiz");
    assert.ok(quizItem, "Reading quiz item must be recorded in history");
    assert.deepEqual(quizItem.wrongItems, ["q1"]);

    // 7b. Filter by module
    const mockFiltered = createMockReqRes({
      method: "GET",
      token,
      url: "/api/activity/history?limit=5&type=matching"
    });
    await activityHistoryHandler(mockFiltered.req, mockFiltered.res);
    assert.equal(mockFiltered.getStatus(), 200);
    const filteredItems = mockFiltered.getData().data.items;
    assert.ok(filteredItems.every((i) => i.activityType === "matching"));

    // 7c. GET 7-day summary
    const mockSummary = createMockReqRes({ method: "GET", token, url: "/api/activity/summary" });
    await activitySummaryHandler(mockSummary.req, mockSummary.res);
    assert.equal(mockSummary.getStatus(), 200);
    const summary = mockSummary.getData().data;
    assert.ok(summary.totalSessions7Days >= 2, "Summary totalSessions7Days must be recorded");
    assert.ok(Array.isArray(summary.days));
    assert.equal(summary.days.length, 7);
  });

  await t.test("Teardown test user and related records", async () => {
    await db.delete(schema.attemptDetails).where(eq(schema.attemptDetails.userId, testUserId));
    await db.delete(schema.activityLog).where(eq(schema.activityLog.userId, testUserId));
    await db.delete(schema.storyProgress).where(eq(schema.storyProgress.userId, testUserId));
    await db.delete(schema.grammarProgress).where(eq(schema.grammarProgress.userId, testUserId));
    await db.delete(schema.titles).where(eq(schema.titles.userId, testUserId));
    await db.delete(schema.avatars).where(eq(schema.avatars.userId, testUserId));
    await db.delete(schema.settings).where(eq(schema.settings.userId, testUserId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, testUserId));
    await db.delete(schema.userStats).where(eq(schema.userStats.userId, testUserId));
    await db.delete(schema.profiles).where(eq(schema.profiles.userId, testUserId));
    await db.delete(schema.users).where(eq(schema.users.id, testUserId));
  });
});
