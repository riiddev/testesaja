/**
 * SINAUENGLISH V2 — Backup & Migration Service
 * Handles exporting user state to JSON, importing, and V1 -> V2 schema validation
 */

import { sanitizeState, type AppState } from "./storage.ts";

export interface FullBackupPayload {
  schemaVersion: 1;
  app: "SINAUENGLISH" | "SINAUENGLISHV2" | "sinauuenglish";
  exportedAt: string;
  state: AppState;
  extras?: {
    adventureProgress?: any;
    habitProgress?: any;
    extraLearning?: any;
    placementResult?: any;
  };
}

export function exportBackup(state: AppState): string {
  const readExtra = (key: string) => {
    if (typeof localStorage === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  };

  const payload: FullBackupPayload = {
    schemaVersion: 1,
    app: "SINAUENGLISHV2",
    exportedAt: new Date().toISOString(),
    state,
    extras: {
      adventureProgress: readExtra("sinauu-adventure-progress-v1"),
      habitProgress: readExtra("sinauu-habit-library-v1"),
      extraLearning: readExtra("sinauu-extra-learning-v1"),
      placementResult: readExtra("sinauu-placement-result-v1")
    }
  };

  return JSON.stringify(payload, null, 2);
}

export function importBackup(jsonString: string): { state: AppState; extras?: any } {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("File backup bukan format JSON yang valid.");
  }

  // Handle both raw AppState and FullBackupPayload wrapper
  let rawState = parsed;
  let extras = parsed.extras || null;

  if (parsed.state && typeof parsed.state === "object") {
    rawState = parsed.state;
  }

  // Schema verification & sanitization
  const state = sanitizeState(rawState);

  // Restore extra modules to localStorage if present
  if (typeof localStorage !== "undefined" && extras && typeof extras === "object") {
    try {
      if (extras.adventureProgress) {
        localStorage.setItem("sinauu-adventure-progress-v1", JSON.stringify(extras.adventureProgress));
      }
      if (extras.habitProgress) {
        localStorage.setItem("sinauu-habit-library-v1", JSON.stringify(extras.habitProgress));
      }
      if (extras.extraLearning) {
        localStorage.setItem("sinauu-extra-learning-v1", JSON.stringify(extras.extraLearning));
      }
      if (extras.placementResult) {
        localStorage.setItem("sinauu-placement-result-v1", JSON.stringify(extras.placementResult));
      }
    } catch (e) {
      console.warn("Could not restore extra snapshots:", e);
    }
  }

  return { state, extras };
}

export function triggerDownload(content: string, filename: string = "sinauenglish-backup.json"): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
