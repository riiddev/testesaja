/**
 * POST /api/titles/unlock
 * 
 * Unlocks a title for active user if qualified.
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const body = await parseJsonBody(req);
    const titleId = String(body.titleId || "").trim();

    if (!titleId) {
      return sendValidationError(res, "Parameter titleId wajib disertakan.");
    }

    const existing = await db
      .select({ id: schema.titles.id })
      .from(schema.titles)
      .where(
        and(
          eq(schema.titles.userId, user.id),
          eq(schema.titles.titleId, titleId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.titles).values({
        userId: user.id,
        titleId,
        unlockedAt: new Date()
      });
    }

    return sendSuccess(res, { titleId }, "Gelar berhasil dibuka.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API titles/unlock] Error:", err);
    return sendServerError(res, "Gagal membuka gelar: " + err.message);
  }
}

