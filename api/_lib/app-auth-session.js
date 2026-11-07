/**
 * Better Auth application bridge.
 *
 * Better Auth owns email/password credentials and HttpOnly sessions.
 * Existing SinauEnglish endpoints still accept a short-lived, hashed bearer
 * bridge while clients are migrated to cookie-only API requests.
 */

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema, withTransaction } from "../../db/index.js";
import { createSessionToken } from "./auth.js";

export function getSetCookieHeaders(headers) {
  if (!headers) return [];
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie().filter(Boolean);
  }
  const value = typeof headers.get === "function"
    ? headers.get("set-cookie")
    : headers["set-cookie"] || headers["Set-Cookie"];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function getCookieHeader(headers) {
  return getSetCookieHeaders(headers)
    .map((cookie) => String(cookie).split(";", 1)[0].trim())
    .filter(Boolean)
    .join("; ");
}

export function getRequestCookieHeader(headers) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get("cookie") || "";
  return headers.cookie || headers.Cookie || "";
}

export async function getBetterAuthSessionFromHeaders(headers) {
  const cookie = getCookieHeader(headers);
  if (!cookie) return null;

  const { auth } = await import("./better-auth.js");
  return auth.api.getSession({
    headers: new Headers({ cookie })
  });
}

export async function getBetterAuthSessionFromRequestHeaders(headers) {
  const cookie = getRequestCookieHeader(headers);
  if (!cookie) return null;

  const { auth } = await import("./better-auth.js");
  return auth.api.getSession({
    headers: new Headers({ cookie })
  });
}

export async function createApplicationBridgeSession(userId, betterAuthSession, displayName = "") {
  if (!userId || !betterAuthSession?.id) {
    throw new Error("Sesi Better Auth tidak valid untuk membuat sesi aplikasi.");
  }

  const bridge = createSessionToken();
  const expiresAt = new Date(betterAuthSession.expiresAt);
  const safeExpiry = Number.isNaN(expiresAt.getTime())
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : expiresAt;

  await withTransaction(async (tx) => {
    await tx.insert(schema.profiles).values({
      userId,
      displayName: String(displayName || "Pelajar Sinau").slice(0, 100),
      activeTitle: "",
      xp: 0,
      coins: 0,
      streak: 0,
      avatarKey: "avatar_1"
    }).onConflictDoNothing();

    await tx.insert(schema.userStats).values({
      userId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0,
      grammarCompleted: 0,
      readingCompleted: 0,
      storiesCompleted: 0,
      matchingCompleted: 0
    }).onConflictDoNothing();

    await tx.insert(schema.settings).values({
      userId,
      dailyGoal: 10,
      theme: "light",
      soundEffects: true,
      morningReminderHour: 7,
      eveningReminderHour: 19,
      reminderEnabled: false
    }).onConflictDoNothing();

    await tx.insert(schema.sessions).values({
      id: "sess_bridge_" + crypto.randomBytes(8).toString("hex"),
      userId,
      tokenHash: bridge.tokenHash,
      authSessionId: betterAuthSession.id,
      expiresAt: safeExpiry
    });
  });

  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
      role: schema.users.role,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!users.length) {
    throw new Error("Akun Better Auth tidak ditemukan setelah sesi dibuat.");
  }

  return { token: bridge.rawToken, user: users[0] };
}

export function getLegacySessionCookie(req, token) {
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production" ||
    Boolean(req?.headers?.["x-forwarded-proto"] === "https");
  return "sinau_session=" + encodeURIComponent(token) +
    "; Path=/; HttpOnly; SameSite=Lax" +
    (secure ? "; Secure" : "") +
    "; Max-Age=" + (30 * 24 * 60 * 60);
}
