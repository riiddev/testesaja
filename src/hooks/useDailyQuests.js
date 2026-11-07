import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth.jsx";
import { api } from "../services/api.js";
import { generateDailyQuests, enrichQuestsWithProgress } from "../features/missions/missionsEngine.js";

export function useDailyQuests({ onRewardClaimed } = {}) {
  const { user, isAuthenticated } = useAuth();

  const todayStr = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }, []);

  // Namespaced by user ID to prevent cross-account leak
  const storageKey = `sinau_daily_quests_${user?.id || "guest"}_${todayStr}`;

  // Generated template quests for today
  const templateQuests = useMemo(() => {
    return generateDailyQuests(todayStr, user?.id || "pelajar");
  }, [todayStr, user?.id]);

  // Saved quest states (progress & claims)
  const [storedQuests, setStoredQuests] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync with cloud if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setIsLoading(true);

    api.getDailyQuests(todayStr)
      .then((res) => {
        if (!isMounted || !res.success || !res.data?.quests) return;
        const remoteQuests = res.data.quests;
        if (remoteQuests.length > 0) {
          setStoredQuests((prev) => {
            const mergedMap = new Map();
            prev.forEach((q) => mergedMap.set(q.questId, q));
            remoteQuests.forEach((q) => mergedMap.set(q.questId, q));
            const merged = Array.from(mergedMap.values());
            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn("[DailyQuests] Gagal mengambil misi dari cloud:", err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, todayStr, storageKey]);

  // Enriched active quests
  const quests = useMemo(() => {
    return enrichQuestsWithProgress(templateQuests, storedQuests);
  }, [templateQuests, storedQuests]);

  // Guest progress is local-only. Authenticated progress is refreshed from
  // server-written activity records; client-supplied increments are never trusted.
  const updateProgress = useCallback((questId, increment = 1) => {
    if (isAuthenticated) {
      api.updateQuestProgress({})
        .then((res) => {
          if (!res?.success || !Array.isArray(res.data?.quests)) return;
          const remote = res.data.quests.map((quest) => ({
            questId: quest.questId,
            dateStr: res.data.dateStr || todayStr,
            progress: quest.progress,
            target: quest.target,
            isCompleted: quest.isCompleted,
            claimedAt: quest.claimedAt || null
          }));
          setStoredQuests(remote);
          try {
            localStorage.setItem(storageKey, JSON.stringify(remote));
          } catch (e) {}
        })
        .catch((err) => {
          console.warn("[DailyQuests] Gagal memperbarui progres server:", err.message);
        });
      return;
    }

    setStoredQuests((prev) => {
      const existing = prev.find((q) => q.questId === questId);
      const targetQuest = templateQuests.find((q) => q.id === questId);
      if (!targetQuest) return prev;

      const currentProgress = existing ? Number(existing.progress) || 0 : 0;
      const target = targetQuest.target;
      const safeIncrement = Math.max(0, Number(increment) || 0);
      const newProgress = Math.min(target, currentProgress + safeIncrement);
      const updated = {
        questId,
        dateStr: todayStr,
        progress: newProgress,
        target,
        isCompleted: newProgress >= target,
        claimedAt: existing?.claimedAt || null
      };

      const next = prev.filter((q) => q.questId !== questId).concat(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, [templateQuests, todayStr, storageKey, isAuthenticated]);

  // Claim quest reward (Server validates completion & double claim)
  const claimReward = useCallback(async (questId) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !quest.isCompleted || quest.isClaimed) return false;

    if (!isAuthenticated) {
      alert("Silakan masuk akun terlebih dahulu untuk mengklaim hadiah misi.");
      return false;
    }

    try {
      const res = await api.claimQuestReward({
        questId,
        dateStr: todayStr
      });

      if (!res?.success || !res.data) {
        throw new Error(res?.error || res?.message || "Server belum mengonfirmasi klaim hadiah.");
      }

      if (res.success && res.data) {
        const now = new Date().toISOString();
        setStoredQuests((prev) => {
          const existing = prev.find((q) => q.questId === questId);
          const updated = {
            questId,
            dateStr: todayStr,
            progress: quest.target,
            target: quest.target,
            isCompleted: true,
            claimedAt: now
          };

          const next = prev.filter((q) => q.questId !== questId).concat(updated);
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        if (onRewardClaimed) {
          onRewardClaimed({
            questId,
            xp: res.data.earnedXp,
            coins: res.data.earnedCoins
          });
        }
        return true;
      }

      return false;
    } catch (err) {
      console.warn("[DailyQuests] Gagal mengklaim misi:", err.message);
      alert(err.message || "Gagal mengklaim hadiah misi.");
      return false;
    }
  }, [quests, todayStr, storageKey, isAuthenticated, onRewardClaimed]);

  // Time remaining until midnight local time
  const [timeUntilReset, setTimeUntilReset] = useState("");
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const wibClock = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const nextWibMidnightUtc = Date.UTC(
        wibClock.getUTCFullYear(),
        wibClock.getUTCMonth(),
        wibClock.getUTCDate() + 1
      ) - 7 * 60 * 60 * 1000;
      const diffMs = nextWibMidnightUtc - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours} jam ${minutes} menit`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const claimedCount = quests.filter((q) => q.isClaimed).length;
  const allCompleted = completedCount === quests.length;
  const allClaimed = claimedCount === quests.length;

  return {
    quests,
    todayStr,
    timeUntilReset,
    completedCount,
    claimedCount,
    allCompleted,
    allClaimed,
    isLoading,
    updateProgress,
    claimReward
  };
}
