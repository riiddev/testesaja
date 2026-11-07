/**
 * POST /api/progress/sync
 *
 * Processes offline-first SRS events. Device submissions contain only the
 * official word identifier and whether the answer was correct; all counts,
 * mastery status, CEFR level, schedule, and rewards are derived on the server.
 */
import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import {
  getOfficialWord,
  OFFICIAL_SRS_INTERVALS
} from "../../_lib/officialWordCatalog.js";
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
    if (updates.length > 25) {
      return sendValidationError(res, "Satu batch sinkronisasi maksimal berisi 25 event.");
    }

    // Validate the full batch before any database writes.
    const seenEventIds = new Set();
    const validatedUpdates = [];

    for (const item of updates) {
      const eventId = String(item?.eventId || "").trim();
      const wordId = String(item?.wordId || "").trim();
      const officialWord = getOfficialWord(wordId);

      if (!eventId || eventId.length > 140 || !/^[\x21-\x7e]+$/.test(eventId)) {
        return sendValidationError(res, "ID event SRS tidak valid atau tidak tersedia.");
      }
      if (seenEventIds.has(eventId)) {
        return sendValidationError(res, "Satu batch tidak boleh memuat event ID yang sama dua kali.");
      }
      if (!officialWord) {
        return sendValidationError(res, `Kata '${wordId.slice(0, 80)}' tidak ditemukan dalam korpus Oxford 3000 resmi.`);
      }
      if (typeof item.isCorrect !== "boolean") {
        return sendValidationError(res, "Status jawaban benar/salah harus disertakan untuk setiap event SRS.");
      }

      seenEventIds.add(eventId);
      validatedUpdates.push({ eventId, wordId: officialWord.id, officialWord, isCorrect: item.isCorrect });
    }

    const processedEvents = [];
    let xpGrantedTotal = 0;
    let coinsGrantedTotal = 0;

    for (const item of validatedUpdates) {
      const { eventId, wordId, officialWord, isCorrect } = item;

      const existingEvent = await db
        .select({ id: schema.progressEvents.id })
        .from(schema.progressEvents)
        .where(and(
          eq(schema.progressEvents.userId, user.id),
          eq(schema.progressEvents.eventId, eventId)
        ))
        .limit(1);

      if (existingEvent.length > 0) {
        processedEvents.push(eventId);
        continue;
      }

      const existingWord = await db
        .select()
        .from(schema.progress)
        .where(and(
          eq(schema.progress.userId, user.id),
          eq(schema.progress.wordId, wordId)
        ))
        .limit(1);

      const now = new Date();
      const isFirstTimeWord = existingWord.length === 0;
      const currentCorrect = Number(existingWord[0]?.correctCount || 0);
      const currentWrong = Number(existingWord[0]?.wrongCount || 0);

      // Counts are cumulative server state. Never trust client-supplied totals,
      // masteryStage, intervalDays, CEFR level, or nextReviewAt.
      const nextCorrect = isCorrect ? currentCorrect + 1 : Math.max(0, currentCorrect - 1);
      const nextWrong = isCorrect ? currentWrong : currentWrong + 1;
      const masteryStage = nextCorrect >= 5
        ? "mastered"
        : (isCorrect ? "learning" : "weak");
      const intervalIndex = isCorrect
        ? Math.min(Math.max(0, nextCorrect - 1), OFFICIAL_SRS_INTERVALS.length - 1)
        : 0;
      const intervalDays = OFFICIAL_SRS_INTERVALS[intervalIndex];
      const nextReviewDate = new Date(now);
      nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
      const isNewlyMastered = masteryStage === "mastered" &&
        existingWord[0]?.masteryStage !== "mastered";
      const activityType = isFirstTimeWord ? "vocab_learn" : "srs_review";

      await db.insert(schema.progressEvents).values({
        userId: user.id,
        eventId,
        activityType,
        payload: {
          wordId,
          level: officialWord.level,
          isCorrect,
          masteryStage,
          intervalDays,
          correctCount: nextCorrect,
          wrongCount: nextWrong,
          nextReviewAt: nextReviewDate.toISOString()
        }
      });

      if (isFirstTimeWord) {
        await db.insert(schema.progress).values({
          userId: user.id,
          wordId,
          level: officialWord.level,
          masteryStage,
          intervalDays,
          correctCount: nextCorrect,
          wrongCount: nextWrong,
          nextReviewAt: nextReviewDate,
          lastReviewedAt: now
        });
      } else {
        await db
          .update(schema.progress)
          .set({
            level: officialWord.level,
            masteryStage,
            intervalDays,
            correctCount: nextCorrect,
            wrongCount: nextWrong,
            nextReviewAt: nextReviewDate,
            lastReviewedAt: now
          })
          .where(and(
            eq(schema.progress.userId, user.id),
            eq(schema.progress.wordId, wordId)
          ));
      }

      const statUpdates = {
        totalReviews: sql`${schema.userStats.totalReviews} + 1`,
        updatedAt: now
      };
      if (isFirstTimeWord) {
        statUpdates.wordsStarted = sql`${schema.userStats.wordsStarted} + 1`;
      }
      if (isNewlyMastered) {
        statUpdates.wordsMastered = sql`${schema.userStats.wordsMastered} + 1`;
        if (officialWord.level === "B2") {
          statUpdates.b2Mastered = sql`${schema.userStats.b2Mastered} + 1`;
        }
      }

      await db.update(schema.userStats)
        .set(statUpdates)
        .where(eq(schema.userStats.userId, user.id));

      const rewardConfig = isFirstTimeWord
        ? REWARDS_CONFIG.vocab_learn_word
        : REWARDS_CONFIG.srs_review_word;
      const rewardTx = await recordLedgerTransaction({
        userId: user.id,
        eventId: `srs_reward:${eventId}`,
        source: activityType,
        xpEarned: rewardConfig.xp,
        coinsEarned: rewardConfig.coins
      });

      if (!rewardTx.alreadyProcessed) {
        xpGrantedTotal += rewardTx.xpEarned;
        coinsGrantedTotal += rewardTx.coinsEarned;
      }

      processedEvents.push(eventId);
    }

    const streakResult = processedEvents.length > 0
      ? await evaluateAndRecordStreak(user.id)
      : null;

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
