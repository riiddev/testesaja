/**
 * Server-authoritative daily mission catalog and progress.
 * Progress is derived from server-written activity rows, never from client
 * supplied progress/target values.
 */

import { and, count, eq, gte, inArray, lt } from "drizzle-orm";
import { generateDailyQuests } from "../../src/features/missions/missionsEngine.js";
import { db, schema } from "../../db/index.js";

function getWibBounds(dateStr) {
  const startMs = Date.parse(`${dateStr}T00:00:00+07:00`);
  if (!Number.isFinite(startMs)) {
    throw new Error("Tanggal misi tidak valid.");
  }
  return {
    start: new Date(startMs),
    end: new Date(startMs + 24 * 60 * 60 * 1000)
  };
}

async function countRows(table, whereClause) {
  const rows = await db.select({ value: count() }).from(table).where(whereClause);
  return Number(rows[0]?.value || 0);
}

export function getDailyQuestDefinitions(dateStr, userId) {
  return generateDailyQuests(dateStr, userId);
}

export async function calculateDailyQuestProgress({ userId, quest, dateStr }) {
  const { start, end } = getWibBounds(dateStr);
  let verifiedCount = 0;

  switch (quest.id) {
    case "quest_vocab_new_5":
      verifiedCount = await countRows(
        schema.progressEvents,
        and(
          eq(schema.progressEvents.userId, userId),
          eq(schema.progressEvents.activityType, "vocab_learn"),
          gte(schema.progressEvents.createdAt, start),
          lt(schema.progressEvents.createdAt, end)
        )
      );
      break;

    case "quest_srs_review_8":
      verifiedCount = await countRows(
        schema.progressEvents,
        and(
          eq(schema.progressEvents.userId, userId),
          eq(schema.progressEvents.activityType, "srs_review"),
          gte(schema.progressEvents.createdAt, start),
          lt(schema.progressEvents.createdAt, end)
        )
      );
      break;

    case "quest_grammar_quiz_1":
      verifiedCount = await countRows(
        schema.activityLog,
        and(
          eq(schema.activityLog.userId, userId),
          eq(schema.activityLog.activityType, "grammar"),
          gte(schema.activityLog.createdAt, start),
          lt(schema.activityLog.createdAt, end)
        )
      );
      break;

    case "quest_habit_reading_1":
      verifiedCount = await countRows(
        schema.activityLog,
        and(
          eq(schema.activityLog.userId, userId),
          inArray(schema.activityLog.activityType, ["reading_quiz", "reading_complete"]),
          gte(schema.activityLog.createdAt, start),
          lt(schema.activityLog.createdAt, end)
        )
      );
      break;

    case "quest_study_focus_3":
      verifiedCount = await countRows(
        schema.activityLog,
        and(
          eq(schema.activityLog.userId, userId),
          eq(schema.activityLog.activityType, "matching"),
          gte(schema.activityLog.createdAt, start),
          lt(schema.activityLog.createdAt, end)
        )
      );
      break;

    case "quest_adventure_explore_1":
      verifiedCount = await countRows(
        schema.activityLog,
        and(
          eq(schema.activityLog.userId, userId),
          eq(schema.activityLog.activityType, "story"),
          gte(schema.activityLog.createdAt, start),
          lt(schema.activityLog.createdAt, end)
        )
      );
      break;

    default:
      return 0;
  }

  return Math.min(quest.target, Math.max(0, verifiedCount));
}

export async function getDailyQuestSnapshot(userId, dateStr) {
  const definitions = getDailyQuestDefinitions(dateStr, userId);
  const claims = await db
    .select({
      questId: schema.questClaims.questId,
      claimedAt: schema.questClaims.claimedAt
    })
    .from(schema.questClaims)
    .where(
      and(
        eq(schema.questClaims.userId, userId),
        eq(schema.questClaims.questDate, dateStr)
      )
    );

  const claimMap = new Map(claims.map((claim) => [claim.questId, claim.claimedAt]));
  const quests = [];

  for (const quest of definitions) {
    const progress = await calculateDailyQuestProgress({ userId, quest, dateStr });
    const isCompleted = progress >= quest.target;
    const claimedAt = claimMap.get(quest.id) || null;

    await db
      .insert(schema.dailyQuests)
      .values({
        userId,
        questDate: dateStr,
        questId: quest.id,
        currentProgress: progress,
        target: quest.target,
        isCompleted
      })
      .onConflictDoNothing();

    await db
      .update(schema.dailyQuests)
      .set({
        currentProgress: progress,
        target: quest.target,
        isCompleted
      })
      .where(
        and(
          eq(schema.dailyQuests.userId, userId),
          eq(schema.dailyQuests.questDate, dateStr),
          eq(schema.dailyQuests.questId, quest.id)
        )
      );

    quests.push({
      ...quest,
      questId: quest.id,
      current: progress,
      progress,
      isCompleted,
      isClaimed: Boolean(claimedAt),
      claimedAt
    });
  }

  return {
    dateStr,
    quests,
    completedCount: quests.filter((quest) => quest.isCompleted).length,
    claimedCount: quests.filter((quest) => quest.isClaimed).length,
    hasUnfinishedQuests: quests.some((quest) => !quest.isCompleted)
  };
}
