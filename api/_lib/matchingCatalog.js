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
