import { randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

const STATE_PREFIX = "sinau_state_v1_";
const MANIFEST_ID = STATE_PREFIX + "manifest";
const CHUNK_SIZE = 30_000;
const MAX_CHUNKS = 250;
const MAX_STATE_BYTES = 5_000_000;

export class RevisionConflictError extends Error {
  code = "REVISION_CONFLICT";
  currentRevision: number;
  constructor(message: string, currentRevision: number) {
    super(message);
    this.name = "RevisionConflictError";
    this.currentRevision = currentRevision;
  }
}

export class LockBusyError extends Error {
  code = "LOCK_BUSY";
  constructor(message: string) {
    super(message);
    this.name = "LockBusyError";
  }
}

export class UncertainCommitError extends Error {
  code = "UNCERTAIN_COMMIT";
  readonly operationId: string;
  readonly expectedRevision: number;

  constructor(message: string, operationId: string, expectedRevision: number) {
    super(message);
    this.name = "UncertainCommitError";
    this.operationId = operationId;
    this.expectedRevision = expectedRevision;
  }
}

function requiredEnv(name: string): string {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error("Konfigurasi server belum lengkap. Admin perlu mengisi " + name + " di Environment Variables Vercel.");
  return value;
}

export function assertSheetsConfigured(): void {
  const url = requiredEnv("SINAI_APPS_SCRIPT_URL");
  if (!url.startsWith("https://script.google.com/macros/s/") || !url.endsWith("/exec")) {
    throw new Error("URL Google Apps Script belum dikonfigurasi dengan benar.");
  }
  if (requiredEnv("SINAI_API_KEY").length < 32) {
    throw new Error("SINAI_API_KEY harus berupa rahasia acak minimal 32 karakter.");
  }
}

async function callSinai(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  assertSheetsConfigured();
  const url = requiredEnv("SINAI_APPS_SCRIPT_URL");
  const apiKey = requiredEnv("SINAI_API_KEY");
  let response: Response;
  try {
    // Timeout budget: Apps Script CONFIG.MAX_LOCK_WAIT_MS is 10s.
    // Adding ~2-3s execution time gives ~13s worst-case response from GAS.
    // Setting client timeout to 20s provides a safe 7s margin over lock wait.
    response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, apiKey, action }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error("Tidak dapat menghubungi Google Sheets. Coba lagi sebentar.");
  }

  let result: any;
  try { result = await response.json(); }
  catch { throw new Error("Respons Google Sheets tidak valid. Pastikan Web App Apps Script sudah di-deploy dan dapat diakses."); }

  if (!response.ok || result?.ok !== true) {
    const code = String(result?.code || "");
    const message = String(result?.error || "");
    if (code === "REVISION_CONFLICT") {
      throw new RevisionConflictError(message || "Snapshot sudah diperbarui dari perangkat lain.", Number(result?.currentRevision ?? 0));
    }
    if (code === "LOCK_BUSY" || /server sibuk/i.test(message)) {
      throw new LockBusyError(message || "Server sibuk. Gagal mendapatkan lock untuk snapshot commit.");
    }
    if (code === "SNAPSHOT_CHUNK_IMMUTABLE" || code === "MANIFEST_IMMUTABLE") {
      throw new Error(message || "Operasi penyimpanan ditolak: data snapshot bersifat immutable.");
    }
    if (/email sudah terdaftar/i.test(message)) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
    if (/unauthorized/i.test(message)) throw new Error("API key tidak cocok dengan Google Apps Script. Periksa environment variable dan deployment Apps Script.");
    if (/maksimal .*record/i.test(message)) throw new Error(message);
    if (/tidak valid|wajib|harus|diizinkan|tidak dikenal/i.test(message)) throw new Error(message);
    throw new Error("Google Sheets gagal memproses permintaan. Periksa konfigurasi Apps Script.");
  }
  return result.data !== undefined ? result.data : result;
}

export async function ensureSheetsReady(): Promise<void> {
  assertSheetsConfigured();
  await callSinai("status");
}

export type AccountRow = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

function mapAccount(raw: any): AccountRow | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.userId || raw.id || "").trim();
  const email = String(raw.email || "").trim().toLowerCase();
  if (!id || !email) return null;
  return {
    id,
    email,
    passwordHash: String(raw.passwordHash || ""),
    passwordSalt: String(raw.passwordSalt || ""),
    displayName: String(raw.displayName || email.split("@")[0]),
    status: String(raw.status || "active"),
    createdAt: String(raw.createdAt || ""),
    updatedAt: String(raw.updatedAt || raw.createdAt || ""),
    lastLoginAt: String(raw.lastLoginAt || ""),
  };
}

export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  const data = await callSinai("users.findByEmail", { email: email.toLowerCase() });
  return mapAccount(data);
}

export async function appendAccount(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<AccountRow> {
  const data = await callSinai("users.create", input);
  const account = mapAccount(data);
  if (!account) throw new Error("Google Sheets membuat akun tanpa mengembalikan ID pengguna yang valid.");
  return account;
}

type CollectionRecord = { id?: string; data?: Record<string, any>; [key: string]: any };

async function listUserLists(userId: string): Promise<CollectionRecord[]> {
  const data = await callSinai("collections.list", { collection: "lists", userId });
  return Array.isArray(data?.records) ? data.records : [];
}

function recordId(record: CollectionRecord): string {
  return String(record.id || record.listId || "");
}

/**
 * Backward-compatible snapshot reading supporting both legacy A/B slot manifests
 * and new immutable CAS snapshots with revision numbers.
 */
export async function readProgress(userId: string): Promise<{ state: any; updatedAt: string; revision: number } | null> {
  const records = await listUserLists(userId);
  const manifests = records.filter((record) => recordId(record) === MANIFEST_ID);
  if (manifests.length > 1) {
    throw new Error("Terdeteksi lebih dari satu manifes progres aktif di Google Sheets. Hubungi admin untuk perbaikan data.");
  }
  const manifest = manifests[0];
  if (!manifest) return null;

  const manifestData: Record<string, any> = manifest.data || {};
  const snapshotId = String(manifestData.snapshotId || "");
  const slot = String(manifestData.slot || manifestData.activeSlot || "");
  const revision = typeof manifestData.revision === "number" ? manifestData.revision : 0;
  const isLegacy = slot === "A" || slot === "B";
  const partCount = Math.max(0, Math.min(MAX_CHUNKS, Number(manifestData.partCount || (isLegacy ? 1 : 0))));
  if ((!snapshotId && !isLegacy) || partCount < 1) return null;

  const byIndex = new Map<number, CollectionRecord>();

  for (const record of records) {
    const data = record.data || {};
    if (snapshotId && data.snapshotId && data.snapshotId !== snapshotId) continue;
    if (isLegacy && data.slot !== slot) continue;
    const index = Number(data.chunkIndex);
    if (Number.isInteger(index) && index >= 0 && index < partCount) {
      byIndex.set(index, record);
    }
  }

  const parts: string[] = [];
  for (let index = 0; index < partCount; index += 1) {
    const record = byIndex.get(index);
    const payload = record?.data?.payload;
    if (typeof payload !== "string") {
      throw new Error("Snapshot progres di Google Sheets belum lengkap. Jangan menghapus baris dengan ID sinau_state_v1_. Coba sinkronkan lagi dari perangkat yang masih memiliki data.");
    }
    parts.push(payload);
  }

  try {
    const state = JSON.parse(gunzipSync(Buffer.from(parts.join(""), "base64")).toString("utf8"));
    return { state, updatedAt: String(manifestData.updatedAt || ""), revision };
  } catch {
    throw new Error("Snapshot progres di Google Sheets tidak dapat dibaca. Jangan mengedit data dengan ID sinau_state_v1_ secara manual.");
  }
}

export type ReconcileResult =
  | { status: "committed"; revision: number }
  | { status: "conflict"; currentRevision: number }
  | { status: "uncertain"; message: string };

/**
 * Reconciles uncertain commit outcome by inspecting the active manifest directly in Google Sheets.
 */
export async function reconcileCommit(
  userId: string,
  snapshotId: string,
  expectedRevision: number,
  newRevision: number
): Promise<ReconcileResult> {
  try {
    const records = await listUserLists(userId);
    const manifests = records.filter((r) => recordId(r) === MANIFEST_ID);
    if (manifests.length > 1) {
      throw new Error("Terdeteksi lebih dari satu manifes progres aktif di Google Sheets. Hubungi admin untuk perbaikan data.");
    }
    if (manifests.length === 0) {
      return { status: "uncertain", message: "Manifes aktif belum ditemukan." };
    }
    const manifestData = manifests[0].data || {};
    const activeSnapshotId = String(manifestData.snapshotId || "");
    const activeRevision = typeof manifestData.revision === "number" ? manifestData.revision : 0;

    // Confirmed commit: snapshotId and newRevision match active manifest
    if (activeSnapshotId === snapshotId && activeRevision === newRevision) {
      return { status: "committed", revision: activeRevision };
    }

    // Superseded or conflict: revision moved past intended newRevision or advanced by another snapshot
    if (activeRevision >= newRevision || (activeRevision > expectedRevision && activeSnapshotId !== snapshotId)) {
      return { status: "conflict", currentRevision: activeRevision };
    }

    // Manifest is still at expectedRevision (not committed yet)
    if (activeRevision === expectedRevision && activeSnapshotId !== snapshotId) {
      return { status: "uncertain", message: "Komit belum diaplikasikan di Google Sheets." };
    }

    return { status: "uncertain", message: "Status komit belum dapat dipastikan." };
  } catch (err: any) {
    if (err instanceof Error && /terdeteksi lebih dari satu/i.test(err.message)) {
      throw err;
    }
    return { status: "uncertain", message: err?.message || "Gagal menghubungi Google Sheets untuk rekonsiliasi." };
  }
}

/**
 * Writes progress using unique immutable chunk IDs and an atomic manifest CAS commit.
 * Supports stable operation identity and server-side reconciliation for uncertain outcomes.
 */
export async function writeProgress(
  userId: string,
  state: unknown,
  baseRevision: number = 0,
  operationId?: string
): Promise<{ revision: number; snapshotId: string }> {
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized, "utf8") > MAX_STATE_BYTES) {
    throw new Error("Snapshot progres terlalu besar. Ekspor cadangan belajar dan hubungi admin sebelum mencoba lagi.");
  }
  const packed = gzipSync(Buffer.from(serialized, "utf8")).toString("base64");
  const parts: string[] = [];
  for (let offset = 0; offset < packed.length; offset += CHUNK_SIZE) {
    parts.push(packed.slice(offset, offset + CHUNK_SIZE));
  }
  if (parts.length < 1 || parts.length > MAX_CHUNKS) {
    throw new Error("Snapshot progres terlalu besar untuk disimpan di Google Sheets. Ekspor cadangan belajar sebelum mencoba lagi.");
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const snapshotId = operationId ? String(operationId).trim() : randomUUID();
  if (!UUID_REGEX.test(snapshotId)) {
    throw new Error("operationId tidak valid. Harus berupa format UUID.");
  }

  const updatedAt = new Date().toISOString();

  if (typeof baseRevision !== "number" || !Number.isFinite(baseRevision) || Math.floor(baseRevision) !== baseRevision || baseRevision < 0) {
    throw new Error("baseRevision tidak valid. Harus berupa bilangan bulat non-negatif.");
  }
  const expectedRevision = baseRevision;
  const newRevision = expectedRevision + 1;

  // Build immutable chunks
  const chunks = parts.map((payload, chunkIndex) => ({
    id: STATE_PREFIX + snapshotId + "_" + String(chunkIndex).padStart(4, "0"),
    data: {
      snapshotId,
      chunkIndex,
      partCount: parts.length,
      payload
    },
  }));

  // Upload chunks in batches of at most 80 records per call
  for (let offset = 0; offset < chunks.length; offset += 80) {
    try {
      await callSinai("collections.upsertBatch", {
        collection: "lists",
        userId,
        records: chunks.slice(offset, offset + 80),
      });
    } catch (err: any) {
      if (/immutable/i.test(err?.message || "")) {
        throw new Error("Operation ID '" + snapshotId + "' telah digunakan dengan konten yang berbeda.");
      }
      throw err;
    }
  }

  // Atomic manifest activation via compare-and-swap with uncertain-commit reconciliation
  try {
    const commitResult = await callSinai("snapshot.commit", {
      collection: "lists",
      userId,
      snapshotId,
      expectedRevision,
      newRevision,
      partCount: parts.length,
      updatedAt,
    });

    const committedRevision = commitResult?.revision;
    if (typeof committedRevision !== "number" || !Number.isFinite(committedRevision) || committedRevision !== newRevision) {
      throw new Error("Penyimpanan gagal: konfirmasi komit manifes dari Google Sheets tidak mengembalikan revisi yang valid.");
    }

    return {
      revision: committedRevision,
      snapshotId
    };
  } catch (commitErr: any) {
    if (commitErr instanceof RevisionConflictError || commitErr instanceof LockBusyError) {
      throw commitErr;
    }

    // Uncertain network outcome: reconcile with active manifest in spreadsheet
    const reconciled = await reconcileCommit(userId, snapshotId, expectedRevision, newRevision);
    if (reconciled.status === "committed") {
      return {
        revision: reconciled.revision,
        snapshotId
      };
    }
    if (reconciled.status === "conflict") {
      throw new RevisionConflictError(
        "Snapshot sudah diperbarui oleh operasi lain.",
        reconciled.currentRevision
      );
    }

    throw new UncertainCommitError(
      reconciled.message || "Hasil komit snapshot belum dapat dipastikan karena batas waktu koneksi.",
      snapshotId,
      expectedRevision
    );
  }
}

