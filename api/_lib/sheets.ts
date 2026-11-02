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
    response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, apiKey, action }),
      signal: AbortSignal.timeout(15_000),
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
    if (code === "LOCK_BUSY") {
      throw new LockBusyError(message || "Server sibuk. Gagal mendapatkan lock untuk snapshot commit.");
    }
    if (/email sudah terdaftar/i.test(message)) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
    if (/unauthorized/i.test(message)) throw new Error("API key tidak cocok dengan Google Apps Script. Periksa environment variable dan deployment Apps Script.");
    if (/maksimal .*record/i.test(message)) throw new Error(message);
    if (/tidak valid|wajib|harus|diizinkan|tidak dikenal/i.test(message)) throw new Error(message);
    throw new Error("Google Sheets gagal memproses permintaan. Periksa konfigurasi Apps Script.");
  }
  return result.data;
}

export async function ensureSheetsReady(): Promise<void> {
  assertSheetsConfigured();
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
  const manifest = records.find((record) => recordId(record) === MANIFEST_ID);
  const manifestData: Record<string, any> = manifest?.data || {};
  const snapshotId = String(manifestData.snapshotId || "");
  const slot = String(manifestData.slot || "");
  const revision = typeof manifestData.revision === "number" ? manifestData.revision : 0;
  const partCount = Math.max(0, Math.min(MAX_CHUNKS, Number(manifestData.partCount || 0)));

  if (!snapshotId || partCount < 1) return null;

  const isLegacy = slot === "A" || slot === "B";
  const byIndex = new Map<number, CollectionRecord>();

  for (const record of records) {
    const data = record.data || {};
    if (data.snapshotId !== snapshotId) continue;
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

/**
 * Writes progress using unique immutable chunk IDs and an atomic manifest CAS commit.
 */
export async function writeProgress(userId: string, state: unknown, baseRevision: number = 0): Promise<{ revision: number; snapshotId: string }> {
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

  const snapshotId = randomUUID();
  const updatedAt = new Date().toISOString();
  const expectedRevision = Math.max(0, Math.floor(Number(baseRevision) || 0));
  const newRevision = expectedRevision + 1;

  // Build immutable chunks
  const chunks = parts.map((payload, chunkIndex) => ({
    id: STATE_PREFIX + snapshotId + "_" + String(chunkIndex).padStart(4, "0"),
    data: {
      snapshotId,
      chunkIndex,
      partCount: parts.length,
      updatedAt,
      payload
    },
  }));

  // Upload chunks in batches of at most 80 records per call
  for (let offset = 0; offset < chunks.length; offset += 80) {
    await callSinai("collections.upsertBatch", {
      collection: "lists",
      userId,
      records: chunks.slice(offset, offset + 80),
    });
  }

  // Atomic manifest activation via compare-and-swap
  const commitResult = await callSinai("snapshot.commit", {
    collection: "lists",
    userId,
    snapshotId,
    expectedRevision,
    newRevision,
    partCount: parts.length,
    updatedAt,
  });

  return {
    revision: Number(commitResult?.revision || newRevision),
    snapshotId
  };
}

