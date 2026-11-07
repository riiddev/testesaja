import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateOfficialMatchingPairs } from "../api/_lib/matchingCatalog.js";

const vocabulary = JSON.parse(
  fs.readFileSync(new URL("../src/data/vocabulary.json", import.meta.url), "utf8")
).entries;

const validPairs = vocabulary.slice(0, 5).map((entry, index) => ({
  leftId: `pair_${entry.id}_${index}`,
  rightId: `pair_${entry.id}_${index}`,
  wordId: entry.id
}));

test("official Matching catalog accepts five unique, valid vocabulary pairs", () => {
  assert.deepEqual(validateOfficialMatchingPairs(validPairs), {
    valid: true,
    score: 5,
    total: 5
  });
});

test("Matching rejects IDs outside the official vocabulary catalog", () => {
  const forged = validPairs.map((pair) => ({ ...pair }));
  forged[0] = {
    leftId: "pair_unlisted_0",
    rightId: "pair_unlisted_0",
    wordId: "unlisted"
  };
  assert.equal(validateOfficialMatchingPairs(forged).valid, false);
});

test("Matching rejects duplicate word IDs, mismatched columns, and invalid pair indices", () => {
  const duplicate = [...validPairs];
  duplicate[1] = { ...duplicate[0] };
  assert.equal(validateOfficialMatchingPairs(duplicate).valid, false);

  const mismatched = validPairs.map((pair) => ({ ...pair }));
  mismatched[0].rightId = "pair_different_0";
  assert.equal(validateOfficialMatchingPairs(mismatched).valid, false);

  const invalidIndex = validPairs.map((pair) => ({ ...pair }));
  invalidIndex[0].leftId = `pair_${invalidIndex[0].wordId}_9`;
  invalidIndex[0].rightId = invalidIndex[0].leftId;
  assert.equal(validateOfficialMatchingPairs(invalidIndex).valid, false);
});

test("Matching requires exactly five pairs", () => {
  assert.equal(validateOfficialMatchingPairs(validPairs.slice(0, 4)).valid, false);
  assert.equal(validateOfficialMatchingPairs([...validPairs, validPairs[0]]).valid, false);
  assert.equal(validateOfficialMatchingPairs(null).valid, false);
});
