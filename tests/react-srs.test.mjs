import test from "node:test";
import assert from "node:assert/strict";
import { SRS_INTERVALS_DAYS, getWordStatus, calculateNextReview } from "../src/hooks/useSpacedRepetition.js";

test("SRS Intervals standard sequence [1, 3, 8, 16, 30]", () => {
  assert.deepEqual(SRS_INTERVALS_DAYS, [1, 3, 8, 16, 30]);
});

test("Word status evaluation: fresh -> learning -> mastered", () => {
  const item = { correctCount: 0, wrongCount: 0, masteryStage: "fresh" };
  assert.equal(getWordStatus(item), "fresh");

  item.correctCount = 1;
  item.masteryStage = "learning";
  assert.equal(getWordStatus(item), "learning");

  item.correctCount = 5;
  item.masteryStage = "mastered";
  assert.equal(getWordStatus(item), "mastered");
});

test("Calculate next review adaptive interval calculation", () => {
  // Correct answer progression
  const rev1 = calculateNextReview(true, 0);
  assert.equal(rev1.correctCount, 1);
  assert.equal(rev1.intervalDays, 3);
  assert.equal(rev1.masteryStage, "learning");

  // Wrong answer resets interval to 1 day
  const revWrong = calculateNextReview(false, 3);
  assert.equal(revWrong.correctCount, 2);
  assert.equal(revWrong.intervalDays, 1);
  assert.equal(revWrong.masteryStage, "weak");
});

