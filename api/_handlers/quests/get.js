/**
 * GET /api/quests/get
 * 
 * Retrieves daily quests for today in Asia/Jakarta (WIB) timezone.
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { REWARDS_CONFIG } from "../../_lib/rewardsConfig.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

const DEFAULT_QUEST_TEMPLATES = [
  {
    questId: "quest_vocab_10",
    name: "Penjelajah Kata Baru",
    description: "Buka dan pelajari 10 kata baru dalam korpus.",
    target: 10,
    xpReward: REWARDS_CONFIG.quest_vocab_10.xp,
    coinsReward: REWARDS_CONFIG.quest_vocab_10.coins
  },
  {
    questId: "quest_review_15",
    name: "Pemelihara Memori (SRS)",
    description: "Ulas 15 kata dalam spaced repetition harian.",
    target: 15,
    xpReward: REWARDS_CONFIG.quest_review_15.xp,
    coinsReward: REWARDS_CONFIG.quest_review_15.coins
  },
  {
    questId: "quest_reading_1",
    name: "Cendekiawan Literasi",
    description: "Selesaikan 1 artikel bacaan ilmiah/budaya di perpustakaan HABIT.",
    target: 1,
    xpReward: REWARDS_CONFIG.quest_reading_1.xp,
    coinsReward: REWARDS_CONFIG.quest_reading_1.coins
  }
];

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);
    const url = new URL(req.url, "http://localhost");
    const queryDate = url.searchParams.get("dateStr");
    const todayWib = (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) ? queryDate : getWibDateStr(new Date());

    // 1. Fetch user's existing quests for today
    let userQuests = await db
      .select()
      .from(schema.dailyQuests)
      .where(
        and(
          eq(schema.dailyQuests.userId, user.id),
          eq(schema.dailyQuests.questDate, todayWib)
        )
      );

    // 2. If not generated yet for today, generate default templates
    if (userQuests.length === 0) {
      for (const tpl of DEFAULT_QUEST_TEMPLATES) {
        await db
          .insert(schema.dailyQuests)
          .values({
            userId: user.id,
            questDate: todayWib,
            questId: tpl.questId,
            currentProgress: 0,
            target: tpl.target,
            isCompleted: false
          })
          .onConflictDoNothing();
      }

      userQuests = await db
        .select()
        .from(schema.dailyQuests)
        .where(
          and(
            eq(schema.dailyQuests.userId, user.id),
            eq(schema.dailyQuests.questDate, todayWib)
          )
        );
    }

    // 3. Fetch claims for today
    const claims = await db
      .select({ questId: schema.questClaims.questId })
      .from(schema.questClaims)
      .where(
        and(
          eq(schema.questClaims.userId, user.id),
          eq(schema.questClaims.questDate, todayWib)
        )
      );

    const claimedIds = new Set(claims.map((c) => c.questId));

    // 4. Enrich with template metadata
    const enriched = userQuests.map((q) => {
      const tpl = DEFAULT_QUEST_TEMPLATES.find((t) => t.questId === q.questId) || {
        name: q.questId,
        description: "",
        xpReward: 35,
        coinsReward: 15
      };

      const isCompleted = q.isCompleted || q.currentProgress >= q.target;
      const isClaimed = claimedIds.has(q.questId);

      return {
        id: q.questId,
        questId: q.questId,
        name: tpl.name,
        description: tpl.description,
        target: q.target,
        current: q.currentProgress,
        progress: q.currentProgress,
        isCompleted,
        isClaimed,
        xpReward: tpl.xpReward,
        coinsReward: tpl.coinsReward
      };
    });

    const completedCount = enriched.filter((q) => q.isCompleted).length;
    const claimedCount = enriched.filter((q) => q.isClaimed).length;
    const hasUnfinished = enriched.some((q) => !q.isCompleted);

    return sendSuccess(res, {
      dateStr: todayWib,
      quests: enriched,
      completedCount,
      claimedCount,
      hasUnfinishedQuests: hasUnfinished
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API quests/get] Error:", err);
    return sendServerError(res, "Gagal memuat misi harian: " + err.message);
  }
}
