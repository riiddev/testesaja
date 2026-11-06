/**
 * SINAUENGLISH V2 — Mastery & Spaced Repetition (SRS) Service
 * Implements intervals: [1, 3, 8, 16, 30] days and mastery evaluation
 */

import type { WordProgress } from "./storage.ts";

export const SRS_INTERVALS = [1, 3, 8, 16, 30]; // Days

export type WordStatus = "fresh" | "learning" | "due" | "weak" | "mastered";

export interface WordStatusMeta {
  status: WordStatus;
  label: string;
  className: string;
  description: string;
}

export const STATUS_META: Record<WordStatus, WordStatusMeta> = {
  fresh: {
    status: "fresh",
    label: "Baru",
    className: "badge-sand",
    description: "Kata belum pernah dipelajari."
  },
  learning: {
    status: "learning",
    label: "Belajar",
    className: "badge-navy",
    description: "Sedang dipelajari dalam siklus latihan."
  },
  due: {
    status: "due",
    label: "Review",
    className: "badge-gold",
    description: "Waktunya diulang sesuai jadwal spaced repetition."
  },
  weak: {
    status: "weak",
    label: "Lemah",
    className: "badge-rose",
    description: "Perlu perhatian lebih karena ada kesalahan baru-baru ini."
  },
  mastered: {
    status: "mastered",
    label: "Mastered",
    className: "badge-sage",
    description: "Telah memenuhi standar pemahaman makna dan review berulang."
  }
};

export function ensureWordProgress(progressMap: Record<string, WordProgress>, wordId: string): WordProgress {
  if (!progressMap[wordId]) {
    progressMap[wordId] = {
      attempts: [],
      skillEvidence: { recall: false, context: false, production: false },
      firstSeenDate: null,
      studiedDates: [],
      nextReviewAt: null,
      reviewSuccesses: 0,
      reviewDates: [],
      reviewHistory: [],
      contextQuestionIds: [],
      consecutiveErrors: 0,
      weak: false,
      masteredAt: null
    };
  }
  return progressMap[wordId];
}

export function isMastered(p: WordProgress): boolean {
  if (!p) return false;
  if (p.masteredAt) return true;
  const hasSkill = p.skillEvidence && p.skillEvidence.recall && p.skillEvidence.context;
  const hasRepeat = p.reviewSuccesses >= 2;
  return Boolean(hasSkill && hasRepeat && !p.weak);
}

export function getWordStatus(p: WordProgress | undefined): WordStatus {
  if (!p || (!p.firstSeenDate && (!p.attempts || p.attempts.length === 0))) {
    return "fresh";
  }
  if (p.weak) return "weak";
  if (p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= Date.now()) {
    return "due";
  }
  if (isMastered(p)) return "mastered";
  return "learning";
}

export function calculateNextReview(p: WordProgress, isCorrect: boolean, now: Date = new Date()): void {
  const todayStr = now.toISOString().split("T")[0];
  if (!p.firstSeenDate) p.firstSeenDate = todayStr;
  if (!p.studiedDates.includes(todayStr)) p.studiedDates.push(todayStr);

  if (isCorrect) {
    p.reviewSuccesses = (p.reviewSuccesses || 0) + 1;
    p.consecutiveErrors = 0;
    p.weak = false;

    const intervalIndex = Math.min(p.reviewSuccesses - 1, SRS_INTERVALS.length - 1);
    const daysToAdd = SRS_INTERVALS[Math.max(0, intervalIndex)];
    
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    p.nextReviewAt = nextDate.toISOString();

    if (isMastered(p) && !p.masteredAt) {
      p.masteredAt = now.toISOString();
    }
  } else {
    p.consecutiveErrors = (p.consecutiveErrors || 0) + 1;
    p.weak = true;
    p.reviewSuccesses = Math.max(0, (p.reviewSuccesses || 0) - 1);

    // Repeat tomorrow
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
    p.nextReviewAt = nextDate.toISOString();
  }
}
