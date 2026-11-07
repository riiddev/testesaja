/**
 * POST /api/auth/login
 *
 * Better Auth is the primary credential provider. Accounts created before
 * the Better Auth cutover retain a verified legacy-password login path.
 * Legacy SHA-256 hashes are upgraded to scrypt after successful verification;
 * their credentials are not silently recreated or relinked in Better Auth.
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
import { auth } from "../../_lib/better-auth.js";
import {
  createApplicationBridgeSession,
  getBetterAuthSessionFromHeaders,
  getLegacySessionCookie,
  getSetCookieHeaders
} from "../../_lib/app-auth-session.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendRateLimitError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

function isBetterAuthCredentialError(error) {
  const status = Number(error?.statusCode || error?.status);
  const code = String(error?.code || error?.body?.code || "").toUpperCase();
  return status === 400 || status === 401 || code.includes("INVALID_EMAIL") ||
    code.includes("INVALID_PASSWORD") || code.includes("UNAUTHORIZED");
}

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

    const forwardedFor = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    const clientIp = forwardedFor || req.socket?.remoteAddress || "127.0.0.1";
    const rateLimitKey = clientIp + ":" + email;
    const rateCheck = await checkLoginRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return sendRateLimitError(res, rateCheck.remainingSeconds);
    }

    const userList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!userList.length) {
      return sendAuthError(res, "Email atau kata sandi tidak cocok.", 401);
    }

    const user = userList[0];
    const betterAccounts = await db
      .select({ id: schema.authAccounts.id })
      .from(schema.authAccounts)
      .where(eq(schema.authAccounts.userId, user.id))
      .limit(1);

    if (betterAccounts.length > 0) {
      let signin;
      try {
        signin = await auth.api.signInEmail({
          returnHeaders: true,
          body: { email, password }
        });
      } catch (error) {
        if (isBetterAuthCredentialError(error)) {
          return sendAuthError(res, "Email atau kata sandi tidak cocok.", 401);
        }
        if (Number(error?.statusCode || error?.status) === 429) {
          return sendRateLimitError(res, 900);
        }
        throw error;
      }

      const betterSession = await getBetterAuthSessionFromHeaders(signin?.headers);
      if (!betterSession?.user?.id || betterSession.user.id !== user.id || !betterSession.session?.id) {
        return sendAuthError(res, "Sesi masuk tidak dapat diverifikasi. Silakan coba lagi.", 401);
      }

      await db
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, user.id));

      const applicationSession = await createApplicationBridgeSession(
        user.id,
        betterSession.session
      );

      await clearLoginRateLimit(rateLimitKey);
      const cookies = [
        ...getSetCookieHeaders(signin.headers),
        getLegacySessionCookie(req, applicationSession.token)
      ];

      return sendSuccess(
        res,
        {
          token: applicationSession.token,
          user: applicationSession.user
        },
        "Berhasil masuk ke SinauEnglish.",
        200,
        { "Set-Cookie": cookies }
      );
    }

    // Compatibility for accounts that predate Better Auth. A legacy account
    // is not migrated or recreated: credentials are verified in place and a
    // SHA-256 legacy hash is upgraded to scrypt after successful verification.
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return sendAuthError(res, "Email atau kata sandi tidak cocok.", 401);
    }

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

    await clearLoginRateLimit(rateLimitKey);
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const { rawToken, tokenHash } = createSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(schema.sessions).values({
      id: "sess_" + crypto.randomBytes(8).toString("hex"),
      userId: user.id,
      tokenHash,
      expiresAt
    });

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
      { "Set-Cookie": getLegacySessionCookie(req, rawToken) }
    );
  } catch (err) {
    console.error("[API login] Error:", err);
    return sendServerError(res, "Gagal memproses login. Silakan coba lagi.");
  }
}
