/**
 * POST /api/quests/claim
 *
 * Grants a fixed reward for one of today's generated missions only after
 * server-written activity records prove that its target has been reached.
 * The ledger row and claim marker are committed in the same transaction.
 */
import { eq, and } from "drizzle-orm";
import { withTransaction, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { getDailyQuestSnapshot } from "../../_lib/dailyQuestProgress.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

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
        "Misi belum selesai (Progres: " +
          quest.progress +
          "/" +
          quest.target +
          "). Selesaikan misi terlebih dahulu."
      );
    }

    const xpReward = Math.max(0, Number(quest.xpReward) || 0);
    const coinsReward = Math.max(0, Number(quest.coinsReward) || 0);
    const eventId = "quest_claim:" + todayWib + ":" + questId;

    const result = await withTransaction(async (tx) => {
      // The same account-level lock is used by the ledger and shop. It makes
      // the claim check, reward grant and claim marker serial for this user.
      await tx
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      const existingClaim = await tx
        .select({ id: schema.questClaims.id })
        .from(schema.questClaims)
        .where(and(
          eq(schema.questClaims.userId, user.id),
          eq(schema.questClaims.questDate, todayWib),
          eq(schema.questClaims.questId, questId)
        ))
        .limit(1);

      if (existingClaim.length > 0) {
        throw validationError("Hadiah misi ini sudah diklaim sebelumnya.");
      }

      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId,
        source: "daily_quest",
        xpEarned: xpReward,
        coinsEarned: coinsReward
      });

      const claimRows = await tx
        .insert(schema.questClaims)
        .values({
          userId: user.id,
          questDate: todayWib,
          questId,
          xpReward,
          coinsReward
        })
        .onConflictDoNothing()
        .returning({ id: schema.questClaims.id });

      if (!claimRows.length) {
        throw validationError("Hadiah misi ini sudah diklaim sebelumnya.");
      }

      return ledger;
    });

    return sendSuccess(
      res,
      {
        questId,
        earnedXp: result.alreadyProcessed ? 0 : result.xpEarned,
        earnedCoins: result.alreadyProcessed ? 0 : result.coinsEarned,
        totalXp: result.totalXp,
        totalCoins: result.totalCoins,
        alreadyClaimed: result.alreadyProcessed
      },
      result.alreadyProcessed
        ? "Hadiah misi ini telah diproses sebelumnya."
        : "Selamat! Hadiah misi berhasil diklaim (+" +
          xpReward +
          " EXP, +" +
          coinsReward +
          " Sinau Coin)."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API quests/claim] Error:", err);
    return sendServerError(res, "Gagal mengklaim hadiah misi.");
  }
}
