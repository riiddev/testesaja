/**
 * POST /api/story/complete
 *
 * Validates the next official story episode and atomically records progress,
 * XP/coins, completion statistics, activity history and streak.
 */

import { eq, and, sql } from "drizzle-orm";
import { getTransactionDb, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreakInTransaction } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

const STORY_TOTAL_EPISODES = Object.freeze({
  "story-01": 10,
  "story-02": 10,
  "story-03": 10,
  "story-04": 10,
  "story-05": 10,
  "story-06": 10,
  "story-07": 10,
  "story-08": 10,
  "story-09": 10,
  "story-10": 10
});

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
    const storyId = String(body.storyId || "").trim();
    const episodeId = Number(body.episodeId);
    const totalEpisodes = STORY_TOTAL_EPISODES[storyId];

    if (!storyId || !totalEpisodes) {
      return sendValidationError(res, "Cerita tidak terdaftar dalam katalog Petualangan resmi.");
    }

    if (!Number.isInteger(episodeId) || episodeId < 1 || episodeId > totalEpisodes) {
      return sendValidationError(
        res,
        "Nomor episode harus berada pada rentang 1–" + totalEpisodes + "."
      );
    }

    const reward = REWARDS_CONFIG.story_episode_complete;
    const result = await getTransactionDb().transaction(async (tx) => {
      await tx
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      const existing = await tx
        .select()
        .from(schema.storyProgress)
        .where(and(
          eq(schema.storyProgress.userId, user.id),
          eq(schema.storyProgress.storyId, storyId)
        ))
        .limit(1);

      const now = new Date();
      const priorList = existing.length > 0 &&
        Array.isArray(existing[0].completedEpisodes)
        ? existing[0].completedEpisodes
        : [];
      const wasStoryCompleted = existing.length > 0 &&
        Boolean(existing[0].isStoryCompleted);

      if (priorList.includes(episodeId)) {
        return {
          storyId,
          episodeId,
          completedEpisodes: priorList,
          isStoryCompleted: wasStoryCompleted,
          alreadyCompleted: true,
          earnedXp: 0,
          earnedCoins: 0,
          streak: null
        };
      }

      const expectedEpisode = existing.length > 0
        ? Math.max(1, Number(existing[0].currentEpisode) || 1)
        : 1;

      if (episodeId !== expectedEpisode) {
        throw validationError(
          "Selesaikan episode secara berurutan. Episode berikutnya yang tersedia adalah " +
          expectedEpisode +
          "."
        );
      }

      const completedList = [...priorList, episodeId];
      const isStoryCompleted = completedList.length >= totalEpisodes ||
        wasStoryCompleted;

      if (!existing.length) {
        await tx.insert(schema.storyProgress).values({
          userId: user.id,
          storyId,
          currentEpisode: Math.min(totalEpisodes, episodeId + 1),
          completedEpisodes: completedList,
          isStoryCompleted,
          updatedAt: now
        });
      } else {
        await tx
          .update(schema.storyProgress)
          .set({
            currentEpisode: Math.min(totalEpisodes, episodeId + 1),
            completedEpisodes: completedList,
            isStoryCompleted,
            updatedAt: now
          })
          .where(and(
            eq(schema.storyProgress.userId, user.id),
            eq(schema.storyProgress.storyId, storyId)
          ));
      }

      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId: "story:" + storyId + ":ep_" + episodeId,
        source: "story_episode",
        xpEarned: reward.xp,
        coinsEarned: reward.coins
      });

      if (isStoryCompleted && !wasStoryCompleted) {
        await tx
          .update(schema.userStats)
          .set({
            storiesCompleted: sql`${schema.userStats.storiesCompleted} + 1`,
            updatedAt: now
          })
          .where(eq(schema.userStats.userId, user.id));
      }

      if (!ledger.alreadyProcessed) {
        const activityId = "act_" + user.id + "_story_" + Date.now() + "_" +
          Math.random().toString(36).slice(2, 8);
        await tx.insert(schema.activityLog).values({
          id: activityId,
          userId: user.id,
          activityType: "story",
          title: ("Petualangan: " + storyId + " — Episode " + episodeId).slice(0, 150),
          score: 1,
          totalQuestions: 1,
          accuracyPercent: 100,
          durationSeconds: 0,
          xpEarned: ledger.xpEarned,
          coinsEarned: ledger.coinsEarned,
          createdAt: now
        });
      }

      const streak = await evaluateAndRecordStreakInTransaction(tx, user.id);

      return {
        storyId,
        episodeId,
        completedEpisodes: completedList,
        isStoryCompleted,
        alreadyCompleted: false,
        earnedXp: ledger.alreadyProcessed ? 0 : ledger.xpEarned,
        earnedCoins: ledger.alreadyProcessed ? 0 : ledger.coinsEarned,
        streak: streak?.streak
      };
    });

    return sendSuccess(
      res,
      result,
      result.alreadyCompleted
        ? "Episode ini sudah pernah diselesaikan. Hadiah tidak diberikan dua kali."
        : "Episode petualangan selesai!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API story/complete] Error:", err);
    return sendServerError(res, "Gagal menyelesaikan episode cerita.");
  }
}
