/**
 * Server-side source of truth for the Grammar Mastery Quiz answer key.
 * Mirrors the catalog transformation used by src/data/grammar/grammarRegistry.js.
 */
import legacyGrammarData from "../../src/data/grammar.json" with { type: "json" };
import presentSimple from "../../src/data/grammar/present-simple.json" with { type: "json" };
import presentContinuous from "../../src/data/grammar/present-continuous.json" with { type: "json" };
import pastSimple from "../../src/data/grammar/past-simple.json" with { type: "json" };

const ENHANCED_TOPICS = Object.freeze({
  "present-simple": presentSimple,
  "present-continuous": presentContinuous,
  "past-simple": pastSimple
});

export function getOfficialGrammarQuiz(topicId) {
  if (!topicId || typeof topicId !== "string") return null;

  const enhanced = ENHANCED_TOPICS[topicId];
  if (enhanced && Array.isArray(enhanced.finalQuiz)) {
    return enhanced.finalQuiz;
  }

  const legacy = legacyGrammarData.topics?.find((topic) => topic.id === topicId);
  if (!legacy) return null;

  // Keep parity with GrammarDetail's legacy mapping in grammarRegistry.js.
  return (legacy.questions || []).map((question, index) => ({
    id: `legacy-q-${index + 1}`,
    question: question.prompt,
    options: question.options || ["A", "B", "C"],
    correctIndex: Number.isInteger(question.answer) ? question.answer : 0
  }));
}
