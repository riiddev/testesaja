/**
 * GET /api/progress/get
 * 
 * Retrieves all Spaced Repetition (SRS) word progress for authenticated user.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest } from "../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const rows = await db
      .select()
      .from(schema.progress)
      .where(eq(schema.progress.userId, user.id));

    const items = {};
    for (const r of rows) {
      items[r.wordId] = {
        wordId: r.wordId,
        level: r.level,
        masteryStage: r.masteryStage,
        intervalDays: r.intervalDays,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        nextReviewAt: r.nextReviewAt ? r.nextReviewAt.toISOString() : null,
        lastReviewedAt: r.lastReviewedAt ? r.lastReviewedAt.toISOString() : null
      };
    }

    return sendSuccess(res, { items, count: rows.length });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API progress/get] Error:", err);
    return sendServerError(res, "Gagal memuat data progres belajar: " + err.message);
  }
}

