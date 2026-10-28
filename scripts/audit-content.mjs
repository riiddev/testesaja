import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));

const mirrorPairs = [
  ["data/vocabulary.json", "public/data/vocabulary.json"],
  ["data/habit-reading-library.json", "public/data/habit-reading-library.json"],
  ["data/reading-lessons.json", "public/data/reading-lessons.json"],
];

for (const [source, mirror] of mirrorPairs) {
  assert.equal(read(source), read(mirror), `Public data mirror is stale: ${mirror}`);
}

const vocabulary = json("data/vocabulary.json");
assert.ok(Array.isArray(vocabulary.entries), "Vocabulary entries must be an array");
assert.ok(vocabulary.entries.length >= 999, "Expected the retained starter and A–E vocabulary rows");

const ids = new Set();
const words = new Set();
let importedDraftCount = 0;
for (const entry of vocabulary.entries) {
  assert.ok(entry.id && entry.word, "Every vocabulary row needs an id and headword");
  assert.ok(!ids.has(entry.id), `Duplicate vocabulary id: ${entry.id}`);
  assert.ok(!words.has(entry.word.trim().toLocaleLowerCase("en")), `Duplicate vocabulary word: ${entry.word}`);
  ids.add(entry.id);
  words.add(entry.word.trim().toLocaleLowerCase("en"));

  for (const field of ["level", "partOfSpeech", "meaning", "example", "translation"]) {
    assert.ok(typeof entry[field] === "string" && entry[field].trim(), `${entry.word}: missing ${field}`);
  }

  if (entry.contentStatus === "assistant-curated-draft") {
    importedDraftCount += 1;
    assert.equal(entry.draft, true, `${entry.word}: editorial draft must stay flagged as draft`);
    assert.equal(entry.translationStatus, "assistant-curated-draft", `${entry.word}: inconsistent translation status`);
  }

  if (entry.context) {
    const { options, answer } = entry.context;
    assert.ok(Array.isArray(options) && options.length >= 3, `${entry.word}: context needs at least three options`);
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer < options.length, `${entry.word}: invalid context answer key`);
    assert.equal(new Set(options).size, options.length, `${entry.word}: context has duplicate options`);
  }
}
assert.equal(importedDraftCount, 965, "Keep all imported A–E entries visibly marked for human editorial review");

const habit = json("data/habit-reading-library.json");
assert.equal(habit.sourcePageCount, 175, "HABIT PDF physical page count changed");
assert.equal(habit.contentPages, 174, "HABIT PDF numbered content page count changed");
assert.equal(habit.extractionSummary.extractedPassages, habit.passages.length, "HABIT passage metadata is stale");
assert.equal(habit.passages.length, 156, "HABIT passage collection count changed");

const passageIds = new Set();
const passageTitles = new Set();
const bodies = new Set();
let storedWordCount = 0;
for (const passage of habit.passages) {
  assert.ok(passage.id && passage.title, "Every HABIT passage needs an id and title");
  assert.ok(!passageIds.has(passage.id), `Duplicate HABIT passage id: ${passage.id}`);
  assert.ok(!passageTitles.has(passage.title.toLocaleLowerCase("en")), `Duplicate HABIT title: ${passage.title}`);
  passageIds.add(passage.id);
  passageTitles.add(passage.title.toLocaleLowerCase("en"));

  assert.ok(Array.isArray(passage.paragraphs) && passage.paragraphs.length > 0, `${passage.title}: paragraphs are missing`);
  const body = passage.paragraphs.join("\\n").trim();
  assert.ok(body.length > 0, `${passage.title}: empty reading text`);
  assert.ok(!bodies.has(body), `${passage.title}: exact duplicate passage text`);
  bodies.add(body);
  assert.ok(passage.category, `${passage.title}: category is missing`);
  assert.ok(Number.isInteger(passage.wordCount) && passage.wordCount > 0, `${passage.title}: invalid word count`);
  assert.ok(Number.isInteger(passage.estimatedMinutes) && passage.estimatedMinutes > 0, `${passage.title}: invalid reading-time estimate`);

  // Tokenizers differ on apostrophes and hyphenated compounds; allow a small boundary-count variance.
  const countedWords = (body.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+)*/gu) || []).length;
  assert.ok(Math.abs(countedWords - passage.wordCount) <= 20, `${passage.title}: stored word count differs materially (${passage.wordCount} vs ${countedWords})`);
  storedWordCount += passage.wordCount;
}
assert.equal(storedWordCount, habit.extractionSummary.wordCount, "HABIT total word count metadata must equal passage word counts");

const reading = json("data/reading-lessons.json");
assert.ok(Array.isArray(reading.skills) && reading.skills.length === 12, "Expected all 12 reading-skill lessons");
const skillIds = new Set();
let questionCount = 0;
for (const skill of reading.skills) {
  assert.ok(skill.id && skill.title, "Every reading skill needs an id and title");
  assert.ok(!skillIds.has(skill.id), `Duplicate reading skill id: ${skill.id}`);
  skillIds.add(skill.id);
  assert.ok(Array.isArray(skill.questions) && skill.questions.length > 0, `${skill.title}: no questions`);
  for (const question of skill.questions) {
    questionCount += 1;
    assert.ok(question.prompt && question.explanation && question.evidence, `${skill.title}: question needs prompt, explanation, and evidence`);
    assert.ok(Array.isArray(question.options) && question.options.length >= 3, `${skill.title}: question needs options`);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${skill.title}: invalid answer index`);
    assert.equal(new Set(question.options).size, question.options.length, `${skill.title}: duplicate answer options`);
  }
}

console.log("Content audit passed.");
console.log(`- Vocabulary: ${vocabulary.entries.length} unique headwords; ${importedDraftCount} imported rows stay explicitly flagged for human review.`);
console.log(`- HABIT library: ${habit.passages.length} unique passages; ${storedWordCount.toLocaleString("en-US")} words; 175 physical PDF pages / 174 numbered content pages.`);
console.log(`- Reading skills: ${reading.skills.length} skills and ${questionCount} checked questions.`);
console.log("- Root/public JSON mirrors match byte-for-byte.");
