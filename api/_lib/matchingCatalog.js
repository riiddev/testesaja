/**
 * Official vocabulary IDs available to the Context Matching exercise.
 */
import vocabularyData from "../../src/data/vocabulary.json" with { type: "json" };

const officialMatchingWordIds = new Set(
  (vocabularyData.entries || [])
    .map((entry) => String(entry.id || ""))
    .filter(Boolean)
);

export function isOfficialMatchingWordId(wordId) {
  return typeof wordId === "string" && officialMatchingWordIds.has(wordId);
}

/**
 * Validates the five pairs submitted by one Context Matching round.
 * This is a deterministic, database-free check and is also covered by tests.
 */
export function validateOfficialMatchingPairs(pairs) {
  if (!Array.isArray(pairs) || pairs.length !== 5) {
    return { valid: false, message: "Satu sesi Matching harus menyelesaikan tepat 5 pasangan." };
  }

  const usedWordIds = new Set();
  for (const pair of pairs) {
    const wordId = String(pair?.wordId || "");
    const leftId = String(pair?.leftId || "");
    const rightId = String(pair?.rightId || "");
    const prefix = `pair_${wordId}_`;
    const sequence = leftId.startsWith(prefix) ? leftId.slice(prefix.length) : "";
    const sequenceIndex = Number(sequence);

    if (
      !isOfficialMatchingWordId(wordId) ||
      usedWordIds.has(wordId) ||
      leftId !== rightId ||
      !sequence ||
      !Number.isInteger(sequenceIndex) ||
      sequenceIndex < 0 ||
      sequenceIndex >= 5
    ) {
      return {
        valid: false,
        message: "Pasangan Matching tidak cocok dengan katalog vocabulary resmi."
      };
    }

    usedWordIds.add(wordId);
  }

  return { valid: true, score: 5, total: 5 };
}
