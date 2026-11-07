import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./useAuth.jsx";
import { api } from "../services/api.js";
import { generateDailyQuests, enrichQuestsWithProgress } from "../features/missions/missionsEngine.js";
import { getWibDateString } from "../features/missions/wibDate.js";
import { hasUnfinishedServerMissions } from "../features/missions/missionStatus.js";
import { notifyDailyQuestsChanged, subscribeToDailyQuestsChanged } from "../services/dailyQuestEvents.js";

function readStoredQuests(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRemoteQuests(remoteQuests, dateStr) {
  return remoteQuests.map((quest) => ({
    questId: quest.questId || quest.id,
    dateStr,
    progress: Math.max(0, Number(quest.progress ?? quest.current ?? quest.currentProgress) || 0),
    target: Math.max(1, Number(quest.target) || 1),
    isCompleted: Boolean(quest.isCompleted),
    claimedAt: quest.claimedAt || null
  }));
}

export function useDailyQuests({ onRewardClaimed } = {}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [todayStr, setTodayStr] = useState(() => getWibDateString());

  // Keep the daily mission date aligned with Asia/Jakarta even when the app
  // remains open across midnight or returns from the background.
  useEffect(() => {
    const refreshWibDate = () => {
      const latest = getWibDateString();
      setTodayStr((current) => current === latest ? current : latest);
    };

    const interval = setInterval(refreshWibDate, 60000);
    window.addEventListener("focus", refreshWibDate);
    document.addEventListener("visibilitychange", refreshWibDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshWibDate);
      document.removeEventListener("visibilitychange", refreshWibDate);
    };
  }, []);

  const userId = user?.id || null;
  const storageKey = `sinau_daily_quests_${userId || "guest"}_${todayStr}`;
  const activeSnapshotKey = `${userId || "guest"}:${todayStr}`;

  const templateQuests = useMemo(() => {
    return generateDailyQuests(todayStr, userId || "pelajar");
  }, [todayStr, userId]);

  const [storedQuests, setStoredQuests] = useState(() => readStoredQuests(storageKey));
  const [isLoading, setIsLoading] = useState(true);
  const [serverSnapshotKey, setServerSnapshotKey] = useState(null);
  const [loadError, setLoadError] = useState("");
  const refreshGenerationRef = useRef(0);

  const refreshServerSnapshot = useCallback(async () => {
    if (!isAuthenticated || !userId) return null;

    const requestGeneration = ++refreshGenerationRef.current;
    const res = await api.getDailyQuests(todayStr);
    if (
      !res?.success ||
      res.data?.dateStr !== todayStr ||
      !Array.isArray(res.data?.quests) ||
      res.data.quests.length !== templateQuests.length
    ) {
      throw new Error(res?.error || "Server belum mengirim seluruh misi hari ini.");
    }

    if (requestGeneration !== refreshGenerationRef.current) return null;

    const remote = normalizeRemoteQuests(res.data.quests, res.data.dateStr || todayStr);
    const expectedIds = new Set(templateQuests.map((quest) => quest.id));
    if (
      remote.length !== expectedIds.size ||
      remote.some((quest) => !expectedIds.has(quest.questId))
    ) {
      throw new Error("Daftar misi dari server tidak cocok dengan tanggal dan akun aktif.");
    }

    setStoredQuests(remote);
    setServerSnapshotKey(activeSnapshotKey);
    setLoadError("");
    try {
      localStorage.setItem(storageKey, JSON.stringify(remote));
    } catch {}

    return remote;
  }, [
    isAuthenticated,
    userId,
    todayStr,
    templateQuests,
    activeSnapshotKey,
    storageKey
  ]);

  // A signed-in account must wait for Better Auth to resolve, then use only
  // its own server snapshot as the authority for mission completion.
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated || !userId) {
      setStoredQuests(readStoredQuests(storageKey));
      setServerSnapshotKey(null);
      setLoadError("");
      setIsLoading(false);
      return;
    }

    setStoredQuests(readStoredQuests(storageKey));
    setServerSnapshotKey(null);
    setLoadError("");
    setIsLoading(true);

    refreshServerSnapshot()
      .catch((err) => {
        console.warn("[DailyQuests] Gagal mengambil misi dari cloud:", err.message);
        setServerSnapshotKey(null);
        setLoadError(err?.message || "Misi belum dapat diverifikasi dari server.");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      // Ignore responses from a previous account/date after a switch or unmount.
      refreshGenerationRef.current += 1;
    };
  }, [authLoading, isAuthenticated, userId, storageKey, refreshServerSnapshot]);

  // Every mounted consumer (sidebar and Missions page) refreshes from the same
  // server-written activity ledger after an accepted learning activity/claim.
  useEffect(() => {
    if (authLoading || !isAuthenticated || !userId) return;

    const refreshAfterActivity = () => {
      setServerSnapshotKey(null);
      setIsLoading(true);
      refreshServerSnapshot()
        .catch((err) => {
          console.warn("[DailyQuests] Gagal menyegarkan misi:", err.message);
          setServerSnapshotKey(null);
          setLoadError(err?.message || "Misi belum dapat diverifikasi dari server.");
        })
        .finally(() => setIsLoading(false));
    };

    return subscribeToDailyQuestsChanged(refreshAfterActivity);
  }, [authLoading, isAuthenticated, userId, refreshServerSnapshot]);

  const quests = useMemo(() => {
    return enrichQuestsWithProgress(templateQuests, storedQuests);
  }, [templateQuests, storedQuests]);

  const isServerConfirmed = Boolean(
    isAuthenticated &&
    serverSnapshotKey &&
    serverSnapshotKey === activeSnapshotKey
  );

  const updateProgress = useCallback(async () => {
    if (isAuthenticated) {
      try {
        return await refreshServerSnapshot();
      } catch (err) {
        console.warn("[DailyQuests] Gagal memperbarui progres server:", err.message);
        setServerSnapshotKey(null);
        setLoadError(err?.message || "Misi belum dapat diverifikasi dari server.");
        return null;
      }
    }

    // Guest mode is local-only. This path is never used for authenticated
    // claims or for the sidebar's server-confirmed red alert.
    return storedQuests;
  }, [isAuthenticated, refreshServerSnapshot, storedQuests]);

  const claimReward = useCallback(async (questId) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !isServerConfirmed || !quest.isCompleted || quest.isClaimed) return false;

    if (!isAuthenticated) {
      alert("Silakan masuk akun terlebih dahulu untuk mengklaim hadiah misi.");
      return false;
    }

    try {
      const res = await api.claimQuestReward({ questId, dateStr: todayStr });
      if (!res?.success || !res.data) {
        throw new Error(res?.error || res?.message || "Server belum mengonfirmasi klaim hadiah.");
      }

      // The event refreshes every mounted mission consumer, including this hook.
      notifyDailyQuestsChanged();

      if (onRewardClaimed) {
        onRewardClaimed({
          userId,
          questId,
          xp: res.data.earnedXp,
          coins: res.data.earnedCoins,
          totalXp: res.data.totalXp,
          totalCoins: res.data.totalCoins
        });
      }
      return true;
    } catch (err) {
      console.warn("[DailyQuests] Gagal mengklaim misi:", err.message);
      alert(err.message || "Gagal mengklaim hadiah misi.");
      return false;
    }
  }, [
    quests,
    isServerConfirmed,
    isAuthenticated,
    todayStr,
    refreshServerSnapshot,
    onRewardClaimed
  ]);

  // Time remaining until midnight in Asia/Jakarta.
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
  const allCompleted = isServerConfirmed && quests.length > 0 && completedCount === quests.length;
  const allClaimed = isServerConfirmed && quests.length > 0 && claimedCount === quests.length;
  const hasUnfinishedMissions = hasUnfinishedServerMissions({
    isAuthenticated,
    isLoading,
    hasServerSnapshot: isServerConfirmed,
    quests
  });

  return {
    quests,
    todayStr,
    timeUntilReset,
    completedCount,
    claimedCount,
    allCompleted,
    allClaimed,
    isLoading,
    isServerConfirmed,
    hasUnfinishedMissions,
    loadError,
    updateProgress,
    refresh: refreshServerSnapshot,
    claimReward
  };
}
