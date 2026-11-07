/**
 * POST /api/matching/record
 *
 * Validates official sentence-context pairs and commits the ledger, activity
 * record, statistics and WIB streak in one transaction.
 */

import { eq, and, gte, lt, sum, sql } from "drizzle-orm";
import { getTransactionDb, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreakInTransaction } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import { validateOfficialMatchingPairs } from "../../_lib/matchingCatalog.js";
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

    const matchValidation = validateOfficialMatchingPairs(matchedPairs);
    if (!matchValidation.valid) {
      return sendValidationError(res, matchValidation.message);
    }

    const score = matchValidation.score;
    const total = matchValidation.total;
    const accuracy = 100;
    const now = new Date();
    const wibDate = getWibDateStr(now);
    const dayStart = new Date(Date.parse(wibDate + "T00:00:00+07:00"));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const eventId = "matching:" + user.id + ":" + sessionId;

    const result = await getTransactionDb().transaction(async (tx) => {
      // Serialize matching sessions per account so simultaneous sessions
      // cannot all read the same remaining daily XP allowance.
      await tx
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      const existing = await tx
        .select({ id: schema.transactions.id })
        .from(schema.transactions)
        .where(and(
          eq(schema.transactions.userId, user.id),
          eq(schema.transactions.eventId, eventId)
        ))
        .limit(1);

      if (existing.length) {
        const ledger = await recordLedgerTransactionInTransaction(tx, {
          userId: user.id,
          eventId,
          source: "matching_round",
          xpEarned: 0,
          coinsEarned: 0
        });
        return { ledger, activityId: null, score, total, accuracy, dailyCapXp: 0, streak: null };
      }

      const rewardConfig = REWARDS_CONFIG.matching_round_complete;
      const capXp = Math.max(0, Number(rewardConfig.dailyCapXp) || 100);
      const spentRows = await tx
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

      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId,
        source: "matching_round",
        xpEarned: xpAward,
        coinsEarned: coinsAward
      });

      let activityId = null;
      if (!ledger.alreadyProcessed) {
        activityId = "act_" + user.id + "_match_" + Date.now() + "_" +
          Math.random().toString(36).slice(2, 8);

        await tx.insert(schema.activityLog).values({
          id: activityId,
          userId: user.id,
          activityType: "matching",
          title: "Matching Konteks Kalimat",
          score,
          totalQuestions: total,
          accuracyPercent: accuracy,
          durationSeconds,
          xpEarned: ledger.xpEarned,
          coinsEarned: ledger.coinsEarned,
          createdAt: now
        });

        await tx
          .update(schema.userStats)
          .set({
            matchingCompleted: sql`${schema.userStats.matchingCompleted} + 1`,
            updatedAt: now
          })
          .where(eq(schema.userStats.userId, user.id));
      }

      const streak = ledger.alreadyProcessed
        ? null
        : await evaluateAndRecordStreakInTransaction(tx, user.id);

      return {
        ledger,
        activityId,
        score,
        total,
        accuracy,
        dailyCapXp: capXp,
        streak
      };
    });

    return sendSuccess(
      res,
      {
        activityId: result.activityId,
        score: result.score,
        total: result.total,
        accuracy: result.accuracy,
        dailyCapXp: result.dailyCapXp,
        earnedXp: result.ledger.alreadyProcessed ? 0 : result.ledger.xpEarned,
        earnedCoins: result.ledger.alreadyProcessed ? 0 : result.ledger.coinsEarned,
        streak: result.streak?.streak
      },
      "Sesi matching konteks kalimat berhasil dicatat!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API matching/record] Error:", err);
    return sendServerError(res, "Gagal mencatat sesi matching.");
  }
}
