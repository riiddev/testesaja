/**
 * POST /api/story/complete
 * 
 * Records story episode completion and awards server-side XP & coins.
 */

import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransaction } from "../../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../../_lib/streak.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";

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
    const storyId = String(body.storyId || "").trim();
    const episodeId = Number(body.episodeId);
    const totalEpisodes = STORY_TOTAL_EPISODES[storyId];

    if (!storyId || !totalEpisodes) {
      return sendValidationError(res, "Cerita tidak terdaftar dalam katalog Petualangan resmi.");
    }

    if (!Number.isInteger(episodeId) || episodeId < 1 || episodeId > totalEpisodes) {
      return sendValidationError(res, `Nomor episode harus berada pada rentang 1–${totalEpisodes}.`);
    }

    const existing = await db
      .select()
      .from(schema.storyProgress)
      .where(
        and(
          eq(schema.storyProgress.userId, user.id),
          eq(schema.storyProgress.storyId, storyId)
        )
      )
      .limit(1);

    const now = new Date();
    const priorList = existing.length > 0 && Array.isArray(existing[0].completedEpisodes)
      ? existing[0].completedEpisodes
      : [];
    const wasStoryCompleted = existing.length > 0 && Boolean(existing[0].isStoryCompleted);
    const wasEpisodeCompleted = priorList.includes(episodeId);

    if (wasEpisodeCompleted) {
      return sendSuccess(
        res,
        {
          storyId,
          episodeId,
          completedEpisodes: priorList,
          isStoryCompleted: wasStoryCompleted,
          alreadyCompleted: true,
          earnedXp: 0,
          earnedCoins: 0
        },
        "Episode ini sudah pernah diselesaikan. Hadiah tidak diberikan dua kali."
      );
    }

    const expectedEpisode = existing.length > 0
      ? Math.max(1, Number(existing[0].currentEpisode) || 1)
      : 1;

    if (episodeId !== expectedEpisode) {
      return sendValidationError(
        res,
        `Selesaikan episode secara berurutan. Episode berikutnya yang tersedia adalah ${expectedEpisode}.`
      );
    }

    const completedList = [...priorList, episodeId];
    const isStoryCompleted = completedList.length >= totalEpisodes || wasStoryCompleted;

    if (existing.length === 0) {
      await db.insert(schema.storyProgress).values({
        userId: user.id,
        storyId,
        currentEpisode: Math.min(totalEpisodes, episodeId + 1),
        completedEpisodes: completedList,
        isStoryCompleted,
        updatedAt: now
      });
    } else {
      await db
        .update(schema.storyProgress)
        .set({
          currentEpisode: Math.min(totalEpisodes, episodeId + 1),
          completedEpisodes: completedList,
          isStoryCompleted,
          updatedAt: now
        })
        .where(
          and(
            eq(schema.storyProgress.userId, user.id),
            eq(schema.storyProgress.storyId, storyId)
          )
        );
    }

    // Award reward via server ledger
    const eventId = `story:${storyId}:ep_${episodeId}`;
    const rewardConfig = REWARDS_CONFIG.story_episode_complete || { xp: 35, coins: 15 };
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "story_episode",
      xpEarned: rewardConfig.xp,
      coinsEarned: rewardConfig.coins
    });

    if (isStoryCompleted && !wasStoryCompleted) {
      await db
        .update(schema.userStats)
        .set({
          storiesCompleted: sql`${schema.userStats.storiesCompleted} + 1`,
          updatedAt: now
        })
        .where(eq(schema.userStats.userId, user.id));
    }

    if (!wasEpisodeCompleted && !tx.alreadyProcessed) {
      const activityId = `act_${user.id}_story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(schema.activityLog).values({
        id: activityId,
        userId: user.id,
        activityType: "story",
        title: `Petualangan: ${storyId} — Episode ${episodeId}`.slice(0, 150),
        score: 1,
        totalQuestions: 1,
        accuracyPercent: 100,
        durationSeconds: 0,
        xpEarned: tx.xpEarned,
        coinsEarned: tx.coinsEarned,
        createdAt: now
      });
    }

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        storyId,
        episodeId,
        completedEpisodes: completedList,
        isStoryCompleted,
        alreadyCompleted: false,
        earnedXp: tx.alreadyProcessed ? 0 : tx.xpEarned,
        earnedCoins: tx.alreadyProcessed ? 0 : tx.coinsEarned,
        streak: streakRes?.streak
      },
      "Episode petualangan selesai!"
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API story/complete] Error:", err);
    return sendServerError(res, "Gagal menyelesaikan episode cerita: " + err.message);
  }
}

