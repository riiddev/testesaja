import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "../api/_lib/better-auth.js";
import meHandler from "../api/_handlers/auth/me.js";
import { db, schema } from "../db/index.js";

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;
      Object.entries(headers).forEach(([key, value]) => {
        this.headers[key.toLowerCase()] = value;
      });
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end(raw) {
      if (raw && !this.body) this.body = JSON.parse(raw);
    }
  };
}

function cookieHeader(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);

  return values
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

test("Better Auth sign-up, /me compatibility bridge, sign-in and logout", async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must point to the Neon development database");
  assert.ok(process.env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET is required for this test");

  const email = `better_auth_${Date.now()}@sinauenglish.test`;
  const password = "BetterAuthTest123!";
  let userId = null;

  try {
    const signup = await auth.api.signUpEmail({
      returnHeaders: true,
      body: {
        name: "Pelajar Better Auth",
        email,
        password
      }
    });

    assert.equal(signup.response.user.email, email);
    userId = signup.response.user.id;
    assert.ok(userId, "Better Auth must create a user id");

    const signupCookie = cookieHeader(signup.headers);
    assert.match(signupCookie, /session_token/i, "sign-up must issue an HttpOnly session cookie");

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: signupCookie })
    });
    assert.equal(session?.user?.id, userId, "sign-up cookie must resolve to the new user");

    const meReq = {
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: signupCookie }
    };
    const meRes = createMockResponse();
    await meHandler(meReq, meRes);

    assert.equal(meRes.statusCode, 200, "legacy /me endpoint must accept Better Auth cookies");
    assert.equal(meRes.body?.success, true);
    assert.equal(meRes.body?.data?.user?.id, userId);
    assert.ok(meRes.body?.data?.token, "/me must issue a temporary API compatibility token");

    const bridgeHash = (await import("../api/_lib/auth.js")).hashToken(meRes.body.data.token);
    const bridgeRows = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.tokenHash, bridgeHash));
    assert.equal(bridgeRows.length, 1, "compatibility token must be stored only as a hash");

    const profileRows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId));
    const statsRows = await db
      .select()
      .from(schema.userStats)
      .where(eq(schema.userStats.userId, userId));
    const settingsRows = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.userId, userId));

    assert.equal(profileRows.length, 1, "new Better Auth users must receive an app profile");
    assert.equal(profileRows[0].xp, 0);
    assert.equal(statsRows.length, 1, "new Better Auth users must receive app statistics");
    assert.equal(settingsRows.length, 1, "new Better Auth users must receive app settings");

    const signin = await auth.api.signInEmail({
      returnHeaders: true,
      body: { email, password }
    });
    assert.equal(signin.response.user.id, userId, "email/password sign-in must resolve the same user");

    const signinCookie = cookieHeader(signin.headers);
    assert.ok(signinCookie, "sign-in must return a session cookie");
    const signinSession = await auth.api.getSession({
      headers: new Headers({ cookie: signinCookie })
    });
    assert.equal(signinSession?.user?.id, userId);

    await auth.api.signOut({
      headers: new Headers({ cookie: signinCookie })
    });
    const revoked = await auth.api.getSession({
      headers: new Headers({ cookie: signinCookie })
    });
    assert.equal(revoked, null, "logout must revoke the database session");
  } finally {
    if (userId) {
      await db.delete(schema.users).where(eq(schema.users.id, userId));
    } else {
      await db.delete(schema.users).where(eq(schema.users.email, email));
    }
  }
});
