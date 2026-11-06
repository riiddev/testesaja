/**
 * POST /api/story/complete
 * 
 * Records story episode completion and awards server-side XP & coins.
 */

import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import { recordLedgerTransaction } from "../_lib/ledger.js";
import { evaluateAndRecordStreak } from "../_lib/streak.js";
import { REWARDS_CONFIG } from "../_lib/rewardsConfig.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const body = await parseJsonBody(req);
    const storyId = String(body.storyId || "").trim();
    const episodeId = parseInt(body.episodeId, 10) || 1;
    const totalEpisodes = parseInt(body.totalEpisodes, 10) || 5;

    if (!storyId) {
      return sendValidationError(res, "Parameter storyId wajib disertakan.");
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
    let completedList = [];
    let isStoryCompleted = false;

    if (existing.length === 0) {
      completedList = [episodeId];
      isStoryCompleted = completedList.length >= totalEpisodes;
      await db.insert(schema.storyProgress).values({
        userId: user.id,
        storyId,
        currentEpisode: Math.min(totalEpisodes, episodeId + 1),
        completedEpisodes: completedList,
        isStoryCompleted,
        updatedAt: now
      });
    } else {
      const priorList = Array.isArray(existing[0].completedEpisodes) ? existing[0].completedEpisodes : [];
      if (!priorList.includes(episodeId)) {
        completedList = [...priorList, episodeId];
      } else {
        completedList = priorList;
      }

      isStoryCompleted = completedList.length >= totalEpisodes || existing[0].isStoryCompleted;

      await db
        .update(schema.storyProgress)
        .set({
          currentEpisode: Math.min(totalEpisodes, Math.max(existing[0].currentEpisode, episodeId + 1)),
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

    if (isStoryCompleted) {
      await db
        .update(schema.userStats)
        .set({
          storiesCompleted: sql`${schema.userStats.storiesCompleted} + 1`,
          updatedAt: now
        })
        .where(eq(schema.userStats.userId, user.id));
    }

    const streakRes = await evaluateAndRecordStreak(user.id);

    return sendSuccess(
      res,
      {
        storyId,
        episodeId,
        completedEpisodes: completedList,
        isStoryCompleted,
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

