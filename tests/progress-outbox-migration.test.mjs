import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOutboxSrsEvent } from "../src/hooks/useProgressSync.js";

test("keeps new SRS events with explicit isCorrect unchanged", () => {
  const event = { eventId: "new-1", isCorrect: false, masteryStage: "weak" };
  assert.equal(normalizeOutboxSrsEvent(event), event);
});

test("converts old weak events to incorrect answer reports", () => {
  const event = { eventId: "old-weak", masteryStage: "weak", correctCount: 0 };
  assert.equal(normalizeOutboxSrsEvent(event).isCorrect, false);
});

test("converts old learning/mastered events to correct answer reports", () => {
  for (const masteryStage of ["learning", "mastered"]) {
    const event = { eventId: `old-${masteryStage}`, masteryStage };
    assert.equal(normalizeOutboxSrsEvent(event).isCorrect, true);
  }
});

test("does not guess for unknown legacy event shapes", () => {
  const event = { eventId: "old-unknown", masteryStage: "fresh" };
  assert.equal(normalizeOutboxSrsEvent(event).isCorrect, undefined);
});
