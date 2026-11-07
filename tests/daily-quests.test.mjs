import test from "node:test";
import assert from "node:assert/strict";
import { generateDailyQuests } from "../src/features/missions/missionsEngine.js";
import { hasUnfinishedServerMissions } from "../src/features/missions/missionStatus.js";
import { QUEST_ACTIVITY_SOURCE_BY_LEARNING_TYPE } from "../src/services/learningActivity.js";
import { getWibDateString } from "../src/features/missions/wibDate.js";

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
  assert.match(styles, /\.app-sidebar\.is-collapsed \.sidebar-link span:not\(\.sidebar-icon\):not\(\.sidebar-unread-alert\)/);
  assert.match(styles, /\.app-sidebar\.is-collapsed \.sidebar-link span\.sidebar-unread-alert\s*\{[\s\S]*?display:\s*inline-flex[\s\S]*?position:\s*absolute/);
});


test("WIB mission date changes exactly at midnight in Asia/Jakarta", () => {
  assert.equal(getWibDateString(new Date("2026-11-06T16:59:59.999Z")), "2026-11-06");
  assert.equal(getWibDateString(new Date("2026-11-06T17:00:00.000Z")), "2026-11-07");
  assert.equal(getWibDateString(new Date("2026-11-07T16:59:59.999Z")), "2026-11-07");
  assert.equal(getWibDateString(new Date("2026-11-07T17:00:00.000Z")), "2026-11-08");
});

test("daily quest page hides cached quest cards until server confirms the active WIB snapshot", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(
    new URL("../src/features/missions/MissionsView.jsx", import.meta.url),
    "utf8"
  );

  const guardIndex = component.indexOf("{isServerConfirmed && (");
  const listIndex = component.indexOf('<section className="missions-list"');
  assert.ok(guardIndex >= 0 && listIndex > guardIndex);
  assert.match(component, /Belum terverifikasi/);
  assert.match(component, /Memeriksa.../);
});


test("authenticated mission page offers a retry after server snapshot failure", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(
    new URL("../src/features/missions/MissionsView.jsx", import.meta.url),
    "utf8"
  );

  assert.match(component, /id="missions-refresh-btn"/);
  assert.match(component, /onClick=\{\(\) => void refresh\(\)\}/);
});


test("legacy QuizRunner submits Grammar answers through the profile's shared reward recorder", async () => {
  const { readFile } = await import("node:fs/promises");
  const [runner, workspace] = await Promise.all([
    readFile(new URL("../src/features/quiz/QuizRunner.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/WorkspacePage.jsx", import.meta.url), "utf8")
  ]);

  assert.match(runner, /claimReward\(payload\)/);
  assert.match(runner, /source:\s*"grammar_quiz"/);
  assert.match(runner, /refId:\s*officialTopic\.id/);
  assert.match(workspace, /claimReward=\{userProfile\.claimReward\}/);
});


test("daily missions refresh from server when the app regains focus or visibility", async () => {
  const { readFile } = await import("node:fs/promises");
  const hook = await readFile(
    new URL("../src/hooks/useDailyQuests.js", import.meta.url),
    "utf8"
  );

  assert.match(hook, /window\.addEventListener\("focus", refreshAfterActivity\)/);
  assert.match(hook, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);
  assert.match(hook, /window\.removeEventListener\("focus", refreshAfterActivity\)/);
  assert.match(hook, /document\.removeEventListener\("visibilitychange", refreshWhenVisible\)/);
});
