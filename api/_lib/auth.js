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
  let token = null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Cookie fallback
  if (!token && req.headers.cookie) {
    const cookieList = req.headers.cookie.split(";");
    for (const cookie of cookieList) {
      const [name, val] = cookie.trim().split("=");
      if (name === "sinau_session") {
        token = decodeURIComponent(val || "");
        break;
      }
    }
  }

  if (!token) {
    const error = new Error("Sesi tidak ditemukan. Silakan masuk terlebih dahulu.");
    error.statusCode = 401;
    error.code = "AUTH_ERROR";
    throw error;
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  // Find active non-expired session
  const activeSessions = await db
    .select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.tokenHash, tokenHash),
        gt(schema.sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!activeSessions.length) {
    const error = new Error("Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.");
    error.statusCode = 401;
    error.code = "AUTH_ERROR";
    throw error;
  }

  const session = activeSessions[0];

  // Retrieve user
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

  if (!userList.length) {
    const error = new Error("Pengguna tidak ditemukan.");
    error.statusCode = 401;
    error.code = "AUTH_ERROR";
    throw error;
  }

  return {
    user: userList[0],
    session,
    token
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
