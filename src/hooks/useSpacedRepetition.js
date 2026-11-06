/**
 * SINAUENGLISH V2 — Spaced Repetition Engine
 * Adaptive interval calculation: [1, 3, 8, 16, 30] days.
 */

export const SRS_INTERVALS_DAYS = [1, 3, 8, 16, 30];

export const STATUS_META = {
  fresh: { label: "Baru", className: "badge-fresh" },
  learning: { label: "Sedang Belajar", className: "badge-learning" },
  review_due: { label: "Jatuh Tempo", className: "badge-due" },
  mastered: { label: "Dikuasai", className: "badge-mastered" },
  weak: { label: "Perlu Perhatian", className: "badge-weak" }
};

export function getWordStatus(item) {
  if (!item || item.masteryStage === "fresh" || (!item.correctCount && !item.wrongCount)) {
    return "fresh";
  }

  if (item.masteryStage === "mastered" || item.correctCount >= 5) {
    return "mastered";
  }

  if (item.wrongCount > item.correctCount && item.wrongCount >= 2) {
    return "weak";
  }

  if (item.nextReviewAt) {
    const dueDate = new Date(item.nextReviewAt);
    if (!isNaN(dueDate.getTime()) && dueDate.getTime() <= Date.now()) {
      return "review_due";
    }
  }

  return "learning";
}

export function calculateNextReview(isCorrect, currentCorrect = 0) {
  const nextCorrect = isCorrect ? currentCorrect + 1 : Math.max(0, currentCorrect - 1);
  const intervalIndex = Math.min(nextCorrect, SRS_INTERVALS_DAYS.length - 1);
  const intervalDays = isCorrect ? SRS_INTERVALS_DAYS[intervalIndex] : 1;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    correctCount: nextCorrect,
    intervalDays: intervalDays,
    nextReviewAt: nextReviewDate.toISOString(),
    masteryStage: nextCorrect >= 5 ? "mastered" : (isCorrect ? "learning" : "weak")
  };
}

