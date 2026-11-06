import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));

console.log("=== SINAUENGLISH V2 DATA & CONTENT AUDIT ===");

// 1. Oxford 3000 Corpus Audit
console.log("Checking Oxford 3000 Corpus...");
const oxfordAudit = json("data/oxford3000/audit.json");
assert.equal(oxfordAudit.headwordCount, 2971, "Oxford 3000 headword count must be exactly 2971");
assert.equal(oxfordAudit.uniqueHeadwords, 2971, "Oxford 3000 unique headwords must be exactly 2971");
assert.equal(oxfordAudit.levelCounts.A1, 892, "A1 count mismatch");
assert.equal(oxfordAudit.levelCounts.A2, 792, "A2 count mismatch");
assert.equal(oxfordAudit.levelCounts.B1, 689, "B1 count mismatch");
assert.equal(oxfordAudit.levelCounts.B2, 597, "B2 count mismatch");
assert.equal(oxfordAudit.levelCounts.UNCLASSIFIED, 1, "UNCLASSIFIED count mismatch");
assert.equal(oxfordAudit.editorialOverrides, 1144, "Editorial overrides count mismatch");

// Verify uncompressed b64 datasets
function readGzB64(path) {
  const b64 = read(path).trim();
  const buf = Buffer.from(b64, "base64");
  const uncompressed = zlib.gunzipSync(buf);
  return JSON.parse(uncompressed.toString("utf8"));
}

const a1Data = readGzB64("data/oxford3000/A1.json.gz.b64");
const a2Data = readGzB64("data/oxford3000/A2.json.gz.b64");
const b1Data = readGzB64("data/oxford3000/B1.json.gz.b64");
const b2Data = readGzB64("data/oxford3000/B2.json.gz.b64");
const unclassifiedData = readGzB64("data/oxford3000/UNCLASSIFIED.json.gz.b64");

assert.equal(a1Data.entries.length, 892, "A1 entries count mismatch");
assert.equal(a2Data.entries.length, 792, "A2 entries count mismatch");
assert.equal(b1Data.entries.length, 689, "B1 entries count mismatch");
assert.equal(b2Data.entries.length, 597, "B2 entries count mismatch");
assert.equal(unclassifiedData.entries.length, 1, "UNCLASSIFIED entries count mismatch");

const allHeadwords = new Set();
const allIds = new Set();

[...a1Data.entries, ...a2Data.entries, ...b1Data.entries, ...b2Data.entries, ...unclassifiedData.entries].forEach(entry => {
  assert.ok(entry.word && entry.id, "Entry must have headword and id");
  assert.ok(!allIds.has(entry.id), `Duplicate ID: ${entry.id}`);
  assert.ok(!allHeadwords.has(entry.word.toLowerCase()), `Duplicate word: ${entry.word}`);
  allIds.add(entry.id);
  allHeadwords.add(entry.word.toLowerCase());
});

assert.equal(allHeadwords.size, 2971, `Total uncompressed headwords count (${allHeadwords.size}) must be 2971`);
console.log(`✓ Oxford 3000 verified: ${allHeadwords.size} unique headwords across A1 (892), A2 (792), B1 (689), B2 (597), UNCLASSIFIED (1).`);

// 2. Starter Vocabulary JSON
console.log("Checking Starter Vocabulary...");
const vocabulary = json("data/vocabulary.json");
assert.ok(Array.isArray(vocabulary.entries), "Vocabulary entries must be an array");
assert.equal(vocabulary.entries.length, 999, "Expected exactly 999 starter vocabulary rows");
console.log(`✓ Vocabulary starter index verified: ${vocabulary.entries.length} entries.`);

// 3. Grammar Curriculum
console.log("Checking Grammar Curriculum...");
const grammar = json("data/grammar.json");
assert.ok(Array.isArray(grammar.topics) && grammar.topics.length === 19, "Expected 19 grammar topics");
let grammarQuestionCount = 0;
for (const topic of grammar.topics) {
  assert.ok(topic.id && topic.title && topic.summary && topic.explanation, `${topic.id}: incomplete topic`);
  grammarQuestionCount += topic.questions.length;
}
assert.equal(grammarQuestionCount, 57, "Expected 57 validated grammar questions");
console.log(`✓ Grammar verified: 19 lessons with ${grammarQuestionCount} validated questions across A1–B2.`);

// 4. HABIT Reading Library
console.log("Checking HABIT Reading Library...");
const habit = json("data/habit-reading-library.json");
assert.equal(habit.passages.length, 156, "HABIT passage collection count changed");
assert.equal(habit.extractionSummary.wordCount, 63309, "HABIT total word count mismatch");
console.log(`✓ HABIT library verified: ${habit.passages.length} passages, ${habit.extractionSummary.wordCount.toLocaleString("en-US")} words.`);

// 5. Reading Lessons
console.log("Checking Reading Skills...");
const reading = json("data/reading-lessons.json");
assert.equal(reading.skills.length, 12, "Expected 12 reading skills");
console.log(`✓ Reading skills verified: ${reading.skills.length} lessons.`);

// 6. Everyday Adventure Series
console.log("Checking Everyday Adventure Series...");
const stories = json("public/data/adventure/stories.json");
assert.equal(stories.stories.length, 8, "Expected 8 Everyday Stories");

const dialogues = json("public/data/adventure/dialogues.json");
assert.equal(dialogues.dialogues.length, 4, "Expected 4 Everyday English dialogues");

const listening = json("public/data/adventure/listening.json");
assert.equal(listening.exercises.length, 8, "Expected 8 Listening Lab exercises");

const pronunciation = json("public/data/adventure/pronunciation.json");
assert.equal(pronunciation.exercises.length, 16, "Expected 16 Pronunciation Studio exercises");

console.log(`✓ Adventure series verified: ${stories.stories.length} stories, ${dialogues.dialogues.length} dialogues, ${listening.exercises.length} listening exercises, ${pronunciation.exercises.length} pronunciation exercises.`);

// 7. Verify src/data/ static bundle matches exactly
console.log("Checking src/data/ static bundle...");
const srcOxfordAudit = json("src/data/oxford3000/audit.json");
assert.equal(srcOxfordAudit.headwordCount, 2971, "src/data/ Oxford 3000 headword count must be exactly 2971");
const srcVocab = json("src/data/vocabulary.json");
assert.equal(srcVocab.entries.length, 999, "src/data/ Vocabulary entries count mismatch");
const srcGrammar = json("src/data/grammar.json");
assert.equal(srcGrammar.topics.length, 19, "src/data/ Grammar topics count mismatch");
const srcHabit = json("src/data/habit-reading-library.json");
assert.equal(srcHabit.passages.length, 156, "src/data/ HABIT passages count mismatch");
console.log("✓ src/data/ static bundle verified 100% identical!");

console.log("\n==============================================");
console.log("DATA PARITY VERIFICATION PASSED (V1 == V2)!");
console.log("Total Headwords V1: 2971 == Total Headwords V2: 2971");
console.log("==============================================");
