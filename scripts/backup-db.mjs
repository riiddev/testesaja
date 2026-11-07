/**
 * SINAUENGLISH V2 — Complete, Consistent Neon Database Backup
 *
 * Exports all application and authentication tables using one read-only
 * Repeatable Read transaction. A missing table or failed query aborts the
 * backup; partial files are never reported as successful backups.
 *
 * Usage:
 *   node scripts/backup-db.mjs
 *   node scripts/backup-db.mjs --out=custom-backup.json
 *
 * Set DATABASE_URL_UNPOOLED to the direct Neon connection string.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TABLES = Object.freeze([
  "users",
  "sessions",
  "profiles",
  "auth_accounts",
  "auth_sessions",
  "auth_verifications",
  "auth_rate_limits",
  "better_auth_rate_limits",
  "avatars",
  "user_stats",
  "settings",
  "catalog",
  "inventory",
  "transactions",
  "titles",
  "progress",
  "progress_events",
  "daily_quests",
  "quest_claims",
  "grammar_progress",
  "story_progress",
  "activity_log",
  "attempt_details"
]);

function getRows(result, table) {
  const rows = Array.isArray(result) ? result : result?.rows;
  if (!Array.isArray(rows)) {
    throw new Error("Format hasil ekspor tabel " + table + " tidak valid.");
  }
  return rows;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    throw new Error("DATABASE_URL_UNPOOLED tidak ditemukan. Backup wajib memakai URL Neon direct.");
  }

  let hostname = "";
  try {
    const parsed = new URL(dbUrl);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("URL database bukan PostgreSQL.");
    }
    hostname = parsed.hostname;
  } catch {
    throw new Error("DATABASE_URL_UNPOOLED bukan URL PostgreSQL yang valid.");
  }

  if (hostname.includes("-pooler")) {
    throw new Error("Backup wajib menggunakan URL direct Neon, bukan pooled.");
  }

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — NEON DATABASE BACKUP         ");
  console.log("==================================================");
  console.log("Credentials and connection details will not be printed.");

  const sql = neon(dbUrl);
  const startTime = Date.now();
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");

  const backupsDir = path.resolve(__dirname, "../backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const customOutArg = process.argv.find((arg) => arg.startsWith("--out="));
  const filename = customOutArg
    ? customOutArg.slice("--out=".length)
    : "backup-" + dateStr + ".json";

  if (!filename || filename.includes("\0")) {
    throw new Error("Nama file backup tidak valid.");
  }

  const targetPath = path.isAbsolute(filename)
    ? filename
    : path.join(backupsDir, filename);

  console.log("Menghubungkan ke database Neon...");
  const [dbInfo] = await sql`SELECT current_database() AS db_name, version() AS ver`;
  if (!dbInfo?.db_name) {
    throw new Error("Database tidak mengembalikan identitas yang valid.");
  }
  console.log("Terhubung ke database: " + dbInfo.db_name);

  // All table reads execute under one Repeatable Read snapshot, so a backup
  // cannot combine rows from different points in time during active learning.
  const queries = TABLES.map((table) =>
    sql.query('SELECT * FROM public."' + table + '"')
  );
  const resultSets = await sql.transaction(queries, {
    isolationLevel: "RepeatableRead",
    readOnly: true
  });

  if (!Array.isArray(resultSets) || resultSets.length !== TABLES.length) {
    throw new Error("Neon tidak mengembalikan seluruh hasil tabel. Backup dibatalkan.");
  }

  const backupData = {
    metadata: {
      formatVersion: 2,
      createdAt: now.toISOString(),
      database: dbInfo.db_name,
      engine: dbInfo.ver,
      totalTables: TABLES.length,
      tables: {}
    },
    tables: {}
  };

  let totalRecords = 0;

  for (let index = 0; index < TABLES.length; index += 1) {
    const table = TABLES[index];
    const rows = getRows(resultSets[index], table);
    backupData.tables[table] = rows;
    backupData.metadata.tables[table] = rows.length;
    totalRecords += rows.length;
    console.log(
      "  [OK] " + table.padEnd(24, " ") +
      " " + String(rows.length).padStart(6, " ") + " baris"
    );
  }

  // Write to a temporary file first. Rename is atomic on the same filesystem.
  const temporaryPath = targetPath + ".tmp-" + process.pid;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(backupData, null, 2), {
      encoding: "utf-8",
      flag: "wx"
    });
    fs.renameSync(temporaryPath, targetPath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    throw error;
  }

  const stats = fs.statSync(targetPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("==================================================");
  console.log("BACKUP BERHASIL");
  console.log("  - Tabel       : " + TABLES.length);
  console.log("  - Total baris : " + totalRecords);
  console.log("  - Ukuran file : " + sizeKb + " KB");
  console.log("  - Lokasi      : " + targetPath);
  console.log("  - Durasi      : " + elapsedSec + " detik");
  console.log("==================================================");
}

main().catch((error) => {
  const safeCode = typeof error?.code === "string"
    ? error.code.replace(/[^A-Z0-9_]/gi, "").slice(0, 32)
    : "BACKUP_FAILED";
  console.error("BACKUP GAGAL (" + safeCode + "). Tidak ada backup parsial yang dinyatakan berhasil.");
  process.exitCode = 1;
});
