/**
 * GET /api/auth/me
 * Verifies either a legacy compatibility session or a Better Auth cookie session.
 */

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, createSessionToken } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

async function ensureAppDefaults(user) {
  await db.insert(schema.profiles).values({
    userId: user.id,
    displayName: user.displayName || "Pelajar Sinau",
    activeTitle: "",
    xp: 0,
    coins: 0,
    streak: 0,
    avatarKey: "avatar_1"
  }).onConflictDoNothing();

  await db.insert(schema.userStats).values({
    userId: user.id,
    wordsStarted: 0,
    wordsMastered: 0,
    b2Mastered: 0,
    totalReviews: 0,
    grammarCompleted: 0,
    readingCompleted: 0,
    storiesCompleted: 0,
    matchingCompleted: 0
  }).onConflictDoNothing();

  await db.insert(schema.settings).values({
    userId: user.id,
    dailyGoal: 10,
    theme: "light",
    soundEffects: true,
    morningReminderHour: 7,
    eveningReminderHour: 19,
    reminderEnabled: false
  }).onConflictDoNothing();
}

export default async function handler(req, res) {
  try {
    const authResult = await authenticateRequest(req);
    const { user } = authResult;
    let token = authResult.token || null;

    if (authResult.authProvider === "better-auth") {
      await ensureAppDefaults(user);

      // Old API clients need a bearer credential. Store only its hash; the
      // Better Auth HttpOnly cookie remains the primary authentication session.
      const bridge = createSessionToken();
      const expiresAt = new Date(authResult.session.expiresAt);
      const safeExpiry = Number.isNaN(expiresAt.getTime())
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : expiresAt;

      await db.insert(schema.sessions).values({
        id: "sess_bridge_" + crypto.randomBytes(8).toString("hex"),
        userId: user.id,
        tokenHash: bridge.tokenHash,
        expiresAt: safeExpiry
      });

      token = bridge.rawToken;
    }

    return sendSuccess(
      res,
      { user, token },
      "Sesi aktif terverifikasi."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API me] Error:", err);
    return sendServerError(res, "Gagal memverifikasi sesi.");
  }
}
