import { calculateNextReview } from "../hooks/useSpacedRepetition.js";
import { normalizeOutboxSrsEvent } from "./progressOutboxMigration.js";

/**
 * Start with canonical server data and replay only unacknowledged local events.
 * This keeps offline work visible while ensuring other devices' saved progress
 * is never overwritten by an older local cache.
 */
export function mergeServerProgressWithPendingEvents(serverItems = {}, pendingEvents = []) {
  const merged = {
    ...(serverItems && typeof serverItems === "object" ? serverItems : {})
  };

  const orderedEvents = [...(Array.isArray(pendingEvents) ? pendingEvents : [])]
    .sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));

  for (const rawEvent of orderedEvents) {
    const event = normalizeOutboxSrsEvent(rawEvent);
    const wordId = String(event?.wordId || "").trim();
    if (!wordId || typeof event?.isCorrect !== "boolean") continue;

    const current = merged[wordId] || {
      wordId,
      level: event.level || "A1",
      correctCount: 0,
      wrongCount: 0,
      masteryStage: "fresh"
    };
    const next = calculateNextReview(event.isCorrect, Number(current.correctCount) || 0);

    merged[wordId] = {
      ...current,
      wordId,
      level: current.level || event.level || "A1",
      correctCount: next.correctCount,
      wrongCount: event.isCorrect
        ? Number(current.wrongCount) || 0
        : (Number(current.wrongCount) || 0) + 1,
      masteryStage: next.masteryStage,
      intervalDays: next.intervalDays || 1,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: event.createdAt || new Date().toISOString()
    };
  }

  return merged;
}
