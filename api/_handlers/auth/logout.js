/**
 * POST /api/auth/logout
 * 
 * Invalidates active session from database and clears auth cookie.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { hashToken } from "../../_lib/auth.js";
import { sendSuccess, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    let token = null;

    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

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

    if (token) {
      const tokenHash = hashToken(token);
      await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
    }

    const clearCookieHeader = "sinau_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax";

    return sendSuccess(res, {}, "Berhasil keluar dari akun.", 200, {
      "Set-Cookie": clearCookieHeader
    });
  } catch (err) {
    console.error("[API logout] Error:", err);
    return sendServerError(res, "Gagal memproses logout: " + err.message);
  }
}

