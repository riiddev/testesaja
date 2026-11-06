/**
 * SINAUENGLISH V2 — Academic Title & Achievement System
 * 
 * Defines 10 serious, academically oriented titles with objective milestones.
 * Includes progress evaluation against real user study data.
 */

export const TITLES_CATALOG = [
  {
    id: "word_explorer",
    name: "Penjelajah Kosakata",
    englishName: "Word Explorer",
    badgeLabel: "KOSAKATA DASAR",
    description: "Membuka dan mempelajari 50 kata pertama dalam korpus Oxford 3000.",
    target: 50,
    unit: "kata",
    category: "vocabulary",
    iconType: "compass",
    evaluate: (stats) => {
      const current = Math.min(stats.totalStartedWords || 0, 50);
      return {
        current,
        total: 50,
        unlocked: current >= 50,
        percentage: Math.min(100, Math.round((current / 50) * 100))
      };
    }
  },
  {
    id: "context_scholar",
    name: "Peneliti Konteks",
    englishName: "Context Scholar",
    badgeLabel: "KONTEKS REAL",
    description: "Menyelesaikan 100 kalimat kontekstual dengan pemahaman utuh.",
    target: 100,
    unit: "kalimat",
    category: "context",
    iconType: "quote",
    evaluate: (stats) => {
      const current = Math.min(stats.contextReviewsCount || 0, 100);
      return {
        current,
        total: 100,
        unlocked: current >= 100,
        percentage: Math.min(100, Math.round((current / 100) * 100))
      };
    }
  },
  {
    id: "cadence_keeper",
    name: "Penjaga Ritme",
    englishName: "Cadence Keeper",
    badgeLabel: "KONSISTENSI",
    description: "Mempertahankan rutinitas belajar 7 hari beruntun tanpa jeda.",
    target: 7,
    unit: "hari",
    category: "streak",
    iconType: "flame-cadence",
    evaluate: (stats) => {
      const current = Math.min(stats.streak || 1, 7);
      return {
        current,
        total: 7,
        unlocked: current >= 7,
        percentage: Math.min(100, Math.round((current / 7) * 100))
      };
    }
  },
  {
    id: "grammar_analyst",
    name: "Analis Tata Bahasa",
    englishName: "Grammar Analyst",
    badgeLabel: "STRUKTUR GRAMMAR",
    description: "Menuntaskan seluruh kuis dari 19 modul grammar A1–B2.",
    target: 19,
    unit: "modul",
    category: "grammar",
    iconType: "award",
    evaluate: (stats) => {
      const current = Math.min(stats.completedGrammarCount || 0, 19);
      return {
        current,
        total: 19,
        unlocked: current >= 19,
        percentage: Math.min(100, Math.round((current / 19) * 100))
      };
    }
  },
  {
    id: "analytical_reader",
    name: "Pembaca Cermat",
    englishName: "Analytical Reader",
    badgeLabel: "LITERASI HABIT",
    description: "Membaca dan menuntaskan 25 bahan bacaan perpustakaan HABIT.",
    target: 25,
    unit: "bacaan",
    category: "reading",
    iconType: "book-open",
    evaluate: (stats) => {
      const current = Math.min(stats.readingCompletedCount || 0, 25);
      return {
        current,
        total: 25,
        unlocked: current >= 25,
        percentage: Math.min(100, Math.round((current / 25) * 100))
      };
    }
  },
  {
    id: "endurance_polymath",
    name: "Penempuh Jarak Jauh",
    englishName: "Endurance Polymath",
    badgeLabel: "DEDIKASI TINGGI",
    description: "Mempertahankan dedikasi belajar konsisten selama 30 hari beruntun.",
    target: 30,
    unit: "hari",
    category: "streak",
    iconType: "shield-star",
    evaluate: (stats) => {
      const current = Math.min(stats.streak || 1, 30);
      return {
        current,
        total: 30,
        unlocked: current >= 30,
        percentage: Math.min(100, Math.round((current / 30) * 100))
      };
    }
  },
  {
    id: "lexicon_curator",
    name: "Kolektor Leksikon",
    englishName: "Lexicon Curator",
    badgeLabel: "MASTERY 250",
    description: "Mencapai status 'Dikuasai Penuh' (mastered) pada 250 kata Oxford 3000.",
    target: 250,
    unit: "kata",
    category: "mastery",
    iconType: "layers",
    evaluate: (stats) => {
      const current = Math.min(stats.masteredWordsCount || 0, 250);
      return {
        current,
        total: 250,
        unlocked: current >= 250,
        percentage: Math.min(100, Math.round((current / 250) * 100))
      };
    }
  },
  {
    id: "relentless_scholar",
    name: "Pengarsip Teladan",
    englishName: "Relentless Scholar",
    badgeLabel: "SRS DISCIPLINES",
    description: "Menyelesaikan 1.000 repetisi Spaced Repetition (SRS) tepat waktu.",
    target: 1000,
    unit: "repetisi",
    category: "repetition",
    iconType: "refresh",
    evaluate: (stats) => {
      const current = Math.min(stats.totalReviewsDone || 0, 1000);
      return {
        current,
        total: 1000,
        unlocked: current >= 1000,
        percentage: Math.min(100, Math.round((current / 1000) * 100))
      };
    }
  },
  {
    id: "narrative_voyager",
    name: "Penjelajah Narasi",
    englishName: "Narrative Voyager",
    badgeLabel: "PETUALANGAN",
    description: "Menyelesaikan seluruh cerita dan dialog dalam serial Petualangan.",
    target: 12,
    unit: "kisah",
    category: "adventure",
    iconType: "map-pin",
    evaluate: (stats) => {
      const current = Math.min(stats.adventureCompletedCount || 0, 12);
      return {
        current,
        total: 12,
        unlocked: current >= 12,
        percentage: Math.min(100, Math.round((current / 12) * 100))
      };
    }
  },
  {
    id: "b2_sovereign",
    name: "Pakar Kemandirian B2",
    englishName: "Upper-Intermediate Sovereign",
    badgeLabel: "CEFR LEVEL B2",
    description: "Menguasai seluruh 597 kata Oxford 3000 tingkat Upper-Intermediate (B2).",
    target: 597,
    unit: "kata B2",
    category: "cefr-b2",
    iconType: "crown",
    evaluate: (stats) => {
      const current = Math.min(stats.b2MasteredCount || 0, 597);
      return {
        current,
        total: 597,
        unlocked: current >= 597,
        percentage: Math.min(100, Math.round((current / 597) * 100))
      };
    }
  }
];

export const AVATAR_PRESETS = [
  { id: "avatar_1", label: "Cendekiawan", bg: "#1E2A38", color: "#F6F2E9", letter: "S" },
  { id: "avatar_2", label: "Peneliti", bg: "#2E473B", color: "#E0EEDD", letter: "P" },
  { id: "avatar_3", label: "Pengembara", bg: "#6E4A28", color: "#F8EBD8", letter: "O" },
  { id: "avatar_4", label: "Pustakawan", bg: "#4A3258", color: "#F0E4F5", letter: "L" },
  { id: "avatar_5", label: "Analis", bg: "#2C3E50", color: "#D1E2F2", letter: "A" },
  { id: "avatar_6", label: "Navigator", bg: "#8C6A2E", color: "#FFF8E6", letter: "N" }
];

export function getTitleById(titleId) {
  if (!titleId) return null;
  return TITLES_CATALOG.find((t) => t.id === titleId) || null;
}

export function evaluateAllTitles(userStats, unlockedTitleIds = []) {
  const unlockedSet = new Set(unlockedTitleIds);

  return TITLES_CATALOG.map((title) => {
    const evalResult = title.evaluate(userStats);
    const isUnlocked = unlockedSet.has(title.id) || evalResult.unlocked;

    return {
      ...title,
      current: evalResult.current,
      total: evalResult.total,
      percentage: evalResult.percentage,
      isUnlocked: isUnlocked
    };
  });
}

