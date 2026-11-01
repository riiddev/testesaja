import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));

const mirrorPairs = [
  ["belajar.js", "public/belajar.js"],
  ["data/vocabulary.json", "public/data/vocabulary.json"],
  ["data/grammar.json", "public/data/grammar.json"],
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

const assistantEditorialPass = vocabulary.entries.filter((entry) =>
  entry.editorialPass === "assistant-editorial-pass-2026-11"
);
assert.ok(assistantEditorialPass.length >= 35, "Expected the first high-frequency A1/A2 editorial pass");
for (const entry of assistantEditorialPass) {
  assert.ok(entry.draft === true && entry.contentStatus === "assistant-curated-draft", `${entry.word}: assistant editorial changes must not remove the human-review flag`);
  assert.ok(entry.definition && entry.context && entry.context.prompt, `${entry.word}: missing editorial definition or context prompt`);
  assert.ok(Array.isArray(entry.context.options) && entry.context.options.length >= 3, `${entry.word}: context needs at least three options`);
  assert.ok(Number.isInteger(entry.context.answer) && entry.context.answer >= 0 && entry.context.answer < entry.context.options.length, `${entry.word}: invalid context answer key`);
}


const grammar = json("data/grammar.json");
assert.ok(Array.isArray(grammar.topics) && grammar.topics.length >= 19, "Expected the expanded A1–B2 grammar curriculum");
const grammarTopicIds = new Set();
const grammarQuestionIds = new Set();
const grammarLevels = Object.fromEntries(["A1", "A2", "B1", "B2"].map((level) => [level, 0]));
let grammarQuestionCount = 0;
for (const topic of grammar.topics) {
  assert.ok(topic.id && topic.title && topic.summary && topic.explanation && topic.checkpoint, "Every grammar topic needs a complete lesson structure");
  assert.ok(!grammarTopicIds.has(topic.id), `Duplicate grammar topic id: ${topic.id}`);
  grammarTopicIds.add(topic.id);
  assert.ok(["A1", "A2", "B1", "B2"].includes(topic.level), `${topic.title}: invalid CEFR level`);
  grammarLevels[topic.level] += 1;
  assert.ok(Number.isInteger(topic.estimatedMinutes) && topic.estimatedMinutes >= 5, `${topic.title}: invalid duration`);
  for (const field of ["patterns", "examples", "mistakes", "questions"]) {
    assert.ok(Array.isArray(topic[field]) && topic[field].length >= 2, `${topic.title}: missing ${field}`);
  }
  for (const example of topic.examples) assert.ok(example.en && example.id, `${topic.title}: example needs English and Indonesian`);
  for (const mistake of topic.mistakes) assert.ok(mistake.wrong && mistake.right && mistake.why, `${topic.title}: incomplete common-error guidance`);
  for (const question of topic.questions) {
    grammarQuestionCount += 1;
    assert.ok(question.id && question.prompt && question.explanation, `${topic.title}: incomplete question`);
    assert.ok(!grammarQuestionIds.has(question.id), `Duplicate grammar question id: ${question.id}`);
    grammarQuestionIds.add(question.id);
    if (question.type === "multiple-choice") {
      assert.ok(Array.isArray(question.options) && question.options.length >= 3, `${topic.title}: multiple-choice question needs options`);
      assert.equal(new Set(question.options).size, question.options.length, `${topic.title}: duplicate answer choices`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${topic.title}: invalid answer key`);
    } else if (question.type === "typed") {
      assert.ok(Array.isArray(question.accepted) && question.accepted.length > 0, `${topic.title}: typed question needs accepted answers`);
    } else assert.fail(`${topic.title}: unsupported question type ${question.type}`);
  }
}
assert.ok(Object.values(grammarLevels).every((count) => count >= 3), "Grammar needs multiple topics at every CEFR level");
assert.ok(grammarQuestionCount >= 55, "Expanded grammar question bank is too small");

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


const storyLibrary = json("public/data/adventure/stories.json");
assert.equal(storyLibrary.schemaVersion, 1, "Everyday Stories schema version changed");
assert.ok(Array.isArray(storyLibrary.stories) && storyLibrary.stories.length >= 4, "Expected the A1–B2 Everyday Stories collection");
const storyIds = new Set();
const storyQuestionIds = new Set();
const vocabularyById = new Map(vocabulary.entries.map((entry) => [entry.id, entry]));
const storyLevels = new Set();
for (const story of storyLibrary.stories) {
  assert.ok(story.id && story.title && story.subtitle, "Every story needs an id, title, and subtitle");
  assert.ok(!storyIds.has(story.id), `Duplicate story id: ${story.id}`);
  storyIds.add(story.id);
  assert.ok(["A1", "A2", "B1", "B2"].includes(story.level), `${story.title}: invalid CEFR guide level`);
  storyLevels.add(story.level);
  assert.ok(Number.isInteger(story.estimatedMinutes) && story.estimatedMinutes > 0, `${story.title}: invalid reading-time estimate`);
  assert.ok(Array.isArray(story.paragraphs) && story.paragraphs.length >= 2 && story.paragraphs.every((item) => typeof item === "string" && item.trim()), `${story.title}: paragraphs are missing`);
  assert.ok(Array.isArray(story.focusWords) && story.focusWords.length >= 3, `${story.title}: at least three focus words are required`);
  for (const focus of story.focusWords) {
    const entry = vocabularyById.get(focus.id);
    assert.ok(entry, `${story.title}: unknown vocabulary id ${focus.id}`);
    assert.equal(String(focus.word).toLocaleLowerCase("en"), entry.word.toLocaleLowerCase("en"), `${story.title}: focus word does not match ${focus.id}`);
    assert.ok(typeof focus.meaning === "string" && focus.meaning.trim(), `${story.title}: missing Indonesian gloss for ${focus.word}`);
  }
  assert.ok(Array.isArray(story.questions) && story.questions.length >= 3, `${story.title}: at least three comprehension questions are required`);
  for (const question of story.questions) {
    assert.ok(question.id && question.prompt && question.explanation, `${story.title}: question needs an id, prompt, and explanation`);
    assert.ok(!storyQuestionIds.has(question.id), `Duplicate story question id: ${question.id}`);
    storyQuestionIds.add(question.id);
    assert.ok(Array.isArray(question.options) && question.options.length >= 3, `${story.title}: question needs at least three options`);
    assert.equal(new Set(question.options).size, question.options.length, `${story.title}: duplicate answer options`);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${story.title}: invalid answer key`);
  }
}
assert.ok(storyLevels.has("A1") && storyLevels.has("A2") && storyLevels.has("B1") && storyLevels.has("B2"), "Everyday Stories should cover A1 through B2");


const dialogueLibrary = json("public/data/adventure/dialogues.json");
assert.equal(dialogueLibrary.schemaVersion, 1, "Everyday English schema version changed");
assert.ok(Array.isArray(dialogueLibrary.dialogues) && dialogueLibrary.dialogues.length >= 4, "Expected at least four Everyday English scenarios");
const dialogueIds = new Set();
const dialogueTurnIds = new Set();
const allowedSpeakingPrompts = new Set(["first-introduction", "ask-directions", "cafe-order", "discuss-study-plan", "present-study-proposal"]);
const dialogueLevels = new Set();
for (const dialogue of dialogueLibrary.dialogues) {
  assert.ok(dialogue.id && dialogue.title && dialogue.subtitle && dialogue.setting, "Every dialogue needs an id, title, subtitle, and setting");
  assert.ok(!dialogueIds.has(dialogue.id), `Duplicate dialogue id: ${dialogue.id}`);
  dialogueIds.add(dialogue.id);
  assert.ok(["A1", "A2", "B1", "B2"].includes(dialogue.level), `${dialogue.title}: invalid CEFR guide level`);
  dialogueLevels.add(dialogue.level);
  assert.ok(Number.isInteger(dialogue.estimatedMinutes) && dialogue.estimatedMinutes > 0, `${dialogue.title}: invalid time estimate`);
  assert.ok(allowedSpeakingPrompts.has(dialogue.speakingPromptId), `${dialogue.title}: missing matching Speaking Studio prompt`);
  assert.ok(Array.isArray(dialogue.transcript) && dialogue.transcript.length >= 4, `${dialogue.title}: transcript is missing`);
  for (const line of dialogue.transcript) assert.ok(line.speaker && line.text, `${dialogue.title}: transcript line needs speaker and text`);
  assert.ok(Array.isArray(dialogue.focusWords) && dialogue.focusWords.length >= 3, `${dialogue.title}: at least three focus words are required`);
  for (const focus of dialogue.focusWords) {
    const entry = vocabularyById.get(focus.id);
    assert.ok(entry, `${dialogue.title}: unknown vocabulary id ${focus.id}`);
    assert.equal(String(focus.word).toLocaleLowerCase("en"), entry.word.toLocaleLowerCase("en"), `${dialogue.title}: focus word does not match ${focus.id}`);
    assert.ok(typeof focus.meaning === "string" && focus.meaning.trim(), `${dialogue.title}: missing Indonesian gloss for ${focus.word}`);
  }
  assert.ok(Array.isArray(dialogue.turns) && dialogue.turns.length >= 3, `${dialogue.title}: at least three conversation turns are required`);
  for (const turn of dialogue.turns) {
    assert.ok(turn.id && turn.partnerLine && turn.prompt && turn.explanation && turn.response, `${dialogue.title}: incomplete roleplay turn`);
    assert.ok(!dialogueTurnIds.has(turn.id), `Duplicate dialogue turn id: ${turn.id}`);
    dialogueTurnIds.add(turn.id);
    assert.ok(dialogue.transcript.some((line) => line.text.includes(turn.partnerLine)), `${dialogue.title}: partner line is not in the transcript`);
    assert.ok(Array.isArray(turn.options) && turn.options.length >= 3, `${dialogue.title}: turn needs at least three answer options`);
    assert.equal(new Set(turn.options).size, turn.options.length, `${dialogue.title}: duplicate answer options`);
    assert.ok(Number.isInteger(turn.answer) && turn.answer >= 0 && turn.answer < turn.options.length, `${dialogue.title}: invalid answer key`);
    assert.equal(turn.response, turn.options[turn.answer], `${dialogue.title}: recommended response must match the answer key`);
  }
}
assert.ok(dialogueLevels.has("A1") && dialogueLevels.has("A2") && dialogueLevels.has("B1") && dialogueLevels.has("B2"), "Everyday English should cover A1 through B2");


const listeningLibrary = json("public/data/adventure/listening.json");
assert.equal(listeningLibrary.schemaVersion, 1, "Listening Lab schema version changed");
assert.ok(Array.isArray(listeningLibrary.exercises) && listeningLibrary.exercises.length >= 8, "Expected at least four Listening Lab exercises");
const listeningIds = new Set();
const listeningStageIds = new Set();
const listeningLevels = new Set();
const listeningKinds = ["gist", "detail", "inference"];
for (const exercise of listeningLibrary.exercises) {
  assert.ok(exercise.id && exercise.title && exercise.subtitle && exercise.setting, "Every Listening Lab exercise needs an id, title, subtitle, and setting");
  assert.ok(!listeningIds.has(exercise.id), `Duplicate Listening Lab exercise id: ${exercise.id}`);
  listeningIds.add(exercise.id);
  assert.ok(["A1", "A2", "B1", "B2"].includes(exercise.level), `${exercise.title}: invalid CEFR guide level`);
  listeningLevels.add(exercise.level);
  assert.ok(Number.isInteger(exercise.estimatedMinutes) && exercise.estimatedMinutes > 0, `${exercise.title}: invalid time estimate`);
  assert.ok(Array.isArray(exercise.transcript) && exercise.transcript.length >= 4, `${exercise.title}: transcript is missing`);
  const transcriptText = exercise.transcript.map((line) => {
    assert.ok(line && typeof line.speaker === "string" && line.speaker.trim() && typeof line.text === "string" && line.text.trim(), `${exercise.title}: invalid transcript line`);
    return line.speaker + ": " + line.text;
  }).join(" ");
  assert.ok(Array.isArray(exercise.focusWords) && exercise.focusWords.length >= 3, `${exercise.title}: at least three focus words are required`);
  for (const focus of exercise.focusWords) {
    const entry = vocabularyById.get(focus.id);
    assert.ok(entry, `${exercise.title}: unknown vocabulary id ${focus.id}`);
    assert.equal(String(focus.word).toLocaleLowerCase("en"), entry.word.toLocaleLowerCase("en"), `${exercise.title}: focus word does not match ${focus.id}`);
    assert.ok(typeof focus.meaning === "string" && focus.meaning.trim(), `${exercise.title}: missing Indonesian gloss for ${focus.word}`);
  }
  assert.ok(Array.isArray(exercise.stages) && exercise.stages.length === 3, `${exercise.title}: expected exactly three listening stages`);
  for (const [index, stage] of exercise.stages.entries()) {
    assert.ok(stage && stage.id && stage.label && stage.prompt && stage.explanation, `${exercise.title}: incomplete listening stage`);
    assert.ok(!listeningStageIds.has(stage.id), `Duplicate Listening Lab stage id: ${stage.id}`);
    listeningStageIds.add(stage.id);
    assert.equal(stage.kind, listeningKinds[index], `${exercise.title}: stage order must be gist, detail, then inference`);
    assert.ok(typeof stage.audioText === "string" && stage.audioText.trim(), `${exercise.title}: missing stage audio text`);
    assert.ok(transcriptText.includes(stage.audioText), `${exercise.title}: stage audio text must be grounded in its transcript`);
    assert.ok(Array.isArray(stage.options) && stage.options.length >= 3, `${exercise.title}: stage needs at least three options`);
    assert.equal(new Set(stage.options).size, stage.options.length, `${exercise.title}: duplicate stage options`);
    assert.ok(Number.isInteger(stage.answer) && stage.answer >= 0 && stage.answer < stage.options.length, `${exercise.title}: invalid stage answer key`);
  }
}
assert.ok(["A1", "A2", "B1", "B2"].every((level) => listeningLevels.has(level)), "Listening Lab should cover A1 through B2");


const pronunciationLibrary = json("public/data/adventure/pronunciation.json");
assert.equal(pronunciationLibrary.schemaVersion, 1, "Pronunciation Studio schema version changed");
assert.ok(Array.isArray(pronunciationLibrary.exercises) && pronunciationLibrary.exercises.length >= 16, "Expected at least eight Pronunciation Studio exercises");
const pronunciationIds = new Set();
const pronunciationLevels = new Set();
for (const exercise of pronunciationLibrary.exercises) {
  assert.ok(exercise && exercise.id && exercise.title && exercise.phrase && exercise.meaning, "Every pronunciation exercise needs an id, title, phrase, and meaning");
  assert.ok(!pronunciationIds.has(exercise.id), `Duplicate Pronunciation Studio exercise id: ${exercise.id}`);
  pronunciationIds.add(exercise.id);
  assert.ok(["A1", "A2", "B1", "B2"].includes(exercise.level), `${exercise.title}: invalid CEFR guide level`);
  pronunciationLevels.add(exercise.level);
  assert.ok(Number.isInteger(exercise.targetSeconds) && exercise.targetSeconds >= 2 && exercise.targetSeconds <= 12, `${exercise.title}: invalid target duration`);
  assert.ok(["Word stress", "Sentence stress", "Polite intonation", "Question intonation", "Rhythm and linking", "Polite phrasing and emphasis", "Contrastive stress", "Contrast and thought groups", "Long sentence rhythm"].includes(exercise.focus), `${exercise.title}: invalid pronunciation focus`);
  assert.ok(Array.isArray(exercise.stressWords) && exercise.stressWords.length >= 1, `${exercise.title}: expected stressed words`);
  for (const word of exercise.stressWords) assert.ok(exercise.phrase.toLocaleLowerCase("en").includes(word.toLocaleLowerCase("en")), `${exercise.title}: stressed expression ${word} is not in the phrase`);
  assert.ok(Array.isArray(exercise.phraseGroups) && exercise.phraseGroups.length >= 2, `${exercise.title}: expected thought groups`);
  assert.ok(exercise.intonation && exercise.intonation.label && exercise.intonation.description, `${exercise.title}: intonation guidance is missing`);
  assert.ok(typeof exercise.linking === "string" && exercise.linking.trim(), `${exercise.title}: connected-speech guidance is missing`);
  assert.ok(Array.isArray(exercise.coaching) && exercise.coaching.length >= 2, `${exercise.title}: at least two coaching tips are required`);
  assert.ok(!("audioUrl" in exercise) && !("audioData" in exercise) && !("recording" in exercise), `${exercise.title}: phrase content must not embed audio files`);
}
assert.ok(["A1", "A2", "B1", "B2"].every((level) => pronunciationLevels.has(level)), "Pronunciation Studio should cover A1 through B2");
assert.ok(["A1", "A2", "B1", "B2"].every((level) => storyLevels.has(level)), "Everyday Stories should cover A1 through B2");
const storyIdSet = storyIds;
const dialogueIdSet = dialogueIds;
const listeningIdSet = listeningIds;
const pronunciationIdSet = pronunciationIds;
const allowedWritingPrompts = new Set(["short-introduction", "weekend-story", "helpful-message", "study-reflection", "balanced-proposal"]);
function auditLearningPath(path, label) {
  assert.ok(path && typeof path === "object", `${label}: shared learning path is required`);
  if (path.storyId) assert.ok(storyIdSet.has(path.storyId), `${label}: unknown linked story ${path.storyId}`);
  if (path.dialogueId) assert.ok(dialogueIdSet.has(path.dialogueId), `${label}: unknown linked dialogue ${path.dialogueId}`);
  if (path.listeningId) assert.ok(listeningIdSet.has(path.listeningId), `${label}: unknown linked listening exercise ${path.listeningId}`);
  if (path.pronunciationId) assert.ok(pronunciationIdSet.has(path.pronunciationId), `${label}: unknown linked pronunciation exercise ${path.pronunciationId}`);
  if (path.speakingPromptId) assert.ok(allowedSpeakingPrompts.has(path.speakingPromptId), `${label}: unknown Speaking Studio prompt ${path.speakingPromptId}`);
  if (path.writingPromptId) assert.ok(allowedWritingPrompts.has(path.writingPromptId), `${label}: unknown Writing Studio prompt ${path.writingPromptId}`);
}
for (const story of storyLibrary.stories) auditLearningPath(story.learningPath, story.title);
for (const dialogue of dialogueLibrary.dialogues) auditLearningPath(dialogue.learningPath, dialogue.title);
for (const exercise of listeningLibrary.exercises) auditLearningPath(exercise.learningPath, exercise.title);
for (const exercise of pronunciationLibrary.exercises) auditLearningPath(exercise.learningPath, exercise.title);

assert.match(pronunciationLibrary.note, /locally|lokal/i, "Pronunciation Studio must disclose local microphone analysis");

console.log("Content audit passed.");
console.log(`- Vocabulary: ${vocabulary.entries.length} unique headwords; ${importedDraftCount} imported rows remain flagged for human review; ${assistantEditorialPass.length} A1/A2 items have an assistant context/definition pass.`);
console.log(`- Grammar: ${grammar.topics.length} lessons and ${grammarQuestionCount} validated questions across A1–B2.`);
console.log(`- HABIT library: ${habit.passages.length} unique passages; ${storedWordCount.toLocaleString("en-US")} words; 175 physical PDF pages / 174 numbered content pages.`);
console.log(`- Reading skills: ${reading.skills.length} skills and ${questionCount} checked questions.`);
console.log(`- Everyday Stories: ${storyLibrary.stories.length} stories across A1–B2; focus words link to checked vocabulary IDs and all question keys are valid.`);
console.log("- Shared learning paths: reading, dialogue, listening, pronunciation, speaking, and writing references are validated.");
console.log(`- Everyday English: ${dialogueLibrary.dialogues.length} situational scenarios across A1–B2; response keys, transcript lines, vocabulary IDs, and Speaking Studio links are valid.`);
console.log(`- Listening Lab: ${listeningLibrary.exercises.length} staged exercises across A1–B2; audio excerpts align with transcripts, focus words link to vocabulary, and all three answer keys per exercise are valid.`);
console.log(`- Pronunciation Studio: ${pronunciationLibrary.exercises.length} guided speaking phrases across A1–B2; stress targets, thought groups, intonation notes, and local-analysis disclosure are checked.`);
console.log("- Root/public JSON mirrors match byte-for-byte.");


const adventureScript = readFileSync("public/adventure.js", "utf8");
const speakingPromptSection = adventureScript.slice(
  adventureScript.indexOf("  const STUDIO_PROMPTS = {"),
  adventureScript.indexOf("  const STUDIO_DRAFTS_KEY")
);
assert.ok(speakingPromptSection.includes('id: "present-study-proposal"'), "Speaking Studio should include a B2 discussion scenario");
assert.ok((speakingPromptSection.match(/partnerLine:/g) || []).length >= 15, "Speaking Studio should provide at least three partner turns for five scenarios");
assert.ok(speakingPromptSection.includes("I addressed a different viewpoint fairly before responding."), "Speaking Studio should include reflection on handling a counterargument");



const writingPromptSection = adventureScript.slice(
  adventureScript.indexOf("    writing: [", adventureScript.indexOf("  const STUDIO_PROMPTS = {")),
  adventureScript.indexOf("    ]", adventureScript.indexOf("    writing: [", adventureScript.indexOf("  const STUDIO_PROMPTS = {")))
);
for (const id of ["short-introduction", "weekend-story", "helpful-message", "study-reflection", "balanced-proposal"]) {
  assert.ok(writingPromptSection.includes('id: "' + id + '"'), `Writing Studio is missing ${id}`);
}
for (const level of ["A1", "A1–A2", "A2", "B1", "B2"]) {
  assert.ok(writingPromptSection.includes('level: "' + level + '"'), `Writing Studio is missing level ${level}`);
}
assert.ok(writingPromptSection.includes("I acknowledged a limitation and addressed it fairly."), "B2 Writing Studio should encourage balanced argument");

