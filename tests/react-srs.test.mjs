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
  // First correct answer uses 1 day (Option 1)
  const rev1 = calculateNextReview(true, 0);
  assert.equal(rev1.correctCount, 1);
  assert.equal(rev1.intervalDays, 1, "First success must schedule review in 1 day [1, 3, 8, 16, 30]");
  assert.equal(rev1.masteryStage, "learning");

  // Second correct answer uses 3 days
  const rev2 = calculateNextReview(true, 1);
  assert.equal(rev2.correctCount, 2);
  assert.equal(rev2.intervalDays, 3);

  // Third correct answer uses 8 days
  const rev3 = calculateNextReview(true, 2);
  assert.equal(rev3.correctCount, 3);
  assert.equal(rev3.intervalDays, 8);

  // Fourth correct answer uses 16 days
  const rev4 = calculateNextReview(true, 3);
  assert.equal(rev4.correctCount, 4);
  assert.equal(rev4.intervalDays, 16);

  // Fifth correct answer uses 30 days and marks mastered
  const rev5 = calculateNextReview(true, 4);
  assert.equal(rev5.correctCount, 5);
  assert.equal(rev5.intervalDays, 30);
  assert.equal(rev5.masteryStage, "mastered");

  // Wrong answer resets interval to 1 day
  const revWrong = calculateNextReview(false, 3);
  assert.equal(revWrong.correctCount, 2);
  assert.equal(revWrong.intervalDays, 1);
  assert.equal(revWrong.masteryStage, "weak");
});
