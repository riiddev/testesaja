/**
 * POST /api/reward/grant
 * 
 * Secure server-side reward granting engine with deterministic idempotency.
 * BUTIR A: Reading rewards granted strictly ONCE per article per user.
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
    const source = String(body.source || "").trim();
    const refId = String(body.refId || "").trim();

    if (!source) {
      return sendValidationError(res, "Parameter source wajib diisi.");
    }

    let deterministicEventId = "";
    let xpAmount = 0;
    let coinsAmount = 0;
    let isHabitReading = false;

    // 1. Determine Reward Policy by Activity Source
    switch (source) {
      case "reading_reward":
      case "reading_complete": {
        if (!refId) return sendValidationError(res, "Parameter refId (articleId) wajib disertakan untuk membaca.");
        deterministicEventId = `reading:${refId}:first_complete`;
        xpAmount = REWARDS_CONFIG.reading_first_complete.xp;
        coinsAmount = REWARDS_CONFIG.reading_first_complete.coins;
        isHabitReading = true;
        break;
      }

      case "reading_quiz_complete": {
        if (!refId) return sendValidationError(res, "Parameter refId (articleId) wajib disertakan untuk kuis membaca.");
        deterministicEventId = `reading_quiz:${refId}:first_complete`;
        xpAmount = REWARDS_CONFIG.reading_quiz_first_complete.xp;
        coinsAmount = REWARDS_CONFIG.reading_quiz_first_complete.coins;
        break;
      }

      case "story_episode": {
        if (!refId) return sendValidationError(res, "Parameter refId (storyId:episodeId) wajib disertakan.");
        deterministicEventId = `story:${refId}:complete`;
        xpAmount = REWARDS_CONFIG.story_episode_complete.xp;
        coinsAmount = REWARDS_CONFIG.story_episode_complete.coins;
        break;
      }

      case "matching_round": {
        const roundId = body.eventId || `round_${Date.now()}`;
        deterministicEventId = `matching:${roundId}`;
        xpAmount = REWARDS_CONFIG.matching_round_complete.xp;
        coinsAmount = REWARDS_CONFIG.matching_round_complete.coins;
        break;
      }

      case "grammar_quiz": {
        if (!refId) return sendValidationError(res, "Parameter refId (topicId) wajib disertakan.");
        deterministicEventId = `grammar:${refId}:quiz`;
        xpAmount = REWARDS_CONFIG.grammar_quiz_complete.xp;
        coinsAmount = REWARDS_CONFIG.grammar_quiz_complete.coins;
        break;
      }

      default: {
        return sendValidationError(res, `Sumber aktivitas '${source}' tidak valid.`);
      }
    }

    // 2. Execute Ledger Transaction (Atomically & Idempotently)
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId: deterministicEventId,
      source,
      xpEarned: xpAmount,
      coinsEarned: coinsAmount
    });

    // 3. Handle Already Rewarded (Membaca Ulang / Percobaan Ganda)
    if (tx.alreadyProcessed) {
      return sendSuccess(
        res,
        {
          alreadyRewarded: true,
          earnedXp: 0,
          earnedCoins: 0,
          totalXp: tx.totalXp,
          totalCoins: tx.totalCoins
        },
        isHabitReading
          ? "Artikel sudah selesai dibaca sebelumnya. Membaca ulang tidak memberikan koin tambahan."
          : "Hadiah untuk aktivitas ini sudah pernah diterima."
      );
    }

    // 4. Update stats & streak for first-time completion
    if (isHabitReading) {
      await db
        .update(schema.userStats)
        .set({
          readingCompleted: sql`${schema.userStats.readingCompleted} + 1`,
          updatedAt: new Date()
        })
        .where(eq(schema.userStats.userId, user.id));
    }

    // Evaluate streak for study activity
    const streakResult = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        alreadyRewarded: false,
        earnedXp: tx.xpEarned,
        earnedCoins: tx.coinsEarned,
        totalXp: tx.totalXp,
        totalCoins: tx.totalCoins,
        streak: streakResult?.streak || undefined
      },
      `Berhasil mendapatkan +${tx.xpEarned} EXP & +${tx.coinsEarned} Sinau Coin!`
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API reward/grant] Error:", err);
    return sendServerError(res, "Gagal memproses hadiah: " + err.message);
  }
}

