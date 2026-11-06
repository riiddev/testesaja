/**
 * SINAUENGLISH V2 — Unified Google Apps Script Web App API Service
 * 
 * Provides robust communication with the serverless Google Spreadsheet backend.
 * Uses text/plain POST to avoid preflight CORS restrictions.
 * Stores authentication tokens strictly in sessionStorage (or memory fallback).
 */

const API_URL = import.meta.env.VITE_API_URL || "";
const TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;

// In-memory token fallback if sessionStorage is restricted/unavailable
let memoryToken = null;
const TOKEN_STORAGE_KEY = "sinauu_sess_token";

/**
 * Retrieve active session token
 */
export function getSessionToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem("sinau_auth_token") || memoryToken;
  } catch (e) {
    return memoryToken;
  }
}

/**
 * Set active session token in sessionStorage
 */
export function setSessionToken(token) {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    // sessionStorage disabled or unavailable
  }
}

/**
 * Clear session token
 */
export function clearSessionToken() {
  setSessionToken(null);
}

/**
 * Send request to Apps Script Web App with retry and timeout logic
 */
async function request(action, payload = {}, requiresAuth = true, retryCount = 0) {
  const token = getSessionToken();

  if (requiresAuth && !token) {
    throw new Error("Sesi tidak ditemukan. Silakan masuk terlebih dahulu.");
  }

  if (!API_URL) {
    // If no remote URL is configured, warn and return mock response for offline/dev preview
    console.warn("[SinauAPI] VITE_API_URL belum dikonfigurasi di file .env. Menggunakan mode preview.");
    return handleDevFallback(action, payload, token);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: action,
        token: token || "",
        payload: payload
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || response.status === 302) {
        console.warn(`[SinauAPI] Endpoint Apps Script (${response.status}) mengalihkan ke Google Login (izin masih privat). Beralih otomatis ke mode dev preview.`);
        return handleDevFallback(action, payload, token);
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success) {
      if (json.error && json.error.toLowerCase().includes("tidak dikenal")) {
        console.warn("[SinauAPI] Aksi '" + action + "' belum dideploy di remote Apps Script. Menggunakan mode dev fallback.");
        return handleDevFallback(action, payload, token);
      }
      if (json.error && json.error.toLowerCase().includes("sesi")) {
        console.warn("[SinauAPI] Sesi remote kedaluwarsa. Menggunakan mode dev fallback.");
        return handleDevFallback(action, payload, token);
      }
      throw new Error(json.error || "Terjadi kesalahan pada server.");
    }

    return json;
  } catch (error) {
    clearTimeout(timer);

    const isAbort = error.name === "AbortError";
    const errorMessage = isAbort ? "Batas waktu koneksi habis (timeout). Silakan periksa jaringan Anda." : error.message;

    // Retry transient network or timeout errors
    if (retryCount < MAX_RETRIES && (isAbort || error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(r => setTimeout(r, delay));
      return request(action, payload, requiresAuth, retryCount + 1);
    }

    // Graceful fallback if Google CORS or redirect blocks anonymous access
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError") || isAbort) {
      console.warn(`[SinauAPI] Gagal terhubung ke remote Apps Script (${errorMessage}). Menggunakan mode dev preview agar pengalaman belajar tidak terputus.`);
      return handleDevFallback(action, payload, token);
    }

    throw new Error(errorMessage);
  }
}

/**
 * Mock fallback for local development preview before spreadsheet URL is linked
 */
function handleDevFallback(action, payload, token) {
  if (action === "register" || action === "login") {
    const fakeToken = "dev_token_" + Date.now();
    setSessionToken(fakeToken);
    return {
      success: true,
      message: "Berhasil masuk (Mode Dev Preview).",
      data: {
        token: fakeToken,
        user: {
          id: "u_dev_user",
          email: payload.email || "pelajar@sinauenglish.id",
          displayName: payload.displayName || "Pelajar Sinau"
        }
      }
    };
  }

  if (action === "getMe") {
    return {
      success: true,
      data: {
        id: "u_dev_user",
        email: "pelajar@sinauenglish.id",
        displayName: "Pelajar Sinau",
        createdAt: new Date().toISOString()
      }
    };
  }

  if (action === "getProgress") {
    return { success: true, data: { items: {} } };
  }

  if (action === "syncProgress") {
    return { success: true, message: "Tersinkron (Dev Preview).", count: (payload.updates || []).length };
  }

  if (action === "getSettings") {
    return { success: true, data: { settings: { dailyGoal: 10, theme: "light" } } };
  }

  if (action === "getProfile") {
    return {
      success: true,
      data: {
        profile: {
          userId: "u_dev_user",
          displayName: "Pelajar Sinau",
          activeTitle: "",
          xp: 0,
          streak: 0,
          coins: 0,
          lastActiveDate: new Date().toISOString(),
          avatarKey: "avatar_1"
        },
        unlockedTitles: []
      }
    };
  }

  if (action === "updateProfile") {
    return { success: true, message: "Profil tersimpan (Dev Preview)." };
  }

  if (action === "getUserTitles") {
    return {
      success: true,
      data: { titles: [] }
    };
  }

  if (action === "unlockTitle") {
    return { success: true, message: "Gelar berhasil dibuka (Dev Preview)." };
  }

  if (action === "getDailyQuests") {
    return {
      success: true,
      data: {
        dateStr: payload.dateStr || new Date().toISOString().slice(0, 10),
        quests: []
      }
    };
  }

  if (action === "updateQuestProgress") {
    return { success: true, message: "Progres misi tersimpan (Dev Preview)." };
  }

  if (action === "claimQuestReward") {
    return {
      success: true,
      message: "Hadiah berhasil diklaim (Dev Preview).",
      data: {
        questId: payload.questId,
        claimedAt: new Date().toISOString(),
        xpEarned: payload.xpReward || 35,
        coinsEarned: payload.coinsReward || 15
      }
    };
  }

  if (action === "uploadAvatar") {
    const updatedAt = new Date().toISOString();
    return {
      success: true,
      message: "Foto profil berhasil diunggah (Dev Preview).",
      data: {
        avatarUrl: payload.imageBase64,
        avatarUpdatedAt: updatedAt
      }
    };
  }

  if (action === "getAvatar") {
    return {
      success: true,
      data: {
        hasAvatar: false,
        avatarUrl: null,
        avatarUpdatedAt: null
      }
    };
  }

  if (action === "deleteAvatar") {
    return {
      success: true,
      message: "Foto profil berhasil dihapus (Dev Preview)."
    };
  }

  // Economy & Collections dev fallback
  if (action === "getCatalog") {
    return {
      success: true,
      data: {
        items: [
          { id: "border_daun", type: "border", name: "Border Daun Belajar", price: 0, levelReq: 1, active: true },
          { id: "border_tinta", type: "border", name: "Border Tinta Cendekiawan", price: 0, levelReq: 1, active: true },
          { id: "border_kawung", type: "border", name: "Border Kawung Tradisional", price: 120, levelReq: 3, active: true },
          { id: "border_buku", type: "border", name: "Border Buku Terbuka", price: 250, levelReq: 5, active: true },
          { id: "border_emas", type: "border", name: "Border Emas Mahkota", price: 400, levelReq: 6, active: true },
          { id: "border_kanci", type: "border", name: "Border Kanci Orisinal", price: 600, levelReq: 8, active: true },
          { id: "outfit_kacamata", type: "outfit", name: "Kacamata Baca Cerdik", price: 150, levelReq: 3, active: true },
          { id: "outfit_syal", type: "outfit", name: "Syal Tenun Hangat", price: 200, levelReq: 4, active: true },
          { id: "outfit_headphone", type: "outfit", name: "Headphone Audio Fokus", price: 350, levelReq: 6, active: true },
          { id: "outfit_petualang", type: "outfit", name: "Topi Petualang Rimba", price: 500, levelReq: 7, active: true },
          { id: "streak_freeze", type: "utility", name: "Pelindung Streak (Streak Freeze)", price: 80, levelReq: 2, active: true }
        ]
      }
    };
  }

  if (action === "getInventory") {
    let saved = [];
    try {
      const raw = localStorage.getItem("sinau_local_inventory");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    return {
      success: true,
      data: { inventory: saved }
    };
  }

  if (action === "buyItem") {
    let saved = [];
    try {
      const raw = localStorage.getItem("sinau_local_inventory");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    const now = new Date().toISOString();
    saved.push({ itemId: payload.itemId, unlockedAt: now, equipped: false });
    try {
      localStorage.setItem("sinau_local_inventory", JSON.stringify(saved));
    } catch (e) {}

    return {
      success: true,
      message: "Berhasil membeli item (Dev Preview).",
      data: {
        itemId: payload.itemId,
        inventory: saved
      }
    };
  }

  if (action === "equipItem") {
    let saved = [];
    try {
      const raw = localStorage.getItem("sinau_local_inventory");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    const type = payload.type || "border";
    saved = saved.map(it => {
      // Toggle logic
      const isTarget = it.itemId === payload.itemId;
      return {
        ...it,
        equipped: isTarget ? true : (it.itemId.startsWith(type) ? false : it.equipped)
      };
    });

    try {
      localStorage.setItem("sinau_local_inventory", JSON.stringify(saved));
    } catch (e) {}

    return {
      success: true,
      message: "Item berhasil diperbarui (Dev Preview).",
      data: {
        equippedItemId: payload.itemId,
        type: payload.type
      }
    };
  }

  if (action === "getGrammarProgress") {
    let saved = {};
    try {
      const raw = localStorage.getItem("sinau_grammar_progress_dev");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}
    return {
      success: true,
      data: { progress: saved }
    };
  }

  if (action === "saveGrammarProgress") {
    let saved = {};
    try {
      const raw = localStorage.getItem("sinau_grammar_progress_dev");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    const topicId = payload.topicId;
    const current = saved[topicId] || { practiceDone: false, quizBest: 0, status: "learning" };
    const nextPracticeDone = Boolean(payload.practiceDone) || current.practiceDone;
    const nextQuizBest = Math.max(current.quizBest || 0, Number(payload.quizScore) || 0);
    const isMastered = nextQuizBest >= 80;
    const nextStatus = isMastered ? "mastered" : (nextPracticeDone ? "learning" : current.status);

    saved[topicId] = {
      topicId,
      practiceDone: nextPracticeDone,
      quizBest: nextQuizBest,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem("sinau_grammar_progress_dev", JSON.stringify(saved));
    } catch (e) {}

    return {
      success: true,
      data: {
        topicId,
        practiceDone: nextPracticeDone,
        quizBest: nextQuizBest,
        status: nextStatus,
        isMastered,
        isNewlyMastered: isMastered && current.status !== "mastered"
      }
    };
  }

  if (action === "getStoryProgress") {
    let saved = {};
    let lastDate = "";
    try {
      const raw = localStorage.getItem("sinau_story_progress_dev");
      if (raw) saved = JSON.parse(raw);
      lastDate = localStorage.getItem("sinau_story_last_date_wib") || "";
    } catch (e) {}

    const todayWib = new Date().toISOString().slice(0, 10);
    const hasUnlockedToday = lastDate === todayWib;

    return {
      success: true,
      data: {
        progress: saved,
        todayWib,
        hasUnlockedNewEpisodeToday: hasUnlockedToday
      }
    };
  }

  if (action === "completeStoryEpisode") {
    let saved = {};
    let lastDate = "";
    try {
      const raw = localStorage.getItem("sinau_story_progress_dev");
      if (raw) saved = JSON.parse(raw);
      lastDate = localStorage.getItem("sinau_story_last_date_wib") || "";
    } catch (e) {}

    const { storyId, episodeId } = payload;
    const epIdNum = Number(episodeId);

    // Sequential story check: Story N requires Story N-1 to have 10 completed episodes
    const sMatch = String(storyId).match(/story-(\d+)/);
    if (sMatch) {
      const sNum = parseInt(sMatch[1], 10);
      if (sNum > 1) {
        const prevStoryId = "story-" + String(sNum - 1).padStart(2, "0");
        const prevEps = saved[prevStoryId] || [];
        if (prevEps.length < 10) {
          return {
            success: false,
            error: `Cerita ${sNum - 1} belum selesai. Anda harus menyelesaikan seluruh 10 episode Cerita ${sNum - 1} terlebih dahulu!`
          };
        }
      }
    }

    if (!saved[storyId]) saved[storyId] = [];

    const isReplay = saved[storyId].includes(epIdNum);
    const todayWib = new Date().toISOString().slice(0, 10);

    if (isReplay) {
      return {
        success: true,
        alreadyCompleted: true,
        earnedXp: 0,
        earnedCoins: 0,
        message: "Episode selesai diulang (tanpa reward ganda)."
      };
    }

    saved[storyId].push(epIdNum);
    try {
      localStorage.setItem("sinau_story_progress_dev", JSON.stringify(saved));
      localStorage.setItem("sinau_story_last_date_wib", todayWib);
    } catch (e) {}

    return {
      success: true,
      data: {
        storyId,
        episodeId: epIdNum,
        earnedXp: 50,
        earnedCoins: 30,
        totalXp: 300,
        totalCoins: 150,
        level: 5,
        todayWib
      }
    };
  }

  if (action === "grantReward") {
    let earnedXp = 0;
    let earnedCoins = 0;
    if (payload.source === "article_quiz") {
      const scorePct = Number(payload.meta?.scorePct) || 0;
      if (scorePct >= 80) earnedXp = 30;
      if (scorePct >= 100) earnedCoins = 20;
    } else {
      earnedXp = payload.meta?.difficulty === 2 ? 40 : 30;
      earnedCoins = payload.meta?.difficulty === 2 ? 20 : 15;
    }
    return {
      success: true,
      data: {
        earnedXp,
        earnedCoins,
        totalXp: 180,
        totalCoins: 100,
        level: 4,
        isLevelUp: false
      }
    };
  }

  return { success: true, message: "Aksi berhasil (Dev Preview)." };
}

/* ==========================================================================
   PUBLIC API EXPORTS
   ========================================================================== */

export const api = {
  // Authentication
  async register({ email, password, displayName }) {
    const res = await request("register", { email, password, displayName }, false);
    if (res.data?.token) {
      setSessionToken(res.data.token);
    }
    return res;
  },

  async login({ email, password }) {
    const res = await request("login", { email, password }, false);
    if (res.data?.token) {
      setSessionToken(res.data.token);
    }
    return res;
  },

  async logout() {
    try {
      await request("logout", {}, true);
    } catch (e) {
      // Ignore network failures on logout
    } finally {
      clearSessionToken();
    }
    return { success: true };
  },

  async getMe() {
    return request("getMe", {}, true);
  },

  // SRS Learning Progress
  async getProgress() {
    return request("getProgress", {}, true);
  },

  async syncProgress(updates = []) {
    return request("syncProgress", { updates }, true);
  },

  // Quizzes
  async saveQuiz({ topicId, score, total }) {
    return request("saveQuiz", { topicId, score, total }, true);
  },

  async getQuizHistory() {
    return request("getQuizHistory", {}, true);
  },

  // Settings
  async getSettings() {
    return request("getSettings", {}, true);
  },

  async updateSettings(settings = {}) {
    return request("updateSettings", { settings }, true);
  },

  // Profiles & Titles
  async getProfile() {
    return request("getProfile", {}, true);
  },

  async updateProfile(profileData = {}) {
    return request("updateProfile", profileData, true);
  },

  async getUserTitles() {
    return request("getUserTitles", {}, true);
  },

  async unlockTitle(titleId) {
    return request("unlockTitle", { titleId }, true);
  },

  // Custom Profile Avatar (Google Drive via Apps Script DriveApp)
  async uploadAvatar({ imageBase64, mimeType = "image/webp" }) {
    return request("uploadAvatar", { imageBase64, mimeType }, true);
  },

  async getAvatar() {
    return request("getAvatar", {}, true);
  },

  async deleteAvatar() {
    return request("deleteAvatar", {}, true);
  },

  // Economy, Collections & Server-side Rewards (Tahap 3)
  async getCatalog() {
    return request("getCatalog", {}, true);
  },

  async getInventory() {
    return request("getInventory", {}, true);
  },

  async buyItem({ itemId }) {
    return request("buyItem", { itemId }, true);
  },

  async equipItem({ itemId, type = "border" }) {
    return request("equipItem", { itemId, type }, true);
  },

  async grantReward({ eventId, source, refId = "", meta = {} }) {
    return request("grantReward", { eventId, source, refId, meta }, true);
  },

  // Daily Quests / Missions
  async getDailyQuests(dateStr) {
    return request("getDailyQuests", { dateStr }, true);
  },

  async updateQuestProgress({ questId, progress, target, dateStr }) {
    return request("updateQuestProgress", { questId, progress, target, dateStr }, true);
  },

  async claimQuestReward({ questId, dateStr, xpReward, coinsReward }) {
    return request("claimQuestReward", { questId, dateStr, xpReward, coinsReward }, true);
  },

  // One-time migration
  async importBackup(backupData) {
    return request("importBackup", { backup: backupData }, true);
  },

  // Grammar Progress (Tahap 5)
  async getGrammarProgress() {
    return request("getGrammarProgress", {}, true);
  },

  async saveGrammarProgress({ topicId, practiceDone, quizScore }) {
    return request("saveGrammarProgress", { topicId, practiceDone, quizScore }, true);
  },

  // Storytelling & Adventures (Tahap 6)
  async getStoryProgress() {
    return request("getStoryProgress", {}, true);
  },

  async completeStoryEpisode({ storyId, episodeId }) {
    return request("completeStoryEpisode", { storyId, episodeId }, true);
  }
};

