/**
 * POST /api/matching/record
 * 
 * Records sentence-context matching session and awards server-side XP & coins.
 */

import { eq, sql } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
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
    const score = Math.max(0, parseInt(body.score, 10) || 0);
    const total = Math.max(1, parseInt(body.total || body.totalRounds, 10) || 5);
    const durationSeconds = Math.max(0, parseInt(body.durationSeconds, 10) || 0);
    const sessionId = body.sessionId || `match_${Date.now()}`;

    const now = new Date();
    const accuracy = Math.round((score / total) * 100);

    // 1. Award reward via ledger
    const rewardConfig = REWARDS_CONFIG.matching_round_complete || { xp: 25, coins: 10 };
    const eventId = `matching:${user.id}:${sessionId}`;
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "matching_round",
      xpEarned: rewardConfig.xp,
      coinsEarned: rewardConfig.coins
    });

    // 2. Insert into activity_log
    const activityId = `act_${user.id}_match_${Date.now()}`;
    await db.insert(schema.activityLog).values({
      id: activityId,
      userId: user.id,
      activityType: "matching",
      title: "Matching Konteks Kalimat",
      score,
      totalQuestions: total,
      accuracyPercent: accuracy,
      durationSeconds,
      xpEarned: tx.alreadyProcessed ? 0 : tx.xpEarned,
      coinsEarned: tx.alreadyProcessed ? 0 : tx.coinsEarned,
      createdAt: now
    });

    // 3. Update user stats
    await db
      .update(schema.userStats)
      .set({
        matchingCompleted: sql`${schema.userStats.matchingCompleted} + 1`,
        updatedAt: now
      })
      .where(eq(schema.userStats.userId, user.id));

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        activityId,
        score,
        total,
        accuracy,
        earnedXp: tx.alreadyProcessed ? 0 : tx.xpEarned,
        earnedCoins: tx.alreadyProcessed ? 0 : tx.coinsEarned,
        streak: streakRes?.streak
      },
      "Sesi matching konteks kalimat berhasil dicatat!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API matching/record] Error:", err);
    return sendServerError(res, "Gagal mencatat sesi matching: " + err.message);
  }
}

