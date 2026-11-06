/**
 * SINAUENGLISH V2 — Context Matching Generator
 * 
 * Prepares 5 authentic clozed sentences and 5 matching target words per round.
 * Context-first approach: students connect realistic sentence gaps to the right word.
 */

/**
 * Creates a clozed sentence by replacing the target word (or its common inflections) with `_____`
 */
export function createClozeSentence(sentence, word) {
  if (!sentence || !word) return sentence || "_____";

  // Clean word and escape regex special chars
  const cleanWord = word.trim().toLowerCase();
  
  // Create regex that matches word with common endings (e.g., notice, noticed, notices, noticing)
  const regex = new RegExp(`\\b${cleanWord}(?:d|ed|s|es|ing)?\\b`, "gi");

  if (regex.test(sentence)) {
    return sentence.replace(regex, "_____");
  }

  // Fallback: replace first word-like occurrence
  const simpleRegex = new RegExp(`\\b${cleanWord}\\b`, "i");
  if (simpleRegex.test(sentence)) {
    return sentence.replace(simpleRegex, "_____");
  }

  // If word not literally in example, prepend prompt
  return `Lengkapi kalimat: "${sentence}" (kata: _____)`;
}

/**
 * Shuffles an array immutably
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a curated matching round of 5 context-based pairs
 */
export function generateMatchingRound(vocabulary = [], selectedLevel = "all", pairCount = 5) {
  let candidates = vocabulary.filter((w) => {
    if (!w.word || !w.example) return false;
    if (selectedLevel !== "all" && w.level !== selectedLevel) return false;
    return w.example.length > 10;
  });

  if (candidates.length < pairCount) {
    candidates = vocabulary.filter((w) => w.example && w.example.length > 10);
  }

  // Pick pairCount unique random words
  const chosenWords = shuffle(candidates).slice(0, pairCount);

  // Map to structured items
  const pairs = chosenWords.map((w, idx) => {
    const posShort = (w.partOfSpeech || w.pos || "")
      .replace("noun", "n")
      .replace("verb", "v")
      .replace("adjective", "adj")
      .replace("adverb", "adv")
      .slice(0, 4);

    const posTag = posShort ? ` (${posShort})` : "";
    const cloze = createClozeSentence(w.example, w.word);

    return {
      pairId: `pair_${w.id}_${idx}`,
      wordId: w.id,
      wordText: `${w.word}${posTag}`,
      rawWord: w.word,
      level: w.level || "A1",
      clozeSentence: cloze,
      fullSentence: w.example,
      translation: w.translation || w.meaning || "",
      meaning: w.meaning || ""
    };
  });

  // Left column: sentences
  const leftItems = pairs.map((p) => ({
    id: p.pairId,
    wordId: p.wordId,
    clozeSentence: p.clozeSentence,
    translation: p.translation,
    level: p.level
  }));

  // Right column: target words (shuffled)
  const rightItems = shuffle(
    pairs.map((p) => ({
      id: p.pairId,
      wordId: p.wordId,
      wordText: p.wordText,
      rawWord: p.rawWord,
      level: p.level
    }))
  );

  return {
    roundId: `round_${Date.now()}`,
    leftItems,
    rightItems,
    totalPairs: pairCount
  };
}

