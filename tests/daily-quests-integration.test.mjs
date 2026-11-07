import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { QUEST_POOL } from "../src/features/missions/missionsEngine.js";
import { calculateDailyQuestProgress } from "../api/_lib/dailyQuestProgress.js";

const dateStr = "2026-11-06";
const dayStart = new Date(Date.parse(`${dateStr}T00:00:00+07:00`));
const sameDay = new Date(Date.parse(`${dateStr}T12:00:00+07:00`));
const previousDay = new Date(dayStart.getTime() - 1000);
const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const userA = { id: `test_quest_a_${runId}`, email: `test_quest_a_${runId}@example.com` };
const userB = { id: `test_quest_b_${runId}`, email: `test_quest_b_${runId}@example.com` };

async function insertProgressEvent(userId, eventId, activityType, createdAt) {
  await db.insert(schema.progressEvents).values({
    userId,
    eventId,
    activityType,
    payload: {},
    createdAt
  });
}

async function insertActivity(userId, id, activityType, createdAt) {
  await db.insert(schema.activityLog).values({
    id,
    userId,
    activityType,
    title: "Daily quest integration fixture",
    score: 1,
    totalQuestions: 1,
    accuracyPercent: 100,
    durationSeconds: 0,
    xpEarned: 0,
    coinsEarned: 0,
    createdAt
  });
}

test("Fase 6.2 — every daily mission reads only its server activity source, account, and WIB date", async (t) => {
  await db.insert(schema.users).values([
    { id: userA.id, email: userA.email, displayName: "Quest Test A", role: "student" },
    { id: userB.id, email: userB.email, displayName: "Quest Test B", role: "student" }
  ]);

  t.after(async () => {
    // User-owned fixture rows cascade-delete. This test only runs against the
    // isolated Neon Development database configured by GitHub Actions.
    await db.delete(schema.users).where(eq(schema.users.id, userA.id));
    await db.delete(schema.users).where(eq(schema.users.id, userB.id));
  });

  const cases = [
    {
      name: "new vocabulary counts progress_events.vocab_learn",
      quest: { ...QUEST_POOL.category_vocab[0], id: "quest_vocab_new_5", target: 3 },
      type: "vocab_learn",
      table: "progress"
    },
    {
      name: "SRS review counts progress_events.srs_review",
      quest: { ...QUEST_POOL.category_vocab[1], id: "quest_srs_review_8", target: 3 },
      type: "srs_review",
      table: "progress"
    },
    {
      name: "Grammar quiz counts activity_log.grammar",
      quest: { ...QUEST_POOL.category_grammar[0], id: "quest_grammar_quiz_1", target: 3 },
      type: "grammar",
      table: "activity"
    },
    {
      name: "HABIT reading counts activity_log.reading_quiz",
      quest: { ...QUEST_POOL.category_grammar[1], id: "quest_habit_reading_1", target: 3 },
      type: "reading_quiz",
      table: "activity"
    },
    {
      name: "HABIT completion counts activity_log.reading_complete",
      quest: { ...QUEST_POOL.category_grammar[1], id: "quest_habit_reading_1", target: 3 },
      type: "reading_complete",
      table: "activity"
    },
    {
      name: "Matching counts activity_log.matching",
      quest: { ...QUEST_POOL.category_interactive[0], id: "quest_study_focus_3", target: 3 },
      type: "matching",
      table: "activity"
    },
    {
      name: "story episode counts activity_log.story",
      quest: { ...QUEST_POOL.category_interactive[1], id: "quest_adventure_explore_1", target: 3 },
      type: "story",
      table: "activity"
    }
  ];

  for (let index = 0; index < cases.length; index += 1) {
    const item = cases[index];
    await t.test(item.name, async () => {
      const suffix = `${runId}_${index}`;

      // Exactly one valid activity for user A on the requested WIB date.
      // The previous-day event and user B event are decoys and must not count.
      if (item.table === "progress") {
        await insertProgressEvent(userA.id, `today_${suffix}`, item.type, sameDay);
        await insertProgressEvent(userA.id, `yesterday_${suffix}`, item.type, previousDay);
        await insertProgressEvent(userB.id, `other_user_${suffix}`, item.type, sameDay);
      } else {
        await insertActivity(userA.id, `today_${suffix}`, item.type, sameDay);
        await insertActivity(userA.id, `yesterday_${suffix}`, item.type, previousDay);
        await insertActivity(userB.id, `other_user_${suffix}`, item.type, sameDay);
      }

      const progress = await calculateDailyQuestProgress({
        userId: userA.id,
        quest: item.quest,
        dateStr
      });
      assert.equal(progress, 1, "Only the matching user's activity on the selected WIB date must count");

      // Add another same-day row and verify the server increments to two but
      // never exceeds the configured target.
      if (item.table === "progress") {
        await insertProgressEvent(userA.id, `second_today_${suffix}`, item.type, sameDay);
      } else {
        await insertActivity(userA.id, `second_today_${suffix}`, item.type, sameDay);
      }

      const updatedProgress = await calculateDailyQuestProgress({
        userId: userA.id,
        quest: item.quest,
        dateStr
      });
      assert.equal(updatedProgress, 2);

      const cappedProgress = await calculateDailyQuestProgress({
        userId: userA.id,
        quest: { ...item.quest, target: 1 },
        dateStr
      });
      assert.equal(cappedProgress, 1, "Server progress must be capped at the mission target");
    });
  }
});
