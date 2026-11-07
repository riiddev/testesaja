import test from "node:test";
import assert from "node:assert/strict";
import { mergeServerProgressWithPendingEvents } from "../src/lib/progressSyncMerge.js";

test("server progress remains canonical while pending events are replayed", () => {
  const serverItems = {
    abandon: {
      wordId: "abandon",
      level: "B1",
      correctCount: 2,
      wrongCount: 0,
      masteryStage: "learning",
      intervalDays: 3,
      nextReviewAt: "2026-11-10T00:00:00.000Z",
      lastReviewedAt: "2026-11-06T00:00:00.000Z"
    },
    other: {
      wordId: "other",
      level: "A2",
      correctCount: 4,
      wrongCount: 1,
      masteryStage: "learning"
    }
  };

  const merged = mergeServerProgressWithPendingEvents(serverItems, [
    {
      eventId: "evt-newer",
      wordId: "abandon",
      isCorrect: true,
      createdAt: "2026-11-07T02:00:00.000Z"
    },
    {
      eventId: "evt-older",
      wordId: "abandon",
      isCorrect: false,
      createdAt: "2026-11-07T01:00:00.000Z"
    }
  ]);

  assert.equal(merged.abandon.level, "B1", "official server CEFR level must win");
  assert.equal(merged.abandon.correctCount, 2, "pending events must apply in timestamp order");
  assert.equal(merged.abandon.wrongCount, 1);
  assert.equal(merged.abandon.intervalDays, 3);
  assert.equal(merged.other.correctCount, 4, "unrelated server progress must remain unchanged");
  assert.equal(merged.abandon.lastReviewedAt, "2026-11-07T02:00:00.000Z");
});

test("new offline words retain their local CEFR label until the server confirms them", () => {
  const merged = mergeServerProgressWithPendingEvents({}, [
    {
      eventId: "evt-b2",
      wordId: "analysis",
      level: "B2",
      isCorrect: true,
      createdAt: "2026-11-07T03:00:00.000Z"
    }
  ]);

  assert.equal(merged.analysis.level, "B2");
  assert.equal(merged.analysis.correctCount, 1);
  assert.equal(merged.analysis.masteryStage, "learning");
  assert.equal(merged.analysis.intervalDays, 1);
});

test("legacy outbox events are normalized before replay", () => {
  const merged = mergeServerProgressWithPendingEvents({}, [
    {
      eventId: "evt-legacy-wrong",
      wordId: "ability",
      masteryStage: "weak",
      wrongCount: 1,
      createdAt: "2026-11-07T04:00:00.000Z"
    }
  ]);

  assert.equal(merged.ability.correctCount, 0);
  assert.equal(merged.ability.wrongCount, 1);
  assert.equal(merged.ability.masteryStage, "weak");
});
