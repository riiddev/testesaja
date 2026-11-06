import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api.js";
import { calculateNextReview, getWordStatus } from "./useSpacedRepetition.js";
import { useAuth } from "./useAuth.jsx";

const BATCH_SIZE_THRESHOLD = 5;
const DEBOUNCE_DELAY_MS = 3000;

export function useProgressSync() {
  const { user, isAuthenticated } = useAuth();
  const [progressMap, setProgressMap] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const pendingQueueRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  // Load progress when user authenticates
  useEffect(() => {
    let isMounted = true;
    async function fetchProgress() {
      if (!isAuthenticated) {
        setProgressMap({});
        return;
      }

      try {
        const res = await api.getProgress();
        if (isMounted && res.success && res.data?.items) {
          setProgressMap(res.data.items);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Gagal mengambil progres:", err.message);
          setSyncError(err.message);
        }
      }
    }

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Flush pending queue to cloud
  const flushQueue = useCallback(async () => {
    if (!isAuthenticated || pendingQueueRef.current.size === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const updates = Array.from(pendingQueueRef.current.values());
    pendingQueueRef.current.clear();

    setIsSyncing(true);
    setSyncError(null);

    try {
      await api.syncProgress(updates);
    } catch (err) {
      console.warn("Gagal sinkronisasi progres batch:", err.message);
      setSyncError("Sinkronisasi tertunda: " + err.message);
      // Re-queue failed updates
      updates.forEach(item => {
        if (!pendingQueueRef.current.has(item.wordId)) {
          pendingQueueRef.current.set(item.wordId, item);
        }
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Flush when navigating away or unmounting
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingQueueRef.current.size > 0) {
        flushQueue();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (pendingQueueRef.current.size > 0) {
        flushQueue();
      }
    };
  }, [flushQueue]);

  // Record a word study outcome
  const recordWordReview = useCallback((wordId, level, isCorrect) => {
    const current = progressMap[wordId] || {
      wordId: wordId,
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
      nextReviewAt: next.nextReviewAt,
      updatedAt: new Date().toISOString()
    };

    // Optimistic state update in memory
    setProgressMap(prev => ({
      ...prev,
      [wordId]: updated
    }));

    // Add to batch queue
    pendingQueueRef.current.set(wordId, updated);

    // If queue reaches threshold, flush immediately; otherwise debounce
    if (pendingQueueRef.current.size >= BATCH_SIZE_THRESHOLD) {
      flushQueue();
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(flushQueue, DEBOUNCE_DELAY_MS);
    }

    return updated;
  }, [progressMap, flushQueue]);

  return {
    progressMap,
    isSyncing,
    syncError,
    recordWordReview,
    flushQueue,
    getWordStatus: (wordId) => getWordStatus(progressMap[wordId])
  };
}

