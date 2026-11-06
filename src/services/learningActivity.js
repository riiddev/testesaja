/**
 * SINAUENGLISH V2 — Unified Learning Activity Hub
 * 
 * Central coordinator connecting all learning features:
 * - Vocabulary & Spaced Repetition (SRS)
 * - Sentence Context Matching
 * - Grammar Curriculum
 * - HABIT Reading & Comprehension Quizzes
 * - Everyday Adventure Stories
 * 
 * Automatically synchronizes activity logs, daily quests progress, and rewards!
 */

import { api } from "./api.js";

export async function recordLearningActivity({
  activityType,
  refId = "",
  title = "",
  score = 0,
  total = 0,
  durationSeconds = 0,
  wrongItems = [],
  questionsBreakdown = [],
  answers = [],
  meta = {}
}) {
  let result = {
    success: true,
    activityType,
    earnedXp: 0,
    earnedCoins: 0,
    streak: undefined
  };

  try {
    switch (activityType) {
      case "matching": {
        const res = await api.recordMatchingSession({
          score,
          total,
          durationSeconds,
          sessionId: refId || `match_${Date.now()}`
        });
        if (!res?.success) {
          throw new Error(res?.error || res?.message || "Server gagal mencatat aktivitas.");
        }
        if (res.success && res.data) {
          result.earnedXp = res.data.earnedXp || 0;
          result.earnedCoins = res.data.earnedCoins || 0;
          result.streak = res.data.streak;
        }
        // Auto-advance matching quest
        api.updateQuestProgress({}).catch(() => {});
        break;
      }

      case "grammar": {
        const res = await api.saveGrammarProgress({
          topicId: refId,
          score,
          total,
          practiceDone: score >= Math.ceil(total * 0.7)
        });
        if (!res?.success) {
          throw new Error(res?.error || res?.message || "Server gagal mencatat aktivitas.");
        }
        if (res.success && res.data) {
          result.earnedXp = res.data.xpEarned || 0;
          result.earnedCoins = res.data.coinsEarned || 0;
          result.streak = res.data.streak;
        }
        // Auto-advance grammar quest
        api.updateQuestProgress({}).catch(() => {});
        break;
      }

      case "reading_quiz": {
        const res = await api.recordReadingQuiz({
          articleId: refId,
          articleTitle: title,
          durationSeconds,
          answers
        });
        if (!res?.success) {
          throw new Error(res?.error || res?.message || "Server gagal mencatat aktivitas.");
        }
        if (res.success && res.data) {
          result.earnedXp = res.data.earnedXp || 0;
          result.earnedCoins = res.data.earnedCoins || 0;
          result.streak = res.data.streak;
        }
        // Auto-advance reading quest
        api.updateQuestProgress({}).catch(() => {});
        break;
      }

      case "reading_complete": {
        const res = await api.grantReward({
          eventId: `reading:${refId}:first_complete`,
          source: "reading_complete",
          refId,
          meta
        });
        if (!res?.success) {
          throw new Error(res?.error || res?.message || "Server gagal mencatat aktivitas.");
        }
        if (res.success && res.data) {
          result.earnedXp = res.data.earnedXp || 0;
          result.earnedCoins = res.data.earnedCoins || 0;
          result.streak = res.data.streak;
          result.alreadyRewarded = res.data.alreadyRewarded;
        }
        // Auto-advance reading quest
        api.updateQuestProgress({}).catch(() => {});
        break;
      }

      case "story_episode": {
        const res = await api.completeStoryEpisode({
          storyId: refId,
          episodeId: meta.episodeId || 1,
          totalEpisodes: meta.totalEpisodes || 5
        });
        if (!res?.success) {
          throw new Error(res?.error || res?.message || "Server gagal mencatat aktivitas.");
        }
        if (res.success && res.data) {
          result.earnedXp = res.data.earnedXp || 0;
          result.earnedCoins = res.data.earnedCoins || 0;
          result.streak = res.data.streak;
        }
        // Auto-advance story quest
        api.updateQuestProgress({}).catch(() => {});
        break;
      }

      default: {
        const error = `Tipe aktivitas '${activityType}' tidak dikenal.`;
        console.warn(`[LearningActivity] ${error}`);
        result.success = false;
        result.error = error;
      }
    }
  } catch (err) {
    console.warn(`[LearningActivity] Gagal mencatat ${activityType}:`, err.message);
    result.success = false;
    result.error = err.message || "Gagal mencatat aktivitas belajar.";
  }

  return result;
}

