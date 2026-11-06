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
      streak: profile.streak || 1
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

    api.getProfile()
      .then(async (res) => {
        if (!isMounted || !res.success || !res.data) return;
        const remoteP = res.data.profile;
        let remoteTitles = (res.data.unlockedTitles || []).map((t) => t.titleId);

        // Filter out premature "word_explorer" title if user has not actually reached 50 words started
        if ((userStats.totalStartedWords || 0) < 50) {
          remoteTitles = remoteTitles.filter((t) => t !== "word_explorer");
        }

        setProfile((prev) => {
          // If user has 0 reviews and 0 words started, ensure streak, coins, and xp start strictly from 0
          const hasStudyActivity = (userStats.totalStartedWords || 0) > 0 || (userStats.totalReviews || 0) > 0;
          const merged = {
            ...prev,
            displayName: remoteP.displayName || user?.displayName || prev.displayName,
            activeTitle: remoteTitles.includes(remoteP.activeTitle) ? remoteP.activeTitle : "",
            avatarKey: remoteP.avatarKey || prev.avatarKey,
            xp: hasStudyActivity ? Number(remoteP.xp !== undefined ? remoteP.xp : (prev.xp || 0)) : 0,
            streak: hasStudyActivity ? Number(remoteP.streak !== undefined ? remoteP.streak : (prev.streak || 0)) : 0,
            coins: hasStudyActivity ? Number(remoteP.coins !== undefined ? remoteP.coins : (prev.coins || 0)) : 0,
            lastActiveDate: remoteP.lastActiveDate || prev.lastActiveDate
          };
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(merged));
          return merged;
        });

        setUnlockedTitleIds((prev) => Array.from(new Set([...prev.filter(t => t !== "word_explorer" || (userStats.totalStartedWords || 0) >= 50), ...remoteTitles])));

        // Cache-aware Avatar Fetch
        const remoteAvatarTime = remoteP.avatarUpdatedAt;
        const localAvatarTime = localStorage.getItem(LOCAL_AVATAR_TIME_KEY);
        const cachedUrl = localStorage.getItem(LOCAL_AVATAR_URL_KEY);

        if (remoteAvatarTime && (remoteAvatarTime !== localAvatarTime || !cachedUrl)) {
          // Fetch updated avatar from Google DriveApp
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
            console.warn("[UserProfile] Gagal fetch avatar Drive:", e);
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
    const item = inventory.find((it) => it.equipped && it.itemId.startsWith("border_"));
    return item ? item.itemId : "border_daun";
  }, [inventory]);

  const equippedOutfit = useMemo(() => {
    const item = inventory.find((it) => it.equipped && it.itemId.startsWith("outfit_"));
    return item ? item.itemId.replace(/^outfit_/, "") : null;
  }, [inventory]);

  const streakFreezesCount = useMemo(() => {
    return inventory.filter((it) => it.itemId === "streak_freeze").length;
  }, [inventory]);

  // Update Display Name
  const updateDisplayName = useCallback(async (newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed) return;

    setProfile((prev) => {
      const next = { ...prev, displayName: trimmed };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
      return next;
    });

    if (isAuthenticated) {
      try {
        await api.updateProfile({ displayName: trimmed });
      } catch (e) {
        console.warn("Gagal update nama di server:", e);
      }
    }
  }, [isAuthenticated]);

  // Change Active Title
  const setActiveTitle = useCallback(async (titleId) => {
    const exists = TITLES_CATALOG.some((t) => t.id === titleId);
    if (!exists) return;

    setProfile((prev) => {
      const next = { ...prev, activeTitle: titleId };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
      return next;
    });

    if (isAuthenticated) {
      try {
        await api.updateProfile({ activeTitle: titleId });
      } catch (e) {
        console.warn("Gagal update active title di server:", e);
      }
    }
  }, [isAuthenticated]);

  // Upload Custom Avatar (from gallery/crop)
  const uploadCustomAvatar = useCallback(async ({ imageBase64, mimeType = "image/webp" }) => {
    setIsUploadingAvatar(true);
    // Optimistic local update
    setAvatarUrl(imageBase64);
    const now = new Date().toISOString();
    setAvatarUpdatedAt(now);
    localStorage.setItem(LOCAL_AVATAR_URL_KEY, imageBase64);
    localStorage.setItem(LOCAL_AVATAR_TIME_KEY, now);

    if (!isAuthenticated) {
      setIsUploadingAvatar(false);
      return { success: true, localOnly: true };
    }

    try {
      const res = await api.uploadAvatar({ imageBase64, mimeType });
      if (res.success && res.data) {
        if (res.data.avatarUpdatedAt) {
          setAvatarUpdatedAt(res.data.avatarUpdatedAt);
          localStorage.setItem(LOCAL_AVATAR_TIME_KEY, res.data.avatarUpdatedAt);
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
    localStorage.removeItem(LOCAL_AVATAR_URL_KEY);
    localStorage.removeItem(LOCAL_AVATAR_TIME_KEY);

    if (isAuthenticated) {
      try {
        await api.deleteAvatar();
      } catch (err) {
        console.warn("Delete avatar warning:", err);
      }
    }
    return { success: true };
  }, [isAuthenticated]);

  // Buy item from collection catalog
  const buyItem = useCallback(async (itemId) => {
    const catItem = getCatalogItemById(itemId);
    if (!catItem) return { success: false, error: "Item tidak ditemukan di katalog." };

    const currentCoins = profile.coins || 0;
    if (currentCoins < catItem.price) {
      return { success: false, error: "Sinau Coin tidak mencukupi (Butuh " + catItem.price + " Coin, saldomu " + currentCoins + " Coin)." };
    }

    const currentLvl = calculateLevelFromXp(profile.xp);
    if (currentLvl < catItem.levelReq) {
      return { success: false, error: "Level belum mencukupi (Butuh Level " + catItem.levelReq + ", levelmu " + currentLvl + ")." };
    }

    const now = new Date().toISOString();
    const updatedCoins = currentCoins - catItem.price;

    setProfile((prev) => {
      const next = { ...prev, coins: updatedCoins };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
      return next;
    });

    setInventory((prev) => {
      const next = [...prev, { itemId, unlockedAt: now, equipped: false }];
      localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(next));
      return next;
    });

    if (isAuthenticated) {
      try {
        await api.buyItem({ itemId });
      } catch (err) {
        console.warn("Buy item cloud sync warning:", err);
      }
    }

    return { success: true, item: catItem };
  }, [profile.coins, profile.xp, isAuthenticated]);

  // Equip border or outfit
  const equipItem = useCallback(async (itemId, type = "border") => {
    setInventory((prev) => {
      const next = prev.map((it) => {
        const itType = it.itemId.startsWith("outfit_") ? "outfit" : "border";
        if (itType === type) {
          return {
            ...it,
            equipped: it.itemId === itemId
          };
        }
        return it;
      });
      localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(next));
      return next;
    });

    if (isAuthenticated) {
      try {
        await api.equipItem({ itemId, type });
      } catch (err) {
        console.warn("Equip item cloud sync warning:", err);
      }
    }
  }, [isAuthenticated]);

  // Server-side idempotent reward grant
  const claimReward = useCallback(async ({ eventId, source, refId = "", meta = {} }) => {
    let expEarned = 15;
    let coinsEarned = 10;
    if (source === "daily_quest") {
      expEarned = meta.difficulty === 2 ? 40 : 30;
      coinsEarned = meta.difficulty === 2 ? 20 : 15;
    } else if (source === "story_episode") {
      expEarned = 50;
      coinsEarned = 30;
    } else if (source === "article_quiz") {
      expEarned = 30;
      coinsEarned = meta.scorePct >= 100 ? 20 : 0;
    } else if (source === "grammar_quiz") {
      expEarned = 25;
      coinsEarned = 15;
    }

    if (isAuthenticated) {
      try {
        const res = await api.grantReward({ eventId, source, refId, meta });
        if (res.success && res.data) {
          expEarned = res.data.earnedXp;
          coinsEarned = res.data.earnedCoins;
        }
      } catch (err) {
        console.warn("Grant reward warning:", err);
      }
    }

    setProfile((prev) => {
      const nextXp = (prev.xp || 0) + expEarned;
      const nextCoins = (prev.coins || 0) + coinsEarned;
      const next = { ...prev, xp: nextXp, coins: nextCoins };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
      return next;
    });

    return { success: true, earnedXp: expEarned, earnedCoins: coinsEarned };
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
