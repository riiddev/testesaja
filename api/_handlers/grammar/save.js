/**
 * POST /api/grammar/save
 *
 * Validates official Grammar answers and commits mastery, one-time rewards,
 * activity history and the WIB streak as a single account transaction.
 */

import { eq, and, sql } from "drizzle-orm";
import { withTransaction, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreakInTransaction } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import { getOfficialGrammarQuiz } from "../../_lib/grammarQuizCatalog.js";
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
    const topicId = String(body.topicId || "").trim();

    if (!topicId) {
      return sendValidationError(res, "Parameter topicId wajib disertakan.");
    }

    const officialQuestions = getOfficialGrammarQuiz(topicId);
    if (!officialQuestions?.length) {
      return sendValidationError(res, "Topik tidak ditemukan dalam kurikulum Grammar resmi.");
    }

    const submittedAnswers = Array.isArray(body.answers) ? body.answers : [];
    if (submittedAnswers.length !== officialQuestions.length) {
      return sendValidationError(
        res,
        "Semua " + officialQuestions.length + " soal wajib dijawab sebelum hasil disimpan."
      );
    }

    const answerMap = new Map();
    for (const answer of submittedAnswers) {
      const questionId = String(answer?.questionId || "");
      const selectedIndex = Number(answer?.selectedIndex);
      if (!questionId || answerMap.has(questionId) || !Number.isInteger(selectedIndex)) {
        return sendValidationError(res, "Format jawaban Grammar tidak valid.");
      }
      answerMap.set(questionId, selectedIndex);
    }

    let score = 0;
    for (const question of officialQuestions) {
      const selectedIndex = answerMap.get(question.id);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
        return sendValidationError(res, "Jawaban Grammar tidak lengkap atau tidak valid.");
      }
      if (selectedIndex === question.correctIndex) score += 1;
    }

    const total = officialQuestions.length;
    const scorePct = Math.round((score / total) * 100);
    const isCompleted = scorePct >= 80;
    const now = new Date();

    const result = await withTransaction(async (tx) => {
      const profileRows = await tx
        .select({
          userId: schema.profiles.userId,
          xp: schema.profiles.xp,
          coins: schema.profiles.coins
        })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      if (!profileRows.length) {
        throw new Error("Profil pengguna tidak ditemukan.");
      }

      const existing = await tx
        .select()
        .from(schema.grammarProgress)
        .where(and(
          eq(schema.grammarProgress.userId, user.id),
          eq(schema.grammarProgress.topicId, topicId)
        ))
        .limit(1);

      const wasAlreadyCompleted = existing.length > 0 &&
        existing[0].status === "completed";

      if (!existing.length) {
        await tx.insert(schema.grammarProgress).values({
          userId: user.id,
          topicId,
          status: isCompleted ? "completed" : "in_progress",
          score,
          total,
          completedAt: isCompleted ? now : null
        });
      } else {
        await tx
          .update(schema.grammarProgress)
          .set({
            status: isCompleted ? "completed" : existing[0].status,
            score: Math.max(Number(existing[0].score) || 0, score),
            total,
            completedAt: isCompleted ? (existing[0].completedAt || now) : existing[0].completedAt
          })
          .where(and(
            eq(schema.grammarProgress.userId, user.id),
            eq(schema.grammarProgress.topicId, topicId)
          ));
      }

      let xpEarned = 0;
      let coinsEarned = 0;
      let totalXp = Number(profileRows[0].xp) || 0;
      let totalCoins = Number(profileRows[0].coins) || 0;

      if (isCompleted && !wasAlreadyCompleted) {
        const reward = REWARDS_CONFIG.grammar_quiz_complete;
        const ledger = await recordLedgerTransactionInTransaction(tx, {
          userId: user.id,
          eventId: "grammar:" + topicId + ":first_complete",
          source: "grammar_quiz",
          xpEarned: reward.xp,
          coinsEarned: reward.coins
        });

        totalXp = ledger.totalXp;
        totalCoins = ledger.totalCoins;
        if (!ledger.alreadyProcessed) {
          xpEarned = ledger.xpEarned;
          coinsEarned = ledger.coinsEarned;
          await tx
            .update(schema.userStats)
            .set({
              grammarCompleted: sql`${schema.userStats.grammarCompleted} + 1`,
              updatedAt: now
            })
            .where(eq(schema.userStats.userId, user.id));
        }
      }

      const activityId = "act_" + user.id + "_grammar_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);

      await tx.insert(schema.activityLog).values({
        id: activityId,
        userId: user.id,
        activityType: "grammar",
        title: ("Latihan Grammar: " + topicId).slice(0, 150),
        score,
        totalQuestions: total,
        accuracyPercent: scorePct,
        durationSeconds: 0,
        xpEarned,
        coinsEarned,
        createdAt: now
      });

      const streak = await evaluateAndRecordStreakInTransaction(tx, user.id);
      return {
        xpEarned,
        coinsEarned,
        totalXp,
        totalCoins,
        status: isCompleted || wasAlreadyCompleted ? "completed" : "in_progress",
        streak
      };
    });

    return sendSuccess(
      res,
      {
        topicId,
        status: result.status,
        score,
        total,
        scorePct,
        xpEarned: result.xpEarned,
        coinsEarned: result.coinsEarned,
        totalXp: result.totalXp,
        totalCoins: result.totalCoins,
        streak: result.streak?.streak
      },
      "Progres grammar berhasil disimpan."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API grammar/save] Error:", err);
    return sendServerError(res, "Gagal menyimpan progres grammar.");
  }
}
