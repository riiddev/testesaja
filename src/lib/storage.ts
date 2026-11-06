/**
 * SINAUENGLISH V2 — Storage Service
 * Local-First IndexedDB with seamless localStorage fallback
 */

export interface AppSettings {
  theme: "light" | "dark";
  dailyGoal: number;
}

export interface WordProgress {
  attempts: any[];
  skillEvidence: {
    recall: boolean;
    context: boolean;
    production: boolean;
  };
  firstSeenDate: string | null;
  studiedDates: string[];
  nextReviewAt: string | null;
  reviewSuccesses: number;
  reviewDates: string[];
  reviewHistory: any[];
  contextQuestionIds: string[];
  consecutiveErrors: number;
  weak: boolean;
  masteredAt: string | null;
}

export interface GrammarProgress {
  studiedAt?: string;
  completedAt?: string;
  score?: number;
  answers?: Record<string, any>;
  attempts?: number;
}

export interface AppState {
  schemaVersion: 1;
  settings: AppSettings;
  wordProgress: Record<string, WordProgress>;
  favorites: string[];
  grammarProgress: Record<string, GrammarProgress>;
  events: any[];
  history: any[];
  updatedAt: string;
}

const DB_NAME = "sinauu-english-v1";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "current";
const FALLBACK_KEY = "sinauu-english-state-v1";

export function createFreshState(): AppState {
  return {
    schemaVersion: 1,
    settings: {
      theme: "light",
      dailyGoal: 10
    },
    wordProgress: {},
    favorites: [],
    grammarProgress: {},
    events: [],
    history: [],
    updatedAt: new Date().toISOString()
  };
}

export function sanitizeState(raw: any): AppState {
  if (!raw || typeof raw !== "object" || raw.schemaVersion !== 1) {
    throw new Error("Versi backup tidak dikenali. Data saat ini tidak diubah.");
  }
  const s = createFreshState();
  const settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
  s.settings.theme = settings.theme === "dark" ? "dark" : "light";
  s.settings.dailyGoal = [5, 10, 15, 20].includes(Number(settings.dailyGoal)) ? Number(settings.dailyGoal) : 10;
  s.wordProgress = raw.wordProgress && typeof raw.wordProgress === "object" && !Array.isArray(raw.wordProgress) ? raw.wordProgress : {};
  s.favorites = Array.isArray(raw.favorites) ? raw.favorites.filter((x: any) => typeof x === "string").slice(0, 10000) : [];
  s.grammarProgress = raw.grammarProgress && typeof raw.grammarProgress === "object" && !Array.isArray(raw.grammarProgress) ? raw.grammarProgress : {};
  s.events = Array.isArray(raw.events) ? raw.events.filter((x: any) => x && typeof x === "object").slice(-5000) : [];
  s.history = Array.isArray(raw.history) ? raw.history.filter((x: any) => x && typeof x === "object").slice(-1000) : [];
  s.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString();
  return s;
}

export class StorageService {
  private db: IDBDatabase | null = null;
  public mode: "indexedDB" | "localStorage" | "memory" = "indexedDB";

  async init(): Promise<AppState> {
    try {
      this.db = await this.openIndexedDB();
      const raw = await this.readIndexedDB();
      this.mode = "indexedDB";
      if (!raw) {
        const fresh = createFreshState();
        await this.writeIndexedDB(fresh);
        return fresh;
      }
      return sanitizeState(raw);
    } catch (_) {
      this.db = null;
      this.mode = "localStorage";
      try {
        const raw = localStorage.getItem(FALLBACK_KEY);
        if (!raw) {
          const fresh = createFreshState();
          localStorage.setItem(FALLBACK_KEY, JSON.stringify(fresh));
          return fresh;
        }
        return sanitizeState(JSON.parse(raw));
      } catch {
        this.mode = "memory";
        return createFreshState();
      }
    }
  }

  async save(state: AppState): Promise<void> {
    state.updatedAt = new Date().toISOString();
    if (this.mode === "indexedDB" && this.db) {
      try {
        await this.writeIndexedDB(state);
        return;
      } catch {
        this.mode = "localStorage";
      }
    }
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        return reject(new Error("IndexedDB tidak tersedia"));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Gagal membuka database"));
    });
  }

  private readIndexedDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  }

  private writeIndexedDB(value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database tidak terbuka"));
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({ key: STATE_KEY, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
}

