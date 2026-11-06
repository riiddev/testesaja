/**
 * POST /api/matching/record
 * 
 * Records sentence-context matching session and awards server-side XP & coins.
 */

import { eq, and, gte, lt, sum, sql } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import { isOfficialMatchingWordId } from "../../_lib/matchingCatalog.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
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
    const matchedPairs = Array.isArray(body.matchedPairs) ? body.matchedPairs : [];
    const sessionId = String(body.sessionId || "").trim();
    const durationSeconds = Math.max(0, Math.min(3600, parseInt(body.durationSeconds, 10) || 0));

    if (!/^[a-zA-Z0-9_-]{6,120}$/.test(sessionId)) {
      return sendValidationError(res, "ID sesi Matching tidak valid.");
    }
    if (matchedPairs.length !== 5) {
      return sendValidationError(res, "Satu sesi Matching harus menyelesaikan tepat 5 pasangan.");
    }

    const usedWordIds = new Set();
    for (const pair of matchedPairs) {
      const wordId = String(pair?.wordId || "");
      const leftId = String(pair?.leftId || "");
      const rightId = String(pair?.rightId || "");
      const prefix = `pair_${wordId}_`;
      const sequence = leftId.startsWith(prefix) ? leftId.slice(prefix.length) : "";
      const sequenceIndex = Number(sequence);

      if (
        !isOfficialMatchingWordId(wordId) ||
        usedWordIds.has(wordId) ||
        leftId !== rightId ||
        !sequence ||
        !Number.isInteger(sequenceIndex) ||
        sequenceIndex < 0 ||
        sequenceIndex >= 5
      ) {
        return sendValidationError(res, "Pasangan Matching tidak cocok dengan katalog vocabulary resmi.");
      }
      usedWordIds.add(wordId);
    }

    // The browser submits pair identities only. The server sets score and total.
    const score = 5;
    const total = 5;
    const accuracy = 100;
    const now = new Date();
    const wibDate = getWibDateStr(now);
    const dayStart = new Date(Date.parse(`${wibDate}T00:00:00+07:00`));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const rewardConfig = REWARDS_CONFIG.matching_round_complete || { xp: 25, coins: 10, dailyCapXp: 100 };
    const capXp = Math.max(0, Number(rewardConfig.dailyCapXp) || 100);
    const spentRows = await db
      .select({ spentXp: sum(schema.transactions.xpAmount) })
      .from(schema.transactions)
      .where(and(
        eq(schema.transactions.userId, user.id),
        eq(schema.transactions.source, "matching_round"),
        gte(schema.transactions.createdAt, dayStart),
        lt(schema.transactions.createdAt, dayEnd)
      ));
    const spentXp = Number(spentRows[0]?.spentXp || 0);
    const remainingXp = Math.max(0, capXp - spentXp);
    const xpAward = Math.min(Number(rewardConfig.xp) || 25, remainingXp);
    const coinsAward = xpAward > 0 ? (Number(rewardConfig.coins) || 10) : 0;

    const eventId = `matching:${user.id}:${sessionId}`;
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "matching_round",
      xpEarned: xpAward,
      coinsEarned: coinsAward
    });

    let activityId = null;
    if (!tx.alreadyProcessed) {
      activityId = `act_${user.id}_match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(schema.activityLog).values({
        id: activityId,
        userId: user.id,
        activityType: "matching",
        title: "Matching Konteks Kalimat",
        score,
        totalQuestions: total,
        accuracyPercent: accuracy,
        durationSeconds,
        xpEarned: tx.xpEarned,
        coinsEarned: tx.coinsEarned,
        createdAt: now
      });

      await db
        .update(schema.userStats)
        .set({
          matchingCompleted: sql`${schema.userStats.matchingCompleted} + 1`,
          updatedAt: now
        })
        .where(eq(schema.userStats.userId, user.id));
    }

    const streakRes = tx.alreadyProcessed ? null : await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        activityId,
        score,
        total,
        accuracy,
        dailyCapXp: capXp,
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

