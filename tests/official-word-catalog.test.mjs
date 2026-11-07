import test from "node:test";
import assert from "node:assert/strict";
import { getOfficialWord, getOfficialWords, OFFICIAL_SRS_INTERVALS } from "../api/_lib/officialWordCatalog.js";

test("official SRS catalogue contains exactly 2,971 Oxford 3000 headwords", () => {
  const words = getOfficialWords();
  assert.equal(words.length, 2971);
  assert.deepEqual(OFFICIAL_SRS_INTERVALS, [1, 3, 8, 16, 30]);
});

test("official SRS lookup accepts known IDs/headwords and returns server CEFR", () => {
  const words = getOfficialWords();
  const b2 = words.find((word) => word.level === "B2");
  const a1 = words.find((word) => word.level === "A1");

  assert.ok(b2);
  assert.ok(a1);
  assert.equal(getOfficialWord(b2.id)?.level, "B2");
  assert.equal(getOfficialWord(b2.word.toUpperCase())?.level, "B2");
  assert.equal(getOfficialWord(a1.id)?.level, "A1");
  assert.equal(getOfficialWord("forged-word-xyz"), null);
  assert.equal(getOfficialWord(""), null);
});
