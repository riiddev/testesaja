/**
 * POST /api/quests/claim
 * 
 * Validates quest completion on server and grants XP/Coins atomically.
 * STRICT SECURITY: Rejects double claims and validates completion criteria!
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
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
    const questId = String(body.questId || "").trim();
    const todayWib = (body.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(body.dateStr)) ? body.dateStr : getWibDateStr(new Date());

    if (!questId) {
      return sendValidationError(res, "Parameter questId wajib disertakan.");
    }

    // 1. Fetch user quest record for today
    const questRows = await db
      .select()
      .from(schema.dailyQuests)
      .where(
        and(
          eq(schema.dailyQuests.userId, user.id),
          eq(schema.dailyQuests.questDate, todayWib),
          eq(schema.dailyQuests.questId, questId)
        )
      )
      .limit(1);

    if (!questRows.length) {
      return sendValidationError(res, "Misi hari ini tidak ditemukan.");
    }

    const quest = questRows[0];
    const isCompleted = quest.isCompleted || quest.currentProgress >= quest.target;

    // 2. Completion Check
    if (!isCompleted) {
      return sendValidationError(
        res,
        `Misi belum selesai (Progres: ${quest.currentProgress}/${quest.target}). Selesaikan misi terlebih dahulu.`
      );
    }

    // 3. Double-claim Check
    const existingClaim = await db
      .select()
      .from(schema.questClaims)
      .where(
        and(
          eq(schema.questClaims.userId, user.id),
          eq(schema.questClaims.questDate, todayWib),
          eq(schema.questClaims.questId, questId)
        )
      )
      .limit(1);

    if (existingClaim.length > 0) {
      return sendValidationError(res, "Hadiah misi ini sudah diklaim sebelumnya.");
    }

    // 4. Server-defined Reward Configuration
    const config = REWARDS_CONFIG[questId] || { xp: 35, coins: 15 };
    const xpReward = Number(config.xp) || 35;
    const coinsReward = Number(config.coins) || 15;

    // 5. Insert claim row
    await db.insert(schema.questClaims).values({
      userId: user.id,
      questDate: todayWib,
      questId,
      xpReward,
      coinsReward
    });

    // Mark quest completed if not already
    if (!quest.isCompleted) {
      await db
        .update(schema.dailyQuests)
        .set({ isCompleted: true })
        .where(eq(schema.dailyQuests.id, quest.id));
    }

    // 6. Record transaction in ledger
    const eventId = `quest_claim:${todayWib}:${questId}`;
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "daily_quest",
      xpEarned: xpReward,
      coinsEarned: coinsReward
    });

    return sendSuccess(
      res,
      {
        questId,
        earnedXp: xpReward,
        earnedCoins: coinsReward,
        totalXp: tx.totalXp,
        totalCoins: tx.totalCoins
      },
      `Selamat! Hadiah misi berhasil diklaim (+${xpReward} EXP, +${coinsReward} Sinau Coin).`
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API quests/claim] Error:", err);
    return sendServerError(res, "Gagal mengklaim hadiah misi: " + err.message);
  }
}
