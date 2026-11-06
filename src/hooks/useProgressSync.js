/**
 * SINAUENGLISH V2 — Offline-First Progress & Spaced Repetition (SRS) Sync Hook
 * 
 * Enforces resilient background syncing:
 * 1. Persistent IndexedDB outbox per user (`sinau_outbox_${userId}`)
 * 2. Strict server ACK deletion (events removed ONLY after confirmed by server)
 * 3. 4-State UI Status: "saved", "syncing", "pending", "error"
 * 4. Automatic retry on network reconnection (online event)
 * 5. Fetch `keepalive: true` on page visibility change
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

const BATCH_SIZE_THRESHOLD = 5;
const DEBOUNCE_DELAY_MS = 2500;

export function useProgressSync() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || "guest";

  const [progressMap, setProgressMap] = useState({});
  const [outboxCount, setOutboxCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("saved"); // "saved" | "syncing" | "pending" | "error"
  const [syncError, setSyncError] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const isSyncingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // 1. Initial Load: Load from IndexedDB cache first, then sync with server
  useEffect(() => {
    let isMounted = true;

    async function initUserProgress() {
      if (!userId || userId === "guest") {
        setProgressMap({});
        setOutboxCount(0);
        setSyncStatus("saved");
        return;
      }

      // Step A: Load instantly from offline cache
      const cached = await loadProgressFromCache(userId);
      if (isMounted && cached && Object.keys(cached).length > 0) {
        setProgressMap(cached);
      }

      // Step B: Check pending outbox count
      const count = await getOutboxCount(userId);
      if (isMounted) {
        setOutboxCount(count);
        if (count > 0) {
          setSyncStatus("pending");
        }
      }

      // Step C: If authenticated, fetch fresh cloud state
      if (isAuthenticated) {
        try {
          const res = await api.getProgress();
          if (isMounted && res.success && res.data?.items) {
            setProgressMap((prev) => {
              const merged = { ...prev, ...res.data.items };
              saveProgressToCache(userId, merged);
              return merged;
            });
          }
        } catch (err) {
          console.warn("[ProgressSync] Gagal memuat progres server:", err.message);
        }

        // Trigger flush if there are pending items
        if (count > 0 && isOnline) {
          flushOutbox();
        }
      }
    }

    initUserProgress();

    return () => {
      isMounted = false;
    };
  }, [userId, isAuthenticated]);

  // 2. Listen to browser Online/Offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (outboxCount > 0 && isAuthenticated) {
        flushOutbox();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (outboxCount > 0) {
        setSyncStatus("pending");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [outboxCount, isAuthenticated]);

  // 3. Flush Outbox queue to server with strict ACK confirmation
  const flushOutbox = useCallback(async () => {
    if (isSyncingRef.current || !isAuthenticated || userId === "guest") return;

    if (!navigator.onLine) {
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
      const res = await api.syncProgress(pending);

      if (res.success && Array.isArray(res.data?.processedEvents)) {
        // STRICT ACK: Remove ONLY events confirmed by the server
        await removeConfirmedEvents(userId, res.data.processedEvents);

        const remainingCount = await getOutboxCount(userId);
        setOutboxCount(remainingCount);

        if (remainingCount > 0) {
          setSyncStatus("pending");
          // Continue flushing remaining batches
          setTimeout(flushOutbox, 500);
        } else {
          setSyncStatus("saved");
          setSyncError(null);
        }
      } else {
        throw new Error(res.error || "Respons server tidak mengonfirmasi event.");
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
  }, [userId, isAuthenticated]);

  // 4. Record a Word Review (Optimistic memory + Persistent outbox)
  const recordWordReview = useCallback(async (wordId, level, isCorrect) => {
    const current = progressMap[wordId] || {
      wordId,
      level: level || "A1",
      correctCount: 0,
      wrongCount: 0,
      masteryStage: "fresh"
    };

    const next = calculateNextReview(isCorrect, current.correctCount);
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

    // A. Optimistic memory update
    const updatedMap = {
      ...progressMap,
      [wordId]: updated
    };
    setProgressMap(updatedMap);

    // B. Save to local offline cache
    saveProgressToCache(userId, updatedMap);

    // C. Create unique event for outbox
    const eventId = `srs_${userId}_${wordId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const event = {
      eventId,
      userId,
      wordId,
      isCorrect: Boolean(isCorrect),
      createdAt: new Date().toISOString()
    };

    // D. Persist into IndexedDB Outbox
    await enqueueOutboxEvent(userId, event);
    const count = await getOutboxCount(userId);
    setOutboxCount(count);
    setSyncStatus("pending");

    // E. Schedule server flush if authenticated and online
    if (isAuthenticated && navigator.onLine) {
      if (count >= BATCH_SIZE_THRESHOLD) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        flushOutbox();
      } else {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(flushOutbox, DEBOUNCE_DELAY_MS);
      }
    }

    return updated;
  }, [progressMap, userId, isAuthenticated, flushOutbox]);

  // 5. Visibility change / pagehide resilience (keepalive flush)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && outboxCount > 0 && isAuthenticated) {
        flushOutbox();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, [outboxCount, isAuthenticated, flushOutbox]);

  return {
    progressMap,
    isSyncing: syncStatus === "syncing",
    syncStatus, // "saved" | "syncing" | "pending" | "error"
    outboxCount,
    syncError,
    isOnline,
    recordWordReview,
    flushQueue: flushOutbox,
    retrySync: flushOutbox,
    getWordStatus: (wordId) => getWordStatus(progressMap[wordId])
  };
}
