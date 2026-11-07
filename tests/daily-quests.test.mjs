import test from "node:test";
import assert from "node:assert/strict";
import { generateDailyQuests } from "../src/features/missions/missionsEngine.js";
import { hasUnfinishedServerMissions } from "../src/features/missions/missionStatus.js";
import { QUEST_ACTIVITY_SOURCE_BY_LEARNING_TYPE } from "../src/services/learningActivity.js";

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


test("sidebar alert stays hidden until the active account has a current server snapshot", () => {
  const incomplete = [{ isCompleted: false }, { isCompleted: true }];
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: true,
    isLoading: true,
    hasServerSnapshot: false,
    quests: incomplete
  }), false);
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: true,
    isLoading: false,
    hasServerSnapshot: false,
    quests: incomplete
  }), false);
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: false,
    isLoading: false,
    hasServerSnapshot: false,
    quests: incomplete
  }), false);
});

test("sidebar alert appears only when a confirmed server mission is unfinished", () => {
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: true,
    isLoading: false,
    hasServerSnapshot: true,
    quests: [{ isCompleted: false }, { isCompleted: true }]
  }), true);
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: true,
    isLoading: false,
    hasServerSnapshot: true,
    quests: [{ isCompleted: true }, { isCompleted: true }]
  }), false);
  assert.equal(hasUnfinishedServerMissions({
    isAuthenticated: true,
    isLoading: false,
    hasServerSnapshot: true,
    quests: []
  }), false);
});

test("the shared activity recorder declares all quest sources including offline-first SRS", () => {
  assert.deepEqual(QUEST_ACTIVITY_SOURCE_BY_LEARNING_TYPE, {
    vocabulary_new: "vocab_learn",
    srs_review: "srs_review",
    grammar: "grammar",
    matching: "matching",
    reading_quiz: "reading_quiz",
    reading_complete: "reading_complete",
    story_episode: "story"
  });
});


test("sidebar alert renders an accessible exclamation using the danger token, including collapsed mode", async () => {
  const { readFile } = await import("node:fs/promises");
  const [component, styles] = await Promise.all([
    readFile(new URL("../src/components/layout/AppSidebar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/workspace.css", import.meta.url), "utf8")
  ]);

  assert.match(component, /aria-label="Ada misi yang belum selesai"/);
  assert.match(component, /title="Ada misi yang belum selesai"/);
  assert.match(component, /<span\s+className="sidebar-unread-alert"[\s\S]*?>\s*!\s*<\/span>/);
  assert.match(styles, /\.sidebar-unread-alert\s*\{[\s\S]*?background-color:\s*var\(--color-danger\)/);
  assert.match(styles, /\.app-sidebar\.is-collapsed \.sidebar-unread-alert\s*\{[\s\S]*?display:\s*inline-flex[\s\S]*?position:\s*absolute/);
});
