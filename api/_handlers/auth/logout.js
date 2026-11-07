/**
 * POST /api/auth/logout
 *
 * Revokes the Better Auth session, any compatibility bridge sessions linked
 * to it, and legacy-only SinauEnglish sessions.
 */

import { eq } from "drizzle-orm";
import { db, schema, withTransaction } from "../../../db/index.js";
import { hashToken, getSessionCookieSecurity } from "../../_lib/auth.js";
import { auth } from "../../_lib/better-auth.js";
import {
  getBetterAuthSessionFromRequestHeaders,
  getRequestCookieHeader,
  getSetCookieHeaders
} from "../../_lib/app-auth-session.js";
import { sendSuccess, sendServerError, sendJson } from "../../_lib/response.js";

function clearLegacyCookie(req) {
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production" ||
    Boolean(req?.headers?.["x-forwarded-proto"] === "https");
  return "sinau_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax" +
    (secure ? "; Secure" : "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    let token = null;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    const cookieHeader = getRequestCookieHeader(req.headers);
    if (!token && cookieHeader) {
      for (const cookie of cookieHeader.split(";")) {
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

    const betterSession = await getBetterAuthSessionFromRequestHeaders(req.headers);
    let betterAuthCookies = [];

    if (betterSession?.session?.id) {
      const signedOut = await auth.api.signOut({
        headers: new Headers({ cookie: cookieHeader }),
        returnHeaders: true
      });
      betterAuthCookies = getSetCookieHeaders(signedOut?.headers);
    }

    const tokenHash = token ? hashToken(token) : null;
    const betterAuthSessionId = betterSession?.session?.id || null;

    if (tokenHash || betterAuthSessionId) {
      await withTransaction(async (tx) => {
        if (tokenHash) {
          await tx.delete(schema.sessions)
            .where(eq(schema.sessions.tokenHash, tokenHash));
        }
        if (betterAuthSessionId) {
          await tx.delete(schema.sessions)
            .where(eq(schema.sessions.authSessionId, betterAuthSessionId));
        }
      });
    }

    const cookies = [
      ...betterAuthCookies,
      clearLegacyCookie(req)
    ];

    return sendSuccess(
      res,
      {},
      "Berhasil keluar dari akun.",
      200,
      { "Set-Cookie": cookies }
    );
  } catch (err) {
    console.error("[API logout] Error:", err);
    return sendServerError(res, "Gagal memproses logout.");
  }
}
