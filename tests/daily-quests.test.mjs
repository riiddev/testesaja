import test from "node:test";
import assert from "node:assert/strict";
import { generateDailyQuests } from "../src/features/missions/missionsEngine.js";

test("daily missions are deterministic for the same user and WIB date", () => {
  const dateStr = "2026-11-06";
  const first = generateDailyQuests(dateStr, "student-123");
  const second = generateDailyQuests(dateStr, "student-123");

  assert.deepEqual(first.map((quest) => quest.id), second.map((quest) => quest.id));
  assert.equal(first.length, 3);
});

test("daily mission definitions always have a valid target and fixed rewards", () => {
  const quests = generateDailyQuests("2026-11-06", "student-123");

  for (const quest of quests) {
    assert.ok(quest.id.startsWith("quest_"));
    assert.ok(Number.isInteger(quest.target) && quest.target > 0);
    assert.ok(Number.isFinite(quest.xpReward) && quest.xpReward >= 0);
    assert.ok(Number.isFinite(quest.coinsReward) && quest.coinsReward >= 0);
  }
});

test("server and client can generate only the known six mission IDs", () => {
  const knownIds = new Set([
    "quest_vocab_new_5",
    "quest_srs_review_8",
    "quest_grammar_quiz_1",
    "quest_habit_reading_1",
    "quest_study_focus_3",
    "quest_adventure_explore_1"
  ]);

  for (let seed = 0; seed < 50; seed++) {
    const quests = generateDailyQuests(`2026-11-${String((seed % 28) + 1).padStart(2, "0")}`, `user-${seed}`);
    assert.equal(quests.length, 3);
    for (const quest of quests) assert.ok(knownIds.has(quest.id));
  }
});
