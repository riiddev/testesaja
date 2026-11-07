/**
 * SINAUENGLISH V2 — Unified API Service & Vercel Functions Gateway
 * 
 * Provides robust communication with:
 * 1. Vercel Functions (/api/auth/*, /api/*) backed by Neon PostgreSQL
 * 2. Strict mock handling (Simulation mode only in dev when VITE_ENABLE_MOCK=true)
 * 3. Structured error handling: SUCCESS, AUTH_ERROR, VALIDATION_ERROR, NETWORK_ERROR
 */

import { ApiError, AuthError, ValidationError, NetworkError } from "./apiErrors.js";

export { ApiError, AuthError, ValidationError, NetworkError };

const TIMEOUT_MS = 15000; // 15 seconds

// Strict Mock Flag: Simulation mode is STRICTLY DISALLOWED in production

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
      sessionStorage.removeItem("sinau_auth_token");
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
 * Standardized Request Handler for Vercel Functions (/api/*)
 */
async function requestApi(endpoint, options = {}, requiresAuth = true) {
  const token = getSessionToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      ...options,
      credentials: "same-origin",
      headers,
      signal: controller.signal
    });

    clearTimeout(timer);

    let json;
    try {
      json = await res.json();
    } catch (e) {
      if (!res.ok) {
        throw new ApiError(`HTTP Error ${res.status}: ${res.statusText}`, "SERVER_ERROR", res.status);
      }
      throw new ApiError("Format respons server tidak valid.", "SERVER_ERROR", 500);
    }

    if (!res.ok || json.success === false) {
      if (res.status === 401 || json.status === "AUTH_ERROR") {
        clearSessionToken();
        throw new AuthError(json.error || "Sesi Anda telah berakhir. Silakan masuk kembali.");
      }
      if (res.status === 400 || json.status === "VALIDATION_ERROR") {
        throw new ValidationError(json.error || "Data input tidak valid.", json.errors || []);
      }
      throw new ApiError(json.error || "Terjadi kesalahan pada server.", json.status || "SERVER_ERROR", res.status);
    }

    return json;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ApiError) {
      throw err;
    }
    const isAbort = err.name === "AbortError";
    const msg = isAbort
      ? "Batas waktu koneksi habis (timeout). Silakan periksa jaringan Anda."
      : "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    throw new NetworkError(msg);
  }
}

/**
 * Gateway request handler — dispatches only to explicitly supported Neon API routes.
 */
async function request(action, payload = {}, requiresAuth = true, retryCount = 0) {
  // 1. Dispatch Auth Actions to Modern Vercel Functions
  if (action === "register") {
    return requestApi("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }, false);
  }
  if (action === "login") {
    return requestApi("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }, false);
  }
  if (action === "logout") {
    return requestApi("/api/auth/logout", { method: "POST", body: JSON.stringify(payload) }, false);
  }
  if (action === "getMe") {
    return requestApi("/api/auth/me", { method: "GET" }, true);
  }

  // 2. Dispatch Fase 4 Profile, Economy, Reward, and Quest Actions to Vercel Functions
  if (action === "getProfile") {
    return requestApi("/api/profile/get", { method: "GET" }, true);
  }
  if (action === "updateProfile") {
    return requestApi("/api/profile/update", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getCatalog") {
    return requestApi("/api/economy/catalog", { method: "GET" }, false);
  }
  if (action === "getInventory") {
    return requestApi("/api/economy/inventory", { method: "GET" }, true);
  }
  if (action === "buyItem") {
    return requestApi("/api/economy/buy", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "equipItem") {
    return requestApi("/api/economy/equip", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "grantReward") {
    return requestApi("/api/reward/grant", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getDailyQuests") {
    const qUrl = payload?.dateStr ? `/api/quests/get?dateStr=${encodeURIComponent(payload.dateStr)}` : "/api/quests/get";
    return requestApi(qUrl, { method: "GET" }, true);
  }
  if (action === "updateQuestProgress") {
    return requestApi("/api/quests/update", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "claimQuestReward") {
    return requestApi("/api/quests/claim", { method: "POST", body: JSON.stringify(payload) }, true);
  }

  // 3. Dispatch Fase 5 Spaced Repetition (SRS) Sync Actions to Vercel Functions
  if (action === "getProgress") {
    return requestApi("/api/progress/get", { method: "GET" }, true);
  }
  if (action === "syncProgress") {
    const { keepalive = false, ...body } = payload;
    return requestApi("/api/progress/sync", {
      method: "POST",
      body: JSON.stringify(body),
      keepalive
    }, true);
  }

  // 4. Dispatch Fase 6 Settings, Avatar, Titles, Grammar, Story, Matching, Reading Quiz, and Activity History
  if (action === "getSettings") {
    return requestApi("/api/settings/get", { method: "GET" }, true);
  }
  if (action === "updateSettings") {
    return requestApi("/api/settings/update", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "uploadAvatar") {
    return requestApi("/api/avatar/upload", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getAvatar") {
    return requestApi("/api/avatar/get", { method: "GET" }, true);
  }
  if (action === "deleteAvatar") {
    return requestApi("/api/avatar/delete", { method: "POST" }, true);
  }
  if (action === "getUserTitles") {
    return requestApi("/api/titles/get", { method: "GET" }, true);
  }
  if (action === "unlockTitle") {
    return requestApi("/api/titles/unlock", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getGrammarProgress") {
    return requestApi("/api/grammar/get", { method: "GET" }, true);
  }
  if (action === "saveGrammarProgress") {
    return requestApi("/api/grammar/save", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getStoryProgress") {
    const sUrl = payload?.storyId ? `/api/story/get?storyId=${encodeURIComponent(payload.storyId)}` : "/api/story/get";
    return requestApi(sUrl, { method: "GET" }, true);
  }
  if (action === "completeStoryEpisode") {
    return requestApi("/api/story/complete", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getMatchingRound") {
    const level = payload?.level ? encodeURIComponent(payload.level) : "all";
    return requestApi("/api/matching/round?level=" + level, { method: "GET" }, true);
  }
  if (action === "recordMatchingSession") {
    return requestApi("/api/matching/record", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "recordReadingQuiz") {
    return requestApi("/api/reading-quiz/record", { method: "POST", body: JSON.stringify(payload) }, true);
  }
  if (action === "getActivityHistory") {
    const q = new URLSearchParams(payload || {}).toString();
    return requestApi(q ? `/api/activity/history?${q}` : "/api/activity/history", { method: "GET" }, true);
  }
  if (action === "getActivitySummary") {
    return requestApi("/api/activity/summary", { method: "GET" }, true);
  }

  throw new ApiError(
    "Aksi '" + action + "' belum terhubung ke API SinauEnglish V2.",
    "UNSUPPORTED_ACTION",
    501
  );
}
/* ==========================================================================
   PUBLIC API EXPORTS
   ========================================================================== */

export const api = {
  // Authentication (Powered by Vercel Functions + Neon PostgreSQL)
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
      await request("logout", {}, false);
    } catch (e) {
      // Clear token regardless of network outcome
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

  async syncProgress(updates = [], options = {}) {
    return request("syncProgress", { updates, keepalive: Boolean(options.keepalive) }, true);
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

  // Custom Profile Avatar
  async uploadAvatar({ imageBase64, mimeType = "image/webp" }) {
    return request("uploadAvatar", { imageBase64, mimeType }, true);
  },

  async getAvatar() {
    return request("getAvatar", {}, true);
  },

  async deleteAvatar() {
    return request("deleteAvatar", {}, true);
  },

  // Economy, Collections & Server-side Rewards
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


  // Grammar Progress
  async getGrammarProgress() {
    return request("getGrammarProgress", {}, true);
  },

  async saveGrammarProgress({ topicId, answers = [] }) {
    return request("saveGrammarProgress", { topicId, answers }, true);
  },

  // Storytelling & Adventures
  async getStoryProgress() {
    return request("getStoryProgress", {}, true);
  },

  async completeStoryEpisode({ storyId, episodeId, totalEpisodes = 5 }) {
    return request("completeStoryEpisode", { storyId, episodeId, totalEpisodes }, true);
  },

  // Sentence Context Matching (Fase 6)
  async getMatchingRound({ level = "all" } = {}) {
    return request("getMatchingRound", { level }, true);
  },

  async recordMatchingSession({ matchedPairs = [], durationSeconds, sessionId, roundToken }) {
    return request("recordMatchingSession", { matchedPairs, durationSeconds, sessionId, roundToken }, true);
  },

  // Reading Comprehension Quiz (Fase 6)
  async recordReadingQuiz({ articleId, articleTitle, durationSeconds, answers = [] }) {
    return request("recordReadingQuiz", { articleId, articleTitle, durationSeconds, answers }, true);
  },

  // Practice History & 7-Day Trend (Butir F)
  async getActivityHistory({ limit = 10, cursor = null, type = "all" } = {}) {
    const params = {};
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;
    if (type && type !== "all") params.type = type;
    return request("getActivityHistory", params, true);
  },

  async getActivitySummary() {
    return request("getActivitySummary", {}, true);
  }
};
