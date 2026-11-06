/**
 * SINAUENGLISH V2 — Daily Missions (Quests) Engine
 * 
 * Deterministic generation of 3 daily quests per day.
 * Rewards include EXP, Koin Sinau, and progress toward Academic Titles.
 */

export const QUEST_POOL = {
  // Category 1: Kosakata & Repetisi SRS
  category_vocab: [
    {
      id: "quest_vocab_new_5",
      title: "Kuasai 5 Kata Baru",
      category: "vocabulary",
      categoryLabel: "KOSAKATA BARU",
      description: "Pilih dan pelajari 5 kosakata baru dalam korpus Oxford 3000 hari ini.",
      target: 5,
      unit: "kata",
      xpReward: 40,
      coinsReward: 15,
      actionUrl: "/belajar/vocabulary",
      actionText: "Buka Daftar Kata",
      iconType: "book"
    },
    {
      id: "quest_srs_review_8",
      title: "Disiplin Spaced Repetition",
      category: "review",
      categoryLabel: "REPETISI SRS",
      description: "Selesaikan 8 review kata jatuh tempo untuk memperkuat retensi memori jangka panjang.",
      target: 8,
      unit: "kata",
      xpReward: 45,
      coinsReward: 20,
      actionUrl: "/belajar/review",
      actionText: "Buka Antrean Review",
      iconType: "refresh"
    }
  ],

  // Category 2: Tata Bahasa & Literasi Konteks
  category_grammar: [
    {
      id: "quest_grammar_quiz_1",
      title: "Tuntaskan 1 Kuis Grammar",
      category: "grammar",
      categoryLabel: "TATA BAHASA",
      description: "Uji pemahaman struktur kalimatmu dengan menyelesaikan 1 kuis topik grammar.",
      target: 1,
      unit: "kuis",
      xpReward: 50,
      coinsReward: 20,
      actionUrl: "/belajar/grammar",
      actionText: "Pilih Modul Grammar",
      iconType: "award"
    },
    {
      id: "quest_habit_reading_1",
      title: "Eksplorasi 1 Bacaan HABIT",
      category: "reading",
      categoryLabel: "LITERASI HABIT",
      description: "Baca dan pahami 1 esai atau artikel autentik dari perpustakaan HABIT.",
      target: 1,
      unit: "artikel",
      xpReward: 45,
      coinsReward: 15,
      actionUrl: "/belajar/reading",
      actionText: "Buka Perpustakaan",
      iconType: "book-open"
    }
  ],

  // Category 3: Sesi Fokus & Cerita Kontekstual
  category_interactive: [
    {
      id: "quest_study_focus_3",
      title: "Latihan Konteks 3 Kata",
      category: "study",
      categoryLabel: "LATIHAN FOKUS",
      description: "Selesaikan latihan 3 tahap (makna, konteks, konfirmasi) pada 3 kosakata pilihanmu.",
      target: 3,
      unit: "sesi",
      xpReward: 40,
      coinsReward: 15,
      actionUrl: "/belajar/vocabulary",
      actionText: "Mulai Sesi Fokus",
      iconType: "target"
    },
    {
      id: "quest_adventure_explore_1",
      title: "Kaji 1 Cerita Petualangan",
      category: "adventure",
      categoryLabel: "PETUALANGAN",
      description: "Simak dialog dan narasi nyata dalam serial petualangan kontekstual.",
      target: 1,
      unit: "cerita",
      xpReward: 50,
      coinsReward: 20,
      actionUrl: "/belajar/adventure",
      actionText: "Mulai Petualangan",
      iconType: "compass"
    }
  ]
};

/**
 * Deterministic PRNG based on date string and optional seed
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates 3 deterministic daily quests for a given date
 */
export function generateDailyQuests(dateStr = new Date().toISOString().slice(0, 10), userSeed = "default") {
  const seed = hashString(dateStr + "_" + userSeed);

  const q1 = QUEST_POOL.category_vocab[seed % QUEST_POOL.category_vocab.length];
  const q2 = QUEST_POOL.category_grammar[(Math.floor(seed / 7)) % QUEST_POOL.category_grammar.length];
  const q3 = QUEST_POOL.category_interactive[(Math.floor(seed / 13)) % QUEST_POOL.category_interactive.length];

  return [
    { ...q1, dateStr },
    { ...q2, dateStr },
    { ...q3, dateStr }
  ];
}

/**
 * Merge generated quests with remote or local execution progress
 */
export function enrichQuestsWithProgress(generatedQuests, storedQuests = []) {
  const map = new Map(storedQuests.map((q) => [q.questId, q]));

  return generatedQuests.map((quest) => {
    const saved = map.get(quest.id);
    const progress = saved ? Number(saved.progress) || 0 : 0;
    const isCompleted = saved ? Boolean(saved.isCompleted) || progress >= quest.target : progress >= quest.target;
    const isClaimed = saved ? Boolean(saved.claimedAt) : false;

    const percentage = Math.min(100, Math.round((progress / quest.target) * 100));

    return {
      ...quest,
      progress,
      isCompleted,
      isClaimed,
      claimedAt: saved?.claimedAt || null,
      percentage
    };
  });
}

