/**
 * SINAUENGLISH V2 — Centralized Asset Manifest
 * 
 * Provides unified access and SVG/CSS fallback placeholders for:
 * - Kanci Mascot expressions
 * - Mascot Outfits
 * - Sinau Coin currency
 * - Scholar Avatar Borders
 * - Interactive Story Covers (Stories 1–10)
 */

export const ASSET_PATHS = {
  mascot: {
    base: "/assets/mascot/kanci-base.png",
    happy: "/assets/mascot/kanci-happy.png",
    thinking: "/assets/mascot/kanci-thinking.png",
    celebrating: "/assets/mascot/kanci-celebrating.png",
    sleepy: "/assets/mascot/kanci-sleepy.png",
    encouraging: "/assets/mascot/kanci-encouraging.png",
    reading: "/assets/mascot/kanci-reading.png"
  },
  outfits: {
    kacamata: "/assets/mascot/kanci-outfit-kacamata.png",
    petualang: "/assets/mascot/kanci-outfit-petualang.png",
    syal: "/assets/mascot/kanci-outfit-syal.png",
    headphone: "/assets/mascot/kanci-outfit-headphone.png"
  },
  ui: {
    coin: "/assets/ui/sinau-coin.png"
  },
  borders: {
    daun: "/assets/borders/border-daun.png",
    tinta: "/assets/borders/border-tinta.png",
    kawung: "/assets/borders/border-kawung.png",
    emas: "/assets/borders/border-emas.png",
    buku: "/assets/borders/border-buku.png",
    kanci: "/assets/borders/border-kanci.png"
  },
  stories: {
    story01: "/assets/stories/story-01-cover.webp",
    story02: "/assets/stories/story-02-cover.webp",
    story03: "/assets/stories/story-03-cover.webp",
    story04: "/assets/stories/story-04-cover.webp",
    story05: "/assets/stories/story-05-cover.webp",
    story06: "/assets/stories/story-06-cover.webp",
    story07: "/assets/stories/story-07-cover.webp",
    story08: "/assets/stories/story-08-cover.webp",
    story09: "/assets/stories/story-09-cover.webp",
    story10: "/assets/stories/story-10-cover.webp"
  }
};

/**
 * Returns the asset URL if present, or an inline SVG data-uri fallback.
 */
export function getAssetUrl(category, key) {
  if (ASSET_PATHS[category] && ASSET_PATHS[category][key]) {
    return ASSET_PATHS[category][key];
  }
  return null;
}

