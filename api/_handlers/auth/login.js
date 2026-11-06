/**
 * POST /api/auth/login
 * 
 * Authenticates user credentials with rate-limiting and session token generation.
 */

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import {
  verifyPassword,
  needsPasswordRehash,
  hashPassword,
  createSessionToken,
  parseJsonBody,
  checkLoginRateLimit,
  clearLoginRateLimit
} from "../../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendRateLimitError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const body = await parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return sendValidationError(res, "Email dan kata sandi wajib diisi.");
    }

    // Rate Limiting Protection (Max 5 attempts per 15 minutes per IP + email)
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    const rateLimitKey = `${clientIp}:${email}`;
    const rateCheck = checkLoginRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return sendRateLimitError(res, rateCheck.remainingSeconds);
    }

    // Query user
    const userList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!userList.length) {
      return sendAuthError(res, "Email atau kata sandi tidak cocok.", 401);
    }

    const user = userList[0];

    // Verify Password
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return sendAuthError(res, "Email atau kata sandi tidak cocok.", 401);
    }

    // Preserve the same account and transparently upgrade Apps Script password
    // hashes to scrypt after the user proves possession of the correct password.
    if (needsPasswordRehash(user.passwordHash)) {
      const upgraded = hashPassword(password);
      await db
        .update(schema.users)
        .set({
          passwordHash: upgraded.hash,
          salt: upgraded.salt
        })
        .where(eq(schema.users.id, user.id));
    }

    // Clear Rate Limit on successful login
    clearLoginRateLimit(rateLimitKey);

    // Update lastLoginAt
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    // Create session token
    const { rawToken, tokenHash } = createSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(schema.sessions).values({
      id: "sess_" + crypto.randomBytes(8).toString("hex"),
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const cookieHeader = `sinau_session=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;

    return sendSuccess(
      res,
      {
        token: rawToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      },
      "Berhasil masuk ke SinauEnglish.",
      200,
      { "Set-Cookie": cookieHeader }
    );
  } catch (err) {
    console.error("[API login] Error:", err);
    return sendServerError(res, "Gagal memproses login: " + err.message);
  }
}

