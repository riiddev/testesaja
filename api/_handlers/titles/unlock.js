/**
 * POST /api/titles/unlock
 *
 * Only unlocks IDs in the official title catalog after server-side statistics
 * prove the user's achievement requirements have been met.
 */
import { eq, and, sum } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { evaluateAllTitles } from "../../../src/features/profile/titleSystem.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

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

    const [profileRows, statsRows, existingRows, contextRows] = await Promise.all([
      db.select().from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .limit(1),
      db.select().from(schema.userStats)
        .where(eq(schema.userStats.userId, user.id))
        .limit(1),
      db.select({ id: schema.titles.id, titleId: schema.titles.titleId })
        .from(schema.titles)
        .where(eq(schema.titles.userId, user.id)),
      db.select({ totalQuestions: sum(schema.activityLog.totalQuestions) })
        .from(schema.activityLog)
        .where(and(
          eq(schema.activityLog.userId, user.id),
          eq(schema.activityLog.activityType, "matching")
        ))
    ]);

    const profile = profileRows[0] || {};
    const stats = statsRows[0] || {};
    const alreadyUnlocked = existingRows.map((row) => row.titleId);
    const contextReviewsCount = Number(contextRows[0]?.totalQuestions || 0);

    const serverStats = {
      totalStartedWords: Number(stats.wordsStarted) || 0,
      masteredWordsCount: Number(stats.wordsMastered) || 0,
      b2MasteredCount: Number(stats.b2Mastered) || 0,
      totalReviewsDone: Number(stats.totalReviews) || 0,
      contextReviewsCount,
      completedGrammarCount: Number(stats.grammarCompleted) || 0,
      readingCompletedCount: Number(stats.readingCompleted) || 0,
      adventureCompletedCount: Number(stats.storiesCompleted) || 0,
      streak: Number(profile.streak) || 0
    };

    const officialTitle = evaluateAllTitles(serverStats, alreadyUnlocked)
      .find((title) => title.id === titleId);

    if (!officialTitle) {
      return sendValidationError(res, "ID gelar tidak terdaftar dalam katalog resmi.");
    }

    if (!officialTitle.isUnlocked) {
      return sendValidationError(
        res,
        `Gelar belum memenuhi syarat. Progres saat ini: ${officialTitle.current}/${officialTitle.total} ${officialTitle.unit}.`
      );
    }

    if (!alreadyUnlocked.includes(titleId)) {
      await db.insert(schema.titles).values({
        userId: user.id,
        titleId,
        unlockedAt: new Date()
      }).onConflictDoNothing();
    }

    return sendSuccess(res, { titleId }, "Gelar resmi berhasil dibuka.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API titles/unlock] Error:", err);
    return sendServerError(res, "Gagal membuka gelar: " + err.message);
  }
}
