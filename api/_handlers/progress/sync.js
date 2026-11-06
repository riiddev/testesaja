/**
 * POST /api/progress/sync
 * 
 * Batch processes offline-first Spaced Repetition (SRS) review updates.
 * STRICT SECURITY & IDEMPOTENCY:
 * - Each item must contain a unique `eventId`
 * - Skips previously recorded eventIds to prevent double counting
 * - Updates user stats, profile XP, and coins via server ledger
 */

import { eq, and, sql } from "drizzle-orm";
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
    const updates = Array.isArray(body.updates) ? body.updates : [];

    if (updates.length === 0) {
      return sendSuccess(res, { processedEvents: [], count: 0 }, "Tidak ada antrean progres.");
    }

    const processedEvents = [];
    let xpGrantedTotal = 0;
    let coinsGrantedTotal = 0;

    for (const item of updates) {
      const eventId = String(item.eventId || "").trim();
      const wordId = String(item.wordId || "").trim();

      if (!wordId) continue;

      const safeEventId = eventId || `srs_${user.id}_${wordId}_${Date.now()}`;

      // 1. Idempotency Check in progress_events ledger
      const existingEvent = await db
        .select({ id: schema.progressEvents.id })
        .from(schema.progressEvents)
        .where(
          and(
            eq(schema.progressEvents.userId, user.id),
            eq(schema.progressEvents.eventId, safeEventId)
          )
        )
        .limit(1);

      if (existingEvent.length > 0) {
        // Event already processed in a previous batch (e.g. network timeout retry)
        processedEvents.push(safeEventId);
        continue;
      }

      // 2. Read existing progress first so the server can classify a genuinely
      // first-seen word separately from a repeat SRS review.
      const existingWord = await db
        .select()
        .from(schema.progress)
        .where(
          and(
            eq(schema.progress.userId, user.id),
            eq(schema.progress.wordId, wordId)
          )
        )
        .limit(1);

      const isFirstTimeWord = existingWord.length === 0;

      // 3. Record an idempotent server-owned activity classification.
      await db.insert(schema.progressEvents).values({
        userId: user.id,
        eventId: safeEventId,
        activityType: isFirstTimeWord ? "vocab_learn" : "srs_review",
        payload: {
          wordId,
          level: item.level || "A1",
          masteryStage: item.masteryStage || "learning",
          correctCount: item.correctCount || 0,
          wrongCount: item.wrongCount || 0,
          nextReviewAt: item.nextReviewAt || null
        }
      });

      // 4. Upsert Spaced Repetition Progress
      const isNewlyMastered =
        item.masteryStage === "mastered" &&
        (!existingWord.length || existingWord[0].masteryStage !== "mastered");

      const nextReviewDate = item.nextReviewAt ? new Date(item.nextReviewAt) : null;
      const intervalDays = Math.max(1, parseInt(item.intervalDays, 10) || 1);

      if (isFirstTimeWord) {
        await db.insert(schema.progress).values({
          userId: user.id,
          wordId,
          level: item.level || "A1",
          masteryStage: item.masteryStage || "fresh",
          intervalDays,
          correctCount: item.correctCount || 0,
          wrongCount: item.wrongCount || 0,
          nextReviewAt: nextReviewDate,
          lastReviewedAt: new Date()
        });
      } else {
        await db
          .update(schema.progress)
          .set({
            level: item.level || existingWord[0].level,
            masteryStage: item.masteryStage || existingWord[0].masteryStage,
            intervalDays,
            correctCount: item.correctCount !== undefined ? item.correctCount : existingWord[0].correctCount,
            wrongCount: item.wrongCount !== undefined ? item.wrongCount : existingWord[0].wrongCount,
            nextReviewAt: nextReviewDate,
            lastReviewedAt: new Date()
          })
          .where(
            and(
              eq(schema.progress.userId, user.id),
              eq(schema.progress.wordId, wordId)
            )
          );
      }

      // 4. Update User Stats
      const statUpdates = {
        totalReviews: sql`${schema.userStats.totalReviews} + 1`,
        updatedAt: new Date()
      };
      if (isFirstTimeWord) {
        statUpdates.wordsStarted = sql`${schema.userStats.wordsStarted} + 1`;
      }
      if (isNewlyMastered) {
        statUpdates.wordsMastered = sql`${schema.userStats.wordsMastered} + 1`;
        if (item.level === "B2") {
          statUpdates.b2Mastered = sql`${schema.userStats.b2Mastered} + 1`;
        }
      }

      await db
        .update(schema.userStats)
        .set(statUpdates)
        .where(eq(schema.userStats.userId, user.id));

      // 5. Award Review Reward via Ledger
      const rewardConfig = REWARDS_CONFIG.srs_review_word || { xp: 3, coins: 1 };
      const rewardTx = await recordLedgerTransaction({
        userId: user.id,
        eventId: `srs_reward:${safeEventId}`,
        source: "srs_review_word",
        xpEarned: rewardConfig.xp,
        coinsEarned: rewardConfig.coins
      });

      if (!rewardTx.alreadyProcessed) {
        xpGrantedTotal += rewardConfig.xp;
        coinsGrantedTotal += rewardConfig.coins;
      }

      processedEvents.push(safeEventId);
    }

    // 6. Record streak for active learning day
    const streakResult = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        processedEvents,
        count: processedEvents.length,
        xpGranted: xpGrantedTotal,
        coinsGranted: coinsGrantedTotal,
        streak: streakResult?.streak
      },
      `Berhasil menyinkronkan ${processedEvents.length} aktivitas belajar.`
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API progress/sync] Error:", err);
    return sendServerError(res, "Gagal menyinkronkan progres belajar: " + err.message);
  }
}

