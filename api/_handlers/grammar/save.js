/**
 * POST /api/grammar/save
 * 
 * Saves grammar practice or quiz completion and awards server-side XP & coins.
 */

import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import { getOfficialGrammarQuiz } from "../../_lib/grammarQuizCatalog.js";
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
      return sendValidationError(res, `Semua ${officialQuestions.length} soal wajib dijawab sebelum hasil disimpan.`);
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

    const existing = await db
      .select()
      .from(schema.grammarProgress)
      .where(
        and(
          eq(schema.grammarProgress.userId, user.id),
          eq(schema.grammarProgress.topicId, topicId)
        )
      )
      .limit(1);

    const wasAlreadyCompleted = existing.length > 0 && existing[0].status === "completed";

    if (existing.length === 0) {
      await db.insert(schema.grammarProgress).values({
        userId: user.id,
        topicId,
        status: isCompleted ? "completed" : "in_progress",
        score,
        total,
        completedAt: isCompleted ? now : null
      });
    } else {
      await db
        .update(schema.grammarProgress)
        .set({
          status: isCompleted ? "completed" : existing[0].status,
          score: Math.max(existing[0].score, score),
          total,
          completedAt: isCompleted ? now : existing[0].completedAt
        })
        .where(
          and(
            eq(schema.grammarProgress.userId, user.id),
            eq(schema.grammarProgress.topicId, topicId)
          )
        );
    }

    let xpEarned = 0;
    let coinsEarned = 0;

    // Grant reward if completed for the first time
    if (isCompleted && !wasAlreadyCompleted) {
      await db
        .update(schema.userStats)
        .set({
          grammarCompleted: sql`${schema.userStats.grammarCompleted} + 1`,
          updatedAt: now
        })
        .where(eq(schema.userStats.userId, user.id));

      const rewardConfig = REWARDS_CONFIG.grammar_quiz_complete || { xp: 30, coins: 15 };
      const eventId = `grammar:${topicId}:first_complete`;
      const tx = await recordLedgerTransaction({
        userId: user.id,
        eventId,
        source: "grammar_quiz",
        xpEarned: rewardConfig.xp,
        coinsEarned: rewardConfig.coins
      });

      if (!tx.alreadyProcessed) {
        xpEarned = rewardConfig.xp;
        coinsEarned = rewardConfig.coins;
      }
    }

    // Every fully submitted quiz is a completed learning activity, even
    // when its score is below the mastery threshold. Mastery and rewards are
    // still controlled separately by the server-side 80% threshold.
    const activityId = `act_${user.id}_grammar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(schema.activityLog).values({
      id: activityId,
      userId: user.id,
      activityType: "grammar",
      title: `Latihan Grammar: ${topicId}`.slice(0, 150),
      score,
      totalQuestions: total,
      accuracyPercent: scorePct,
      durationSeconds: 0,
      xpEarned,
      coinsEarned,
      createdAt: now
    });

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        topicId,
        status: isCompleted ? "completed" : "in_progress",
        score,
        total,
        scorePct,
        xpEarned,
        coinsEarned,
        streak: streakRes?.streak
      },
      "Progres grammar berhasil disimpan."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API grammar/save] Error:", err);
    return sendServerError(res, "Gagal menyimpan progres grammar: " + err.message);
  }
}

