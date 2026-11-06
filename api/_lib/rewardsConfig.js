/**
 * SINAUENGLISH V2 — Server-side Reward Matrix & Economy Policy
 * 
 * Client NEVER determines XP, coins, or item prices.
 */

export const REWARDS_CONFIG = {
  // Vocabulary & Spaced Repetition (SRS)
  vocab_learn_word: {
    xp: 5,
    coins: 2,
    dailyCapXp: 200
  },
  srs_review_word: {
    xp: 3,
    coins: 1,
    dailyCapXp: 150
  },

  // Grammar curriculum
  grammar_quiz_complete: {
    xp: 30,
    coins: 15
  },

  // Habit Reading (Butir A: Once per article ever per account)
  reading_first_complete: {
    xp: 40,
    coins: 20
  },
  reading_quiz_first_complete: {
    xp: 35,
    coins: 15
  },

  // Everyday Adventure Story Series
  story_episode_complete: {
    xp: 35,
    coins: 15
  },

  // Context Matching
  matching_round_complete: {
    xp: 25,
    coins: 10,
    dailyCapXp: 100
  },

  // Daily Quests (Standard defaults)
  quest_vocab_10: { xp: 35, coins: 15 },
  quest_review_15: { xp: 40, coins: 20 },
  quest_reading_1: { xp: 35, coins: 15 },
  quest_grammar_1: { xp: 35, coins: 15 },
  quest_story_1: { xp: 40, coins: 20 },
  quest_matching_1: { xp: 30, coins: 10 }
};

/**
 * Calibrated XP-to-Level formula
 * Level = max(1, floor(sqrt(XP / 15)) + 1)
 */
export function calculateLevelFromXp(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor(Math.sqrt(safeXp / 15)) + 1);
}

