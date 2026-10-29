import { createSign } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

const MAX_PARTS = 24;
const PART_SIZE = 40_000;
const ACCOUNT_HEADER = ["user_id", "email", "password_hash", "created_at", "updated_at"];
const PROGRESS_HEADER = ["user_id", "updated_at", "part_count", ...Array.from({ length: MAX_PARTS }, (_, i) => "state_part_" + String(i + 1).padStart(2, "0"))];

let accessTokenCache: { token: string; expiresAt: number } | null = null;
let headersReady = false;

function requiredEnv(name: string): string {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error("Konfigurasi server belum lengkap. Admin perlu mengisi " + name + " di Environment Variables Vercel.");
  return value;
}

export function assertSheetsConfigured(): void {
  requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  requiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const secret = requiredEnv("SINAUU_SESSION_SECRET");
  if (secret.length < 32) throw new Error("SINAUU_SESSION_SECRET harus berupa rahasia acak minimal 32 karakter.");
}

function b64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function googleAccessToken(): Promise<string> {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) return accessTokenCache.token;
  assertSheetsConfigured();
  const email = requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = requiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const input = header + "." + claim;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  const assertion = input + "." + b64url(signer.sign(key));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error("Google Sheets gagal diautentikasi. Periksa service account dan private key di Vercel.");
  accessTokenCache = { token: body.access_token, expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000 };
  return body.access_token;
}

async function sheetsRequest(path: string, init: RequestInit = {}): Promise<any> {
  const spreadsheetId = requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const token = await googleAccessToken();
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(spreadsheetId) + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String(body?.error?.message || "");
    if (/Unable to parse range|not found/i.test(message)) {
      throw new Error("Google Sheets belum siap. Pastikan spreadsheet memiliki dua tab bernama persis Accounts dan LearningStates, lalu bagikan sebagai Editor kepada email service account.");
    }
    throw new Error("Permintaan ke Google Sheets gagal. Periksa ID spreadsheet, akses Editor service account, dan kuota Google Sheets API.");
  }
  return body;
}

async function getValues(range: string): Promise<string[][]> {
  const body = await sheetsRequest("/values/" + encodeURIComponent(range));
  return Array.isArray(body.values) ? body.values.map((row: any[]) => row.map((value) => String(value ?? ""))) : [];
}

async function putValues(range: string, values: any[][]): Promise<void> {
  await sheetsRequest("/values/" + encodeURIComponent(range) + "?valueInputOption=RAW", {
    method: "PUT",
    body: JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
}

async function appendValues(range: string, values: any[][]): Promise<void> {
  await sheetsRequest("/values/" + encodeURIComponent(range) + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", {
    method: "POST",
    body: JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
}

async function ensureHeaders(): Promise<void> {
  if (headersReady) return;
  // The sheet tabs are created once in the setup guide. Headers are initialized automatically.
  const accountHeader = await getValues("Accounts!A1:E1");
  if (!accountHeader.length || !accountHeader[0]?.[0]) await putValues("Accounts!A1:E1", [ACCOUNT_HEADER]);
  const progressHeader = await getValues("LearningStates!A1:AA1");
  if (!progressHeader.length || !progressHeader[0]?.[0]) await putValues("LearningStates!A1:AA1", [PROGRESS_HEADER]);
  headersReady = true;
}

export type AccountRow = {
  rowNumber: number;
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export async function readAccounts(): Promise<AccountRow[]> {
  await ensureHeaders();
  const rows = await getValues("Accounts!A2:E");
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    id: row[0] || "",
    email: (row[1] || "").toLowerCase(),
    passwordHash: row[2] || "",
    createdAt: row[3] || "",
    updatedAt: row[4] || "",
  })).filter((row) => row.id && row.email);
}

export async function appendAccount(row: [string, string, string, string, string]): Promise<void> {
  await ensureHeaders();
  await appendValues("Accounts!A:E", [row]);
}

export async function updateAccount(rowNumber: number, row: [string, string, string, string, string]): Promise<void> {
  await ensureHeaders();
  await putValues("Accounts!A" + rowNumber + ":E" + rowNumber, [row]);
}

export async function readProgress(userId: string): Promise<{ state: any; updatedAt: string } | null> {
  await ensureHeaders();
  const rows = await getValues("LearningStates!A2:AA");
  const rowIndex = rows.findIndex((row) => row[0] === userId);
  if (rowIndex < 0) return null;
  const row = rows[rowIndex];
  const partCount = Math.max(0, Math.min(MAX_PARTS, Number(row[2] || 0)));
  if (!partCount) return null;
  try {
    const packed = row.slice(3, 3 + partCount).join("");
    const json = gunzipSync(Buffer.from(packed, "base64")).toString("utf8");
    return { state: JSON.parse(json), updatedAt: row[1] || "" };
  } catch {
    throw new Error("Data progres di spreadsheet tidak dapat dibaca. Jangan menghapus atau mengedit isi kolom state_part secara manual.");
  }
}

export async function writeProgress(userId: string, state: unknown): Promise<void> {
  await ensureHeaders();
  const serialized = JSON.stringify(state);
  const packed = gzipSync(Buffer.from(serialized, "utf8")).toString("base64");
  const partCount = Math.ceil(packed.length / PART_SIZE);
  if (partCount < 1 || partCount > MAX_PARTS) {
    throw new Error("Progres terlalu besar untuk satu snapshot spreadsheet. Ekspor cadangan belajar dan hubungi admin sebelum mencoba lagi.");
  }
  const parts = Array.from({ length: MAX_PARTS }, (_, index) => packed.slice(index * PART_SIZE, (index + 1) * PART_SIZE));
  const updatedAt = new Date().toISOString();
  const values = [userId, updatedAt, String(partCount), ...parts];
  const rows = await getValues("LearningStates!A2:AA");
  const rowIndex = rows.findIndex((row) => row[0] === userId);
  if (rowIndex < 0) await appendValues("LearningStates!A:AA", [values]);
  else {
    const rowNumber = rowIndex + 2;
    await putValues("LearningStates!A" + rowNumber + ":AA" + rowNumber, [values]);
  }
}
