import test from "node:test";
import assert from "node:assert/strict";
import { SRS_INTERVALS, getWordStatus, calculateNextReview, isMastered, ensureWordProgress } from "../src/lib/mastery.ts";
import { createFreshState, sanitizeState } from "../src/lib/storage.ts";
import { exportBackup, importBackup } from "../src/lib/backup.ts";

test("SRS Intervals standard sequence", () => {
  assert.deepEqual(SRS_INTERVALS, [1, 3, 8, 16, 30]);
});

test("Word status progression: fresh -> learning -> mastered", () => {
  const map = {};
  const p = ensureWordProgress(map, "word-1");
  assert.equal(getWordStatus(p), "fresh");

  // First review success
  calculateNextReview(p, true, new Date("2026-11-04T12:00:00Z"));
  assert.equal(p.reviewSuccesses, 1);
  assert.equal(p.firstSeenDate, "2026-11-04");
  assert.equal(getWordStatus(p), "learning");

  // Second review success with skill evidence
  p.skillEvidence.recall = true;
  p.skillEvidence.context = true;
  calculateNextReview(p, true, new Date("2026-11-05T12:00:00Z"));
  assert.equal(p.reviewSuccesses, 2);
  assert.equal(isMastered(p), true);
  assert.equal(getWordStatus(p), "mastered");
});

test("Word error triggers weak state and 1-day reset interval", () => {
  const map = {};
  const p = ensureWordProgress(map, "word-2");
  calculateNextReview(p, true, new Date("2026-11-04T12:00:00Z"));
  
  // Fail next review
  calculateNextReview(p, false, new Date("2026-11-05T12:00:00Z"));
  assert.equal(p.weak, true);
  assert.equal(p.consecutiveErrors, 1);
  assert.equal(getWordStatus(p), "weak");
  assert.equal(p.nextReviewAt.startsWith("2026-11-06"), true);
});

test("Backup export and import validation", () => {
  const state = createFreshState();
  state.settings.dailyGoal = 15;
  state.wordProgress["oxford-test"] = {
    attempts: [1],
    skillEvidence: { recall: true, context: true, production: false },
    firstSeenDate: "2026-11-04",
    studiedDates: ["2026-11-04"],
    nextReviewAt: null,
    reviewSuccesses: 2,
    reviewDates: [],
    reviewHistory: [],
    contextQuestionIds: [],
    consecutiveErrors: 0,
    weak: false,
    masteredAt: "2026-11-04T12:00:00Z"
  };

  const exported = exportBackup(state);
  assert.ok(exported.includes("SINAUENGLISHV2"));

  const imported = importBackup(exported);
  assert.equal(imported.state.schemaVersion, 1);
  assert.equal(imported.state.settings.dailyGoal, 15);
  assert.ok(imported.state.wordProgress["oxford-test"]);
  assert.equal(imported.state.wordProgress["oxford-test"].masteredAt, "2026-11-04T12:00:00Z");
});

