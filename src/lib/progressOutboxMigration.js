/**
 * Preserve progress events written by older app versions before isCorrect
 * was added. Their masteryStage was calculated locally from that answer.
 */
export function normalizeOutboxSrsEvent(event) {
  if (typeof event?.isCorrect === "boolean") return event;

  if (event?.masteryStage === "weak") {
    return { ...event, isCorrect: false };
  }
  if (event?.masteryStage === "learning" || event?.masteryStage === "mastered") {
    return { ...event, isCorrect: true };
  }

  // Unknown historical shapes are passed through so the server can reject
  // them explicitly rather than silently inventing an answer.
  return event;
}
