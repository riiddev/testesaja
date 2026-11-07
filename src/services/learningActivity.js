/**
 * Unified learning-activity recorder.
 *
 * Activity ownership remains on the server: every case calls its dedicated
 * validator/transaction. This module only normalizes the feature calls and
 * announces a refresh after the server accepts an activity.
 *
 * SRS/vocabulary attempts are queued through useProgressSync's offline-first
 * outbox; the hook announces the same refresh only after server ACK.
 */

import { api } from "./api.js";
import { notifyDailyQuestsChanged } from "./dailyQuestEvents.js";

export const QUEST_ACTIVITY_SOURCE_BY_LEARNING_TYPE = Object.freeze({
  vocabulary_new: "vocab_learn",
  srs_review: "srs_review",
  grammar: "grammar",
  matching: "matching",
  reading_quiz: "reading_quiz",
  reading_complete: "reading_complete",
  story_episode: "story"
});

function copyRewardResult(result, data) {
  result.data = data || null;
  result.earnedXp = Number(data?.earnedXp ?? data?.xpEarned) || 0;
  result.earnedCoins = Number(data?.earnedCoins ?? data?.coinsEarned) || 0;
  result.totalXp = data?.totalXp;
  result.totalCoins = data?.totalCoins;
  result.streak = data?.streak;
  result.alreadyRewarded = Boolean(data?.alreadyRewarded || data?.alreadyCompleted);
  result.alreadyCompleted = Boolean(data?.alreadyCompleted);
}

export async function recordLearningActivity({
  activityType,
  refId = "",
  title = "",
  durationSeconds = 0,
  answers = [],
  matchedPairs = [],
  roundToken = "",
  meta = {}
}) {
  const result = {
    success: false,
    activityType,
    data: null,
    earnedXp: 0,
    earnedCoins: 0,
    streak: undefined,
    error: null
  };

  try {
    if (!Object.prototype.hasOwnProperty.call(QUEST_ACTIVITY_SOURCE_BY_LEARNING_TYPE, activityType)) {
      throw new Error(`Tipe aktivitas '${activityType}' tidak dikenal.`);
    }

    let response;

    switch (activityType) {
      case "matching": {
        response = await api.recordMatchingSession({
          matchedPairs,
          durationSeconds,
          sessionId: refId || `match_${Date.now()}`,
          roundToken
        });
        break;
      }

      case "grammar": {
        if (!Array.isArray(answers) || answers.length === 0) {
          throw new Error("Jawaban resmi kuis Grammar wajib disertakan.");
        }
        response = await api.saveGrammarProgress({
          topicId: refId,
          answers
        });
        break;
      }

      case "reading_quiz": {
        response = await api.recordReadingQuiz({
          articleId: refId,
          articleTitle: title,
          durationSeconds,
          answers
        });
        break;
      }

      case "reading_complete": {
        response = await api.grantReward({
          eventId: `reading:${refId}:first_complete`,
          source: "reading_complete",
          refId,
          meta: {
            ...meta,
            articleTitle: title || meta.articleTitle || refId,
            durationSeconds
          }
        });
        break;
      }

      case "story_episode": {
        response = await api.completeStoryEpisode({
          storyId: refId,
          episodeId: meta.episodeId || 1,
          totalEpisodes: meta.totalEpisodes || 5
        });
        break;
      }

      case "vocabulary_new":
      case "srs_review":
        throw new Error("Aktivitas kosakata dan SRS harus dicatat melalui antrean offline-first useProgressSync.");

      default:
        throw new Error(`Tipe aktivitas '${activityType}' tidak dikenal.`);
    }

    if (!response?.success || !response.data) {
      throw new Error(response?.error || response?.message || "Server gagal mencatat aktivitas belajar.");
    }

    result.success = true;
    copyRewardResult(result, response.data);
    result.message = response.message || null;

    // Every consumer (sidebar, mission page, widgets) re-reads the server
    // snapshot. No client-side increment is sent to the mission endpoint.
    notifyDailyQuestsChanged();
  } catch (err) {
    console.warn(`[LearningActivity] Gagal mencatat ${activityType}:`, err.message);
    result.error = err.message || "Gagal mencatat aktivitas belajar.";
  }

  return result;
}
