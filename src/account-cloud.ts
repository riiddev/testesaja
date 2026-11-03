type AnyRecord = Record<string, any>;
type CloudBundle = {
  schemaVersion: 2;
  core: AnyRecord;
  extras: {
    extraLearning: AnyRecord;
    habitProgress: AnyRecord;
    adventureProgress: AnyRecord;
    studioDrafts?: AnyRecord;
    preferences?: AnyRecord;
    [key: string]: any;
  };
};
type AuthUser = { id: string; email?: string };
type AuthSession = { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number; token_type?: string; user: AuthUser };

declare global {
  interface Window {
    sinauuExportLocalBundle?: () => CloudBundle | Promise<CloudBundle>;
    sinauuApplyCloudBundle?: (bundle: CloudBundle) => void | Promise<void>;
    sinauuExtraLearningRestore?: (next: AnyRecord) => void;
    sinauuExtraLearningBackup?: () => AnyRecord;
    sinauuHabitLibraryRestore?: (next: AnyRecord) => void;
    sinauuHabitLibraryBackup?: () => AnyRecord;
    sinauuAdventureRestore?: (next: AnyRecord) => void;
    sinauuAdventureBackup?: () => AnyRecord;
    sinauuStudioDraftsRestore?: (next: AnyRecord) => void;
    sinauuStudioDraftsBackup?: () => AnyRecord;
    sinauuRenderAdventure?: () => void;
    sinauuGetSkillPassport?: () => any;
    sinauuSkillPassportData?: any;
    sinauuGetAdaptiveStudyPlan?: (today?: string) => any;
    sinauuGetWordList?: () => any[];
    sinauuGetTopicList?: () => any[];
    sinauuGetCoreState?: () => any;
    sinauuGetWordContextQuestion?: (word: any, qId: string) => any;
    sinauuGetHabitLibrary?: () => any;
    sinauuGetHabitQuestions?: (passage: any) => any[];
    sinauuOpenHabitPassage?: (passageId: string) => void;
    sinauuRecordMistake?: (input: any) => void;
    sinauuSyncMistakes?: () => void;
    sinauuIsCloudVerified?: () => boolean;
    sinauuTriggerCloudSync?: () => Promise<boolean>;
  }
}

let CLOUD_READY = false;
let isCloudVerified = false;
const SESSION_KEY = "sinauu-cloud-session-v1";
const LOCAL_DB = "sinauu-local-v1", LOCAL_STORE = "state", LOCAL_RECORD = "main";
const CORE_FALLBACK = "sinauu-learning-state-v1", EXTRA_KEY = "sinauu-extra-learning-v1", HABIT_KEY = "sinauu-habit-library-v1", ADVENTURE_KEY = "sinauu-adventure-progress-v1";
const OWNER_KEY = "sinauu-cloud-owner-v1";
const ACCOUNT_CACHE_PREFIX = "sinauu-cloud-local-cache-v1:";
const PREVIEW_DISABLED_CLOUD_HOSTS = new Set([
  "sinauuenglish.vercel.app",
  "sinauuenglish-thoodev.vercel.app",
  "sinauuenglish-git-main-thoodev.vercel.app",
]);
const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector(selector) as T | null;

let session: AuthSession | null = null;
let syncTimer: number | undefined, pollingTimer: number | undefined;
let syncing = false, applyingCloud = false, signingOut = false;
let installPrompt: BeforeInstallPromptEvent | null = null;
let currentMode: "signin" | "signup" = "signin";
let recoveryMode = false;
let sessionEpoch = 0;
let lastSuccessfulSync: string | null = null;
let lastCloudRevision: number | null = null;
let syncConflict = false;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function parseStored<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}

function freshCore(): AnyRecord {
  return { schemaVersion: 1, settings: { theme: "light", dailyGoal: 10 }, wordProgress: {}, favorites: [], grammarProgress: {}, events: [], history: [], updatedAt: new Date().toISOString() };
}

function localStudioDrafts(): AnyRecord {
  if (typeof window !== "undefined" && window.sinauuStudioDraftsBackup) {
    try {
      const live = window.sinauuStudioDraftsBackup();
      if (live && typeof live === "object") return live;
    } catch (_) {}
  }
  const userId = session?.user?.id;
  const userKey = userId ? "sinauu-adventure-studio-drafts-v1:" + encodeURIComponent(userId) : null;
  const raw = (userKey && parseStored<AnyRecord | null>(userKey, null)) ||
              parseStored<AnyRecord | null>("sinauu-adventure-studio-drafts-v1:local", null);
  if (raw && typeof raw === "object") return raw;
  return {
    speaking: { selectedPromptId: "first-introduction", prompts: {} },
    writing: { selectedPromptId: "short-introduction", prompts: {} },
  };
}

function localExtras(): CloudBundle["extras"] {
  return {
    extraLearning: parseStored<AnyRecord>(EXTRA_KEY, {}),
    habitProgress: parseStored<AnyRecord>(HABIT_KEY, {}),
    adventureProgress: parseStored<AnyRecord>(ADVENTURE_KEY, {}),
    studioDrafts: localStudioDrafts(),
  };
}

function normalizeBundle(raw: any): CloudBundle {
  if (raw && raw.core && typeof raw.core === "object") {
    const incomingExtras = raw.extras && typeof raw.extras === "object" && !Array.isArray(raw.extras) ? raw.extras : {};
    return {
      schemaVersion: 2,
      core: raw.core,
      extras: {
        ...incomingExtras,
        extraLearning: incomingExtras.extraLearning && typeof incomingExtras.extraLearning === "object" ? incomingExtras.extraLearning : {},
        habitProgress: incomingExtras.habitProgress && typeof incomingExtras.habitProgress === "object" ? incomingExtras.habitProgress : {},
        adventureProgress: incomingExtras.adventureProgress && typeof incomingExtras.adventureProgress === "object" ? incomingExtras.adventureProgress : {},
        studioDrafts: incomingExtras.studioDrafts && typeof incomingExtras.studioDrafts === "object" ? incomingExtras.studioDrafts : localStudioDrafts(),
      },
    };
  }
  return { schemaVersion: 2, core: raw && raw.schemaVersion === 1 ? raw : freshCore(), extras: localExtras() };
}

async function clearIndexedDbState(): Promise<boolean> {
  if (!("indexedDB" in window)) return false;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(LOCAL_DB, 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LOCAL_STORE)) { db.close(); resolve(true); return; }
        const transaction = db.transaction(LOCAL_STORE, "readwrite");
        transaction.objectStore(LOCAL_STORE).clear();
        transaction.oncomplete = () => { db.close(); resolve(true); };
        transaction.onerror = () => { db.close(); resolve(false); };
      };
      request.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

async function readIndexedDbState(): Promise<AnyRecord | null> {
  if (!("indexedDB" in window)) return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LOCAL_STORE)) request.result.createObjectStore(LOCAL_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_STORE)) { db.close(); resolve(null); return; }
      const transaction = db.transaction(LOCAL_STORE, "readonly");
      const getRequest = transaction.objectStore(LOCAL_STORE).get(LOCAL_RECORD);
      getRequest.onsuccess = () => { const value = getRequest.result?.value ?? null; db.close(); resolve(value); };
      getRequest.onerror = () => { db.close(); reject(getRequest.error); };
    };
    request.onerror = () => reject(request.error);
  });
}

async function writeIndexedDbState(state: AnyRecord): Promise<boolean> {
  if (!("indexedDB" in window)) return false;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LOCAL_STORE)) request.result.createObjectStore(LOCAL_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction(LOCAL_STORE, "readwrite");
      transaction.objectStore(LOCAL_STORE).put({ key: LOCAL_RECORD, value: state });
      transaction.oncomplete = () => { db.close(); resolve(true); };
      transaction.onerror = () => { const error = transaction.error; db.close(); reject(error); };
      transaction.onabort = () => { const error = transaction.error; db.close(); reject(error); };
    };
    request.onerror = () => reject(request.error);
  });
}

async function readLocalBundle(): Promise<CloudBundle> {
  try {
    if (window.sinauuExportLocalBundle) return normalizeBundle(await window.sinauuExportLocalBundle());
  } catch { /* Fall back to the same IndexedDB record used by the study workspace. */ }
  let core: AnyRecord | null = null;
  try { core = await readIndexedDbState(); } catch { core = null; }
  if (!core) {
    try { core = JSON.parse(localStorage.getItem(CORE_FALLBACK) || "null") as AnyRecord | null; }
    catch { core = null; }
  }
  return normalizeBundle({ core: core || freshCore(), extras: localExtras() });
}

async function applyLocalBundle(bundle: CloudBundle): Promise<void> {
  applyingCloud = true;
  try {
    if (window.sinauuApplyCloudBundle) {
      await window.sinauuApplyCloudBundle(bundle);
    } else {
      if (!isCloudVerified) {
        try { await writeIndexedDbState(bundle.core); } catch { /* local fallback below */ }
        try {
          localStorage.setItem(CORE_FALLBACK, JSON.stringify(bundle.core));
          localStorage.setItem(EXTRA_KEY, JSON.stringify(bundle.extras.extraLearning || {}));
          localStorage.setItem(HABIT_KEY, JSON.stringify(bundle.extras.habitProgress || {}));
          localStorage.setItem(ADVENTURE_KEY, JSON.stringify(bundle.extras.adventureProgress || {}));
        } catch { /* The cloud copy remains available if local storage is full. */ }
      }
      window.sinauuExtraLearningRestore?.(bundle.extras.extraLearning || {});
      window.sinauuHabitLibraryRestore?.(bundle.extras.habitProgress || {});
      window.sinauuAdventureRestore?.(bundle.extras.adventureProgress || {});
    }
    if (bundle.extras.studioDrafts) {
      window.sinauuStudioDraftsRestore?.(bundle.extras.studioDrafts);
    }
  } finally { applyingCloud = false; }
}

function itemKey(value: any): string {
  if (value == null) return "null";
  if (typeof value !== "object") return typeof value + ":" + String(value);
  if (value.id) return "id:" + value.id;
  const time = value.at || value.answeredAt || value.createdAt || value.date || value.timestamp || "";
  return [time, value.type || "", value.title || "", value.detail || "", value.questionId || "", value.correct ?? "", value.selected ?? "", JSON.stringify(value)].join("|");
}

function mergeArrays(...arrays: any[][]): any[] {
  const rows = new Map<string, any>();
  for (const item of arrays.flat()) rows.set(itemKey(item), item);
  return Array.from(rows.values()).sort((a, b) => {
    const ta = Date.parse(a?.at || a?.answeredAt || a?.createdAt || a?.date || "") || 0;
    const tb = Date.parse(b?.at || b?.answeredAt || b?.createdAt || b?.date || "") || 0;
    return ta - tb;
  });
}

function stable(value: any): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (!value || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + stable(value[key])).join(",") + "}";
}

function mergeDeep(a: any, b: any, preferB: boolean): any {
  if (Array.isArray(a) && Array.isArray(b)) return mergeArrays(a, b);
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const result: AnyRecord = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) result[key] = key in a && key in b ? mergeDeep(a[key], b[key], preferB) : (key in b ? b[key] : a[key]);
    return result;
  }
  if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
  return preferB ? (b === undefined ? a : b) : (a === undefined ? b : a);
}

function dayDistance(d1: any, d2: any): number {
  const a = d1 ? new Date(d1) : null, b = d2 ? new Date(d2) : null;
  return a && b && !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) ? Math.floor((b.getTime() - a.getTime()) / 86400000) : 0;
}

function parseTime(val: any): number {
  if (typeof val === "string" || typeof val === "number") {
    const t = Date.parse(String(val));
    if (Number.isFinite(t)) return t;
  }
  return NaN;
}

function getWordActivityTimestamp(w: AnyRecord, fallback: number): number {
  if (!w || typeof w !== "object") return fallback;
  let maxT = 0;
  if (Array.isArray(w.reviewHistory)) {
    for (const r of w.reviewHistory) {
      if (r) {
        const t = parseTime(r.at || r.date);
        if (Number.isFinite(t) && t > maxT) maxT = t;
      }
    }
  }
  if (Array.isArray(w.attempts)) {
    for (const a of w.attempts) {
      if (a) {
        const t = parseTime(a.at || a.date);
        if (Number.isFinite(t) && t > maxT) maxT = t;
      }
    }
  }
  const lr = parseTime(w.lastReviewedAt);
  if (Number.isFinite(lr) && lr > maxT) maxT = lr;
  const ls = parseTime(w.lastSeenAt);
  if (Number.isFinite(ls) && ls > maxT) maxT = ls;
  const ma = parseTime(w.masteredAt);
  if (Number.isFinite(ma) && ma > maxT) maxT = ma;
  return maxT > 0 ? maxT : fallback;
}

function mergeWordProgressItem(a: AnyRecord, b: AnyRecord, remoteIsNewer: boolean, localTime: number, remoteTime: number): AnyRecord {
  const timeA = getWordActivityTimestamp(a, localTime);
  const timeB = getWordActivityTimestamp(b, remoteTime);
  const bIsNewer = timeB > timeA ? true : (timeA > timeB ? false : remoteIsNewer);
  const preferred = bIsNewer ? b : a;
  const older = bIsNewer ? a : b;

  // 1. Skill evidence: union of all evidence
  const skillEvidence = {
    recall: Boolean(a.skillEvidence?.recall || b.skillEvidence?.recall),
    context: Boolean(a.skillEvidence?.context || b.skillEvidence?.context),
    production: Boolean(a.skillEvidence?.production || b.skillEvidence?.production),
  };

  // 2. Dates, questions, and attempts
  const studiedDates = Array.from(new Set([...(a.studiedDates || []), ...(b.studiedDates || [])])).filter(Boolean).sort();
  const contextQuestionIds = Array.from(new Set([...(a.contextQuestionIds || []), ...(b.contextQuestionIds || [])])).filter(Boolean);
  const attempts = mergeArrays(a.attempts || [], b.attempts || []);
  const savedContext = b.savedContext || a.savedContext || null;
  const firstSeenDate = earliestIso(a.firstSeenDate, b.firstSeenDate) || studiedDates[0] || null;

  // 3. Deduplicate review history
  const rawHistory: any[] = [...(a.reviewHistory || []), ...(b.reviewHistory || [])];
  const seenReviews = new Set<string>();
  const deduplicatedHistory: any[] = [];
  for (const r of rawHistory) {
    if (!r || typeof r !== "object") continue;
    const rAt = typeof r.at === "string" ? r.at : "";
    const rDate = typeof r.date === "string" ? r.date : "";
    const rCorrect = r.correct === true ? "1" : (r.correct === false ? "0" : "u");
    const rSession = typeof r.sessionId === "string" ? r.sessionId : "";
    const key = rAt ? `${rAt}_${rCorrect}_${rSession}` : `${rDate}_${rCorrect}_${rSession}_${stable(r)}`;
    if (!seenReviews.has(key)) {
      seenReviews.add(key);
      deduplicatedHistory.push(r);
    }
  }

  // Sort chronologically by review timestamp
  deduplicatedHistory.sort((x, y) => {
    const tx = parseTime(x.at || x.date);
    const ty = parseTime(y.at || y.date);
    const xValid = Number.isFinite(tx);
    const yValid = Number.isFinite(ty);
    if (xValid && yValid) return tx - ty;
    if (xValid && !yValid) return 1;
    if (!xValid && yValid) return -1;
    return 0;
  });

  // 4. Trace lapses and review progression
  let lastLapseIndex = -1;
  for (let i = 0; i < deduplicatedHistory.length; i++) {
    if (deduplicatedHistory[i].correct === false) {
      lastLapseIndex = i;
    }
  }

  const latestReview = [a.lastReviewedAt, b.lastReviewedAt].filter(Boolean).sort().reverse()[0] || null;
  const nextReview = bIsNewer ? (preferred.nextReviewAt || older.nextReviewAt || null) : (older.nextReviewAt || preferred.nextReviewAt || null);

  let status = preferred.status || older.status || "new";
  let weak = Boolean(preferred.weak !== undefined ? preferred.weak : older.weak);
  let reviewSuccesses = Math.max(Number(preferred.reviewSuccesses) || 0, 0);
  let reviewDates = Array.from(new Set([...(a.reviewDates || []), ...(b.reviewDates || [])])).filter(Boolean).sort();
  let masteredAt: string | null = earliestIso(a.masteredAt, b.masteredAt) || preferred.masteredAt || older.masteredAt || null;
  let consecutiveErrors = Math.max(Number(preferred.consecutiveErrors) || 0, Number(older.consecutiveErrors) || 0);

  if (deduplicatedHistory.length > 0 && lastLapseIndex >= 0) {
    const reviewsAfterLapse = deduplicatedHistory.slice(lastLapseIndex + 1).filter(e => e.correct === true);
    if (reviewsAfterLapse.length === 0) {
      // The most recent review outcome was a LAPSE: reset retention and cancel mastery!
      weak = true;
      reviewSuccesses = 0;
      reviewDates = [];
      status = "weak";
      masteredAt = null;
      consecutiveErrors = Math.max(1, Number(preferred.consecutiveErrors) || 1);
    } else {
      // Relearning after lapse: count consecutive successes achieved since the lapse
      weak = false;
      reviewSuccesses = reviewsAfterLapse.length;
      reviewDates = Array.from(new Set(reviewsAfterLapse.map(e => e.date).filter(Boolean))).sort();
      consecutiveErrors = 0;
      const meetsMastery = skillEvidence.recall && skillEvidence.context && skillEvidence.production &&
        reviewSuccesses >= 3 && reviewDates.length >= 3 &&
        dayDistance(firstSeenDate, reviewDates[reviewDates.length - 1]) >= 12 &&
        studiedDates.length >= 4 && !weak;
      if (meetsMastery) {
        status = "mastered";
        masteredAt = preferred.masteredAt || older.masteredAt || new Date().toISOString();
      } else {
        masteredAt = null;
        status = (nextReview && parseTime(nextReview) <= Date.now()) ? "due" : "learning";
      }
    }
  } else if (deduplicatedHistory.length > 0) {
    // Only successful reviews recorded
    reviewSuccesses = Math.max(Number(a.reviewSuccesses) || 0, Number(b.reviewSuccesses) || 0, deduplicatedHistory.length);
    weak = false;
    consecutiveErrors = 0;
    const meetsMastery = (skillEvidence.recall && skillEvidence.context && skillEvidence.production &&
      reviewSuccesses >= 3 && reviewDates.length >= 3 &&
      dayDistance(firstSeenDate, reviewDates[reviewDates.length - 1]) >= 12 &&
      studiedDates.length >= 4 && !weak) || (preferred.status === "mastered" || older.status === "mastered");
    if (meetsMastery) {
      status = "mastered";
      masteredAt = earliestIso(a.masteredAt, b.masteredAt) || preferred.masteredAt || older.masteredAt || new Date().toISOString();
    } else {
      status = (nextReview && parseTime(nextReview) <= Date.now()) ? "due" : (preferred.status || "learning");
    }
  } else {
    // No review history on either device: respect newer device outcome
    if (preferred.status === "weak" || preferred.weak) {
      weak = true;
      status = "weak";
      reviewSuccesses = 0;
      masteredAt = null;
      reviewDates = [];
    } else if (preferred.status === "mastered") {
      weak = false;
      status = "mastered";
      reviewSuccesses = Math.max(Number(a.reviewSuccesses) || 0, Number(b.reviewSuccesses) || 0, 3);
      masteredAt = preferred.masteredAt || older.masteredAt || new Date().toISOString();
    } else if (older.status === "mastered" && !bIsNewer) {
      status = "mastered";
      weak = false;
    } else {
      status = preferred.status || older.status || "learning";
      weak = Boolean(preferred.weak);
      if (status !== "mastered") masteredAt = null;
      reviewSuccesses = Math.max(Number(preferred.reviewSuccesses) || 0, Number(older.reviewSuccesses) || 0);
    }
  }

  return {
    ...older,
    ...preferred,
    status,
    weak,
    reviewSuccesses,
    firstSeenDate,
    lastReviewedAt: latestReview,
    nextReviewAt: nextReview,
    savedContext,
    masteredAt,
    consecutiveErrors,
    attempts,
    skillEvidence,
    studiedDates,
    reviewDates,
    reviewHistory: deduplicatedHistory.slice(-150),
    contextQuestionIds,
  };
}

function mergeCore(local: AnyRecord, remote: AnyRecord): AnyRecord {
  const localTime = Date.parse(local.updatedAt || "") || 0, remoteTime = Date.parse(remote.updatedAt || "") || 0;
  const remoteIsNewer = remoteTime >= localTime;
  const older = remoteIsNewer ? local : remote, newer = remoteIsNewer ? remote : local;
  const merged: AnyRecord = { ...older, ...newer };
  merged.settings = { ...(older.settings || {}), ...(newer.settings || {}) };
  merged.favorites = Array.from(new Set([...(local.favorites || []), ...(remote.favorites || [])]));
  merged.wordProgress = {};
  const wordIds = new Set([...Object.keys(local.wordProgress || {}), ...Object.keys(remote.wordProgress || {})]);
  for (const id of wordIds) {
    const a = local.wordProgress?.[id], b = remote.wordProgress?.[id];
    if (!a || !b) { merged.wordProgress[id] = a || b; continue; }
    merged.wordProgress[id] = mergeWordProgressItem(a, b, remoteIsNewer, localTime, remoteTime);
  }
  merged.grammarProgress = {};
  const topicIds = new Set([...Object.keys(local.grammarProgress || {}), ...Object.keys(remote.grammarProgress || {})]);
  for (const id of topicIds) {
    const a = local.grammarProgress?.[id], b = remote.grammarProgress?.[id];
    if (!a || !b) { merged.grammarProgress[id] = a || b; continue; }
    const item = { ...(remoteIsNewer ? a : b), ...(remoteIsNewer ? b : a) };
    item.answers = { ...(a.answers || {}), ...(b.answers || {}) };
    item.history = mergeArrays(a.history || [], b.history || []);
    item.completedAt = earliestIso(a.completedAt, b.completedAt);
    item.lastAttemptAt = [a.lastAttemptAt, b.lastAttemptAt].filter(Boolean).sort().reverse()[0] || null;
    if (item.history.length) {
      item.attempts = item.history.length;
      item.correct = item.history.filter((entry: any) => entry.correct === true).length;
    } else {
      item.attempts = Math.max(a.attempts || 0, b.attempts || 0);
      item.correct = Math.max(a.correct || 0, b.correct || 0);
    }
    merged.grammarProgress[id] = item;
  }
  if (local.placementResult || remote.placementResult) {
    const aRes = local.placementResult, bRes = remote.placementResult;
    merged.placementResult = (aRes && bRes)
      ? (Date.parse(bRes.completedAt || "") >= Date.parse(aRes.completedAt || "") ? bRes : aRes)
      : (bRes || aRes);
  }
  merged.history = mergeArrays(local.history || [], remote.history || []).slice(-1000);
  merged.events = mergeArrays(local.events || [], remote.events || []).slice(-5000);
  merged.updatedAt = new Date(Math.max(localTime, remoteTime) || Date.now()).toISOString();
  return merged;
}



function earliestIso(a: any, b: any): string | null {
  const validA = typeof a === "string" && Number.isFinite(Date.parse(a)) ? a : null;
  const validB = typeof b === "string" && Number.isFinite(Date.parse(b)) ? b : null;
  if (!validA) return validB;
  if (!validB) return validA;
  return Date.parse(validA) <= Date.parse(validB) ? validA : validB;
}

function mergeAdventureAttempts(...groups: any[][]): any[] {
  const byId = new Map<string, AnyRecord>();
  for (const attempt of groups.flat()) {
    if (!attempt || typeof attempt !== "object" || typeof attempt.attemptId !== "string") continue;
    const previous = byId.get(attempt.attemptId);
    if (!previous) {
      byId.set(attempt.attemptId, { ...attempt });
      continue;
    }
    const completedStepIds = Array.from(new Set([...(previous.completedStepIds || []), ...(attempt.completedStepIds || [])]));
    const stepResults: AnyRecord = { ...(previous.stepResults || {}) };
    for (const [stepId, result] of Object.entries(attempt.stepResults || {})) {
      const old = stepResults[stepId] as AnyRecord | undefined;
      const next = result as AnyRecord;
      stepResults[stepId] = old ? {
        ...old,
        ...next,
        completedAt: earliestIso(old.completedAt, next.completedAt),
        firstTry: old.firstTry !== false && next.firstTry !== false,
        attempts: Math.max(Number(old.attempts) || 0, Number(next.attempts) || 0),
      } : next;
    }
    const wrongAttempts: AnyRecord = { ...(previous.wrongAttempts || {}) };
    for (const [stepId, count] of Object.entries(attempt.wrongAttempts || {})) {
      wrongAttempts[stepId] = Math.max(Number(wrongAttempts[stepId]) || 0, Number(count) || 0);
    }
    byId.set(attempt.attemptId, {
      ...previous,
      ...attempt,
      startedAt: earliestIso(previous.startedAt, attempt.startedAt) || previous.startedAt || attempt.startedAt,
      completedAt: earliestIso(previous.completedAt, attempt.completedAt),
      completedStepIds,
      stepResults,
      wrongAttempts,
      score: previous.score == null ? attempt.score : attempt.score == null ? previous.score : Math.max(previous.score, attempt.score),
    });
  }
  return Array.from(byId.values()).sort((a, b) => String(a.startedAt || "").localeCompare(String(b.startedAt || "")));
}

function mergeAdventureProgress(local: AnyRecord = {}, remote: AnyRecord = {}): AnyRecord {
  const result: AnyRecord = { ...local, ...remote, schemaVersion: 1 };
  const localUpdatedAt = Date.parse(local.updatedAt || "") || 0;
  const remoteUpdatedAt = Date.parse(remote.updatedAt || "") || 0;
  const localHasActivity = Boolean(
    (local.missionProgress && Object.keys(local.missionProgress).length > 0) ||
    (local.dailyQuests && Object.keys(local.dailyQuests).length > 0) ||
    (local.mistakeJournal && Object.keys(local.mistakeJournal).length > 0)
  );
  const remoteHasActivity = Boolean(
    (remote.missionProgress && Object.keys(remote.missionProgress).length > 0) ||
    (remote.dailyQuests && Object.keys(remote.dailyQuests).length > 0) ||
    (remote.mistakeJournal && Object.keys(remote.mistakeJournal).length > 0)
  );
  const preferRemoteRate = localHasActivity && !remoteHasActivity
    ? false
    : !localHasActivity && remoteHasActivity
      ? true
      : remoteUpdatedAt >= localUpdatedAt;
  const preferredRate = preferRemoteRate ? remote.listeningRate : local.listeningRate;
  const fallbackRate = preferRemoteRate ? local.listeningRate : remote.listeningRate;
  result.listeningRate = [0.75, 0.9, 1].includes(Number(preferredRate))
    ? Number(preferredRate)
    : [0.75, 0.9, 1].includes(Number(fallbackRate)) ? Number(fallbackRate) : 0.9;
  const localMissions = local.missionProgress || {}, remoteMissions = remote.missionProgress || {};
  result.missionProgress = {};
  for (const missionId of new Set([...Object.keys(localMissions), ...Object.keys(remoteMissions)])) {
    const a = localMissions[missionId] || {}, b = remoteMissions[missionId] || {};
    const attempts = mergeAdventureAttempts(a.attempts || [], b.attempts || []);
    const active = attempts.filter((attempt) => !attempt.completedAt).sort((x, y) => String(y.startedAt || "").localeCompare(String(x.startedAt || "")))[0];
    const scores = [a.bestScore, b.bestScore].filter((score) => typeof score === "number" && Number.isFinite(score));
    result.missionProgress[missionId] = {
      ...a,
      ...b,
      attempts,
      bestScore: scores.length ? Math.max(...scores) : null,
      completedAt: earliestIso(a.completedAt, b.completedAt),
      activeAttemptId: active?.attemptId || null,
    };
  }

  const localEvidence = local.skillEvidence || {}, remoteEvidence = remote.skillEvidence || {};
  result.skillEvidence = {};
  for (const skill of new Set([...Object.keys(localEvidence), ...Object.keys(remoteEvidence)])) {
    const evidence = new Map<string, AnyRecord>();
    for (const item of [...(localEvidence[skill] || []), ...(remoteEvidence[skill] || [])]) {
      if (!item || typeof item.evidenceId !== "string") continue;
      evidence.set(item.evidenceId, item);
    }
    result.skillEvidence[skill] = Array.from(evidence.values())
      .sort((a, b) => String(a.recordedAt || "").localeCompare(String(b.recordedAt || "")))
      .slice(-500);
  }

  result.xpLedger = { ...(local.xpLedger || {}) };
  for (const [awardId, award] of Object.entries(remote.xpLedger || {})) {
    const previous = result.xpLedger[awardId] as AnyRecord | undefined;
    const next = award as AnyRecord;
    result.xpLedger[awardId] = previous ? {
      ...previous,
      ...next,
      amount: Math.max(Number(previous.amount) || 0, Number(next.amount) || 0),
      awardedAt: earliestIso(previous.awardedAt, next.awardedAt),
    } : next;
  }
  const localDaily = local.dailyQuests || {}, remoteDaily = remote.dailyQuests || {};
  result.dailyQuests = {};
  for (const dateKey of new Set([...Object.keys(localDaily), ...Object.keys(remoteDaily)])) {
    const a = localDaily[dateKey] || {}, b = remoteDaily[dateKey] || {};
    const aTime = Date.parse(a.updatedAt || a.startedAt || "") || 0;
    const bTime = Date.parse(b.updatedAt || b.startedAt || "") || 0;
    const newer = bTime >= aTime ? b : a;
    const wrongAttempts: AnyRecord = { ...(a.wrongAttempts || {}) };
    for (const [stepId, count] of Object.entries(b.wrongAttempts || {})) {
      wrongAttempts[stepId] = Math.max(Number(wrongAttempts[stepId]) || 0, Number(count) || 0);
    }
    result.dailyQuests[dateKey] = {
      ...a,
      ...b,
      stepIds: Array.from(new Set([...(a.stepIds || []), ...(b.stepIds || [])])),
      completedStepIds: Array.from(new Set([...(a.completedStepIds || []), ...(b.completedStepIds || [])])),
      wrongAttempts,
      startedAt: earliestIso(a.startedAt, b.startedAt),
      completedAt: earliestIso(a.completedAt, b.completedAt),
      lastFeedback: newer.lastFeedback || null,
      lastFeedbackStepId: newer.lastFeedbackStepId || null,
      updatedAt: new Date(Math.max(aTime, bTime) || Date.now()).toISOString(),
    };
  }

  const localMistakes = local.mistakeJournal || {}, remoteMistakes = remote.mistakeJournal || {};
  result.mistakeJournal = { ...localMistakes };
  for (const [mistakeId, mistake] of Object.entries(remoteMistakes)) {
    const previous = result.mistakeJournal[mistakeId] as AnyRecord | undefined;
    const next = mistake as AnyRecord;
    const prevStage = typeof previous?.reviewStage === "number" ? previous.reviewStage : 0;
    const nextStage = typeof next?.reviewStage === "number" ? next.reviewStage : 0;
    const maxStage = Math.max(prevStage, nextStage);
    const resolvedAt = earliestIso(previous?.resolvedAt, next?.resolvedAt);
    const masteredAt = earliestIso(previous?.masteredAt, next?.masteredAt);
    const nextReviewAt = [previous?.nextReviewAt, next?.nextReviewAt].filter(Boolean).sort().reverse()[0] || null;
    result.mistakeJournal[mistakeId] = previous ? {
      ...previous,
      ...next,
      reviewStage: maxStage,
      reviewHistory: mergeArrays(previous.reviewHistory || [], next.reviewHistory || []),
      nextReviewAt,
      masteredAt,
      recordedAt: earliestIso(previous.recordedAt, next.recordedAt),
      resolvedAt,
      status: (masteredAt && maxStage >= 4) || previous?.status === "mastered" || next?.status === "mastered" ? "mastered" : (resolvedAt ? "resolved" : "open"),
    } : next;
  }
  for (const [mistakeId, mistake] of Object.entries(result.mistakeJournal)) {
    const item = mistake as AnyRecord;
    item.status = (item.masteredAt && item.reviewStage >= 4) || item.status === "mastered" ? "mastered" : (item.resolvedAt ? "resolved" : "open");
  }

  const studioById = new Map<string, AnyRecord>();
  for (const candidate of [...(Array.isArray(local.studioSessions) ? local.studioSessions : []), ...(Array.isArray(remote.studioSessions) ? remote.studioSessions : [])]) {
    if (!candidate || typeof candidate !== "object" || typeof candidate.sessionId !== "string"
      || !["speaking", "writing"].includes(candidate.studioType) || typeof candidate.promptId !== "string") continue;
    const previous = studioById.get(candidate.sessionId);
    const previousTime = Date.parse(previous?.updatedAt || previous?.completedAt || "") || 0;
    const candidateTime = Date.parse(candidate.updatedAt || candidate.completedAt || "") || 0;
    const newer = candidateTime >= previousTime ? candidate : previous;
    const older = candidateTime >= previousTime ? previous : candidate;
    studioById.set(candidate.sessionId, {
      sessionId: candidate.sessionId.slice(0, 140),
      studioType: candidate.studioType,
      promptId: candidate.promptId.slice(0, 80),
      wordCount: Math.max(0, Math.min(5000, Math.max(Number(previous?.wordCount) || 0, Number(candidate.wordCount) || 0))),
      checklistCompleted: Math.max(0, Math.min(5, Math.max(Number(previous?.checklistCompleted) || 0, Number(candidate.checklistCompleted) || 0))),
      completedAt: earliestIso(previous?.completedAt, candidate.completedAt) || newer?.completedAt || null,
      updatedAt: (newer || older)?.updatedAt || (newer || older)?.completedAt || null,
    });
  }
  result.studioSessions = Array.from(studioById.values())
    .sort((a, b) => String(a.completedAt || "").localeCompare(String(b.completedAt || "")))
    .slice(-500);

  const localStories = local.storyProgress || {}, remoteStories = remote.storyProgress || {};
  result.storyProgress = {};
  for (const storyId of new Set([...Object.keys(localStories), ...Object.keys(remoteStories)])) {
    const a = localStories[storyId] || {}, b = remoteStories[storyId] || {};
    const attemptsById = new Map<string, AnyRecord>();
    for (const attempt of [...(Array.isArray(a.attempts) ? a.attempts : []), ...(Array.isArray(b.attempts) ? b.attempts : [])]) {
      if (!attempt || typeof attempt.attemptId !== "string" || !Number.isInteger(attempt.score) || !Number.isInteger(attempt.total)) continue;
      const previous = attemptsById.get(attempt.attemptId);
      const previousTime = Date.parse(previous?.completedAt || "") || 0;
      const attemptTime = Date.parse(attempt.completedAt || "") || 0;
      if (!previous || attemptTime >= previousTime) attemptsById.set(attempt.attemptId, attempt);
    }
    const attempts = Array.from(attemptsById.values())
      .sort((x, y) => String(x.completedAt || "").localeCompare(String(y.completedAt || "")))
      .slice(-100);
    const completionDates = [a.completedAt, b.completedAt, ...attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.completedAt)]
      .filter((value) => typeof value === "string").sort();
    const updateTimes = [Date.parse(a.updatedAt || "") || 0, Date.parse(b.updatedAt || "") || 0];
    result.storyProgress[storyId] = {
      attempts,
      bestScore: Math.max(Number(a.bestScore) || 0, Number(b.bestScore) || 0, ...attempts.map((attempt) => Number(attempt.score) || 0)),
      completedAt: completionDates[0] || null,
      updatedAt: new Date(Math.max(...updateTimes) || Date.now()).toISOString(),
    };
  }


  const localListening = local.listeningProgress || {}, remoteListening = remote.listeningProgress || {};
  result.listeningProgress = {};
  for (const exerciseId of new Set([...Object.keys(localListening), ...Object.keys(remoteListening)])) {
    const a = localListening[exerciseId] || {}, b = remoteListening[exerciseId] || {};
    const attemptsById = new Map<string, AnyRecord>();
    for (const attempt of [...(Array.isArray(a.attempts) ? a.attempts : []), ...(Array.isArray(b.attempts) ? b.attempts : [])]) {
      if (!attempt || typeof attempt.attemptId !== "string" || !Number.isInteger(attempt.score) || !Number.isInteger(attempt.total)) continue;
      const previous = attemptsById.get(attempt.attemptId);
      const previousTime = Date.parse(previous?.completedAt || "") || 0;
      const attemptTime = Date.parse(attempt.completedAt || "") || 0;
      if (!previous || attemptTime >= previousTime) attemptsById.set(attempt.attemptId, attempt);
    }
    const attempts = Array.from(attemptsById.values())
      .sort((x, y) => String(x.completedAt || "").localeCompare(String(y.completedAt || "")))
      .slice(-100);
    const completionDates = [a.completedAt, b.completedAt, ...attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.completedAt)]
      .filter((value) => typeof value === "string").sort();
    const updateTimes = [Date.parse(a.updatedAt || "") || 0, Date.parse(b.updatedAt || "") || 0];
    result.listeningProgress[exerciseId] = {
      attempts,
      bestScore: Math.max(Number(a.bestScore) || 0, Number(b.bestScore) || 0, ...attempts.map((attempt) => Number(attempt.score) || 0)),
      completedAt: completionDates[0] || null,
      updatedAt: new Date(Math.max(...updateTimes) || Date.now()).toISOString(),
    };
  }

  const localDialogues = local.dialogueProgress || {}, remoteDialogues = remote.dialogueProgress || {};
  result.dialogueProgress = {};
  for (const dialogueId of new Set([...Object.keys(localDialogues), ...Object.keys(remoteDialogues)])) {
    const a = localDialogues[dialogueId] || {}, b = remoteDialogues[dialogueId] || {};
    const attemptsById = new Map<string, AnyRecord>();
    for (const attempt of [...(Array.isArray(a.attempts) ? a.attempts : []), ...(Array.isArray(b.attempts) ? b.attempts : [])]) {
      if (!attempt || typeof attempt.attemptId !== "string" || !Number.isInteger(attempt.score) || !Number.isInteger(attempt.total)) continue;
      const previous = attemptsById.get(attempt.attemptId);
      const previousTime = Date.parse(previous?.completedAt || "") || 0;
      const attemptTime = Date.parse(attempt.completedAt || "") || 0;
      if (!previous || attemptTime >= previousTime) attemptsById.set(attempt.attemptId, attempt);
    }
    const attempts = Array.from(attemptsById.values())
      .sort((x, y) => String(x.completedAt || "").localeCompare(String(y.completedAt || "")))
      .slice(-100);
    const completionDates = [a.completedAt, b.completedAt, ...attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.completedAt)]
      .filter((value) => typeof value === "string").sort();
    const updateTimes = [Date.parse(a.updatedAt || "") || 0, Date.parse(b.updatedAt || "") || 0];
    result.dialogueProgress[dialogueId] = {
      attempts,
      bestScore: Math.max(Number(a.bestScore) || 0, Number(b.bestScore) || 0, ...attempts.map((attempt) => Number(attempt.score) || 0)),
      completedAt: completionDates[0] || null,
      updatedAt: new Date(Math.max(...updateTimes) || Date.now()).toISOString(),
    };
  }


  const localPronunciation = local.pronunciationProgress || {}, remotePronunciation = remote.pronunciationProgress || {};
  result.pronunciationProgress = {};
  for (const phraseId of new Set([...Object.keys(localPronunciation), ...Object.keys(remotePronunciation)])) {
    const a = localPronunciation[phraseId] || {}, b = remotePronunciation[phraseId] || {};
    const attemptsById = new Map<string, AnyRecord>();
    for (const attempt of [...(Array.isArray(a.attempts) ? a.attempts : []), ...(Array.isArray(b.attempts) ? b.attempts : [])]) {
      if (!attempt || typeof attempt.attemptId !== "string" || typeof attempt.completedAt !== "string"
        || !Number.isFinite(attempt.durationMs) || !Number.isFinite(attempt.voiceShare)) continue;
      attemptsById.set(attempt.attemptId, {
        attemptId: attempt.attemptId.slice(0, 140),
        completedAt: attempt.completedAt,
        durationMs: Math.max(0, Math.min(12000, Number(attempt.durationMs) || 0)),
        voiceShare: Math.max(0, Math.min(1, Number(attempt.voiceShare) || 0)),
        voicedFrames: Math.max(0, Math.min(200, Math.trunc(Number(attempt.voicedFrames) || 0))),
        meanRms: Math.max(0, Math.min(1, Number(attempt.meanRms) || 0)),
        pauseCount: Math.max(0, Math.min(30, Math.trunc(Number(attempt.pauseCount) || 0))),
        pitchMedian: Number.isFinite(attempt.pitchMedian) ? Math.max(60, Math.min(400, Number(attempt.pitchMedian))) : null,
        pitchRangeSemitones: Number.isFinite(attempt.pitchRangeSemitones) ? Math.max(0, Math.min(24, Number(attempt.pitchRangeSemitones))) : null,
      });
    }
    const attempts = Array.from(attemptsById.values())
      .sort((x, y) => String(x.completedAt || "").localeCompare(String(y.completedAt || "")))
      .slice(-50);
    const updateTimes = [Date.parse(a.updatedAt || "") || 0, Date.parse(b.updatedAt || "") || 0];
    result.pronunciationProgress[phraseId] = {
      attempts,
      updatedAt: new Date(Math.max(...updateTimes) || Date.now()).toISOString(),
    };
  }

  result.achievementIds = Array.from(new Set([...(local.achievementIds || []), ...(remote.achievementIds || [])]));
  result.updatedAt = new Date(Math.max(Date.parse(local.updatedAt || "") || 0, Date.parse(remote.updatedAt || "") || 0) || Date.now()).toISOString();
  return result;
}

function mergeHabitProgress(local: AnyRecord = {}, remote: AnyRecord = {}): AnyRecord {
  const result: AnyRecord = { ...local, ...remote };
  result.readCount = Math.max(Number(local.readCount) || 0, Number(remote.readCount) || 0);
  result.completedPassages = Array.from(new Set([...(local.completedPassages || []), ...(remote.completedPassages || [])]));
  result.passageStats = {};
  const localStats = local.passageStats || {}, remoteStats = remote.passageStats || {};
  const allPassages = new Set([...Object.keys(localStats), ...Object.keys(remoteStats)]);
  for (const id of allPassages) {
    const a = localStats[id] || {}, b = remoteStats[id] || {};
    result.passageStats[id] = {
      ...a,
      ...b,
      readCount: Math.max(Number(a.readCount) || 0, Number(b.readCount) || 0),
      completedAt: earliestIso(a.completedAt, b.completedAt),
      lastReadAt: [a.lastReadAt, b.lastReadAt].filter(Boolean).sort().reverse()[0] || null,
      quizAttempts: mergeArrays(a.quizAttempts || [], b.quizAttempts || []),
      comprehensionAnswers: { ...(a.comprehensionAnswers || {}), ...(b.comprehensionAnswers || {}) },
    };
  }
  return result;
}

function mergeExtraLearning(local: AnyRecord = {}, remote: AnyRecord = {}): AnyRecord {
  const result: AnyRecord = { ...local, ...remote };
  const moduleKeys = ["readingProgress", "readingLessonProgress", "listeningProgress", "pronunciationProgress", "speakingProgress", "writingProgress"];
  for (const mod of moduleKeys) {
    const aMod = local[mod] || {}, bMod = remote[mod] || {};
    result[mod] = {};
    for (const id of new Set([...Object.keys(aMod), ...Object.keys(bMod)])) {
      const a = aMod[id] || {}, b = bMod[id] || {};
      result[mod][id] = {
        ...a,
        ...b,
        completedAt: earliestIso(a.completedAt, b.completedAt),
        attempts: mergeArrays(a.attempts || [], b.attempts || []),
      };
    }
  }
  return result;
}

function mergePreferences(local: AnyRecord = {}, remote: AnyRecord = {}): AnyRecord {
  return {
    ...local,
    ...remote,
    characterVoices: { ...(local.characterVoices || {}), ...(remote.characterVoices || {}) },
  };
}

function mergeStudioDrafts(local: AnyRecord = {}, remote: AnyRecord = {}): AnyRecord {
  const result: AnyRecord = {
    speaking: { selectedPromptId: "first-introduction", prompts: {} },
    writing: { selectedPromptId: "short-introduction", prompts: {} },
  };
  for (const kind of ["speaking", "writing"] as const) {
    const locKind = local[kind] || {};
    const remKind = remote[kind] || {};
    result[kind].selectedPromptId = remKind.selectedPromptId || locKind.selectedPromptId || result[kind].selectedPromptId;
    const allPrompts = new Set([...Object.keys(locKind.prompts || {}), ...Object.keys(remKind.prompts || {})]);
    for (const pId of allPrompts) {
      const a = locKind.prompts?.[pId];
      const b = remKind.prompts?.[pId];
      if (!a) { result[kind].prompts[pId] = b; continue; }
      if (!b) { result[kind].prompts[pId] = a; continue; }
      const aTime = Date.parse(a.updatedAt || a.completedAt || "") || 0;
      const bTime = Date.parse(b.updatedAt || b.completedAt || "") || 0;
      const hasContent = (d: any) => Boolean((d && typeof d.text === "string" && d.text.trim()) || (d && typeof d.revision === "string" && d.revision.trim()) || (d && Array.isArray(d.checked) && d.checked.length > 0) || (d && d.plan && (d.plan.opening || d.plan.detail || d.plan.closing)));
      const newer = bTime >= aTime ? b : a;
      const older = bTime >= aTime ? a : b;
      const chosen = hasContent(newer) ? newer : (hasContent(older) ? older : newer);
      result[kind].prompts[pId] = {
        ...older,
        ...chosen,
        checked: Array.from(new Set([...(a.checked || []), ...(b.checked || [])])).sort(),
        turnIndex: Math.max(Number(a.turnIndex) || 0, Number(b.turnIndex) || 0),
        updatedAt: new Date(Math.max(aTime, bTime) || Date.now()).toISOString(),
      };
    }
  }
  return result;
}

function mergeBundles(local: CloudBundle, remote: CloudBundle): CloudBundle {
  const extras: CloudBundle["extras"] = {
    extraLearning: mergeExtraLearning(local.extras?.extraLearning, remote.extras?.extraLearning),
    habitProgress: mergeHabitProgress(local.extras?.habitProgress, remote.extras?.habitProgress),
    adventureProgress: mergeAdventureProgress(local.extras?.adventureProgress, remote.extras?.adventureProgress),
    studioDrafts: mergeStudioDrafts(local.extras?.studioDrafts, remote.extras?.studioDrafts),
    preferences: mergePreferences(local.extras?.preferences, remote.extras?.preferences),
  };
  return { schemaVersion: 2, core: mergeCore(local.core, remote.core), extras };
}

function isVercelPreviewDeployment(): boolean {
  const host = window.location.hostname.toLowerCase();
  return host.endsWith(".vercel.app") && !PREVIEW_DISABLED_CLOUD_HOSTS.has(host);
}

function setMessage(message: string, kind: "info" | "success" | "error" = "info"): void {
  const status = $("#account-status") as HTMLElement | null;
  if (status) { status.textContent = message; status.dataset.kind = kind; }
}

function setSyncBadge(label: string, state: "idle" | "syncing" | "success" | "error" = "idle"): void {
  const badge = $("#cloud-sync-badge") as HTMLElement | null;
  if (badge) { badge.textContent = label; badge.dataset.state = state; }
}

function setSession(next: AuthSession | null): void {
  const oldUserId = session?.user?.id || null;
  const nextUserId = next?.user?.id || null;
  if (oldUserId !== nextUserId) {
    sessionEpoch += 1;
    lastCloudRevision = null;
    syncConflict = false;
  }
  session = next;
  try { if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next)); else localStorage.removeItem(SESSION_KEY); } catch { /* This open tab keeps its in-memory session. */ }
  renderAccount();
}

async function authRequest(path: string, options: RequestInit = {}, bearer?: string): Promise<any> {
  const grantType = new URLSearchParams(path.split("?")[1] || "").get("grant_type");
  const method = String(options.method || "POST").toUpperCase();
  let action = "status";
  if (path.startsWith("/signup")) action = "signup";
  else if (path.startsWith("/token")) action = grantType === "password" ? "login" : "refresh";
  else if (path.startsWith("/user")) action = method === "PUT" ? "change-password" : "me";
  else if (path.startsWith("/logout")) action = "logout";
  else if (path.startsWith("/recover")) action = "recover";
  const headers = new Headers({ "Content-Type": "application/json" });
  if (bearer) headers.set("Authorization", "Bearer " + bearer);
  const response = await fetch("/api/account?action=" + encodeURIComponent(action), {
    method: method === "GET" ? "GET" : "POST",
    headers,
    ...(options.body ? { body: options.body } : {}),
    credentials: "same-origin",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.msg || "Permintaan akun gagal. Periksa konfigurasi Google Sheets di Vercel.");
  return body;
}
function toSession(data: any): AuthSession | null {
  if (!data?.access_token || !data?.refresh_token || !data?.user?.id) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
    expires_in: data.expires_in,
    token_type: data.token_type || "bearer",
    user: data.user,
  };
}

async function currentSession(): Promise<AuthSession | null> {
  if (!session) return null;
  if (session.expires_at && session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;
  if (!session.refresh_token) { setSession(null); return null; }
  const body = await authRequest("/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) });
  const next = toSession(body);
  if (!next) throw new Error("Sesi berakhir. Silakan masuk lagi.");
  setSession(next);
  return next;
}

async function cloudRequest(path: string, options: RequestInit = {}): Promise<any> {
  let active = await currentSession();
  if (!active) throw new Error("Masuk terlebih dahulu untuk menyinkronkan progres.");
  const run = (token: string) => fetch("/api/progress", {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
  });
  let response = await run(active.access_token);
  if (response.status === 401 && active.refresh_token) {
    setSession({ ...active, expires_at: 0 });
    active = await currentSession();
    if (!active) throw new Error("Sesi berakhir. Silakan masuk lagi.");
    response = await run(active.access_token);
  }
  const text = await response.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) {
    if (response.status === 409) {
      const conflictError = new Error(body?.message || "Progres akun berubah dari perangkat lain. Perubahan ini belum tersimpan. Muat progres terbaru sebelum melanjutkan sinkronisasi.");
      (conflictError as any).status = 409;
      (conflictError as any).code = body?.code || "REVISION_CONFLICT";
      (conflictError as any).currentRevision = body?.currentRevision;
      throw conflictError;
    }
    const message = body && typeof body === "object" ? body.message : "";
    throw new Error(message || "Sinkronisasi Google Sheets gagal (" + response.status + "). Progres lokal tetap tersimpan.");
  }
  return body;
}

async function readCloudBundle(): Promise<{ bundle: CloudBundle; revision: number } | null> {
  if (!session) return null;
  const rows = await cloudRequest("/user_learning_states?select=state,updated_at,revision&user_id=eq." + encodeURIComponent(session.user.id) + "&limit=1", { method: "GET" });
  if (!Array.isArray(rows) || !rows.length) return null;
  const bundle = normalizeBundle(rows[0].state);
  const revision = typeof rows[0].revision === "number" ? rows[0].revision : 0;
  return { bundle, revision };
}

type PendingSaveOperation = {
  operationId: string;
  baseRevision: number;
  payloadDigest: string;
};
let pendingSaveOp: PendingSaveOperation | null = null;

async function writeCloudBundle(bundle: CloudBundle): Promise<{ revision: number }> {
  if (!session) throw new Error("Masuk terlebih dahulu untuk menyinkronkan progres.");
  const serialized = JSON.stringify(bundle);
  const baseRev = lastCloudRevision ?? 0;

  // Stable operation identity: keep same operationId across retries of the same pending save intent
  let opId: string;
  if (pendingSaveOp && pendingSaveOp.baseRevision === baseRev && pendingSaveOp.payloadDigest === serialized) {
    opId = pendingSaveOp.operationId;
  } else {
    opId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      ? crypto.randomUUID()
      : ("10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
          (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        ));
    pendingSaveOp = {
      operationId: opId,
      baseRevision: baseRev,
      payloadDigest: serialized,
    };
  }

  try {
    const res = await cloudRequest("/user_learning_states?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{
        user_id: session.user.id,
        state: bundle,
        updated_at: new Date().toISOString(),
        baseRevision: baseRev,
        operationId: opId,
      }]),
    });
    const newRev = typeof res?.revision === "number" ? res.revision : (baseRev + 1);
    lastCloudRevision = newRev;
    pendingSaveOp = null; // Confirmed commit clears pending operation
    syncConflict = false;
    return { revision: newRev };
  } catch (err: any) {
    // If definite revision conflict, clear pending operation to prevent retrying stale revision
    if (err?.status === 409 || err?.code === "REVISION_CONFLICT") {
      pendingSaveOp = null;
      syncConflict = true;
    }
    throw err;
  }
}

async function reloadLatestCloudProgress(): Promise<boolean> {
  if (!session || syncing) return false;
  syncing = true;
  setSyncBadge("Memuat cloud…", "syncing");
  setMessage("Memuat progres terbaru dari cloud…", "info");
  try {
    const remoteData = await readCloudBundle();
    if (!remoteData || !remoteData.bundle) {
      setMessage("Tidak ditemukan data progres di cloud.", "info");
      syncConflict = false;
      setSyncBadge("Tersimpan di perangkat", "idle");
      renderAccount();
      return true;
    }
    lastCloudRevision = remoteData.revision;
    syncConflict = false;
    pendingSaveOp = null;
    isCloudVerified = true;
    await applyLocalBundle(remoteData.bundle);
    try {
      localStorage.setItem(OWNER_KEY, session.user.id);
    } catch { /* Local account metadata */ }
    lastSuccessfulSync = new Date().toISOString();
    setSyncBadge("Tersinkron", "success");
    setMessage("Progres terbaru (revisi " + remoteData.revision + ") berhasil dimuat. Siap melanjutkan belajar.", "success");
    renderAccount();
    return true;
  } catch (err: any) {
    setMessage("Gagal memuat progres dari cloud: " + (err.message || String(err)), "error");
    setSyncBadge("Gagal memuat", "error");
    return false;
  } finally {
    syncing = false;
  }
}

async function prepareLocalForAccount(): Promise<void> {
  if (!session) return;
  let owner: string | null = null;
  try { owner = localStorage.getItem(OWNER_KEY); } catch { owner = null; }
  if (!owner || owner === session.user.id) return;
  const next = {
    schemaVersion: 2 as const,
    core: freshCore(),
    extras: {
      extraLearning: {},
      habitProgress: {},
      adventureProgress: {},
      studioDrafts: {
        speaking: { selectedPromptId: "first-introduction", prompts: {} },
        writing: { selectedPromptId: "short-introduction", prompts: {} },
      },
    },
  };
  await applyLocalBundle(next);
}

const OFFLINE_QUEUE_KEY = "sinauu-offline-sync-queue-v1";

type QueuedSync = {
  id: string;
  userId: string;
  timestamp: string;
  bundle: CloudBundle;
  attempts: number;
};

function readOfflineQueue(): QueuedSync[] {
  return parseStored<QueuedSync[]>(OFFLINE_QUEUE_KEY, []);
}

function clearOfflineQueue(userId: string): void {
  try {
    const queue = readOfflineQueue().filter(q => q.userId !== userId);
    if (queue.length) localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-20)));
    else localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (_) {}
}

let cleanupPending = false;
let syncDirty = false;

function hasLegacyProgress(userId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  const legacyKeys = [
    CORE_FALLBACK,
    EXTRA_KEY,
    HABIT_KEY,
    ADVENTURE_KEY,
    "sinauu-placement-check-v1",
    "sinauu-placement-result-v1",
    "sinauu-adventure-studio-drafts-v1:" + encodeURIComponent(userId),
    "sinauu-adventure-studio-drafts-v1:local",
    ACCOUNT_CACHE_PREFIX + userId,
  ];
  const hasKey = legacyKeys.some((key) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null && val !== "" && val !== "null" && val !== "{}";
    } catch { return false; }
  });
  if (hasKey) return true;
  try {
    const queue = readOfflineQueue();
    if (queue.some(q => q && q.userId === userId)) return true;
  } catch { return false; }
  return false;
}

async function collectLegacyBundle(userId: string): Promise<CloudBundle | null> {
  let core: AnyRecord | null = null;
  try { core = await readIndexedDbState(); } catch { core = null; }
  if (!core) {
    try { core = JSON.parse(localStorage.getItem(CORE_FALLBACK) || "null") as AnyRecord | null; }
    catch { core = null; }
  }
  const placementRaw = parseStored<AnyRecord | null>("sinauu-placement-check-v1", null)
    || parseStored<AnyRecord | null>("sinauu-placement-result-v1", null);

  const base = core || { ...freshCore(), updatedAt: "" };
  if (placementRaw && !base.placementResult) {
    base.placementResult = placementRaw;
  }

  const extras: CloudBundle["extras"] = {
    extraLearning: parseStored<AnyRecord>(EXTRA_KEY, {}),
    habitProgress: parseStored<AnyRecord>(HABIT_KEY, {}),
    adventureProgress: parseStored<AnyRecord>(ADVENTURE_KEY, {}),
    studioDrafts: parseStored<AnyRecord | null>("sinauu-adventure-studio-drafts-v1:" + encodeURIComponent(userId), null)
      || parseStored<AnyRecord | null>("sinauu-adventure-studio-drafts-v1:local", null)
      || localStudioDrafts(),
  };

  let candidate = normalizeBundle({ core: base, extras });

  // Merge account-specific cache if present
  try {
    const cached = parseStored<AnyRecord | null>(ACCOUNT_CACHE_PREFIX + userId, null);
    if (cached) {
      if (cached.bundle) {
        candidate = mergeBundles(candidate, normalizeBundle(cached.bundle));
      } else if (cached.core || cached.extras) {
        candidate = mergeBundles(candidate, normalizeBundle(cached));
      }
    }
  } catch (_) {}

  // Merge user's queued offline changes in chronological order
  try {
    const queuedItems = readOfflineQueue()
      .filter(q => q && q.userId === userId)
      .sort((a, b) => (parseTime(a.timestamp) || 0) - (parseTime(b.timestamp) || 0));
    for (const q of queuedItems) {
      if (q.bundle) {
        candidate = mergeBundles(candidate, normalizeBundle(q.bundle));
      }
    }
  } catch (_) {}

  return candidate;
}

function isSafeToMigrate(userId: string): boolean {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (!owner || owner === "local" || owner === userId) return true;
    return false; // Stored data belongs to another user
  } catch { return true; }
}

async function purgeLegacyStorage(userId: string): Promise<{ complete: boolean }> {
  const keysToRemove = [
    CORE_FALLBACK,
    EXTRA_KEY,
    HABIT_KEY,
    ADVENTURE_KEY,
    "sinauu-placement-check-v1",
    "sinauu-placement-result-v1",
    "sinauu-adventure-studio-drafts-v1:" + encodeURIComponent(userId),
    "sinauu-adventure-studio-drafts-v1:local",
    ACCOUNT_CACHE_PREFIX + userId,
  ];
  for (const key of keysToRemove) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  // Clear offline queue for this specific user only; do not delete other users' queues
  clearOfflineQueue(userId);

  // Clear IndexedDB state and track completion status
  const idbCleared = await clearIndexedDbState();
  cleanupPending = !idbCleared;
  return { complete: idbCleared };
}

function verifyBundleDataIncluded(candidate: CloudBundle, cloud: CloudBundle): { ok: boolean; reason?: string } {
  if (!cloud || !cloud.core) {
    return { ok: false, reason: "Cloud bundle atau core tidak valid." };
  }

  // 1. Core wordProgress
  const candWords = candidate.core?.wordProgress || {};
  const cloudWords = cloud.core?.wordProgress || {};
  for (const id of Object.keys(candWords)) {
    const cw = candWords[id];
    if (!cw) continue;
    const rw = cloudWords[id];
    if (!rw) {
      return { ok: false, reason: `Kosakata '${id}' tidak ditemukan di cloud readback.` };
    }
    if (cw.skillEvidence?.recall && !rw.skillEvidence?.recall) {
      return { ok: false, reason: `Bukti recall kosakata '${id}' hilang dari cloud readback.` };
    }
    if (cw.skillEvidence?.context && !rw.skillEvidence?.context) {
      return { ok: false, reason: `Bukti konteks kosakata '${id}' hilang dari cloud readback.` };
    }
    if (cw.skillEvidence?.production && !rw.skillEvidence?.production) {
      return { ok: false, reason: `Bukti produksi kosakata '${id}' hilang dari cloud readback.` };
    }
    if (Array.isArray(cw.reviewDates)) {
      const rwDates = new Set(Array.isArray(rw.reviewDates) ? rw.reviewDates : []);
      const rwHistDates = new Set(Array.isArray(rw.reviewHistory) ? rw.reviewHistory.map((h: any) => h?.date).filter(Boolean) : []);
      for (const d of cw.reviewDates) {
        if (!rwDates.has(d) && !rwHistDates.has(d)) {
          return { ok: false, reason: `Tanggal review '${d}' untuk kosakata '${id}' hilang dari cloud.` };
        }
      }
    }
    if (Array.isArray(cw.studiedDates)) {
      const rwStudied = new Set(Array.isArray(rw.studiedDates) ? rw.studiedDates : []);
      for (const d of cw.studiedDates) {
        if (!rwStudied.has(d)) {
          return { ok: false, reason: `Tanggal belajar '${d}' untuk kosakata '${id}' hilang dari cloud.` };
        }
      }
    }
  }

  // 2. Favorites
  if (Array.isArray(candidate.core?.favorites)) {
    const cloudFavs = new Set(Array.isArray(cloud.core?.favorites) ? cloud.core.favorites : []);
    for (const f of candidate.core.favorites) {
      if (!cloudFavs.has(f)) {
        return { ok: false, reason: `Favorit '${f}' tidak ditemukan di cloud readback.` };
      }
    }
  }

  // 3. Grammar topics
  const candGrammar = candidate.core?.grammarProgress || {};
  const cloudGrammar = cloud.core?.grammarProgress || {};
  for (const tid of Object.keys(candGrammar)) {
    const cg = candGrammar[tid];
    if (!cg) continue;
    const rg = cloudGrammar[tid];
    if (!rg) {
      return { ok: false, reason: `Topik grammar '${tid}' tidak ditemukan di cloud readback.` };
    }
    if (cg.answers && typeof cg.answers === "object") {
      const rgAnswers = rg.answers || {};
      for (const qKey of Object.keys(cg.answers)) {
        if (rgAnswers[qKey] === undefined) {
          return { ok: false, reason: `Jawaban soal '${qKey}' pada topik '${tid}' tidak ditemukan di cloud.` };
        }
      }
    }
  }

  // 4. Placement result
  if (candidate.core?.placementResult) {
    if (!cloud.core?.placementResult) {
      return { ok: false, reason: "Hasil tes penempatan (placement check) tidak ditemukan di cloud readback." };
    }
  }

  // 5. Studio Drafts
  const candDrafts = candidate.extras?.studioDrafts;
  const cloudDrafts = cloud.extras?.studioDrafts;
  if (candDrafts?.writing?.prompts) {
    const candPrompts = candDrafts.writing.prompts;
    const cloudPrompts = cloudDrafts?.writing?.prompts || {};
    for (const pId of Object.keys(candPrompts)) {
      const cp = candPrompts[pId];
      if (cp && (cp.text || cp.revision)) {
        const rp = cloudPrompts[pId];
        if (!rp || (!rp.text && !rp.revision)) {
          return { ok: false, reason: `Draft writing prompt '${pId}' hilang dari cloud readback.` };
        }
      }
    }
  }
  if (candDrafts?.speaking?.prompts) {
    const candSpeaking = candDrafts.speaking.prompts;
    const cloudSpeaking = cloudDrafts?.speaking?.prompts || {};
    for (const pId of Object.keys(candSpeaking)) {
      const cs = candSpeaking[pId];
      if (cs && Array.isArray(cs.turns) && cs.turns.length > 0) {
        const rs = cloudSpeaking[pId];
        if (!rs || !Array.isArray(rs.turns) || rs.turns.length === 0) {
          return { ok: false, reason: `Draft speaking prompt '${pId}' hilang dari cloud readback.` };
        }
      }
    }
  }

  // 6. Habit reading passages
  const candHabit = candidate.extras?.habitProgress?.readingPassages;
  const cloudHabit = cloud.extras?.habitProgress?.readingPassages || {};
  if (candHabit && typeof candHabit === "object") {
    for (const pId of Object.keys(candHabit)) {
      const cp = candHabit[pId];
      if (cp?.completed) {
        const rp = cloudHabit[pId];
        if (!rp?.completed) {
          return { ok: false, reason: `Selesai baca habit '${pId}' hilang dari cloud readback.` };
        }
      }
    }
  }

  // 7. Adventure missions
  const candMissions = candidate.extras?.adventureProgress?.missions;
  const cloudMissions = cloud.extras?.adventureProgress?.missions || {};
  if (candMissions && typeof candMissions === "object") {
    for (const mId of Object.keys(candMissions)) {
      const cm = candMissions[mId];
      if (cm?.completed) {
        const rm = cloudMissions[mId];
        if (!rm?.completed) {
          return { ok: false, reason: `Misi adventure '${mId}' hilang dari cloud readback.` };
        }
      }
    }
  }

  // 8. Mistake journal
  const candMistakes = candidate.extras?.extraLearning?.mistakeJournal;
  const cloudMistakes = cloud.extras?.extraLearning?.mistakeJournal || {};
  if (candMistakes && typeof candMistakes === "object") {
    for (const mId of Object.keys(candMistakes)) {
      if (!cloudMistakes[mId]) {
        return { ok: false, reason: `Mistake '${mId}' hilang dari cloud readback.` };
      }
    }
  }

  return { ok: true };
}

async function migrateLegacyDataIfNeeded(userId: string): Promise<{ migrated: boolean; success: boolean }> {
  if (!session || session.user.id !== userId) return { migrated: false, success: false };
  if (!isSafeToMigrate(userId)) {
    return { migrated: false, success: true };
  }

  const hasLocal = hasLegacyProgress(userId);
  let idbHasState = false;
  try {
    const idbState = await readIndexedDbState();
    idbHasState = Boolean(idbState && Object.keys(idbState.wordProgress || {}).length > 0);
  } catch { idbHasState = false; }

  if (!hasLocal && !idbHasState) {
    return { migrated: false, success: true };
  }

  setMessage("Memigrasikan data belajar lokal ke cloud…", "info");
  setSyncBadge("Migrasi data…", "syncing");

  try {
    const localCandidate = await collectLegacyBundle(userId);
    if (!localCandidate) return { migrated: false, success: false };

    // Fetch remote cloud bundle
    const remoteData = await readCloudBundle();
    const remote = remoteData?.bundle || null;
    const baseRev = remoteData?.revision ?? 0;
    lastCloudRevision = baseRev;

    // Merge local candidate with remote
    const merged = remote ? mergeBundles(localCandidate, remote) : localCandidate;

    // Upload to cloud
    const writeResult = await writeCloudBundle(merged);

    // Verification readback
    const readback = await readCloudBundle();
    if (!readback || !readback.bundle) {
      throw new Error("Verifikasi pembacaan ulang cloud gagal: data tidak ditemukan.");
    }
    if (readback.revision < writeResult.revision) {
      throw new Error(`Verifikasi pembacaan ulang cloud gagal: revisi tidak sesuai (${readback.revision} < ${writeResult.revision}).`);
    }

    // Verify all candidate records are represented in cloud before local deletion
    const verification = verifyBundleDataIncluded(localCandidate, readback.bundle);
    if (!verification.ok) {
      throw new Error("Verifikasi integritas data cloud gagal: " + verification.reason);
    }

    // Verification SUCCESSFUL: now and only now purge legacy storage
    await purgeLegacyStorage(userId);
    isCloudVerified = true;
    lastCloudRevision = readback.revision;
    await applyLocalBundle(readback.bundle);

    lastSuccessfulSync = new Date().toISOString();
    setSyncBadge("Tersinkron", "success");
    setMessage("Progres berhasil dimigrasikan ke cloud Google Sheets.", "success");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-success"));
    return { migrated: true, success: true };
  } catch (err: any) {
    // Verification or write failed: RETAIN all local data!
    setSyncBadge("Migrasi tertunda", "error");
    setMessage("Gagal memigrasikan data ke cloud: " + (err.message || String(err)) + ". Progres lokal dipertahankan.", "error");
    return { migrated: true, success: false };
  }
}

async function syncNow(allowWhileSigningOut = false): Promise<boolean> {
  if (isVercelPreviewDeployment()) {
    setSyncBadge("Preview · lokal", "idle");
    setMessage("Mode preview: progres hanya disimpan di browser ini dan tidak ditulis ke Google Sheets.", "info");
    return true;
  }
  if (!CLOUD_READY || !session || (signingOut && !allowWhileSigningOut)) return false;
  if (syncing) {
    syncDirty = true;
    return false;
  }
  if (syncConflict && !allowWhileSigningOut) {
    setSyncBadge("Konflik revisi", "error");
    setMessage("Progres akun berubah dari perangkat lain. Perubahan ini belum tersimpan. Muat progres terbaru sebelum melanjutkan sinkronisasi.", "error");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-conflict"));
    return false;
  }

  if (!navigator.onLine) {
    setSyncBadge("Offline · Menunggu internet", "idle");
    setMessage("Offline: perubahan tersimpan di memori browser ini dan akan disinkronkan saat terhubung kembali.", "info");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-offline"));
    return false;
  }

  const syncUserId = session.user.id;
  const syncEpoch = sessionEpoch;
  const stillSameAccount = () => Boolean(session && session.user.id === syncUserId && sessionEpoch === syncEpoch);
  syncing = true;
  setSyncBadge("Menyinkronkan…", "syncing");
  window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-syncing"));

  try {
    await prepareLocalForAccount();
    if (!stillSameAccount()) return false;
    let local = await readLocalBundle();

    // Drain legacy queued offline changes if any
    const queued = readOfflineQueue().filter(q => q.userId === syncUserId);
    if (queued.length > 0) {
      for (const item of queued) {
        local = mergeBundles(local, item.bundle);
      }
    }

    const remoteData = await readCloudBundle();
    if (!stillSameAccount()) return false;
    const remote = remoteData?.bundle || null;
    if (remoteData) {
      lastCloudRevision = remoteData.revision;
    }

    let merged = remote ? mergeBundles(local, remote) : local;
    if (!remote || stable(merged) !== stable(remote)) {
      await writeCloudBundle(merged);
    }
    if (!stillSameAccount()) return false;

    // Incorporate in-flight dirty changes if edits arrived during the write
    if (syncDirty) {
      const currentLocal = await readLocalBundle();
      merged = mergeBundles(currentLocal, merged);
    }

    if (stable(merged) !== stable(local)) {
      await applyLocalBundle(merged);
    }
    if (!stillSameAccount()) return false;

    clearOfflineQueue(syncUserId);

    try {
      localStorage.setItem(OWNER_KEY, session.user.id);
    } catch { /* Local account owner metadata */ }

    lastSuccessfulSync = new Date().toISOString();
    syncConflict = false;
    isCloudVerified = true;
    setSyncBadge("Tersinkron", "success");
    setMessage("Progres tersinkron pada " + new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSuccessfulSync)) + ". Kamu bisa lanjut di perangkat lain.", "success");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-success"));
    renderAccount();
    return true;
  } catch (error: any) {
    if (error?.status === 409 || error?.code === "REVISION_CONFLICT") {
      syncConflict = true;
      setSyncBadge("Konflik revisi", "error");
      setMessage("Progres akun berubah dari perangkat lain. Perubahan ini belum tersimpan. Muat progres terbaru sebelum melanjutkan sinkronisasi.", "error");
      window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-conflict"));
      renderAccount();
      return false;
    }
    setSyncBadge("Belum tersinkron · Coba lagi", "error");
    setMessage(error instanceof Error ? error.message : "Sinkronisasi belum berhasil. Progres di memori tetap dipertahankan.", "error");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-error"));
    return false;
  } finally {
    syncing = false;
    if (syncDirty && session && !signingOut && !syncConflict && navigator.onLine) {
      syncDirty = false;
      window.setTimeout(() => void syncNow(), 50);
    }
  }
}

function scheduleSync(): void {
  if (isVercelPreviewDeployment() || !session || !CLOUD_READY || applyingCloud || signingOut || syncConflict) return;
  if (syncing) {
    syncDirty = true;
    setSyncBadge(navigator.onLine ? "Menunggu sinkronisasi" : "Menunggu internet", navigator.onLine ? "syncing" : "error");
    window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-waiting"));
    return;
  }
  setSyncBadge(navigator.onLine ? "Ada perubahan" : "Menunggu internet", navigator.onLine ? "syncing" : "error");
  window.dispatchEvent(new CustomEvent("sinauu:cloud-sync-waiting"));
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => void syncNow(), 900);
}

function modalMarkup(): string {
  return `
    <dialog class="account-dialog" id="account-dialog" aria-labelledby="account-title">
      <div class="account-dialog-inner">
        <div class="account-dialog-top">
          <div><span class="eyebrow">SINAUUENGLISH / AKUN</span><h2 id="account-title">Belajar dari perangkat mana pun.</h2></div>
          <button class="account-close" type="button" data-account-close aria-label="Tutup dialog akun">×</button>
        </div>
        <p class="account-dialog-lede">Simpan progres ke akunmu agar kosakata, latihan, dan bacaan tetap nyambung di HP maupun laptop.</p>
        <div class="account-config-notice" id="account-config-notice" hidden>
          <strong>Akun cloud belum diaktifkan.</strong>
          <p>Fitur ini memakai Google Sheets sebagai database akun dan progres. Siapkan spreadsheet dengan tab Accounts dan LearningStates, service account Google Cloud, lalu isi variabel server di Vercel. Panduan lengkap ada di GitHub.</p>
          <a href="https://github.com/riiddev/testesaja/blob/main/docs/ACCOUNT-SYNC-SETUP.md" target="_blank" rel="noreferrer">Buka panduan konfigurasi ↗</a>
        </div>
        <div class="account-auth-panel" id="account-auth-panel">
          <div class="account-mode-switch" role="tablist" aria-label="Masuk atau daftar">
            <button type="button" class="is-active" data-account-mode="signin" role="tab" aria-selected="true">Masuk</button>
            <button type="button" data-account-mode="signup" role="tab" aria-selected="false">Buat akun</button>
          </div>
          <form class="account-form" id="account-form">
            <label for="account-email">Email</label>
            <input id="account-email" type="email" name="email" autocomplete="email" placeholder="kamu@email.com" required>
            <label for="account-password">Kata sandi</label>
            <input id="account-password" type="password" name="password" autocomplete="current-password" minlength="8" placeholder="Minimal 8 karakter" required>
            <p class="account-password-note" id="account-password-note">Gunakan kata sandi yang kuat dan tidak dipakai di akun lain.</p>
            <button class="account-submit" id="account-submit" type="submit">Masuk ke akun ↗</button>
          </form>
          <div class="account-form-extra"><button type="button" id="account-reset">Lupa kata sandi?</button><span>Progres yang sudah ada di perangkat ini akan digabungkan, bukan langsung dihapus.</span></div>
        </div>
        <div class="account-signed-in" id="account-signed-in" hidden>
          <div class="account-avatar" aria-hidden="true">S</div>
          <div class="account-user-info"><strong id="account-user-email"></strong><span>Progres pribadi · hanya untuk akun ini</span></div>
          <div class="account-sync-card"><div><strong id="cloud-sync-badge" data-state="idle">Belum tersinkron</strong><p id="account-sync-copy">Progres akan disinkronkan saat tersambung ke internet.</p></div><button type="button" id="account-sync-now">Sinkronkan sekarang ↻</button><button type="button" id="account-reload-cloud" class="account-conflict-reload" hidden>Muat progres terbaru ↻</button></div>
          <button class="account-sign-out" type="button" id="account-sign-out">Keluar dari akun</button>
        </div>
        <div class="account-recovery-panel" id="account-recovery-panel" hidden>
          <span class="eyebrow">PEMULIHAN AKUN</span>
          <h3>Buat kata sandi baru.</h3>
          <p>Gunakan kata sandi yang kuat dan simpan di tempat aman.</p>
          <form class="account-form" id="account-recovery-form">
            <label for="account-new-password">Kata sandi baru</label>
            <input id="account-new-password" type="password" autocomplete="new-password" minlength="8" placeholder="Minimal 8 karakter" required>
            <button class="account-submit" id="account-recovery-submit" type="submit">Simpan kata sandi ↗</button>
          </form>
        </div>
        <p class="account-status" id="account-status" role="status" aria-live="polite">Progres tersimpan secara lokal saat kamu belajar.</p>
        <div class="account-install-note">
          <span class="eyebrow">PENGALAMAN APLIKASI</span>
          <strong>Pasang SinauuEnglish di layar utama HP.</strong>
          <p>Android: buka menu browser lalu pilih <em>Install app</em> atau <em>Tambahkan ke layar utama</em>. iPhone: buka di Safari, tekan Bagikan, lalu <em>Add to Home Screen</em>.</p>
          <button type="button" id="account-install-app" hidden>Pasang aplikasi ↗</button>
        </div>
      </div>
    </dialog>`;
}

function mountUi(): void {
  const toolbar = $(".nav-actions") || $(".topbar-actions");
  if (!toolbar) return;
  const trigger = document.createElement("button");
  trigger.id = "account-open";
  trigger.className = "account-trigger";
  trigger.type = "button";
  trigger.textContent = "Masuk / Daftar";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "account-dialog");
  toolbar.append(trigger);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = modalMarkup();
  document.body.append(wrapper.firstElementChild!);
  trigger.addEventListener("click", () => {
    renderAccount();
    const modal = $("#account-dialog") as HTMLDialogElement | null;
    if (modal && !modal.open) modal.showModal();
  });
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (target?.closest("[data-account-close]")) ($("#account-dialog") as HTMLDialogElement | null)?.close();
    const modeButton = target?.closest("[data-account-mode]") as HTMLButtonElement | null;
    if (modeButton) setMode(modeButton.dataset.accountMode === "signup" ? "signup" : "signin");
  });
  $("#account-form")?.addEventListener("submit", (event) => void submitAuth(event));
  $("#account-recovery-form")?.addEventListener("submit", (event) => void submitPasswordRecovery(event));
  $("#account-reset")?.addEventListener("click", () => void sendPasswordReset());
  $("#account-sign-out")?.addEventListener("click", () => void signOut());
  $("#account-sync-now")?.addEventListener("click", () => void syncNow());
  $("#account-reload-cloud")?.addEventListener("click", () => void reloadLatestCloudProgress());
  $("#account-install-app")?.addEventListener("click", () => void triggerInstall());
  const notice = $("#account-config-notice");
  if (notice) notice.toggleAttribute("hidden", CLOUD_READY);
  renderAccount();
}

function setMode(mode: "signin" | "signup"): void {
  currentMode = mode;
  document.querySelectorAll("[data-account-mode]").forEach((node) => {
    const button = node as HTMLButtonElement;
    const active = button.dataset.accountMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const password = $("#account-password") as HTMLInputElement | null;
  const submit = $("#account-submit") as HTMLButtonElement | null;
  const note = $("#account-password-note");
  if (password) password.autocomplete = mode === "signup" ? "new-password" : "current-password";
  if (submit) submit.textContent = mode === "signup" ? "Buat akun ↗" : "Masuk ke akun ↗";
  if (note) note.textContent = mode === "signup" ? "Email belum diverifikasi pada versi ini. Gunakan kata sandi unik dan simpan aman; reset email belum tersedia." : "Gunakan kata sandi untuk akun SinauuEnglish.";
}

function renderAccount(): void {
  const trigger = $("#account-open") as HTMLButtonElement | null;
  if (trigger) trigger.textContent = session?.user?.email ? "Akun saya" : "Masuk / Daftar";
  const signedIn = Boolean(session?.user?.id);
  $("#account-auth-panel")?.toggleAttribute("hidden", signedIn || !CLOUD_READY || recoveryMode);
  $("#account-signed-in")?.toggleAttribute("hidden", !signedIn || recoveryMode);
  $("#account-recovery-panel")?.toggleAttribute("hidden", !recoveryMode || !signedIn);
  const email = $("#account-user-email");
  if (email) email.textContent = session?.user?.email || "Akun SinauuEnglish";
  const installButton = $("#account-install-app") as HTMLButtonElement | null;
  if (installButton) installButton.hidden = !installPrompt;
  const reloadButton = $("#account-reload-cloud") as HTMLButtonElement | null;
  if (reloadButton) reloadButton.hidden = !signedIn || !syncConflict;
  const configNotice = $("#account-config-notice");
  if (configNotice) configNotice.toggleAttribute("hidden", CLOUD_READY);
}

async function submitAuth(event: Event): Promise<void> {
  event.preventDefault();
  if (!CLOUD_READY) { setMessage("Akun cloud belum dikonfigurasi. Ikuti panduan setup terlebih dahulu.", "error"); return; }
  const email = ($("#account-email") as HTMLInputElement | null)?.value.trim().toLowerCase() || "";
  const password = ($("#account-password") as HTMLInputElement | null)?.value || "";
  const submit = $("#account-submit") as HTMLButtonElement | null;
  if (!email || password.length < 8) { setMessage("Masukkan email yang valid dan kata sandi minimal 8 karakter.", "error"); return; }
  if (submit) { submit.disabled = true; submit.textContent = "Memproses…"; }
  try {
    if (currentMode === "signup") {
      const redirect = window.location.origin + "/belajar.html";
      const data = await authRequest("/signup?redirect_to=" + encodeURIComponent(redirect), { method: "POST", body: JSON.stringify({ email, password, data: { app: "SinauuEnglish" } }) });
      const nextSession = toSession(data);
      if (nextSession) {
        setSession(nextSession);
        setMessage("Akun dibuat. Memeriksa progres tersimpan dan menghubungkan ke cloud…", "success");
        const migration = await migrateLegacyDataIfNeeded(nextSession.user.id);
        if (!migration.migrated) {
          await syncNow();
        }
      } else {
        setMessage("Akun dibuat. Cek email untuk mengonfirmasi alamatmu, lalu masuk kembali ke SinauuEnglish.", "success");
      }
    } else {
      const data = await authRequest("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      const nextSession = toSession(data);
      if (!nextSession) throw new Error("Sesi masuk tidak tersedia. Coba masuk lagi.");
      setSession(nextSession);
      setMessage("Berhasil masuk. Memeriksa progres dan menyinkronkan ke cloud…", "success");
      const migration = await migrateLegacyDataIfNeeded(nextSession.user.id);
      if (!migration.migrated) {
        await syncNow();
      }
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Tidak dapat memproses akun. Coba lagi.", "error");
  } finally { if (submit) { submit.disabled = false; setMode(currentMode); } }
}

async function submitPasswordRecovery(event: Event): Promise<void> {
  event.preventDefault();
  if (!CLOUD_READY || !session || !recoveryMode) {
    setMessage("Tautan pemulihan tidak aktif. Minta tautan baru dari menu lupa kata sandi.", "error");
    return;
  }
  const password = ($("#account-new-password") as HTMLInputElement | null)?.value || "";
  const submit = $("#account-recovery-submit") as HTMLButtonElement | null;
  if (password.length < 8) {
    setMessage("Kata sandi minimal 8 karakter.", "error");
    return;
  }
  if (submit) { submit.disabled = true; submit.textContent = "Menyimpan…"; }
  try {
    const active = await currentSession();
    if (!active) throw new Error("Sesi pemulihan berakhir. Minta tautan baru.");
    const user = await authRequest("/user", { method: "PUT", body: JSON.stringify({ password }) }, active.access_token);
    setSession({ ...active, user });
    recoveryMode = false;
    renderAccount();
    setMessage("Kata sandi berhasil diperbarui. Akunmu siap digunakan.", "success");
    const field = $("#account-new-password") as HTMLInputElement | null;
    if (field) field.value = "";
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Kata sandi belum dapat diperbarui. Minta tautan pemulihan baru.", "error");
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = "Simpan kata sandi ↗"; }
  }
}

async function sendPasswordReset(): Promise<void> {
  setMessage("Pemulihan kata sandi melalui email belum tersedia. Jika kamu lupa kata sandi, akun belum dapat dipulihkan otomatis. Simpan kata sandi dengan aman.", "info");
}
async function signOut(): Promise<void> {
  const signedInUserId = session?.user?.id;
  if (!signedInUserId) {
    setSession(null);
    return;
  }
  signingOut = true;
  window.clearTimeout(syncTimer);
  // Let an in-flight save finish before taking the final snapshot. A bounded wait
  // prevents the UI from hanging if the network drops mid-request.
  let waitCount = 0;
  while (syncing && waitCount < 200) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    waitCount += 1;
  }
  // Invalidate older sync work so it cannot restore this account after local cleanup.
  sessionEpoch += 1;
  await syncNow(true);
  isCloudVerified = false;
  await applyLocalBundle({
    schemaVersion: 2,
    core: freshCore(),
    extras: {
      extraLearning: {},
      habitProgress: {},
      adventureProgress: {},
      studioDrafts: {
        speaking: { selectedPromptId: "first-introduction", prompts: {} },
        writing: { selectedPromptId: "short-introduction", prompts: {} },
      },
    },
  });
  try { localStorage.removeItem(OWNER_KEY); } catch { /* no-op */ }
  try {
    if (session && session.user.id === signedInUserId) {
      const active = await currentSession();
      if (active && active.user.id === signedInUserId) await authRequest("/logout", { method: "POST" }, active.access_token);
    }
  } catch { /* A local sign-out still works if the network is unavailable. */ }
  setSession(null);
  signingOut = false;
  setSyncBadge("Tersimpan di cloud", "idle");
  setMessage("Kamu sudah keluar. Progres akunmu tetap tersimpan di cloud; masuk kembali untuk memuatnya. Sesi lokal dibersihkan agar tidak bercampur dengan akun lain.", "info");
}

async function waitForWorkspaceReady(): Promise<void> {
  if (!$("#app-main") || (window as unknown as AnyRecord).sinauuWorkspaceReady) return;
  await new Promise<void>((resolve) => window.addEventListener("sinauu:workspace-ready", () => resolve(), { once: true }));
}

async function checkCloudReady(): Promise<void> {
  try {
    const response = await fetch("/api/account?action=status", { cache: "no-store", credentials: "same-origin" });
    const body = await response.json().catch(() => ({}));
    CLOUD_READY = Boolean(response.ok && body.ready);
  } catch {
    CLOUD_READY = false;
  }
  renderAccount();
  if (CLOUD_READY) await restoreSession();
}

async function restoreSession(): Promise<void> {
  if (!CLOUD_READY) return;
  await waitForWorkspaceReady();
  try {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fragmentAccess = fragment.get("access_token");
    const fragmentRefresh = fragment.get("refresh_token");
    const fragmentType = fragment.get("type");
    if (fragmentAccess && fragmentRefresh) {
      const fragmentExpires = Number(fragment.get("expires_in") || 3600);
      const fragmentSession: AuthSession = {
        access_token: fragmentAccess,
        refresh_token: fragmentRefresh,
        expires_in: fragmentExpires,
        expires_at: Math.floor(Date.now() / 1000) + fragmentExpires,
        token_type: fragment.get("token_type") || "bearer",
        user: { id: "pending-auth-user" },
      };
      const user = await authRequest("/user", { method: "GET" }, fragmentAccess);
      const nextUser = (user && typeof user === "object" && typeof user.id === "string") ? { ...fragmentSession.user, ...user } : fragmentSession.user;
      setSession({ ...fragmentSession, user: nextUser });
      recoveryMode = fragmentType === "recovery";
      history.replaceState(null, "", window.location.pathname + window.location.search);
      renderAccount();
      const modal = $("#account-dialog") as HTMLDialogElement | null;
      if (modal && recoveryMode && !modal.open) modal.showModal();
      if (recoveryMode) {
        setMessage("Tautan pemulihan valid. Buat kata sandi baru untuk melanjutkan.", "success");
      } else {
        setMessage("Akun terverifikasi. Memuat progres tersinkron…", "success");
        const migration = await migrateLegacyDataIfNeeded(nextUser.id);
        if (!migration.migrated) {
          await syncNow();
        }
      }
      return;
    }
    const raw = parseStored<AuthSession | null>(SESSION_KEY, null);
    if (!raw?.access_token || !raw?.refresh_token) return;
    session = raw;

    if (!navigator.onLine) {
      setSyncBadge("Offline · Menunggu internet", "idle");
      setMessage("Mode offline: menampilkan progres tersimpan di perangkat.", "info");
      renderAccount();
      return;
    }

    const active = await currentSession();
    if (!active) return;
    const user = await authRequest("/user", { method: "GET" }, active.access_token);
    const nextUser = (user && typeof user === "object" && typeof user.id === "string") ? { ...active.user, ...user } : active.user;
    setSession({ ...active, user: nextUser });
    setMessage("Akun dikenali. Memeriksa progres cloud…", "info");
    const migration = await migrateLegacyDataIfNeeded(active.user.id);
    if (!migration.migrated) {
      await syncNow();
    }
  } catch (error) {
    setSession(null);
    setSyncBadge("Masuk kembali", "idle");
    if (error instanceof Error && /sesi berakhir|masuk kembali/i.test(error.message)) {
      window.location.replace("/login.html?next=%2Fbelajar.html");
    }
  }
}

async function triggerInstall(): Promise<void> {
  if (installPrompt) {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setMessage("SinauuEnglish sedang dipasang di perangkatmu.", "success");
    installPrompt = null;
    renderAccount();
  } else {
    setMessage("Android/Chrome: buka menu ⋮ lalu pilih Install app atau Tambahkan ke layar utama. iPhone: buka lewat Safari → Bagikan → Add to Home Screen.", "info");
  }
}

function setupPwa(): void {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js").catch(() => undefined); });
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    renderAccount();
    let installButton = $("#install-app-top") as HTMLButtonElement | null;
    const toolbar = $(".nav-actions") || $(".topbar-actions");
    if (!installButton && toolbar) {
      installButton = document.createElement("button");
      installButton.id = "install-app-top";
      installButton.className = "install-app-trigger";
      installButton.type = "button";
      installButton.textContent = "Pasang app";
      toolbar.insertBefore(installButton, toolbar.firstChild);
      installButton.addEventListener("click", () => void triggerInstall());
    }
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    $("#install-app-top")?.remove();
    renderAccount();
    setMessage("SinauuEnglish berhasil dipasang. Kamu bisa membukanya dari layar utama.", "success");
  });
}

window.addEventListener("sinauu:local-state-saved", () => { if (!applyingCloud) scheduleSync(); });
window.addEventListener("sinauu:local-extras-saved", () => { if (!applyingCloud) scheduleSync(); });
window.addEventListener("online", () => { if (session && !syncConflict) void syncNow(); });
window.addEventListener("focus", () => { if (session && !syncConflict) void syncNow(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && session && !syncConflict) void syncNow(); });

mountUi();
setupPwa();
void checkCloudReady();
pollingTimer = window.setInterval(() => {
  if (session && document.visibilityState === "visible" && !syncConflict) void syncNow();
}, 45_000);
window.addEventListener("pagehide", () => { window.clearTimeout(syncTimer); window.clearInterval(pollingTimer); });

(window as any).sinauuSyncNow = () => syncNow();
(window as any).sinauuReloadLatestCloud = () => reloadLatestCloudProgress();
(window as any).sinauuGetLastCloudRevision = () => lastCloudRevision;
(window as any).sinauuHasSyncConflict = () => syncConflict;
(window as any).sinauuIsCloudVerified = () => isCloudVerified;
(window as any).sinauuTriggerCloudSync = () => syncNow();
(window as any).sinauuMigrateLegacyData = (userId: string) => migrateLegacyDataIfNeeded(userId);
(window as any).sinauuIsCleanupPending = () => cleanupPending;
(window as any).sinauuVerifyBundleDataIncluded = (candidate: CloudBundle, cloud: CloudBundle) => verifyBundleDataIncluded(candidate, cloud);
(window as any).sinauuGetSyncStatus = () => ({
  syncing,
  lastSuccessfulSync,
  online: navigator.onLine,
  isCloudVerified,
  badgeText: ($("#cloud-sync-badge") as HTMLElement | null)?.textContent || "",
  conflict: syncConflict,
  revision: lastCloudRevision,
});

export {
  dayDistance,
  parseTime,
  getWordActivityTimestamp,
  mergeWordProgressItem,
  mergeCore,
  verifyBundleDataIncluded,
  hasLegacyProgress,
  readOfflineQueue,
  clearOfflineQueue,
  collectLegacyBundle,
  purgeLegacyStorage,
  migrateLegacyDataIfNeeded,
  syncNow,
  scheduleSync,
};
