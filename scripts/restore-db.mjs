/**
 * SINAUENGLISH V2 — Safe Database Restore Tool
 *
 * Restores rows from a complete version-2 backup produced by backup-db.mjs.
 * Existing rows are preserved through ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   node scripts/restore-db.mjs --dry-run --file=backups/backup.json
 *   node scripts/restore-db.mjs --file=backups/backup.json
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

// Ordered by foreign-key dependency. The drizzle migration journal is
// intentionally excluded: the target schema must be migrated separately.
const SERIAL_ID_TABLES = Object.freeze([
  "progress_events",
  "transactions",
  "inventory",
  "titles",
  "daily_quests",
  "quest_claims"
]);

const RESTORE_ORDER = Object.freeze([
  "users",
  "catalog",
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
  "progress",
  "progress_events",
  "transactions",
  "inventory",
  "titles",
  "grammar_progress",
  "story_progress",
  "daily_quests",
  "quest_claims",
  "activity_log",
  "attempt_details"
]);

function quoteIdentifier(identifier) {
  return '"' + String(identifier).replaceAll('"', '""') + '"';
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const backupsDir = path.resolve(__dirname, "../backups");
  let backupFilePath;

  if (fileArg) {
    backupFilePath = fileArg.slice("--file=".length);
    if (!path.isAbsolute(backupFilePath)) {
      backupFilePath = path.resolve(process.cwd(), backupFilePath);
    }
  } else {
    if (!fs.existsSync(backupsDir)) {
      throw new Error("Direktori backups/ tidak ditemukan.");
    }
    const files = fs.readdirSync(backupsDir)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .reverse();

    if (!files.length) {
      throw new Error("Tidak ada file backup di direktori backups/.");
    }
    backupFilePath = path.join(backupsDir, files[0]);
  }

  if (!fs.existsSync(backupFilePath)) {
    throw new Error("File backup tidak ditemukan.");
  }

  const backupContent = JSON.parse(fs.readFileSync(backupFilePath, "utf-8"));
  const metadata = backupContent.metadata || {};
  const tables = backupContent.tables || {};

  if (metadata.formatVersion !== 2) {
    throw new Error(
      "Format backup lama/tidak lengkap. Buat backup versi 2 yang mencakup semua tabel autentikasi sebelum restore."
    );
  }

  const missingTables = RESTORE_ORDER.filter(
    (table) => !Object.prototype.hasOwnProperty.call(tables, table) ||
      !Array.isArray(tables[table])
  );

  if (missingTables.length) {
    throw new Error(
      "Backup tidak lengkap. Jumlah tabel wajib yang hilang: " + missingTables.length
    );
  }

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — DATABASE RESTORE TOOL        ");
  console.log("==================================================");
  console.log("File backup : " + path.basename(backupFilePath));
  console.log("Dibuat      : " + (metadata.createdAt || "Tidak diketahui"));
  console.log("Sumber DB   : " + (metadata.database || "Tidak diketahui"));
  console.log("Format      : " + metadata.formatVersion);
  console.log("Tabel       : " + RESTORE_ORDER.length);

  let totalRowsInBackup = 0;
  for (const table of RESTORE_ORDER) {
    const count = tables[table].length;
    totalRowsInBackup += count;
    console.log("  " + table.padEnd(24, " ") + String(count).padStart(6, " ") + " baris");
  }

  console.log("Total baris: " + totalRowsInBackup);

  if (isDryRun) {
    console.log("DRY-RUN BERHASIL. Tidak ada database yang diubah.");
    return;
  }

  const dbUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    throw new Error("DATABASE_URL_UNPOOLED tidak ditemukan. Restore wajib memakai URL Neon direct.");
  }

  let hostname = "";
  try {
    const parsed = new URL(dbUrl);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("URL bukan PostgreSQL.");
    }
    hostname = parsed.hostname;
  } catch {
    throw new Error("DATABASE_URL_UNPOOLED bukan URL PostgreSQL yang valid.");
  }
  if (hostname.includes("-pooler")) {
    throw new Error("Restore wajib menggunakan URL direct Neon, bukan pooled.");
  }

  const sql = neon(dbUrl);
  const [dbInfo] = await sql`SELECT current_database() AS db_name`;
  if (!dbInfo?.db_name) {
    throw new Error("Database tujuan tidak mengembalikan identitas yang valid.");
  }
  console.log("Database tujuan: " + dbInfo.db_name);

  let restoredTotal = 0;

  for (const table of RESTORE_ORDER) {
    const rows = tables[table];
    if (!rows.length) continue;

    console.log("Memulihkan " + table + " (" + rows.length + " baris)...");
    for (const row of rows) {
      const keys = Object.keys(row);
      if (!keys.length) continue;

      const columns = keys.map(quoteIdentifier).join(", ");
      const placeholders = keys.map((_, index) => "$" + (index + 1)).join(", ");
      const values = keys.map((key) => row[key]);
      const query = "INSERT INTO public." + quoteIdentifier(table) +
        " (" + columns + ") VALUES (" + placeholders + ") ON CONFLICT DO NOTHING";

      await sql.query(query, values);
      restoredTotal += 1;
    }
  }

  // Explicitly restored BIGSERIAL IDs do not automatically advance their
  // PostgreSQL sequences. Synchronize each known serial sequence so the next
  // application insert cannot collide with a restored ID.
  for (const table of SERIAL_ID_TABLES) {
    const sequenceRows = await sql`
      SELECT pg_get_serial_sequence(${"public." + table}, 'id') AS sequence_name
    `;
    const sequenceName = sequenceRows[0]?.sequence_name;
    if (!sequenceName) continue;

    const maxRows = await sql.query(
      "SELECT COALESCE(MAX(id), 0)::bigint AS max_id FROM public." + quoteIdentifier(table)
    );
    const maxId = Number(maxRows[0]?.max_id || 0);

    await sql`
      SELECT setval(
        ${sequenceName}::regclass,
        ${maxId > 0 ? maxId : 1},
        ${maxId > 0}
      )
    `;
  }

  console.log("==================================================");
  console.log("RESTORE SELESAI — " + restoredTotal + " baris diproses.");
  console.log("ON CONFLICT DO NOTHING menjaga data yang sudah ada tetap utuh.");
  console.log("==================================================");
}

main().catch((error) => {
  const safeCode = typeof error?.code === "string"
    ? error.code.replace(/[^A-Z0-9_]/gi, "").slice(0, 32)
    : "RESTORE_FAILED";
  console.error("RESTORE GAGAL (" + safeCode + "). Periksa format backup, skema tujuan, dan koneksi.");
  process.exitCode = 1;
});
