/**
 * GET /api/grammar/get
 * 
 * Retrieves grammar lesson & quiz progress for active user.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const rows = await db
      .select()
      .from(schema.grammarProgress)
      .where(eq(schema.grammarProgress.userId, user.id));

    const progress = {};
    for (const r of rows) {
      progress[r.topicId] = {
        topicId: r.topicId,
        status: r.status,
        score: r.score,
        total: r.total,
        completedAt: r.completedAt ? r.completedAt.toISOString() : null
      };
    }

    return sendSuccess(res, { progress, count: rows.length });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API grammar/get] Error:", err);
    return sendServerError(res, "Gagal memuat progres grammar: " + err.message);
  }
}

