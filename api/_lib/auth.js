/**
 * SINAUENGLISH V2 — Core Authentication & Session Security Helper
 */

import crypto from "crypto";
import { eq, and, gt, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";

/**
 * Hash password securely using Node.js crypto.scrypt with a random 16-byte salt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString("hex"),
    salt
  };
}

/**
 * Verify current Vercel scrypt hashes and legacy Apps Script SHA-256×5,000 hashes.
 * Legacy format: SHA256(salt + ":" + password), then SHA256(previous digest)
 * for 4,999 additional iterations.
 */
export function verifyPassword(password, storedHash, salt) {
  if (typeof password !== "string" || !password || !storedHash || !salt) return false;
  if (!/^[a-f0-9]+$/i.test(storedHash)) return false;

  try {
    const storedBuffer = Buffer.from(storedHash, "hex");

    // Legacy Apps Script hash: 32-byte SHA-256 digest => 64 hex characters.
    if (storedHash.length === 64) {
      let digest = crypto
        .createHash("sha256")
        .update(`${salt}:${password}`, "utf8")
        .digest();

      for (let iteration = 1; iteration < 5000; iteration++) {
        digest = crypto.createHash("sha256").update(digest).digest();
      }

      return digest.length === storedBuffer.length &&
        crypto.timingSafeEqual(digest, storedBuffer);
    }

    // Current Vercel hash: 64-byte scrypt key => 128 hex characters.
    if (storedHash.length !== 128) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return derivedKey.length === storedBuffer.length &&
      crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

/** True when a valid login should upgrade the stored legacy hash to scrypt. */
export function needsPasswordRehash(storedHash) {
  return typeof storedHash === "string" && /^[a-f0-9]{64}$/i.test(storedHash);
}

/**
 * Generate 64-character hex session token and its SHA-256 hash for database storage
 */
export function createSessionToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

/**
 * Hash raw token with SHA-256
 */
export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Persistent, shared rate limit for login attempts (default: 5 per 15 minutes).
 * The key is SHA-256 hashed before storage, so raw IP/email values are not kept.
 * PostgreSQL UPSERT serializes concurrent attempts across serverless instances.
 */
function hashRateLimitKey(key) {
  return crypto.createHash("sha256").update(String(key)).digest("hex");
}

export async function checkLoginRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = new Date();
  const resetBefore = new Date(now.getTime() - windowMs);
  const keyHash = hashRateLimitKey(key);

  const rows = await db
    .insert(schema.authRateLimits)
    .values({
      keyHash,
      windowStartedAt: now,
      attemptCount: 1,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: schema.authRateLimits.keyHash,
      set: {
        windowStartedAt: sql`CASE
          WHEN ${schema.authRateLimits.windowStartedAt} <= ${resetBefore}
          THEN ${now}
          ELSE ${schema.authRateLimits.windowStartedAt}
        END`,
        attemptCount: sql`CASE
          WHEN ${schema.authRateLimits.windowStartedAt} <= ${resetBefore}
          THEN 1
          ELSE ${schema.authRateLimits.attemptCount} + 1
        END`,
        updatedAt: now
      }
    })
    .returning({
      windowStartedAt: schema.authRateLimits.windowStartedAt,
      attemptCount: schema.authRateLimits.attemptCount
    });

  const record = rows[0];
  const allowed = Number(record?.attemptCount || 0) <= maxAttempts;
  const startedAt = record?.windowStartedAt instanceof Date
    ? record.windowStartedAt.getTime()
    : new Date(record?.windowStartedAt || now).getTime();
  const remainingSeconds = Math.max(
    0,
    Math.ceil((startedAt + windowMs - now.getTime()) / 1000)
  );

  return allowed ? { allowed: true } : { allowed: false, remainingSeconds };
}

/** Clear the persistent login window after successful authentication. */
export async function clearLoginRateLimit(key) {
  await db.delete(schema.authRateLimits)
    .where(eq(schema.authRateLimits.keyHash, hashRateLimitKey(key)));
}

/**
 * Parse JSON body safely from incoming request
 */
export async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) { // 1 MB limit
        reject(new Error("Payload terlalu besar."));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Format JSON tidak valid."));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

/**
 * Authenticate incoming request and retrieve active user
 */
export async function authenticateRequest(req) {
  const headers = req?.headers || {};
  let token = null;

  // 1. Existing SinauEnglish compatibility token (Bearer or legacy cookie).
  const authHeader = headers.authorization || headers.Authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && typeof headers.cookie === "string") {
    for (const cookie of headers.cookie.split(";")) {
      const [name, ...parts] = cookie.trim().split("=");
      if (name === "sinau_session") {
        try {
          token = decodeURIComponent(parts.join("=") || "");
        } catch {
          token = null;
        }
        break;
      }
    }
  }

  // Keep older Vercel and Apps Script-compatible requests working during cutover.
  if (token) {
    const tokenHash = hashToken(token);
    const activeSessions = await db
      .select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.tokenHash, tokenHash),
        gt(schema.sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (activeSessions.length) {
      const session = activeSessions[0];
      const userList = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          displayName: schema.users.displayName,
          role: schema.users.role,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .where(eq(schema.users.id, session.userId))
        .limit(1);

      if (userList.length) {
        return { user: userList[0], session, token, authProvider: "legacy-bridge" };
      }
    }
  }

  // 2. Better Auth cookie session. This makes all existing feature handlers
  // compatible with Better Auth without exposing the session token to JavaScript.
  const [{ fromNodeHeaders }, { auth }] = await Promise.all([
    import("better-auth/node"),
    import("./better-auth.js")
  ]);
  const betterSession = await auth.api.getSession({
    headers: fromNodeHeaders(headers)
  });

  if (!betterSession?.user?.id || !betterSession?.session) {
    const error = new Error("Sesi tidak ditemukan, tidak valid, atau telah kedaluwarsa. Silakan masuk kembali.");
    error.statusCode = 401;
    error.code = "AUTH_ERROR";
    throw error;
  }

  const userList = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
      role: schema.users.role,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .where(eq(schema.users.id, betterSession.user.id))
    .limit(1);

  if (!userList.length) {
    const error = new Error("Pengguna tidak ditemukan.");
    error.statusCode = 401;
    error.code = "AUTH_ERROR";
    throw error;
  }

  return {
    user: userList[0],
    session: betterSession.session,
    token: null,
    authProvider: "better-auth"
  };
}


/**
 * Add Secure to session cookies on HTTPS requests (including Vercel Preview).
 * Local HTTP development keeps the cookie usable without Secure.
 */
export function getSessionCookieSecurity(req) {
  const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return forwardedProto === "https" || process.env.VERCEL === "1" ? "; Secure" : "";
}
