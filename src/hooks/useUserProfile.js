import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth.jsx";
import { api } from "../services/api.js";
import { getWordStatus } from "./useSpacedRepetition.js";
import { TITLES_CATALOG, getTitleById, evaluateAllTitles } from "../features/profile/titleSystem.js";
import { calculateLevelFromXp, getCatalogItemById } from "../features/collection/collectionCatalog.js";

const LOCAL_PROFILE_KEY = "sinau_local_profile";
const LOCAL_AVATAR_URL_KEY = "sinau_avatar_url";
const LOCAL_AVATAR_TIME_KEY = "sinau_avatar_updated_at";
const LOCAL_INVENTORY_KEY = "sinau_local_inventory";

export function useUserProfile({ vocabulary = [], progressMap = {} }) {
  const { user, isAuthenticated } = useAuth();

  // Local state initialized from cache
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
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
      lastActiveDate: new Date().toISOString()
    };
  });

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_AVATAR_URL_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [avatarUpdatedAt, setAvatarUpdatedAt] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_AVATAR_TIME_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [unlockedTitleIds, setUnlockedTitleIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Economy & Inventory state
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_INVENTORY_KEY);
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
      totalStartedWords: started,
      masteredWordsCount: mastered,
      b2MasteredCount: b2Mastered,
      totalReviewsDone: totalReviews,
      contextReviewsCount: Math.round(totalReviews * 0.7),
      completedGrammarCount: grammarCount,
      readingCompletedCount: readingCount,
      adventureCompletedCount: Math.min(started > 10 ? 3 : 0, 12),
      streak: profile.streak || 0
    };
  }, [vocabulary, progressMap, profile.streak]);

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

  // Load from remote cloud if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getProfile(),
      api.getInventory().catch(() => ({ success: false, data: { inventory: [] } }))
    ])
      .then(async ([profileRes, invRes]) => {
        if (!isMounted) return;

        // Sync inventory from server
        if (invRes?.success && invRes.data?.inventory) {
          setInventory(invRes.data.inventory);
          try {
            localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(invRes.data.inventory));
          } catch (e) {}
        }

        if (!profileRes?.success || !profileRes.data) return;
        const remoteP = profileRes.data.profile;
        let remoteTitles = (profileRes.data.unlockedTitles || []).map((t) => (typeof t === "string" ? t : t.titleId));

        // Filter out premature "word_explorer" title if user has not actually reached 50 words started
        if ((userStats.totalStartedWords || 0) < 50) {
          remoteTitles = remoteTitles.filter((t) => t !== "word_explorer");
        }

        setProfile((prev) => {
          const merged = {
            ...prev,
            displayName: remoteP.displayName || user?.displayName || prev.displayName,
            activeTitle: remoteTitles.includes(remoteP.activeTitle) ? remoteP.activeTitle : "",
            avatarKey: remoteP.avatarKey || prev.avatarKey,
            xp: Number(remoteP.xp !== undefined ? remoteP.xp : (prev.xp ?? 0)),
            streak: Number(remoteP.streak !== undefined ? remoteP.streak : (prev.streak ?? 0)),
            coins: Number(remoteP.coins !== undefined ? remoteP.coins : (prev.coins ?? 0)),
            lastActiveDate: remoteP.lastActiveDate || prev.lastActiveDate
          };
          try {
            localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });

        setUnlockedTitleIds((prev) => Array.from(new Set([...prev.filter(t => t !== "word_explorer" || (userStats.totalStartedWords || 0) >= 50), ...remoteTitles])));

        // Cache-aware Avatar Fetch
        const remoteAvatarTime = remoteP.avatarUpdatedAt;
        const localAvatarTime = localStorage.getItem(LOCAL_AVATAR_TIME_KEY);
        const cachedUrl = localStorage.getItem(LOCAL_AVATAR_URL_KEY);

        if (remoteAvatarTime && (remoteAvatarTime !== localAvatarTime || !cachedUrl)) {
          try {
            const avatarRes = await api.getAvatar();
            if (isMounted && avatarRes.success && avatarRes.data?.hasAvatar) {
              setAvatarUrl(avatarRes.data.avatarUrl);
              setAvatarUpdatedAt(avatarRes.data.avatarUpdatedAt);
              localStorage.setItem(LOCAL_AVATAR_URL_KEY, avatarRes.data.avatarUrl);
              localStorage.setItem(LOCAL_AVATAR_TIME_KEY, avatarRes.data.avatarUpdatedAt || remoteAvatarTime);
            } else if (isMounted && avatarRes.success && !avatarRes.data?.hasAvatar) {
              setAvatarUrl(null);
              localStorage.removeItem(LOCAL_AVATAR_URL_KEY);
            }
          } catch (e) {
            console.warn("[UserProfile] Gagal fetch avatar:", e);
          }
        } else if (!remoteAvatarTime && cachedUrl) {
          // Avatar was removed
          setAvatarUrl(null);
          localStorage.removeItem(LOCAL_AVATAR_URL_KEY);
          localStorage.removeItem(LOCAL_AVATAR_TIME_KEY);
        }
      })
      .catch((err) => {
        console.warn("[UserProfile] Gagal memuat profil cloud:", err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

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
        try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      return;
    }

    try {
      const res = await api.updateProfile({ displayName: trimmed });
      if (res.success) {
        setProfile((prev) => {
          const next = { ...prev, displayName: trimmed };
          try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
          return next;
        });
      }
    } catch (e) {
      console.warn("Gagal update nama di server:", e);
      throw e;
    }
  }, [isAuthenticated]);

  // Change Active Title
  const setActiveTitle = useCallback(async (titleId) => {
    const exists = TITLES_CATALOG.some((t) => t.id === titleId);
    if (!exists && titleId !== "") return;

    if (!isAuthenticated) {
      setProfile((prev) => {
        const next = { ...prev, activeTitle: titleId };
        try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      return;
    }

    try {
      const res = await api.updateProfile({ activeTitle: titleId });
      if (res.success) {
        setProfile((prev) => {
          const next = { ...prev, activeTitle: titleId };
          try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
          return next;
        });
      }
    } catch (e) {
      console.warn("Gagal update active title di server:", e);
      throw e;
    }
  }, [isAuthenticated]);

  // Upload Custom Avatar (from gallery/crop)
  const uploadCustomAvatar = useCallback(async ({ imageBase64, mimeType = "image/webp" }) => {
    setIsUploadingAvatar(true);
    setAvatarUrl(imageBase64);
    const now = new Date().toISOString();
    setAvatarUpdatedAt(now);
    try {
      localStorage.setItem(LOCAL_AVATAR_URL_KEY, imageBase64);
      localStorage.setItem(LOCAL_AVATAR_TIME_KEY, now);
    } catch (e) {}

    if (!isAuthenticated) {
      setIsUploadingAvatar(false);
      return { success: true, localOnly: true };
    }

    try {
      const res = await api.uploadAvatar({ imageBase64, mimeType });
      if (res.success && res.data) {
        if (res.data.avatarUpdatedAt) {
          setAvatarUpdatedAt(res.data.avatarUpdatedAt);
          try { localStorage.setItem(LOCAL_AVATAR_TIME_KEY, res.data.avatarUpdatedAt); } catch (e) {}
        }
      }
      return { success: true };
    } catch (err) {
      console.warn("Upload avatar warning:", err);
      return { success: true, warning: err.message };
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [isAuthenticated]);

  // Delete Custom Avatar (revert to initials)
  const deleteCustomAvatar = useCallback(async () => {
    setAvatarUrl(null);
    setAvatarUpdatedAt(null);
    try {
      localStorage.removeItem(LOCAL_AVATAR_URL_KEY);
      localStorage.removeItem(LOCAL_AVATAR_TIME_KEY);
    } catch (e) {}

    if (isAuthenticated) {
      try {
        await api.deleteAvatar();
      } catch (err) {
        console.warn("Delete avatar warning:", err);
      }
    }
    return { success: true };
  }, [isAuthenticated]);

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
          try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
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
          try { localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(next)); } catch (e) {}
          return next;
        });

        return { success: true, item: catItem, remainingCoins };
      }
      return { success: false, error: res.error || "Gagal membeli item." };
    } catch (err) {
      return { success: false, error: err.message || "Gagal membeli item." };
    }
  }, [isAuthenticated]);

  // Equip border or outfit (Server is authoritative)
  const equipItem = useCallback(async (itemId, type = "border") => {
    if (!isAuthenticated) return;

    try {
      const res = await api.equipItem({ itemId, type });
      if (res.success) {
        setInventory((prev) => {
          const next = prev.map((it) => {
            const itType = it.type || (it.itemId?.startsWith("outfit_") ? "outfit" : "border");
            if (itType === type) {
              return {
                ...it,
                equipped: it.itemId === itemId
              };
            }
            return it;
          });
          try { localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(next)); } catch (e) {}
          return next;
        });
      }
    } catch (err) {
      console.warn("Equip item server warning:", err.message);
    }
  }, [isAuthenticated]);

  // Server-side idempotent reward grant
  const claimReward = useCallback(async ({ eventId, source, refId = "", meta = {} }) => {
    if (!isAuthenticated) {
      return { success: false, error: "Silakan masuk untuk mendapatkan hadiah." };
    }

    try {
      const res = await api.grantReward({ eventId, source, refId, meta });
      if (res.success && res.data) {
        const { totalXp, totalCoins, earnedXp, earnedCoins, streak } = res.data;
        setProfile((prev) => {
          const next = {
            ...prev,
            xp: totalXp !== undefined ? totalXp : (prev.xp ?? 0),
            coins: totalCoins !== undefined ? totalCoins : (prev.coins ?? 0),
            streak: streak !== undefined ? streak : (prev.streak ?? 0)
          };
          try { localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next)); } catch (e) {}
          return next;
        });

        return {
          success: true,
          alreadyRewarded: res.data.alreadyRewarded || false,
          earnedXp: earnedXp || 0,
          earnedCoins: earnedCoins || 0
        };
      }
      return { success: false, error: res.error || "Gagal memproses hadiah." };
    } catch (err) {
      console.warn("Grant reward error:", err.message);
      return { success: false, error: err.message };
    }
  }, [isAuthenticated]);

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
