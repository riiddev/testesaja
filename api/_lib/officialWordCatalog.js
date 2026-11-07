/**
 * Official Oxford 3000 headword catalogue used to validate SRS sync.
 * The source files are the same audited corpus verified by scripts/verify-v2-data.mjs.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const OFFICIAL_SRS_INTERVALS = Object.freeze([1, 3, 8, 16, 30]);

const corpusDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/oxford3000");
const levelFiles = ["A1", "A2", "B1", "B2", "UNCLASSIFIED"];
const wordsByIdentifier = new Map();
const words = [];

for (const level of levelFiles) {
  const encoded = readFileSync(resolve(corpusDirectory, `${level}.json.gz.b64`), "utf8").trim();
  const parsed = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));

  for (const entry of parsed.entries || []) {
    if (!entry?.id || !entry?.word) continue;
    const official = Object.freeze({
      id: String(entry.id),
      word: String(entry.word),
      level: String(entry.level || level).toUpperCase()
    });

    words.push(official);
    wordsByIdentifier.set(official.id, official);
    wordsByIdentifier.set(official.word.trim().toLowerCase(), official);
  }
}

export function getOfficialWord(identifier) {
  if (typeof identifier !== "string") return null;
  return wordsByIdentifier.get(identifier.trim()) ||
    wordsByIdentifier.get(identifier.trim().toLowerCase()) ||
    null;
}

export function getOfficialWords() {
  return words.slice();
}
