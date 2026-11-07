import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import registerHandler from "../api/_handlers/auth/register.js";
import loginHandler from "../api/_handlers/auth/login.js";
import meHandler from "../api/_handlers/auth/me.js";
import logoutHandler from "../api/_handlers/auth/logout.js";
import { auth } from "../api/_lib/better-auth.js";

// Helper to mock request and response for testing serverless handlers
function createMockReqRes({ method = "GET", body = {}, headers = {} }) {
  const req = {
    method,
    headers: { ...headers },
    body,
    socket: { remoteAddress: "127.0.0.1" }
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
    },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;
      Object.entries(headers).forEach(([k, v]) => {
        this.headers[k.toLowerCase()] = v;
      });
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

  return { req, res };
}

function getCookieHeader(setCookie) {
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  return entries
    .filter(Boolean)
    .map((value) => String(value).split(";", 1)[0].trim())
    .join("; ");
}

function legacyPasswordHash(password, salt) {
  let digest = crypto.createHash("sha256").update(salt + ":" + password, "utf8").digest();
  for (let iteration = 1; iteration < 5000; iteration += 1) {
    digest = crypto.createHash("sha256").update(digest).digest();
  }
  return digest.toString("hex");
}

const TEST_EMAIL = `tester_${Date.now()}@sinauenglish.test`;
const TEST_PASSWORD = "ValidPassword123!";
let createdUserId = null;
let activeSessionToken = null;
let activeCookieHeader = "";

test("AUTH SUITE — Register new account starting strictly from 0", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: "Pelajar Uji"
    }
  });

  await registerHandler(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.status, "SUCCESS");
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.email, TEST_EMAIL);

  createdUserId = res.body.data.user.id;
  activeSessionToken = res.body.data.token;
  activeCookieHeader = getCookieHeader(res.headers["set-cookie"]);
  assert.match(activeCookieHeader, /session_token/i, "Better Auth must issue an HttpOnly session cookie");

  const authAccountRows = await db
    .select()
    .from(schema.authAccounts)
    .where(eq(schema.authAccounts.userId, createdUserId));
  assert.equal(authAccountRows.length, 1, "new registrations must create a Better Auth credential account");

  const authSessionRows = await db
    .select()
    .from(schema.authSessions)
    .where(eq(schema.authSessions.userId, createdUserId));
  assert.equal(authSessionRows.length, 1, "new registrations must create a Better Auth session");

  const betterSession = await auth.api.getSession({
    headers: new Headers({ cookie: activeCookieHeader })
  });
  assert.equal(betterSession?.user?.id, createdUserId, "Better Auth cookie must resolve to the new account");

  // Verify Database State: XP, Coins, Streak MUST be 0!
  const profileRow = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, createdUserId));

  assert.equal(profileRow.length, 1);
  assert.equal(profileRow[0].xp, 0, "New account XP must start strictly at 0");
  assert.equal(profileRow[0].coins, 0, "New account Coins must start strictly at 0");
  assert.equal(profileRow[0].streak, 0, "New account Streak must start strictly at 0");

  // Verify User Stats: All counters MUST be 0!
  const statsRow = await db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, createdUserId));

  assert.equal(statsRow.length, 1);
  assert.equal(statsRow[0].wordsStarted, 0);
  assert.equal(statsRow[0].totalReviews, 0);
  assert.equal(statsRow[0].storiesCompleted, 0);
});

test("AUTH SUITE — Reject duplicate email registration", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: "Peniru"
    }
  });

  await registerHandler(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.success, false);
  assert.equal(res.body.status, "VALIDATION_ERROR");
});

test("AUTH SUITE — Persistent login rate limit blocks the sixth attempt", async () => {
  const uniqueEmail = `rate_limit_${Date.now()}@sinauenglish.test`;
  const requestLogin = async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      body: { email: uniqueEmail, password: "WrongPassword123!" }
    });
    await loginHandler(req, res);
    return res;
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await requestLogin();
    assert.equal(response.statusCode, 401, `Attempt ${attempt} should reach credential verification`);
  }

  const blocked = await requestLogin();
  assert.equal(blocked.statusCode, 429, "The sixth attempt in the active window must be rate limited");
});

test("AUTH SUITE — Reject registration with short password", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    body: {
      email: "short@sinau.test",
      password: "123",
      displayName: "Pendek"
    }
  });

  await registerHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, "VALIDATION_ERROR");
});

test("AUTH SUITE — Login with valid credentials", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  await loginHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.id, createdUserId);

  activeSessionToken = res.body.data.token;
  activeCookieHeader = getCookieHeader(res.headers["set-cookie"]);
  assert.match(activeCookieHeader, /session_token/i);
});

test("AUTH SUITE — Login with invalid password fails with 401", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: "WrongPassword999!"
    }
  });

  await loginHandler(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.status, "AUTH_ERROR");
  assert.equal(res.body.success, false);
});

test("AUTH SUITE — GetMe returns active session identity", async () => {
  const { req, res } = createMockReqRes({
    method: "GET",
    headers: {
      authorization: `Bearer ${activeSessionToken}`
    }
  });

  await meHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.id, createdUserId);
  assert.equal(res.body.data.user.email, TEST_EMAIL);
});

test("AUTH SUITE — GetMe with invalid token fails with 401", async () => {
  const { req, res } = createMockReqRes({
    method: "GET",
    headers: {
      authorization: "Bearer fake_token_invalid_12345"
    }
  });

  await meHandler(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.status, "AUTH_ERROR");
});

test("AUTH SUITE — Logout invalidates session in database", async () => {
  const { req, res } = createMockReqRes({
    method: "POST",
    headers: {
      authorization: `Bearer ${activeSessionToken}`,
      cookie: activeCookieHeader
    }
  });

  await logoutHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  // Subsequent GetMe must now fail
  const checkReqRes = createMockReqRes({
    method: "GET",
    headers: {
      authorization: `Bearer ${activeSessionToken}`
    }
  });

  await meHandler(checkReqRes.req, checkReqRes.res);

  assert.equal(checkReqRes.res.statusCode, 401);
  assert.equal(checkReqRes.res.body.status, "AUTH_ERROR");

  // Better Auth logout must revoke the primary cookie session as well.
  const revokedBetterSession = await auth.api.getSession({
    headers: new Headers({ cookie: activeCookieHeader })
  });
  assert.equal(revokedBetterSession, null, "logout must revoke the Better Auth session cookie");

  // Cleanup test user
  await db.delete(schema.users).where(eq(schema.users.id, createdUserId));
});

test("AUTH SUITE — Existing legacy account can still sign in and its hash upgrades safely", async () => {
  const legacyUserId = "legacy_auth_" + Date.now();
  const legacyEmail = `legacy_${Date.now()}@sinauenglish.test`;
  const legacySalt = crypto.randomBytes(12).toString("hex");

  await db.insert(schema.users).values({
    id: legacyUserId,
    email: legacyEmail,
    displayName: "Pelajar Legacy",
    passwordHash: legacyPasswordHash(TEST_PASSWORD, legacySalt),
    salt: legacySalt,
    role: "student"
  });

  try {
    const { req, res } = createMockReqRes({
      method: "POST",
      body: { email: legacyEmail, password: TEST_PASSWORD }
    });

    await loginHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.id, legacyUserId);
    assert.ok(res.body.data.token);

    const updatedUsers = await db
      .select({ passwordHash: schema.users.passwordHash })
      .from(schema.users)
      .where(eq(schema.users.id, legacyUserId))
      .limit(1);
    assert.equal(updatedUsers.length, 1);
    assert.equal(updatedUsers[0].passwordHash.length, 128, "legacy SHA-256 hash must upgrade to scrypt after verified login");

    const betterAccounts = await db
      .select()
      .from(schema.authAccounts)
      .where(eq(schema.authAccounts.userId, legacyUserId));
    assert.equal(betterAccounts.length, 0, "legacy account remains usable without forced re-registration");
  } finally {
    await db.delete(schema.users).where(eq(schema.users.id, legacyUserId));
  }
});

