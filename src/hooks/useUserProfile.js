import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth.jsx";
import { api } from "../services/api.js";
import { recordLearningActivity } from "../services/learningActivity.js";
import { getWordStatus } from "./useSpacedRepetition.js";
import { TITLES_CATALOG, getTitleById, evaluateAllTitles } from "../features/profile/titleSystem.js";
import { calculateLevelFromXp, getCatalogItemById } from "../features/collection/collectionCatalog.js";
import { getUserScopedStorageKey, normalizeServerProfile, normalizeServerUserStats } from "../lib/profileData.js";

const LOCAL_PROFILE_KEY = "sinau_local_profile";
const LOCAL_AVATAR_URL_KEY = "sinau_avatar_url";
const LOCAL_AVATAR_TIME_KEY = "sinau_avatar_updated_at";
const LOCAL_INVENTORY_KEY = "sinau_local_inventory";

export function useUserProfile({ vocabulary = [], progressMap = {} }) {
  const { user, isAuthenticated } = useAuth();
  const profileStorageKey = getUserScopedStorageKey(LOCAL_PROFILE_KEY, user?.id);
  const avatarUrlStorageKey = getUserScopedStorageKey(LOCAL_AVATAR_URL_KEY, user?.id);
  const avatarTimeStorageKey = getUserScopedStorageKey(LOCAL_AVATAR_TIME_KEY, user?.id);
  const inventoryStorageKey = getUserScopedStorageKey(LOCAL_INVENTORY_KEY, user?.id);

  // Local state initialized from cache
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(profileStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      displayName: user?.displayName || "Pelajar Sinau",
      activeTitle: "",
      avatarKey: "avatar_1",
      xp: 0,
      streak: 0,
      coins: 0,
      lastActiveDate: null
    };
  });

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return localStorage.getItem(avatarUrlStorageKey) || null;
    } catch (e) {
      return null;
    }
  });

  const [avatarUpdatedAt, setAvatarUpdatedAt] = useState(() => {
    try {
      return localStorage.getItem(avatarTimeStorageKey) || null;
    } catch (e) {
      return null;
    }
  });

  const [unlockedTitleIds, setUnlockedTitleIds] = useState([]);
  const [serverStatsState, setServerStatsState] = useState({ userId: null, stats: null });
  const serverUserStats = serverStatsState.userId === user?.id ? serverStatsState.stats : null;
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Economy & Inventory state
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(inventoryStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Derive stats from real vocabulary & progress
  const userStats = useMemo(() => {
    let started = 0;
    let mastered = 0;
    let b2Mastered = 0;
    let totalReviews = 0;

    vocabulary.forEach((word) => {
      const p = progressMap[word.id];
      if (p) {
        started++;
        const st = getWordStatus(p);
        if (st === "mastered") {
          mastered++;
          if (word.level === "B2") b2Mastered++;
        }
        totalReviews += (p.correctCount || 0) + (p.wrongCount || 0);
      }
    });

    let readingCount = 0;
    try {
      const readingSaved = localStorage.getItem("sinau_habit_read_history");
      if (readingSaved) readingCount = JSON.parse(readingSaved).length || 0;
    } catch (e) {}

    let grammarCount = 0;
    try {
      const grammarSaved = localStorage.getItem("sinau_grammar_history");
      if (grammarSaved) grammarCount = Object.keys(JSON.parse(grammarSaved)).length || 0;
    } catch (e) {}

    return {
      // The server's user_stats ledger is authoritative for authenticated
      // accounts. Local progress remains a fallback for offline-only display.
      totalStartedWords: serverUserStats?.totalStartedWords ?? started,
      masteredWordsCount: serverUserStats?.masteredWordsCount ?? mastered,
      b2MasteredCount: serverUserStats?.b2MasteredCount ?? b2Mastered,
      totalReviewsDone: serverUserStats?.totalReviewsDone ?? totalReviews,
      contextReviewsCount: Math.round((serverUserStats?.totalReviewsDone ?? totalReviews) * 0.7),
      completedGrammarCount: grammarCount,
      readingCompletedCount: readingCount,
      adventureCompletedCount: Math.min(started > 10 ? 3 : 0, 12),
      streak: profile.streak ?? 0
    };
  }, [vocabulary, progressMap, profile.streak, serverUserStats]);

  // Evaluated titles with live progress
  const evaluatedTitles = useMemo(() => {
    return evaluateAllTitles(userStats, unlockedTitleIds);
  }, [userStats, unlockedTitleIds]);

  // Check and auto-unlock newly qualified titles
  useEffect(() => {
    evaluatedTitles.forEach((t) => {
      if (t.isUnlocked && !unlockedTitleIds.includes(t.id)) {
        setUnlockedTitleIds((prev) => [...prev, t.id]);
        if (isAuthenticated) {
          api.unlockTitle(t.id).catch(() => {});
        }
      }
    });
  }, [evaluatedTitles, unlockedTitleIds, isAuthenticated]);

  // The authenticated profile is isolated per user and always refreshed from
  // Neon. A scoped cache is only a temporary offline display, never authority.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let isMounted = true;
    const warnings = [];

    const readJson = (key, fallback) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    const writeJson = (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    };

    // Hydrate only this account's cached copy while the server request runs.
    const cachedProfile = readJson(profileStorageKey, null);
    setProfile(normalizeServerProfile(cachedProfile || {}, user.displayName));
    const cachedInventory = readJson(inventoryStorageKey, []);
    setInventory(Array.isArray(cachedInventory) ? cachedInventory : []);
    try {
      setAvatarUrl(localStorage.getItem(avatarUrlStorageKey) || null);
      setAvatarUpdatedAt(localStorage.getItem(avatarTimeStorageKey) || null);
    } catch {
      setAvatarUrl(null);
      setAvatarUpdatedAt(null);
    }

    setUnlockedTitleIds([]);
    setProfileError("");
    setIsLoading(true);

    async function loadCloudProfile() {
      try {
        const [profileRes, inventoryRes] = await Promise.all([
          api.getProfile(),
          api.getInventory().catch((error) => ({
            success: false,
            error: error?.message || "Gagal memuat inventori dari server."
          }))
        ]);

        if (!profileRes?.success || !profileRes.data?.profile) {
          throw new Error(profileRes?.error || "Server belum mengonfirmasi data profil.");
        }
        if (!isMounted) return;

        const remoteProfile = profileRes.data.profile;
        const canonicalProfile = normalizeServerProfile(remoteProfile, user.displayName);
        setProfile(canonicalProfile);
        setServerStatsState({
          userId: user.id,
          stats: normalizeServerUserStats(profileRes.data.userStats)
        });
        writeJson(profileStorageKey, canonicalProfile);

        // Unlock state comes from the server. Do not infer ownership from stale
        // local counters or remove a server-confirmed title using cached totals.
        const remoteTitles = (profileRes.data.unlockedTitles || [])
          .map((title) => typeof title === "string" ? title : title?.titleId)
          .filter((titleId) => typeof titleId === "string" && titleId.length > 0);
        setUnlockedTitleIds([...new Set(remoteTitles)]);

        if (inventoryRes?.success && Array.isArray(inventoryRes.data?.inventory)) {
          setInventory(inventoryRes.data.inventory);
          writeJson(inventoryStorageKey, inventoryRes.data.inventory);
        } else {
          warnings.push(inventoryRes?.error || "Inventori belum dapat diperbarui dari server.");
        }

        // The server timestamp is the version for avatar cache invalidation.
        const remoteAvatarTime = remoteProfile.avatarUpdatedAt ?? null;
        let localAvatarTime = null;
        let cachedAvatarUrl = null;
        try {
          localAvatarTime = localStorage.getItem(avatarTimeStorageKey);
          cachedAvatarUrl = localStorage.getItem(avatarUrlStorageKey);
        } catch {}

        if (!remoteAvatarTime) {
          setAvatarUrl(null);
          setAvatarUpdatedAt(null);
          try {
            localStorage.removeItem(avatarUrlStorageKey);
            localStorage.removeItem(avatarTimeStorageKey);
          } catch {}
        } else if (remoteAvatarTime !== localAvatarTime || !cachedAvatarUrl) {
          const avatarRes = await api.getAvatar();
          if (!avatarRes?.success) {
            warnings.push(avatarRes?.error || "Foto profil belum dapat diperbarui.");
          } else if (avatarRes.data?.hasAvatar && avatarRes.data.avatarUrl) {
            setAvatarUrl(avatarRes.data.avatarUrl);
            setAvatarUpdatedAt(avatarRes.data.avatarUpdatedAt || remoteAvatarTime);
            try {
              localStorage.setItem(avatarUrlStorageKey, avatarRes.data.avatarUrl);
              localStorage.setItem(avatarTimeStorageKey, avatarRes.data.avatarUpdatedAt || remoteAvatarTime);
            } catch {}
          } else {
            setAvatarUrl(null);
            setAvatarUpdatedAt(null);
            try {
              localStorage.removeItem(avatarUrlStorageKey);
              localStorage.removeItem(avatarTimeStorageKey);
            } catch {}
          }
        }

        if (isMounted && warnings.length) {
          setProfileError(warnings.join(" "));
        }
      } catch (error) {
        console.warn("[UserProfile] Gagal memuat profil cloud:", error?.message || error);
        if (isMounted) {
          setProfileError(error?.message || "Gagal memuat profil dari server.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCloudProfile();
    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    user?.id,
    user?.displayName,
    profileStorageKey,
    avatarUrlStorageKey,
    avatarTimeStorageKey,
    inventoryStorageKey
  ]);

  // Calculate Level from XP
  const calculatedLevel = useMemo(() => {
    return calculateLevelFromXp(profile.xp);
  }, [profile.xp]);

  // Derived Equipped Border & Outfit
  const equippedBorder = useMemo(() => {
    const item = inventory.find((it) => it.equipped && (it.itemId?.startsWith("border_") || it.type === "border"));
    return item ? item.itemId : "border_daun";
  }, [inventory]);

  const equippedOutfit = useMemo(() => {
    const item = inventory.find((it) => it.equipped && (it.itemId?.startsWith("outfit_") || it.type === "outfit"));
    return item ? item.itemId.replace(/^outfit_/, "") : null;
  }, [inventory]);

  const streakFreezesCount = useMemo(() => {
    return inventory.filter((it) => it.itemId === "streak_freeze").length;
  }, [inventory]);

  // Update Display Name
  const updateDisplayName = useCallback(async (newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed) return;

    if (!isAuthenticated) {
      setProfile((prev) => {
        const next = { ...prev, displayName: trimmed };
        try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      return;
    }

    try {
      const res = await api.updateProfile({ displayName: trimmed });
      if (!res?.success) {
        throw new Error(res?.error || "Server gagal menyimpan nama profil.");
      }
      setProfile((prev) => {
        const next = { ...prev, displayName: trimmed };
        try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      return { success: true };
    } catch (error) {
      console.warn("Gagal update nama di server:", error);
      throw error;
    }
  }, [isAuthenticated, profileStorageKey]);

  // Change Active Title
  const setActiveTitle = useCallback(async (titleId) => {
    const exists = TITLES_CATALOG.some((t) => t.id === titleId);
    if (!exists && titleId !== "") {
      throw new Error("Gelar yang dipilih tidak terdaftar.");
    }

    if (!isAuthenticated) {
      setProfile((prev) => {
        const next = { ...prev, activeTitle: titleId };
        try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      return;
    }

    try {
      const res = await api.updateProfile({ activeTitle: titleId });
      if (!res?.success) {
        throw new Error(res?.error || "Server gagal menyimpan gelar aktif.");
      }
      setProfile((prev) => {
        const next = { ...prev, activeTitle: titleId };
        try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      return { success: true };
    } catch (error) {
      console.warn("Gagal update active title di server:", error);
      throw error;
    }
  }, [isAuthenticated, profileStorageKey]);

  // Upload Custom Avatar — server first, then update the visible state/cache.
  const uploadCustomAvatar = useCallback(async ({ imageBase64, mimeType = "image/webp" }) => {
    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk sebelum mengunggah foto profil." };
    }

    setIsUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar({ imageBase64, mimeType });
      if (!res?.success || !res.data?.avatarUpdatedAt) {
        throw new Error(res?.error || "Server belum mengonfirmasi penyimpanan foto profil.");
      }

      const updatedAt = res.data.avatarUpdatedAt;
      setAvatarUrl(imageBase64);
      setAvatarUpdatedAt(updatedAt);
      try {
        localStorage.setItem(avatarUrlStorageKey, imageBase64);
        localStorage.setItem(avatarTimeStorageKey, updatedAt);
      } catch {}

      return { success: true, avatarUpdatedAt: updatedAt };
    } catch (error) {
      console.warn("Upload avatar gagal:", error);
      return { success: false, error: error?.message || "Gagal mengunggah foto profil." };
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [isAuthenticated, avatarUrlStorageKey, avatarTimeStorageKey]);

  // Delete Custom Avatar — keep the current photo until the server confirms.
  const deleteCustomAvatar = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk sebelum menghapus foto profil." };
    }

    try {
      const res = await api.deleteAvatar();
      if (!res?.success) {
        throw new Error(res?.error || "Server gagal menghapus foto profil.");
      }

      setAvatarUrl(null);
      setAvatarUpdatedAt(null);
      try {
        localStorage.removeItem(avatarUrlStorageKey);
        localStorage.removeItem(avatarTimeStorageKey);
      } catch {}

      return { success: true };
    } catch (error) {
      console.warn("Delete avatar gagal:", error);
      return { success: false, error: error?.message || "Gagal menghapus foto profil." };
    }
  }, [isAuthenticated, avatarUrlStorageKey, avatarTimeStorageKey]);

  // Buy item from collection catalog (Server is authoritative)
  const buyItem = useCallback(async (itemId) => {
    const catItem = getCatalogItemById(itemId);
    if (!catItem) return { success: false, error: "Item tidak ditemukan di katalog." };

    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk terlebih dahulu untuk membeli koleksi." };
    }

    try {
      const res = await api.buyItem({ itemId });
      if (res.success && res.data) {
        const remainingCoins = res.data.remainingCoins;
        setProfile((prev) => {
          const next = { ...prev, coins: remainingCoins };
          try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch {}
          return next;
        });

        const boughtItem = {
          itemId,
          name: res.data.item?.name || catItem.name,
          type: res.data.item?.type || catItem.type,
          unlockedAt: new Date().toISOString(),
          equipped: false
        };

        setInventory((prev) => {
          const next = [...prev, boughtItem];
          try { localStorage.setItem(inventoryStorageKey, JSON.stringify(next)); } catch (e) {}
          return next;
        });

        return { success: true, item: catItem, remainingCoins };
      }
      return { success: false, error: res.error || "Gagal membeli item." };
    } catch (err) {
      return { success: false, error: err.message || "Gagal membeli item." };
    }
  }, [isAuthenticated, profileStorageKey, inventoryStorageKey]);

  // Equip border or outfit — UI/cache changes only after server confirmation.
  const equipItem = useCallback(async (itemId, type = "border") => {
    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk sebelum memasang koleksi." };
    }

    try {
      const res = await api.equipItem({ itemId, type });
      if (!res?.success) {
        throw new Error(res?.error || "Server gagal memasang koleksi.");
      }

      setInventory((prev) => {
        const next = prev.map((item) => {
          const itemType = item.type || (item.itemId?.startsWith("outfit_") ? "outfit" : "border");
          if (itemType === type) {
            return { ...item, equipped: item.itemId === itemId };
          }
          return item;
        });
        try { localStorage.setItem(inventoryStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      return { success: true };
    } catch (error) {
      console.warn("Equip item gagal:", error);
      return { success: false, error: error?.message || "Gagal memasang koleksi." };
    }
  }, [isAuthenticated, inventoryStorageKey]);

  // All supported learning completions use the shared activity recorder.
  // Each feature endpoint validates and persists the work on the server; the
  // returned canonical balances are applied only after server confirmation.
  const claimReward = useCallback(async ({ eventId, source, refId = "", meta = {} }) => {
    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk untuk mendapatkan hadiah." };
    }

    try {
      let res;
      const isReadingQuiz = source === "article_quiz" || source === "reading_quiz_complete";
      const isReadingCompletion = source === "reading_complete" || source === "reading_reward";
      const isStoryEpisode = source === "story_episode";
      const isGrammarQuiz = source === "grammar_quiz" || source === "grammar";

      if (isReadingQuiz) {
        res = await recordLearningActivity({
          activityType: "reading_quiz",
          refId,
          title: String(meta.articleTitle || refId).slice(0, 150),
          durationSeconds: Math.max(0, Number(meta.durationSeconds) || 0),
          answers: Array.isArray(meta.answers) ? meta.answers : []
        });
      } else if (isReadingCompletion) {
        res = await recordLearningActivity({
          activityType: "reading_complete",
          refId,
          title: String(meta.articleTitle || refId).slice(0, 150),
          durationSeconds: Math.max(0, Number(meta.durationSeconds) || 0),
          meta
        });
      } else if (isStoryEpisode) {
        res = await recordLearningActivity({
          activityType: "story_episode",
          refId,
          meta
        });
      } else if (isGrammarQuiz) {
        res = await recordLearningActivity({
          activityType: "grammar",
          refId,
          answers: Array.isArray(meta.answers) ? meta.answers : []
        });
      } else {
        res = await api.grantReward({ eventId, source, refId, meta });
      }

      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Server gagal memproses aktivitas belajar.");
      }

      const data = res.data || {};
      const earnedXp = Number(res.earnedXp ?? data.earnedXp ?? data.xpEarned) || 0;
      const earnedCoins = Number(res.earnedCoins ?? data.earnedCoins ?? data.coinsEarned) || 0;
      const totalXp = data.totalXp ?? res.totalXp;
      const totalCoins = data.totalCoins ?? res.totalCoins;
      const streak = data.streak ?? res.streak;

      setProfile((prev) => {
        const next = {
          ...prev,
          xp: totalXp !== undefined ? totalXp : (prev.xp ?? 0) + earnedXp,
          coins: totalCoins !== undefined ? totalCoins : (prev.coins ?? 0) + earnedCoins,
          streak: streak !== undefined ? streak : (prev.streak ?? 0)
        };
        try { localStorage.setItem(profileStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });

      return {
        success: true,
        data,
        alreadyRewarded: Boolean(res.alreadyRewarded ?? data.alreadyRewarded ?? data.alreadyCompleted),
        earnedXp,
        earnedCoins
      };
    } catch (err) {
      console.warn("Learning activity recording error:", err.message);
      return { success: false, error: err.message || "Gagal memproses aktivitas." };
    }
  }, [isAuthenticated, profileStorageKey]);

  const activeTitleObj = useMemo(() => {
    if (!profile.activeTitle) return null;
    const isUnlocked = unlockedTitleIds.includes(profile.activeTitle) ||
      evaluatedTitles.some((t) => t.id === profile.activeTitle && t.isUnlocked);
    if (!isUnlocked) return null;
    return getTitleById(profile.activeTitle);
  }, [profile.activeTitle, unlockedTitleIds, evaluatedTitles]);

  return {
    profile,
    userStats,
    avatarUrl,
    avatarUpdatedAt,
    isUploadingAvatar,
    activeTitleObj,
    evaluatedTitles,
    calculatedLevel,
    isLoading,
    profileError,
    updateDisplayName,
    setActiveTitle,
    uploadCustomAvatar,
    deleteCustomAvatar,
    inventory,
    equippedBorder,
    equippedOutfit,
    streakFreezesCount,
    buyItem,
    equipItem,
    claimReward
  };
}
