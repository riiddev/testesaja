/**
 * POST /api/grammar/save
 * 
 * Saves grammar practice or quiz completion and awards server-side XP & coins.
 */

import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import { recordLedgerTransaction } from "../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../_lib/streak.js";
import { REWARDS_CONFIG } from "../_lib/rewardsConfig.js";
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
    const topicId = String(body.topicId || "").trim();
    const score = Math.max(0, parseInt(body.quizScore !== undefined ? body.quizScore : body.score, 10) || 0);
    const total = Math.max(1, parseInt(body.total, 10) || 5);
    const isCompleted = score >= Math.ceil(total * 0.7) || Boolean(body.practiceDone);

    if (!topicId) {
      return sendValidationError(res, "Parameter topicId wajib disertakan.");
    }

    const now = new Date();

    const existing = await db
      .select()
      .from(schema.grammarProgress)
      .where(
        and(
          eq(schema.grammarProgress.userId, user.id),
          eq(schema.grammarProgress.topicId, topicId)
        )
      )
      .limit(1);

    const wasAlreadyCompleted = existing.length > 0 && existing[0].status === "completed";

    if (existing.length === 0) {
      await db.insert(schema.grammarProgress).values({
        userId: user.id,
        topicId,
        status: isCompleted ? "completed" : "in_progress",
        score,
        total,
        completedAt: isCompleted ? now : null
      });
    } else {
      await db
        .update(schema.grammarProgress)
        .set({
          status: isCompleted ? "completed" : existing[0].status,
          score: Math.max(existing[0].score, score),
          total,
          completedAt: isCompleted ? now : existing[0].completedAt
        })
        .where(
          and(
            eq(schema.grammarProgress.userId, user.id),
            eq(schema.grammarProgress.topicId, topicId)
          )
        );
    }

    let xpEarned = 0;
    let coinsEarned = 0;

    // Grant reward if completed for the first time
    if (isCompleted && !wasAlreadyCompleted) {
      await db
        .update(schema.userStats)
        .set({
          grammarCompleted: sql`${schema.userStats.grammarCompleted} + 1`,
          updatedAt: now
        })
        .where(eq(schema.userStats.userId, user.id));

      const rewardConfig = REWARDS_CONFIG.grammar_quiz_complete || { xp: 30, coins: 15 };
      const eventId = `grammar:${topicId}:first_complete`;
      const tx = await recordLedgerTransaction({
        userId: user.id,
        eventId,
        source: "grammar_quiz",
        xpEarned: rewardConfig.xp,
        coinsEarned: rewardConfig.coins
      });

      if (!tx.alreadyProcessed) {
        xpEarned = rewardConfig.xp;
        coinsEarned = rewardConfig.coins;
      }
    }

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        topicId,
        status: isCompleted ? "completed" : "in_progress",
        score,
        total,
        xpEarned,
        coinsEarned,
        streak: streakRes?.streak
      },
      "Progres grammar berhasil disimpan."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API grammar/save] Error:", err);
    return sendServerError(res, "Gagal menyimpan progres grammar: " + err.message);
  }
}

