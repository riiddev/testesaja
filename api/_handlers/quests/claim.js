/**
 * POST /api/quests/claim
 *
 * Grants the fixed reward for one of today's generated missions only after
 * server-written activity records prove that its target has been reached.
 */
import { eq, and } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { getDailyQuestSnapshot } from "../../_lib/dailyQuestProgress.js";
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
    const todayWib = getWibDateStr(new Date());

    if (!questId) {
      return sendValidationError(res, "Parameter questId wajib disertakan.");
    }

    const snapshot = await getDailyQuestSnapshot(user.id, todayWib);
    const quest = snapshot.quests.find((item) => item.id === questId);

    if (!quest) {
      return sendValidationError(res, "Misi tidak termasuk dalam daftar misi harian akun ini.");
    }

    if (quest.progress < quest.target) {
      return sendValidationError(
        res,
        `Misi belum selesai (Progres: ${quest.progress}/${quest.target}). Selesaikan misi terlebih dahulu.`
      );
    }

    const existingClaim = await db
      .select({ id: schema.questClaims.id })
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

    // Reward amounts come from the server-owned mission catalog. No fallback
    // reward is issued for unknown IDs.
    const xpReward = Math.max(0, Number(quest.xpReward) || 0);
    const coinsReward = Math.max(0, Number(quest.coinsReward) || 0);
    const eventId = `quest_claim:${todayWib}:${questId}`;

    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "daily_quest",
      xpEarned: xpReward,
      coinsEarned: coinsReward
    });

    // Upsert semantics allow a retry after a server interruption between the
    // ledger write and the claim marker without crediting the reward twice.
    await db
      .insert(schema.questClaims)
      .values({
        userId: user.id,
        questDate: todayWib,
        questId,
        xpReward,
        coinsReward
      })
      .onConflictDoNothing();

    return sendSuccess(
      res,
      {
        questId,
        earnedXp: tx.alreadyProcessed ? 0 : tx.xpEarned,
        earnedCoins: tx.alreadyProcessed ? 0 : tx.coinsEarned,
        totalXp: tx.totalXp,
        totalCoins: tx.totalCoins,
        alreadyClaimed: tx.alreadyProcessed
      },
      tx.alreadyProcessed
        ? "Hadiah misi ini telah diproses sebelumnya."
        : `Selamat! Hadiah misi berhasil diklaim (+${xpReward} EXP, +${coinsReward} Sinau Coin).`
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
