/**
 * FASE 10 TEST SUITE — Android Widget Summary Endpoint
 * 
 * Verifies that GET /api/widget/summary delivers fast, read-only
 * data for Android homescreen widgets and PWA app shortcuts.
 */

import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import widgetSummaryHandler from "../api/widget/summary.js";
import authRegisterHandler from "../api/auth/register.js";
import { getWibDateStr } from "../api/_lib/wibDate.js";
function mockReq({ method = "GET", headers = {}, body = {}, query = {} } = {}) {
  return {
    method,
    headers: { ...headers },
    body,
    query,
    socket: { remoteAddress: "127.0.0.1" }
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end(raw) {
      if (raw && !this.body) {
        try {
          this.body = JSON.parse(raw);
        } catch (e) {
          this.body = raw;
        }
      }
    }
  };
  return res;
}

const TEST_EMAIL = `widget_test_${Date.now()}@sinauenglish.test`;
let testUserId = null;
let testToken = null;

test("FASE 10 TEST SUITE — Android Widget Summary & Badging Data", async (t) => {
  const sql = neon(process.env.DATABASE_URL);

  await t.test("Setup test user for widget tests", async () => {
    const req = mockReq({
      method: "POST",
      body: {
        email: TEST_EMAIL,
        password: "WidgetPassword123!",
        displayName: "Widget Tester"
      }
    });
    const res = mockRes();
    await authRegisterHandler(req, res);

    assert.equal(res.statusCode, 201);
    testUserId = res.body.data.user.id;
    testToken = res.body.data.token;

    // Set initial test stats
    await sql`
      UPDATE profiles
      SET xp = 350, coins = 45, streak = 7
      WHERE user_id = ${testUserId}
    `;

    // Insert 1 due SRS word and 1 future SRS word
    await sql`
      INSERT INTO progress (user_id, word_id, level, mastery_stage, next_review_at)
      VALUES 
        (${testUserId}, 'abandon', 'A1', 'learning', NOW() - INTERVAL '1 hour'),
        (${testUserId}, 'ability', 'A2', 'learning', NOW() + INTERVAL '3 days')
    `;

    // Insert 1 completed quest and 1 incomplete quest
    const today = getWibDateStr();
    await sql`
      INSERT INTO daily_quests (user_id, quest_date, quest_id, current_progress, target, is_completed)
      VALUES
        (${testUserId}, ${today}, 'quest_1', 10, 10, true),
        (${testUserId}, ${today}, 'quest_2', 2, 5, false)
    `;
  });

  await t.test("1. Unauthenticated request to /api/widget/summary returns 401", async () => {
    const req = mockReq({ method: "GET" });
    const res = mockRes();
    await widgetSummaryHandler(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
  });

  await t.test("2. Authenticated request returns structured widget summary data", async () => {
    const req = mockReq({
      method: "GET",
      headers: {
        authorization: `Bearer ${testToken}`
      }
    });
    const res = mockRes();
    await widgetSummaryHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    
    const data = res.body.data;
    assert.ok(data.user);
    assert.equal(data.user.displayName, "Widget Tester");

    // Level check: Math.floor(350 / 100) + 1 = 4
    assert.equal(data.stats.level, 4);
    assert.equal(data.stats.xp, 350);
    assert.equal(data.stats.coins, 45);
    assert.equal(data.stats.streak, 7);

    // SRS check: only 'abandon' is due
    assert.equal(data.srs.dueReviewsCount, 1);

    // Quests check: 1 completed out of 2 quests
    assert.equal(data.quests.completed, 1);
    assert.equal(data.quests.total, 2);
    assert.equal(data.quests.allCompleted, false);

    // Cache control check
    assert.ok(res.headers["cache-control"]?.includes("max-age=60"));
  });

  await t.test("Teardown test user and related rows", async () => {
    if (testUserId) {
      await sql`DELETE FROM users WHERE id = ${testUserId}`;
    }
  });
});
