/**
 * POST /api/reading-quiz/record
 *
 * Validates official HABIT reading answers. The first-completion reward,
 * practice history, mistake details and streak update are atomic.
 */

import { eq } from "drizzle-orm";
import { withTransaction, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreakInTransaction } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import habitReadingQuizzes from "../../../src/data/habit-reading-quizzes.json" with { type: "json" };
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
    const articleId = String(body.articleId || "").trim();
    const durationSeconds = Math.max(0, Math.min(3600, parseInt(body.durationSeconds, 10) || 0));

    if (!articleId) {
      return sendValidationError(res, "Parameter articleId wajib disertakan.");
    }

    const officialQuiz = habitReadingQuizzes.quizzes?.[articleId];
    if (!officialQuiz || !Array.isArray(officialQuiz.questions) || officialQuiz.questions.length === 0) {
      return sendValidationError(res, "Kuis artikel tidak ditemukan dalam katalog HABIT resmi.");
    }

    const questions = officialQuiz.questions;
    const submittedAnswers = Array.isArray(body.answers) ? body.answers : [];
    if (submittedAnswers.length !== questions.length) {
      return sendValidationError(
        res,
        "Semua " + questions.length + " soal wajib dijawab sebelum hasil disimpan."
      );
    }

    const answerMap = new Map();
    for (const answer of submittedAnswers) {
      const questionId = String(answer?.questionId || "");
      const selectedIndex = Number(answer?.selectedIndex);
      if (!questionId || answerMap.has(questionId) || !Number.isInteger(selectedIndex)) {
        return sendValidationError(res, "Format jawaban kuis tidak valid.");
      }
      answerMap.set(questionId, selectedIndex);
    }

    let score = 0;
    const wrongItems = [];
    const questionsBreakdown = [];

    for (const question of questions) {
      const selectedIndex = answerMap.get(question.id);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
        return sendValidationError(res, "Jawaban kuis tidak lengkap atau tidak valid.");
      }

      const isCorrect = selectedIndex === question.correctIndex;
      if (isCorrect) {
        score += 1;
      } else {
        wrongItems.push(question.targetWord || question.id);
      }

      questionsBreakdown.push({
        questionId: question.id,
        category: question.category || "General Info",
        subType: question.subType || "",
        question: question.question,
        selectedAnswer: selectedIndex,
        correctAnswer: question.options[question.correctIndex],
        isCorrect,
        targetWord: question.targetWord || null
      });
    }

    const total = questions.length;
    const articleTitle = String(
      officialQuiz.passageTitle || officialQuiz.title || articleId
    ).slice(0, 150);
    const now = new Date();
    const accuracy = Math.round((score / total) * 100);
    const activityId = "act_" + user.id + "_rq_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
    const reward = REWARDS_CONFIG.reading_quiz_first_complete;

    const result = await withTransaction(async (tx) => {
      await tx
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId: "reading_quiz:" + articleId + ":first_complete",
        source: "reading_quiz_complete",
        xpEarned: reward.xp,
        coinsEarned: reward.coins
      });

      await tx.insert(schema.activityLog).values({
        id: activityId,
        userId: user.id,
        activityType: "reading_quiz",
        title: "Kuis Bacaan: " + articleTitle,
        score,
        totalQuestions: total,
        accuracyPercent: accuracy,
        durationSeconds,
        xpEarned: ledger.alreadyProcessed ? 0 : ledger.xpEarned,
        coinsEarned: ledger.alreadyProcessed ? 0 : ledger.coinsEarned,
        createdAt: now
      });

      if (wrongItems.length > 0) {
        await tx.insert(schema.attemptDetails).values({
          activityId,
          userId: user.id,
          wrongItems,
          questionsBreakdown,
          createdAt: now
        });
      }

      const streak = await evaluateAndRecordStreakInTransaction(tx, user.id);
      return { ledger, streak };
    });

    return sendSuccess(
      res,
      {
        activityId,
        score,
        total,
        accuracy,
        alreadyRewarded: result.ledger.alreadyProcessed,
        earnedXp: result.ledger.alreadyProcessed ? 0 : result.ledger.xpEarned,
        earnedCoins: result.ledger.alreadyProcessed ? 0 : result.ledger.coinsEarned,
        totalXp: result.ledger.totalXp,
        totalCoins: result.ledger.totalCoins,
        streak: result.streak?.streak
      },
      "Kuis bacaan berhasil diselesaikan!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API reading-quiz/record] Error:", err);
    return sendServerError(res, "Gagal mencatat kuis bacaan.");
  }
}
