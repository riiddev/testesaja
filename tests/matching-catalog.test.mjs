import test from "node:test";
import assert from "node:assert/strict";
import {
  createOfficialMatchingRound,
  validateOfficialMatchingRound
} from "../api/_lib/matchingCatalog.js";

const TEST_SECRET = "unit-test-matching-secret-with-at-least-32-characters";
const USER_ID = "matching-test-user";

function completePairs(round) {
  return round.leftItems.map((left) => ({
    leftId: left.id,
    rightId: left.id,
    wordId: left.wordId
  }));
}

test("server creates five unique official pairs and signs the account-bound round", () => {
  const round = createOfficialMatchingRound(USER_ID, "all", TEST_SECRET);
  assert.equal(round.totalPairs, 5);
  assert.equal(round.leftItems.length, 5);
  assert.equal(round.rightItems.length, 5);
  assert.ok(round.roundToken);
  assert.match(round.roundId, /^round_[a-f0-9]{32}$/);

  const result = validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: completePairs(round)
  }, TEST_SECRET);

  assert.equal(result.valid, true);
  assert.equal(result.score, 5);
  assert.equal(result.total, 5);
  assert.equal(result.questionsBreakdown.length, 5);
});

test("Matching rejects forged pairs that were not included in the signed round", () => {
  const round = createOfficialMatchingRound(USER_ID, "all", TEST_SECRET);
  const pairs = completePairs(round);
  pairs[0] = {
    leftId: "pair_forged_0",
    rightId: "pair_forged_0",
    wordId: "forged"
  };

  const result = validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: pairs
  }, TEST_SECRET);

  assert.equal(result.valid, false);
});

test("Matching rejects modified signatures and rounds belonging to another account", () => {
  const round = createOfficialMatchingRound(USER_ID, "all", TEST_SECRET);
  const alteredToken = round.roundToken.slice(0, -1) +
    (round.roundToken.endsWith("A") ? "B" : "A");

  assert.equal(validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: alteredToken,
    matchedPairs: completePairs(round)
  }, TEST_SECRET).valid, false);

  assert.equal(validateOfficialMatchingRound({
    userId: "another-account",
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: completePairs(round)
  }, TEST_SECRET).valid, false);
});

test("Matching rejects missing, duplicated, and mismatched submitted pairs", () => {
  const round = createOfficialMatchingRound(USER_ID, "all", TEST_SECRET);
  const pairs = completePairs(round);

  assert.equal(validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: pairs.slice(0, 4)
  }, TEST_SECRET).valid, false);

  const duplicate = [...pairs];
  duplicate[1] = { ...duplicate[0] };
  assert.equal(validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: duplicate
  }, TEST_SECRET).valid, false);

  const mismatch = [...pairs];
  mismatch[0] = { ...mismatch[0], rightId: "pair_other_0" };
  assert.equal(validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: mismatch
  }, TEST_SECRET).valid, false);
});

test("Matching rejects a token with the wrong signing key", () => {
  const round = createOfficialMatchingRound(USER_ID, "all", TEST_SECRET);
  assert.equal(validateOfficialMatchingRound({
    userId: USER_ID,
    roundId: round.roundId,
    roundToken: round.roundToken,
    matchedPairs: completePairs(round)
  }, "a-different-key-that-is-also-longer-than-32").valid, false);
});
