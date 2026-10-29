type AnyRecord = Record<string, any>;
type CloudBundle = { schemaVersion: 1; core: AnyRecord; extras: { extraLearning: AnyRecord; habitProgress: AnyRecord } };
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
  }
}

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const CLOUD_READY = /^https:\/\/.+/.test(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);
const SESSION_KEY = "sinauu-cloud-session-v1";
const LOCAL_DB = "sinauu-local-v1", LOCAL_STORE = "state", LOCAL_RECORD = "main";
const CORE_FALLBACK = "sinauu-learning-state-v1", EXTRA_KEY = "sinauu-extra-learning-v1", HABIT_KEY = "sinauu-habit-library-v1";
const OWNER_KEY = "sinauu-cloud-owner-v1";
const ACCOUNT_CACHE_PREFIX = "sinauu-cloud-local-cache-v1:";
const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector(selector) as T | null;

let session: AuthSession | null = null;
let syncTimer: number | undefined, pollingTimer: number | undefined;
let syncing = false, applyingCloud = false;
let installPrompt: BeforeInstallPromptEvent | null = null;
let currentMode: "signin" | "signup" = "signin";
let lastSuccessfulSync: string | null = null;

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

function localExtras(): CloudBundle["extras"] {
  return { extraLearning: parseStored<AnyRecord>(EXTRA_KEY, {}), habitProgress: parseStored<AnyRecord>(HABIT_KEY, {}) };
}

function normalizeBundle(raw: any): CloudBundle {
  if (raw && raw.core && typeof raw.core === "object") {
    return {
      schemaVersion: 1,
      core: raw.core,
      extras: {
        extraLearning: raw.extras?.extraLearning && typeof raw.extras.extraLearning === "object" ? raw.extras.extraLearning : {},
        habitProgress: raw.extras?.habitProgress && typeof raw.extras.habitProgress === "object" ? raw.extras.habitProgress : {},
      },
    };
  }
  return { schemaVersion: 1, core: raw && raw.schemaVersion === 1 ? raw : freshCore(), extras: localExtras() };
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
      try { await writeIndexedDbState(bundle.core); } catch { /* local fallback below */ }
      try {
        localStorage.setItem(CORE_FALLBACK, JSON.stringify(bundle.core));
        localStorage.setItem(EXTRA_KEY, JSON.stringify(bundle.extras.extraLearning || {}));
        localStorage.setItem(HABIT_KEY, JSON.stringify(bundle.extras.habitProgress || {}));
      } catch { /* The cloud copy remains available if local storage is full. */ }
      window.sinauuExtraLearningRestore?.(bundle.extras.extraLearning || {});
      window.sinauuHabitLibraryRestore?.(bundle.extras.habitProgress || {});
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
  if (!value || typeof value !== "object") return JSON.stringify(value);
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
    const preferred = remoteIsNewer ? b : a;
    merged.wordProgress[id] = {
      ...(remoteIsNewer ? a : b), ...preferred,
      attempts: mergeArrays(a.attempts || [], b.attempts || []),
      skillEvidence: {
        recall: Boolean(a.skillEvidence?.recall || b.skillEvidence?.recall),
        context: Boolean(a.skillEvidence?.context || b.skillEvidence?.context),
        production: Boolean(a.skillEvidence?.production || b.skillEvidence?.production),
      },
      studiedDates: Array.from(new Set([...(a.studiedDates || []), ...(b.studiedDates || [])])).sort(),
      reviewDates: Array.from(new Set([...(a.reviewDates || []), ...(b.reviewDates || [])])).sort(),
      reviewHistory: mergeArrays(a.reviewHistory || [], b.reviewHistory || []),
      contextQuestionIds: Array.from(new Set([...(a.contextQuestionIds || []), ...(b.contextQuestionIds || [])])),
    };
  }
  merged.grammarProgress = {};
  const topicIds = new Set([...Object.keys(local.grammarProgress || {}), ...Object.keys(remote.grammarProgress || {})]);
  for (const id of topicIds) {
    const a = local.grammarProgress?.[id], b = remote.grammarProgress?.[id];
    if (!a || !b) { merged.grammarProgress[id] = a || b; continue; }
    const item = { ...(remoteIsNewer ? a : b), ...(remoteIsNewer ? b : a) };
    item.answers = { ...(a.answers || {}), ...(b.answers || {}) };
    item.history = mergeArrays(a.history || [], b.history || []);
    if (item.history.length) {
      item.attempts = item.history.length;
      item.correct = item.history.filter((entry: any) => entry.correct === true).length;
    } else {
      item.attempts = Math.max(a.attempts || 0, b.attempts || 0);
      item.correct = Math.max(a.correct || 0, b.correct || 0);
    }
    merged.grammarProgress[id] = item;
  }
  merged.history = mergeArrays(local.history || [], remote.history || []).slice(-1000);
  merged.events = mergeArrays(local.events || [], remote.events || []).slice(-5000);
  merged.updatedAt = new Date(Math.max(localTime, remoteTime) || Date.now()).toISOString();
  return merged;
}

function mergeBundles(local: CloudBundle, remote: CloudBundle): CloudBundle {
  const localTime = Date.parse(local.core.updatedAt || "") || 0, remoteTime = Date.parse(remote.core.updatedAt || "") || 0;
  return {
    schemaVersion: 1,
    core: mergeCore(local.core, remote.core),
    extras: {
      extraLearning: mergeDeep(local.extras.extraLearning || {}, remote.extras.extraLearning || {}, remoteTime >= localTime),
      habitProgress: mergeDeep(local.extras.habitProgress || {}, remote.extras.habitProgress || {}, remoteTime >= localTime),
    },
  };
}

function setMessage(message: string, kind: "info" | "success" | "error" = "info"): void {
  const status = $("#account-status");
  if (status) { status.textContent = message; status.dataset.kind = kind; }
}

function setSyncBadge(label: string, state: "idle" | "syncing" | "success" | "error" = "idle"): void {
  const badge = $("#cloud-sync-badge");
  if (badge) { badge.textContent = label; badge.dataset.state = state; }
}

function setSession(next: AuthSession | null): void {
  session = next;
  try { if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next)); else localStorage.removeItem(SESSION_KEY); } catch { /* This open tab keeps its in-memory session. */ }
  renderAccount();
}

async function authRequest(path: string, options: RequestInit = {}, bearer?: string): Promise<any> {
  if (!CLOUD_READY) throw new Error("Akun cloud belum dikonfigurasi di Vercel.");
  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_ANON_KEY);
  headers.set("Content-Type", "application/json");
  if (bearer) headers.set("Authorization", "Bearer " + bearer);
  const response = await fetch(SUPABASE_URL + "/auth/v1" + path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.msg || body.message || body.error_description || "Permintaan akun gagal. Periksa email, kata sandi, dan konfigurasi Auth.");
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
  const run = (token: string) => fetch(SUPABASE_URL + "/rest/v1" + path, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
    const message = body && typeof body === "object" ? (body.message || body.details || body.hint) : "";
    throw new Error(message || "Sinkronisasi cloud gagal (" + response.status + "). Pastikan migrasi database sudah dijalankan.");
  }
  return body;
}

async function readCloudBundle(): Promise<CloudBundle | null> {
  if (!session) return null;
  const rows = await cloudRequest("/user_learning_states?select=state,updated_at&user_id=eq." + encodeURIComponent(session.user.id) + "&limit=1", { method: "GET" });
  if (!Array.isArray(rows) || !rows.length) return null;
  const bundle = normalizeBundle(rows[0].state);
  return bundle;
}

async function writeCloudBundle(bundle: CloudBundle): Promise<void> {
  if (!session) throw new Error("Masuk terlebih dahulu untuk menyinkronkan progres.");
  await cloudRequest("/user_learning_states?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ user_id: session.user.id, state: bundle, updated_at: new Date().toISOString() }]),
  });
}

async function prepareLocalForAccount(): Promise<void> {
  if (!session) return;
  let owner: string | null = null;
  try { owner = localStorage.getItem(OWNER_KEY); } catch { owner = null; }
  if (!owner || owner === session.user.id) return;
  const previous = await readLocalBundle();
  try { localStorage.setItem(ACCOUNT_CACHE_PREFIX + owner, JSON.stringify(previous)); } catch { /* Keep the cloud copy as the durable backup. */ }
  const target = parseStored<CloudBundle | null>(ACCOUNT_CACHE_PREFIX + session.user.id, null);
  const next = target ? normalizeBundle(target) : {
    schemaVersion: 1 as const,
    core: freshCore(),
    extras: { extraLearning: {}, habitProgress: {} },
  };
  await applyLocalBundle(next);
}

async function syncNow(): Promise<void> {
  if (!CLOUD_READY || !session || syncing || !navigator.onLine) return;
  syncing = true;
  setSyncBadge("Menyinkronkan…", "syncing");
  try {
    await prepareLocalForAccount();
    const local = await readLocalBundle();
    const remote = await readCloudBundle();
    const merged = remote ? mergeBundles(local, remote) : local;
    if (!remote || stable(merged) !== stable(remote)) await writeCloudBundle(merged);
    if (stable(merged) !== stable(local)) await applyLocalBundle(merged);
    try {
      localStorage.setItem(OWNER_KEY, session.user.id);
      localStorage.setItem(ACCOUNT_CACHE_PREFIX + session.user.id, JSON.stringify(merged));
    } catch { /* Local account cache is a convenience, not the only cloud copy. */ }
    lastSuccessfulSync = new Date().toISOString();
    setSyncBadge("Tersinkron", "success");
    setMessage("Progres tersinkron pada " + new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSuccessfulSync)) + ". Kamu bisa lanjut di perangkat lain.", "success");
  } catch (error) {
    setSyncBadge("Belum tersinkron", "error");
    setMessage(error instanceof Error ? error.message : "Sinkronisasi belum berhasil. Progres lokal tetap tersimpan.", "error");
  } finally { syncing = false; }
}

function scheduleSync(): void {
  if (!session || !CLOUD_READY || applyingCloud) return;
  setSyncBadge(navigator.onLine ? "Ada perubahan" : "Menunggu internet", navigator.onLine ? "syncing" : "error");
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
          <p>Fitur ini memakai Supabase Free. Siapkan project, jalankan SQL migration, lalu tambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di environment Vercel. Panduan lengkap ada di GitHub.</p>
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
          <div class="account-sync-card"><div><strong id="cloud-sync-badge" data-state="idle">Belum tersinkron</strong><p id="account-sync-copy">Progres akan disinkronkan saat tersambung ke internet.</p></div><button type="button" id="account-sync-now">Sinkronkan sekarang ↻</button></div>
          <button class="account-sign-out" type="button" id="account-sign-out">Keluar dari akun</button>
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
  $("#account-reset")?.addEventListener("click", () => void sendPasswordReset());
  $("#account-sign-out")?.addEventListener("click", () => void signOut());
  $("#account-sync-now")?.addEventListener("click", () => void syncNow());
  $("#account-install-app")?.addEventListener("click", () => void triggerInstall());
  const notice = $("#account-config-notice");
  if (notice) notice.toggleAttribute("hidden", CLOUD_READY);
  if (!CLOUD_READY) {
    const form = $("#account-form") as HTMLFormElement | null;
    if (form) Array.from(form.elements).forEach((element) => (element as HTMLInputElement | HTMLButtonElement).disabled = true);
    const reset = $("#account-reset") as HTMLButtonElement | null;
    if (reset) reset.disabled = true;
  }
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
  if (note) note.textContent = mode === "signup" ? "Minimal 8 karakter. Konfirmasi email mungkin diperlukan sebelum masuk." : "Gunakan kata sandi untuk akun SinauuEnglish.";
}

function renderAccount(): void {
  const trigger = $("#account-open") as HTMLButtonElement | null;
  if (trigger) trigger.textContent = session?.user?.email ? "Akun saya" : "Masuk / Daftar";
  const signedIn = Boolean(session?.user?.id);
  $("#account-auth-panel")?.toggleAttribute("hidden", signedIn || !CLOUD_READY);
  $("#account-signed-in")?.toggleAttribute("hidden", !signedIn);
  const email = $("#account-user-email");
  if (email) email.textContent = session?.user?.email || "Akun SinauuEnglish";
  const installButton = $("#account-install-app") as HTMLButtonElement | null;
  if (installButton) installButton.hidden = !installPrompt;
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
        setMessage("Akun dibuat. Menggabungkan progres perangkat ini ke cloud…", "success");
        await syncNow();
      } else {
        setMessage("Akun dibuat. Cek email untuk mengonfirmasi alamatmu, lalu masuk kembali ke SinauuEnglish.", "success");
      }
    } else {
      const data = await authRequest("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      const nextSession = toSession(data);
      if (!nextSession) throw new Error("Sesi masuk tidak tersedia. Coba masuk lagi.");
      setSession(nextSession);
      setMessage("Berhasil masuk. Menggabungkan progres yang tersimpan…", "success");
      await syncNow();
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Tidak dapat memproses akun. Coba lagi.", "error");
  } finally { if (submit) { submit.disabled = false; setMode(currentMode); } }
}

async function sendPasswordReset(): Promise<void> {
  if (!CLOUD_READY) return;
  const email = ($("#account-email") as HTMLInputElement | null)?.value.trim().toLowerCase() || "";
  if (!email) {
    setMessage("Isi email akunmu dahulu, lalu tekan Lupa kata sandi.", "error");
    ($("#account-email") as HTMLInputElement | null)?.focus();
    return;
  }
  try {
    const redirect = window.location.origin + "/belajar.html";
    await authRequest("/recover?redirect_to=" + encodeURIComponent(redirect), { method: "POST", body: JSON.stringify({ email }) });
    setMessage("Jika akun dengan email itu tersedia, instruksi pemulihan akan dikirim ke email tersebut.", "success");
  } catch (error) { setMessage(error instanceof Error ? error.message : "Email pemulihan belum bisa dikirim.", "error"); }
}

async function signOut(): Promise<void> {
  const signedInUserId = session?.user?.id;
  if (signedInUserId) {
    await syncNow();
    try {
      const current = await readLocalBundle();
      localStorage.setItem(ACCOUNT_CACHE_PREFIX + signedInUserId, JSON.stringify(current));
    } catch { /* Cloud state remains the primary saved copy. */ }
    await applyLocalBundle({ schemaVersion: 1, core: freshCore(), extras: { extraLearning: {}, habitProgress: {} } });
    try { localStorage.removeItem(OWNER_KEY); } catch { /* no-op */ }
  }
  try {
    if (session) {
      const active = await currentSession();
      if (active) await authRequest("/logout", { method: "POST" }, active.access_token);
    }
  } catch { /* A local sign-out still works if the network is unavailable. */ }
  setSession(null);
  setSyncBadge("Tersimpan di perangkat", "idle");
  setMessage("Kamu sudah keluar. Progres akunmu tetap tersimpan di cloud; masuk kembali untuk memuatnya. Sesi lokal dibersihkan agar tidak bercampur dengan akun lain.", "info");
}

async function waitForWorkspaceReady(): Promise<void> {
  if (!$("#app-main") || (window as AnyRecord).sinauuWorkspaceReady) return;
  await new Promise<void>((resolve) => window.addEventListener("sinauu:workspace-ready", () => resolve(), { once: true }));
}

async function restoreSession(): Promise<void> {
  if (!CLOUD_READY) return;
  await waitForWorkspaceReady();
  try {
    const raw = parseStored<AuthSession | null>(SESSION_KEY, null);
    if (!raw?.access_token || !raw?.refresh_token) return;
    session = raw;
    const active = await currentSession();
    if (!active) return;
    const user = await authRequest("/user", { method: "GET" }, active.access_token);
    setSession({ ...active, user });
    setMessage("Akun dikenali. Memeriksa progres cloud…", "info");
    await syncNow();
  } catch { setSession(null); setSyncBadge("Masuk kembali", "idle"); }
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
window.addEventListener("online", () => { if (session) void syncNow(); });
window.addEventListener("focus", () => { if (session) void syncNow(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && session) void syncNow(); });

mountUi();
setupPwa();
void restoreSession();
pollingTimer = window.setInterval(() => {
  if (session && document.visibilityState === "visible") void syncNow();
}, 45_000);
window.addEventListener("pagehide", () => { window.clearTimeout(syncTimer); window.clearInterval(pollingTimer); });
