/**
 * POST /api/reading-quiz/record
 * 
 * Records comprehension quiz outcome for HABIT reading articles.
 */

import { eq, sql } from "drizzle-orm";
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
    const articleId = String(body.articleId || "").trim();
    const articleTitle = String(body.articleTitle || articleId).slice(0, 150);
    const score = Math.max(0, parseInt(body.score, 10) || 0);
    const total = Math.max(1, parseInt(body.total, 10) || 3);
    const durationSeconds = Math.max(0, parseInt(body.durationSeconds, 10) || 0);
    const wrongItems = Array.isArray(body.wrongItems) ? body.wrongItems : [];

    if (!articleId) {
      return sendValidationError(res, "Parameter articleId wajib disertakan.");
    }

    const now = new Date();
    const accuracy = Math.round((score / total) * 100);

    // 1. Reward: 1x first complete per article
    const rewardConfig = REWARDS_CONFIG.reading_quiz_first_complete || { xp: 35, coins: 15 };
    const eventId = `reading_quiz:${articleId}:first_complete`;
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "reading_quiz_complete",
      xpEarned: rewardConfig.xp,
      coinsEarned: rewardConfig.coins
    });

    // 2. Insert activity log
    const activityId = `act_${user.id}_rq_${Date.now()}`;
    await db.insert(schema.activityLog).values({
      id: activityId,
      userId: user.id,
      activityType: "reading_quiz",
      title: `Kuis Bacaan: ${articleTitle}`,
      score,
      totalQuestions: total,
      accuracyPercent: accuracy,
      durationSeconds,
      xpEarned: tx.alreadyProcessed ? 0 : tx.xpEarned,
      coinsEarned: tx.alreadyProcessed ? 0 : tx.coinsEarned,
      createdAt: now
    });

    // 3. Insert attempt details (90 days retention for practice history)
    if (wrongItems.length > 0) {
      await db.insert(schema.attemptDetails).values({
        activityId,
        userId: user.id,
        wrongItems,
        questionsBreakdown: body.questionsBreakdown || [],
        createdAt: now
      });
    }

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        activityId,
        score,
        total,
        accuracy,
        alreadyRewarded: tx.alreadyProcessed,
        earnedXp: tx.alreadyProcessed ? 0 : tx.xpEarned,
        earnedCoins: tx.alreadyProcessed ? 0 : tx.coinsEarned,
        streak: streakRes?.streak
      },
      "Kuis bacaan berhasil diselesaikan!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API reading-quiz/record] Error:", err);
    return sendServerError(res, "Gagal mencatat kuis bacaan: " + err.message);
  }
}

