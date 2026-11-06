/**
 * SINAUENGLISH V2 — Economy & Collections Catalog
 * 
 * 6 Borders, 4 Mascot Outfits, and Learning Utilities.
 * Calibrated against the current XP level curve: Level = max(1, floor(sqrt(XP / 15)) + 1).
 */

export const CATALOG_ITEMS = [
  // ---------------------------------------------------------------------------
  // 1. AVATAR BORDERS (6 items)
  // ---------------------------------------------------------------------------
  {
    id: "border_daun",
    type: "border",
    name: "Border Daun Belajar",
    englishName: "Verdant Leaf Border",
    description: "Bingkai dedaunan alami lambang awal mula perjalanan belajar.",
    price: 0,
    levelReq: 1,
    assetKey: "daun",
    themeColor: "#2F5D38"
  },
  {
    id: "border_tinta",
    type: "border",
    name: "Border Tinta Cendekiawan",
    englishName: "Scholar Inkstroke Border",
    description: "Goresan cincin tinta klasik khas pencatat ilmu dan sarjana kata.",
    price: 0,
    levelReq: 1,
    assetKey: "tinta",
    themeColor: "#263238"
  },
  {
    id: "border_kawung",
    type: "border",
    name: "Border Kawung Tradisional",
    englishName: "Heritage Kawung Border",
    description: "Motif batik geometris Jawa klasik perlambang ketekunan dan budi pekerti.",
    price: 120,
    levelReq: 3,
    assetKey: "kawung",
    themeColor: "#8D4E24"
  },
  {
    id: "border_buku",
    type: "border",
    name: "Border Buku Terbuka",
    englishName: "Open Manuscript Border",
    description: "Lembaran manuskrip terbuka bagi pembelajar yang rajin menyelami teks.",
    price: 250,
    levelReq: 5,
    assetKey: "buku",
    themeColor: "#2D4A6B"
  },
  {
    id: "border_emas",
    type: "border",
    name: "Border Emas Mahkota",
    englishName: "Gilded Laurel Border",
    description: "Bingkai emas tempa elegan bagi cendekiawan berprestasi konsisten.",
    price: 400,
    levelReq: 6,
    assetKey: "emas",
    themeColor: "#C98816"
  },
  {
    id: "border_kanci",
    type: "border",
    name: "Border Kanci Orisinal",
    englishName: "Signature Kanci Ears Border",
    description: "Siluet telinga kancil cerdik khas SinauEnglish penanda dedikasi tertinggi.",
    price: 600,
    levelReq: 8,
    assetKey: "kanci",
    themeColor: "#B25E1A"
  },

  // ---------------------------------------------------------------------------
  // 2. KANCI MASCOT OUTFITS (4 items)
  // ---------------------------------------------------------------------------
  {
    id: "outfit_kacamata",
    type: "outfit",
    name: "Kacamata Baca Cerdik",
    englishName: "Scholar Round Glasses",
    description: "Kacamata kawat bundar klasik yang dikenakan Kanci saat membaca buku tebal.",
    price: 150,
    levelReq: 3,
    assetKey: "kacamata",
    themeColor: "#333333"
  },
  {
    id: "outfit_syal",
    type: "outfit",
    name: "Syal Tenun Hangat",
    englishName: "Warm Knitted Scarf",
    description: "Syal musim gugur tenun halus melingkar nyaman di leher Kanci.",
    price: 200,
    levelReq: 4,
    assetKey: "syal",
    themeColor: "#A33826"
  },
  {
    id: "outfit_headphone",
    type: "outfit",
    name: "Headphone Audio Fokus",
    englishName: "Focus Studio Headphones",
    description: "Headphone over-ear modern untuk Kanci menyimak pelafalan kata bahasa Inggris.",
    price: 350,
    levelReq: 6,
    assetKey: "headphone",
    themeColor: "#1B3A57"
  },
  {
    id: "outfit_petualang",
    type: "outfit",
    name: "Topi Petualang Rimba",
    englishName: "Explorer Safari Fedora",
    description: "Topi petualang legendaris untuk menjelajahi rimba kosakata dan cerita misteri.",
    price: 500,
    levelReq: 7,
    assetKey: "petualang",
    themeColor: "#594925"
  },

  // ---------------------------------------------------------------------------
  // 3. UTILITIES (1 item)
  // ---------------------------------------------------------------------------
  {
    id: "streak_freeze",
    type: "utility",
    name: "Pelindung Streak (Streak Freeze)",
    englishName: "Streak Protector",
    description: "Melindungi 1 hari tidak sempat belajar agar streak harian tidak hangus (Maksimal 2 simpanan).",
    price: 80,
    levelReq: 2,
    assetKey: "coin",
    themeColor: "#2B6CB0",
    maxOwn: 2
  }
];

export function getCatalogItemById(id) {
  return CATALOG_ITEMS.find((item) => item.id === id) || null;
}

export function getCatalogItemsByType(type) {
  if (!type || type === "all") return CATALOG_ITEMS;
  return CATALOG_ITEMS.filter((item) => item.type === type);
}

/**
 * Calculates level from EXP
 * Formula: Level = max(1, floor(sqrt(xp / 15)) + 1)
 */
export function calculateLevelFromXp(xp = 0) {
  const num = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor(Math.sqrt(num / 15)) + 1);
}

/**
 * Calculates EXP needed to reach the next level
 */
export function getXpProgressForLevel(xp = 0) {
  const currentLvl = calculateLevelFromXp(xp);
  const currentLvlBaseXp = Math.pow(currentLvl - 1, 2) * 15;
  const nextLvlBaseXp = Math.pow(currentLvl, 2) * 15;
  const range = nextLvlBaseXp - currentLvlBaseXp;
  const progressInLevel = Math.max(0, xp - currentLvlBaseXp);
  const percentage = Math.min(100, Math.round((progressInLevel / range) * 100));

  return {
    currentLevel: currentLvl,
    nextLevel: currentLvl + 1,
    currentXp: xp,
    currentLvlBaseXp,
    nextLvlBaseXp,
    xpToNextLevel: Math.max(0, nextLvlBaseXp - xp),
    percentage
  };
}

