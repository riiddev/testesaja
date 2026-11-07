export const DAILY_QUESTS_CHANGED_EVENT = "sinau:daily-quests-changed";

/**
 * Notify all mounted mission views that a server-backed learning activity or
 * reward claim has just been accepted. Each hook then fetches a fresh snapshot;
 * no client-provided progress value is trusted.
 */
export function notifyDailyQuestsChanged() {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  const EventConstructor = typeof Event === "function" ? Event : null;
  if (!EventConstructor) return;

  window.dispatchEvent(new EventConstructor(DAILY_QUESTS_CHANGED_EVENT));
}

export function subscribeToDailyQuestsChanged(callback) {
  if (
    typeof window === "undefined" ||
    typeof window.addEventListener !== "function" ||
    typeof callback !== "function"
  ) {
    return () => {};
  }

  window.addEventListener(DAILY_QUESTS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(DAILY_QUESTS_CHANGED_EVENT, callback);
}
