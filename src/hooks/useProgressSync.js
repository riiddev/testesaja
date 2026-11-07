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

const BATCH_SIZE_THRESHOLD = 5;
const DEBOUNCE_DELAY_MS = 2500;
const OUTBOX_REPLAY_LIMIT = Number.MAX_SAFE_INTEGER;

export function useProgressSync() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || "guest";

  const [progressMap, setProgressMap] = useState({});
  const [outboxCount, setOutboxCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("saved"); // "saved" | "syncing" | "pending" | "error"
  const [syncError, setSyncError] = useState(null);
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

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("pending");
      return;
    }

    const pending = await getPendingOutboxEvents(userId, 25);
    if (!pending.length) {
      setOutboxCount(0);
      setSyncStatus("saved");
      setSyncError(null);
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const res = await api.syncProgress(pending, { keepalive });

      if (!res?.success || !Array.isArray(res.data?.processedEvents)) {
        throw new Error(res?.error || "Server tidak mengonfirmasi antrean progres.");
      }
      if (res.data.processedEvents.length === 0) {
        throw new Error("Belum ada event yang dikonfirmasi server. Antrean lokal tetap disimpan.");
      }

      // Strict ACK: delete only event IDs explicitly confirmed by the server.
      await removeConfirmedEvents(userId, res.data.processedEvents);

      const remainingCount = await getOutboxCount(userId);
      setOutboxCount(remainingCount);

      if (remainingCount > 0) {
        setSyncStatus("pending");
        // A closing page sends one keepalive batch only. Remaining events are
        // picked up automatically when the user opens the app again.
        if (!keepalive) {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => flushOutbox(), 500);
        }
      } else {
        // Re-read canonical server state after the queue is fully acknowledged.
        // Do not start a second non-keepalive request while the page is closing.
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
            // The confirmed writes are safe; the next normal load will refresh
            // the view from the server if this optional read fails.
            console.warn("[ProgressSync] Gagal memperbarui tampilan progres:", refreshError.message);
          }
        }

        setSyncStatus(remainingCount === 0 ? "saved" : "pending");
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

    const updatedMap = { ...currentMap, [wordId]: updated };
    replaceProgressMap(updatedMap);
    await saveProgressToCache(userId, updatedMap);

    const event = {
      eventId: `srs_${userId}_${wordId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      wordId,
      level: updated.level,
      isCorrect: Boolean(isCorrect),
      createdAt: new Date().toISOString()
    };

    await enqueueOutboxEvent(userId, event);
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
    setSyncStatus("saved");
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
        if (isMounted && res?.success && res.data?.items) {
          const merged = mergeServerProgressWithPendingEvents(res.data.items, pending);
          replaceProgressMap(merged);
          await saveProgressToCache(userId, merged);
        }
      } catch (err) {
        console.warn("[ProgressSync] Gagal memuat progres server:", err.message);
        // Keep the user-scoped local cache available while offline.
      }

      if (isMounted && count > 0) {
        flushOutbox();
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
    recordWordReview,
    flushQueue: flushOutbox,
    retrySync: flushOutbox,
    getWordStatus: (wordId) => getWordStatus(progressMap[wordId])
  };
}
