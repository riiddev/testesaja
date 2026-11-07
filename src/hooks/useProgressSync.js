/**
 * SINAUENGLISH V2 — Offline-First Progress & Spaced Repetition (SRS) Sync Hook
 *
 * The server is the source of truth. Pending outbox events are replayed over
 * the latest server state so offline work remains visible without allowing an
 * old local cache to overwrite progress from another device.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api.js";
import { calculateNextReview, getWordStatus } from "./useSpacedRepetition.js";
import { useAuth } from "./useAuth.jsx";
import {
  enqueueOutboxEvent,
  getPendingOutboxEvents,
  removeConfirmedEvents,
  getOutboxCount,
  saveProgressToCache,
  loadProgressFromCache
} from "../services/outboxDb.js";
import { mergeServerProgressWithPendingEvents } from "../lib/progressSyncMerge.js";
import { notifyDailyQuestsChanged } from "../services/dailyQuestEvents.js";

const BATCH_SIZE_THRESHOLD = 5;
const DEBOUNCE_DELAY_MS = 2500;
const OUTBOX_REPLAY_LIMIT = Number.MAX_SAFE_INTEGER;

export function useProgressSync() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || "guest";

  const [progressMap, setProgressMap] = useState({});
  const [outboxCount, setOutboxCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("checking"); // "checking" | "saved" | "syncing" | "pending" | "error"
  const [syncError, setSyncError] = useState(null);
  const [serverBalances, setServerBalances] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const progressMapRef = useRef({});
  const isSyncingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const retryTimerRef = useRef(null);

  const replaceProgressMap = useCallback((nextMap) => {
    const safeMap = nextMap && typeof nextMap === "object" ? nextMap : {};
    progressMapRef.current = safeMap;
    setProgressMap(safeMap);
  }, []);

  // Flush one server-acknowledged batch. Unconfirmed events always stay in IndexedDB.
  const flushOutbox = useCallback(async ({ keepalive = false } = {}) => {
    if (isSyncingRef.current || !isAuthenticated || userId === "guest") return;

    isSyncingRef.current = true;
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const count = await getOutboxCount(userId);
        setOutboxCount(count);
        setSyncStatus(count > 0 ? "pending" : "error");
        setSyncError(count > 0
          ? "Perangkat sedang offline. Aktivitas tetap menunggu di perangkat."
          : "Belum dapat memeriksa penyimpanan cloud. Coba lagi saat online.");
        return;
      }

      const pending = await getPendingOutboxEvents(userId, 25);
      if (!pending.length) {
        // An empty local queue is not proof that the cloud is reachable. Verify
        // the authenticated server before displaying the green "Tersimpan" state.
        const [latest, pendingAfterCheck] = await Promise.all([
          api.getProgress(),
          getPendingOutboxEvents(userId, OUTBOX_REPLAY_LIMIT)
        ]);

        if (!latest?.success || !latest.data?.items || typeof latest.data.items !== "object") {
          throw new Error(latest?.error || "Server belum mengonfirmasi status penyimpanan.");
        }

        const canonical = mergeServerProgressWithPendingEvents(
          latest.data.items,
          pendingAfterCheck
        );
        replaceProgressMap(canonical);
        await saveProgressToCache(userId, canonical);

        const remainingCount = pendingAfterCheck.length;
        setOutboxCount(remainingCount);
        setSyncStatus(remainingCount > 0 ? "pending" : "saved");
        setSyncError(null);
        if (remainingCount > 0 && !keepalive) {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => flushOutbox(), 500);
        }
        return;
      }

      setSyncStatus("syncing");
      setSyncError(null);

      const res = await api.syncProgress(pending, { keepalive });
      if (!res?.success || !Array.isArray(res.data?.processedEvents)) {
        throw new Error(res?.error || "Server tidak mengonfirmasi antrean progres.");
      }

      // Only acknowledge IDs that were actually present in the submitted batch.
      const submittedIds = new Set(pending.map((item) => item.eventId));
      const acknowledgedIds = [...new Set(res.data.processedEvents)]
        .filter((eventId) => submittedIds.has(eventId));
      if (!acknowledgedIds.length) {
        throw new Error("Belum ada event yang dikonfirmasi server. Antrean lokal tetap disimpan.");
      }

      // The server response includes canonical balances from the same locked
      // transaction. Keep the owner ID so a late response cannot update a new
      // account after logout/login.
      if (
        Number.isSafeInteger(Number(res.data.totalXp)) &&
        Number(res.data.totalXp) >= 0 &&
        Number.isSafeInteger(Number(res.data.totalCoins)) &&
        Number(res.data.totalCoins) >= 0
      ) {
        setServerBalances({
          userId,
          totalXp: Number(res.data.totalXp),
          totalCoins: Number(res.data.totalCoins),
          streak: Number.isSafeInteger(Number(res.data.streak))
            ? Number(res.data.streak)
            : undefined
        });
      }

      const removalSucceeded = await removeConfirmedEvents(userId, acknowledgedIds);
      if (!removalSucceeded) {
        throw new Error("Server sudah menerima aktivitas, tetapi antrean lokal belum dapat dibersihkan. Sinkronisasi akan diulang dengan aman.");
      }

      // SRS events are first committed to progress_events by the server. Only
      // after that ACK may daily mission consumers refresh their server snapshot.
      notifyDailyQuestsChanged();

      const remainingCount = await getOutboxCount(userId);
      setOutboxCount(remainingCount);

      if (remainingCount > 0) {
        setSyncStatus("pending");
        // Send one batch while closing; remaining batches resume on next open.
        if (!keepalive) {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => flushOutbox(), 500);
        }
      } else {
        // The explicit server ACK is sufficient proof for the just-submitted
        // events. Refresh the canonical view when the page is still active.
        if (!keepalive) {
          try {
            const [latest, pendingAfterAck] = await Promise.all([
              api.getProgress(),
              getPendingOutboxEvents(userId, OUTBOX_REPLAY_LIMIT)
            ]);

            if (latest?.success && latest.data?.items) {
              const canonical = mergeServerProgressWithPendingEvents(
                latest.data.items,
                pendingAfterAck
              );
              replaceProgressMap(canonical);
              await saveProgressToCache(userId, canonical);
            }
          } catch (refreshError) {
            // The server ACK remains valid; this only delays the visual refresh.
            console.warn("[ProgressSync] Gagal memperbarui tampilan progres:", refreshError.message);
          }
        }

        setSyncStatus("saved");
        setSyncError(null);
      }
    } catch (err) {
      console.warn("[ProgressSync] Gagal sinkronisasi batch:", err.message);
      const remainingCount = await getOutboxCount(userId);
      setOutboxCount(remainingCount);
      setSyncStatus("error");
      setSyncError(err.message || "Gagal terhubung ke server.");
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, isAuthenticated, replaceProgressMap]);

  // Record a review locally first, then let the server validate and persist it.
  const recordWordReview = useCallback(async (wordId, level, isCorrect) => {
    const currentMap = progressMapRef.current;
    const current = currentMap[wordId] || {
      wordId,
      level: level || "A1",
      correctCount: 0,
      wrongCount: 0,
      masteryStage: "fresh"
    };

    const next = calculateNextReview(Boolean(isCorrect), current.correctCount);
    const updated = {
      ...current,
      level: level || current.level,
      correctCount: next.correctCount,
      wrongCount: isCorrect ? current.wrongCount : current.wrongCount + 1,
      masteryStage: next.masteryStage,
      intervalDays: next.intervalDays || 1,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: new Date().toISOString()
    };

    const event = {
      eventId: `srs_${userId}_${wordId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      wordId,
      level: updated.level,
      isCorrect: Boolean(isCorrect),
      createdAt: new Date().toISOString()
    };

    const queued = await enqueueOutboxEvent(userId, event);
    if (!queued) {
      setSyncStatus("error");
      setSyncError("Aktivitas belum tersimpan ke antrean perangkat. Ulangi latihan sebelum meninggalkan halaman.");
      return null;
    }

    const updatedMap = { ...currentMap, [wordId]: updated };
    replaceProgressMap(updatedMap);
    await saveProgressToCache(userId, updatedMap);

    const count = await getOutboxCount(userId);
    setOutboxCount(count);
    setSyncStatus("pending");

    if (isAuthenticated && typeof navigator !== "undefined" && navigator.onLine) {
      if (count >= BATCH_SIZE_THRESHOLD) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        flushOutbox();
      } else {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => flushOutbox(), DEBOUNCE_DELAY_MS);
      }
    }

    return updated;
  }, [userId, isAuthenticated, flushOutbox, replaceProgressMap]);

  // On account changes, reset immediately, then hydrate cache + server for that user.
  useEffect(() => {
    let isMounted = true;

    replaceProgressMap({});
    setOutboxCount(0);
    setSyncStatus("checking");
    setSyncError(null);

    async function initUserProgress() {
      if (!userId || userId === "guest") return;

      const cached = await loadProgressFromCache(userId);
      if (!isMounted) return;
      replaceProgressMap(cached || {});

      const [pending, count] = await Promise.all([
        getPendingOutboxEvents(userId, OUTBOX_REPLAY_LIMIT),
        getOutboxCount(userId)
      ]);
      if (!isMounted) return;

      setOutboxCount(count);
      if (count > 0) setSyncStatus("pending");

      if (!isAuthenticated) return;

      try {
        const res = await api.getProgress();
        if (!res?.success || !res.data?.items || typeof res.data.items !== "object") {
          throw new Error(res?.error || "Server belum mengonfirmasi status penyimpanan.");
        }

        if (isMounted) {
          const merged = mergeServerProgressWithPendingEvents(res.data.items, pending);
          replaceProgressMap(merged);
          await saveProgressToCache(userId, merged);
          if (count > 0) {
            setSyncStatus("pending");
            flushOutbox();
          } else {
            setSyncStatus("saved");
            setSyncError(null);
          }
        }
      } catch (err) {
        console.warn("[ProgressSync] Gagal memuat progres server:", err.message);
        // Keep the user-scoped cache and durable outbox, but never claim cloud save.
        if (isMounted) {
          setSyncStatus("error");
          setSyncError(err.message || "Gagal memeriksa penyimpanan cloud.");
        }
      }
    }

    initUserProgress();

    return () => {
      isMounted = false;
    };
  }, [userId, isAuthenticated, flushOutbox, replaceProgressMap]);

  // Retry automatically when network connectivity returns.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (outboxCount > 0 && isAuthenticated) flushOutbox();
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (outboxCount > 0) setSyncStatus("pending");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [outboxCount, isAuthenticated, flushOutbox]);

  // Browsers may cancel regular fetches during page shutdown; keepalive allows
  // one small SRS batch to finish while the page is closing.
  useEffect(() => {
    const flushOnHide = () => {
      if (outboxCount > 0 && isAuthenticated) flushOutbox({ keepalive: true });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushOnHide();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushOnHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushOnHide);
    };
  }, [outboxCount, isAuthenticated, flushOutbox]);

  // Clear timers when the active account changes or this hook unmounts.
  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [userId]);

  return {
    progressMap,
    isSyncing: syncStatus === "syncing",
    syncStatus,
    outboxCount,
    syncError,
    isOnline,
    serverBalances,
    recordWordReview,
    flushQueue: flushOutbox,
    retrySync: flushOutbox,
    getWordStatus: (wordId) => getWordStatus(progressMap[wordId])
  };
}
