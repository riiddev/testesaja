/**
 * GET /api/titles/get
 * 
 * Retrieves unlocked titles for active user.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest } from "../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const rows = await db
      .select({
        titleId: schema.titles.titleId,
        unlockedAt: schema.titles.unlockedAt
      })
      .from(schema.titles)
      .where(eq(schema.titles.userId, user.id));

    return sendSuccess(res, {
      titles: rows.map((r) => r.titleId),
      details: rows
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API titles/get] Error:", err);
    return sendServerError(res, "Gagal memuat gelar: " + err.message);
  }
}

