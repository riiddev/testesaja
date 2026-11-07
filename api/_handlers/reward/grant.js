/**
 * POST /api/reward/grant
 *
 * Legacy compatibility endpoint for one-time HABIT article completion only.
 * Matching, Grammar, Reading Quiz and Story rewards must use their dedicated
 * endpoints, which verify the submitted work on the server.
 */

import { eq, sql } from "drizzle-orm";
import { getTransactionDb, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreakInTransaction } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import habitReadingLibrary from "../../../src/data/habit-reading-library.json" with { type: "json" };
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

    if (source !== "reading_reward" && source !== "reading_complete") {
      return sendValidationError(
        res,
        "Hadiah aktivitas ini harus diproses melalui endpoint penyelesaian resminya."
      );
    }

    if (!refId) {
      return sendValidationError(res, "Parameter refId (articleId) wajib disertakan untuk membaca.");
    }

    const officialArticle = habitReadingLibrary.passages?.find(
      (passage) => passage.id === refId
    );
    if (!officialArticle) {
      return sendValidationError(
        res,
        "Artikel tidak ditemukan dalam perpustakaan HABIT resmi."
      );
    }

    const reward = REWARDS_CONFIG.reading_first_complete;
    const eventId = "reading:" + refId + ":first_complete";

    const result = await getTransactionDb().transaction(async (tx) => {
      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId,
        source: "reading_complete",
        xpEarned: reward.xp,
        coinsEarned: reward.coins
      });

      if (ledger.alreadyProcessed) {
        return { ledger, streak: null };
      }

      await tx
        .update(schema.userStats)
        .set({
          readingCompleted: sql`${schema.userStats.readingCompleted} + 1`,
          updatedAt: new Date()
        })
        .where(eq(schema.userStats.userId, user.id));

      const streak = await evaluateAndRecordStreakInTransaction(tx, user.id);
      return { ledger, streak };
    });

    if (result.ledger.alreadyProcessed) {
      return sendSuccess(
        res,
        {
          alreadyRewarded: true,
          earnedXp: 0,
          earnedCoins: 0,
          totalXp: result.ledger.totalXp,
          totalCoins: result.ledger.totalCoins
        },
        "Artikel sudah selesai dibaca sebelumnya. Membaca ulang tidak memberikan koin tambahan."
      );
    }

    return sendSuccess(
      res,
      {
        alreadyRewarded: false,
        earnedXp: result.ledger.xpEarned,
        earnedCoins: result.ledger.coinsEarned,
        totalXp: result.ledger.totalXp,
        totalCoins: result.ledger.totalCoins,
        streak: result.streak?.streak
      },
      "Berhasil mendapatkan +" +
        result.ledger.xpEarned +
        " EXP & +" +
        result.ledger.coinsEarned +
        " Sinau Coin!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API reward/grant] Error:", err);
    return sendServerError(res, "Gagal memproses hadiah aktivitas.");
  }
}
