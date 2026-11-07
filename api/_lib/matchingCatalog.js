/**
 * Server-authoritative Context Matching rounds.
 *
 * The server selects the five official pairs and signs the round payload.
 * The client can only submit a completed set matching that signed challenge.
 */

import crypto from "node:crypto";
import vocabularyData from "../../src/data/vocabulary.json" with { type: "json" };

const vocabularyEntries = Array.isArray(vocabularyData.entries)
  ? vocabularyData.entries
  : [];
const officialMatchingWords = new Map(
  vocabularyEntries
    .filter((entry) => entry?.id && entry?.word && entry?.example)
    .map((entry) => [String(entry.id), entry])
);

function getSigningSecret(secret = process.env.BETTER_AUTH_SECRET) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET harus tersedia untuk menandatangani ronde Matching.");
  }
  return secret;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(encodedPayload, secret) {
  return crypto
    .createHmac("sha256", getSigningSecret(secret))
    .update(encodedPayload)
    .digest("base64url");
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function shuffle(values) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function createClozeSentence(sentence, word) {
  if (!sentence || !word) return sentence || "_____";
  const escapedWord = String(word).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("\\b" + escapedWord + "(?:d|ed|s|es|ing)?\\b", "gi");
  if (regex.test(sentence)) return sentence.replace(regex, "_____");
  return "Lengkapi kalimat: \"" + sentence + "\"";
}

function toPairText(entry) {
  const partOfSpeech = String(entry.partOfSpeech || entry.pos || "")
    .replace("noun", "n")
    .replace("verb", "v")
    .replace("adjective", "adj")
    .replace("adverb", "adv")
    .slice(0, 4);
  return String(entry.word) + (partOfSpeech ? " (" + partOfSpeech + ")" : "");
}

export function isOfficialMatchingWordId(wordId) {
  return typeof wordId === "string" && officialMatchingWords.has(wordId);
}

export function createOfficialMatchingRound(userId, selectedLevel = "all", secret = process.env.BETTER_AUTH_SECRET) {
  if (!userId) throw new Error("User ID wajib tersedia untuk membuat ronde Matching.");

  let candidates = vocabularyEntries.filter((entry) => {
    if (!entry?.id || !entry?.word || !entry?.example || entry.example.length <= 10) return false;
    return selectedLevel === "all" || entry.level === selectedLevel;
  });

  if (candidates.length < 5) {
    candidates = vocabularyEntries.filter((entry) =>
      entry?.id && entry?.word && entry?.example && entry.example.length > 10
    );
  }

  if (candidates.length < 5) {
    throw new Error("Katalog belum memiliki lima kata yang dapat digunakan untuk Matching.");
  }

  const chosen = shuffle(candidates).slice(0, 5);
  const roundId = "round_" + crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 30 * 60 * 1000;

  const canonicalPairs = chosen.map((entry, index) => ({
    pairId: "pair_" + roundId.slice(6, 18) + "_" + index,
    wordId: String(entry.id),
    wordText: toPairText(entry),
    rawWord: String(entry.word),
    level: entry.level || "A1",
    clozeSentence: createClozeSentence(entry.example, entry.word),
    fullSentence: String(entry.example),
    translation: String(entry.translation || entry.meaning || ""),
    meaning: String(entry.meaning || "")
  }));

  const payload = {
    v: 1,
    userId: String(userId),
    roundId,
    issuedAt: Date.now(),
    expiresAt,
    pairs: canonicalPairs.map((pair) => ({
      pairId: pair.pairId,
      wordId: pair.wordId
    }))
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const roundToken = encodedPayload + "." + signPayload(encodedPayload, secret);

  const leftItems = canonicalPairs.map((pair) => ({
    id: pair.pairId,
    wordId: pair.wordId,
    clozeSentence: pair.clozeSentence,
    translation: pair.translation,
    level: pair.level
  }));
  const rightItems = shuffle(canonicalPairs).map((pair) => ({
    id: pair.pairId,
    wordId: pair.wordId,
    wordText: pair.wordText,
    rawWord: pair.rawWord,
    level: pair.level
  }));

  return {
    roundId,
    roundToken,
    expiresAt: new Date(expiresAt).toISOString(),
    totalPairs: 5,
    leftItems,
    rightItems
  };
}

export function validateOfficialMatchingRound({
  userId,
  roundId,
  roundToken,
  matchedPairs
}, secret = process.env.BETTER_AUTH_SECRET) {
  if (!userId || !roundId || !roundToken || !Array.isArray(matchedPairs) || matchedPairs.length !== 5) {
    return { valid: false, message: "Ronde Matching tidak lengkap atau belum diverifikasi server." };
  }

  const [encodedPayload, suppliedSignature, ...extra] = String(roundToken).split(".");
  if (!encodedPayload || !suppliedSignature || extra.length > 0) {
    return { valid: false, message: "Tanda tangan ronde Matching tidak valid." };
  }

  let expectedSignature;
  try {
    expectedSignature = signPayload(encodedPayload, secret);
  } catch {
    return { valid: false, message: "Layanan verifikasi Matching belum dikonfigurasi." };
  }

  if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
    return { valid: false, message: "Tanda tangan ronde Matching tidak valid." };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { valid: false, message: "Data ronde Matching rusak." };
  }

  if (
    payload?.v !== 1 ||
    payload.userId !== String(userId) ||
    payload.roundId !== String(roundId) ||
    !Number.isFinite(payload.expiresAt) ||
    payload.expiresAt < Date.now() ||
    !Array.isArray(payload.pairs) ||
    payload.pairs.length !== 5
  ) {
    return { valid: false, message: "Ronde Matching kedaluwarsa atau bukan milik akun ini." };
  }

  const expected = new Map(payload.pairs.map((pair) => [pair.pairId, pair.wordId]));
  const seen = new Set();
  const questionsBreakdown = [];

  for (const pair of matchedPairs) {
    const leftId = String(pair?.leftId || "");
    const rightId = String(pair?.rightId || "");
    const wordId = String(pair?.wordId || "");
    const expectedWordId = expected.get(leftId);

    if (
      !expectedWordId ||
      leftId !== rightId ||
      wordId !== expectedWordId ||
      seen.has(leftId) ||
      !isOfficialMatchingWordId(wordId)
    ) {
      return {
        valid: false,
        message: "Pasangan Matching tidak cocok dengan ronde resmi yang dibuat server."
      };
    }

    seen.add(leftId);
    const entry = officialMatchingWords.get(wordId);
    questionsBreakdown.push({
      questionId: leftId,
      category: "Matching Konteks",
      subType: entry.level || "A1",
      question: createClozeSentence(entry.example, entry.word),
      selectedAnswer: entry.word,
      correctAnswer: entry.word,
      isCorrect: true,
      targetWord: wordId
    });
  }

  if (seen.size !== expected.size) {
    return { valid: false, message: "Semua pasangan pada ronde resmi harus diselesaikan." };
  }

  return {
    valid: true,
    score: 5,
    total: 5,
    questionsBreakdown
  };
}
