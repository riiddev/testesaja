import test from "node:test";
import assert from "node:assert/strict";
import { getOfficialGrammarQuiz } from "../api/_lib/grammarQuizCatalog.js";

test("enhanced grammar quizzes use the official 10-question answer keys", () => {
  for (const topicId of ["present-simple", "present-continuous", "past-simple"]) {
    const questions = getOfficialGrammarQuiz(topicId);
    assert.equal(questions.length, 10, `${topicId} should contain 10 official questions`);

    const ids = questions.map((question) => question.id);
    assert.equal(new Set(ids).size, ids.length, `${topicId} question IDs must be unique`);

    for (const question of questions) {
      assert.ok(Array.isArray(question.options) && question.options.length >= 2);
      assert.ok(Number.isInteger(question.correctIndex));
      assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
    }
  }
});

test("legacy grammar quiz catalog preserves the official question keys", () => {
  const topicIds = ["present-simple","present-continuous","articles","past-simple","countable-uncountable","present-perfect","prepositions-place-time","can-cant-ability","wh-questions","comparatives-superlatives","future-plans-predictions","past-continuous","modals-advice-obligation","passive-voice","relative-clauses","gerunds-infinitives","reported-speech","mixed-conditionals","inversion-emphasis"];
  assert.equal(topicIds.length, 19);

  for (const topicId of topicIds) {
    const questions = getOfficialGrammarQuiz(topicId);
    assert.ok(questions.length > 0, `Missing official questions for ${topicId}`);
    for (const question of questions) {
      assert.ok(question.id);
      assert.ok(question.options.length >= 2);
      assert.ok(Number.isInteger(question.correctIndex));
      assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
    }
  }
});

test("unknown grammar topics and malformed IDs do not return an answer key", () => {
  assert.equal(getOfficialGrammarQuiz("not-a-real-topic"), null);
  assert.equal(getOfficialGrammarQuiz(""), null);
  assert.equal(getOfficialGrammarQuiz(null), null);
});
