/**
 * SINAUENGLISH V2 — Database Restore Script
 * 
 * Restores database state from a backup JSON file produced by backup-db.mjs.
 * Supports --dry-run mode for pre-flight validation.
 * 
 * Usage:
 *   node scripts/restore-db.mjs --dry-run
 *   node scripts/restore-db.mjs --file=backups/backup-custom.json
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ordered by foreign key dependency
const RESTORE_ORDER = [
  "users",
  "catalog",
  "sessions",
  "profiles",
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
];

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));

  const backupsDir = path.resolve(__dirname, "../backups");
  let backupFilePath;

  if (fileArg) {
    backupFilePath = fileArg.split("=")[1];
    if (!path.isAbsolute(backupFilePath)) {
      backupFilePath = path.resolve(process.cwd(), backupFilePath);
    }
  } else {
    // Pick newest backup in backups directory
    if (!fs.existsSync(backupsDir)) {
      console.error("❌ Direktori backups/ tidak ditemukan.");
      process.exit(1);
    }
    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) {
      console.error("❌ Tidak ada file backup di direktori backups/.");
      process.exit(1);
    }
    backupFilePath = path.join(backupsDir, files[0]);
  }

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ File backup tidak ditemukan: ${backupFilePath}`);
    process.exit(1);
  }

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — DATABASE RESTORE TOOL        ");
  console.log("==================================================");
  console.log(`📂 Membaca file backup: ${path.basename(backupFilePath)}`);
  if (isDryRun) {
    console.log("🔍 MODE: DRY-RUN (Hanya simulasi, tidak mengubah database)");
  }

  const backupContent = JSON.parse(fs.readFileSync(backupFilePath, "utf-8"));
  const metadata = backupContent.metadata || {};
  console.log(`📅 Dibuat pada : ${metadata.createdAt || "Tidak diketahui"}`);
  console.log(`🗄️ Sumber DB   : ${metadata.database || "Tidak diketahui"}`);

  const tables = backupContent.tables || {};
  let totalRowsInBackup = 0;

  for (const table of RESTORE_ORDER) {
    const rows = tables[table] || [];
    totalRowsInBackup += rows.length;
    console.log(`  📦 [${table.padEnd(18, " ")}] -> ${rows.length.toString().padStart(5, " ")} baris ditemukan`);
  }

  console.log(`Total baris dalam backup: ${totalRowsInBackup}`);

  if (isDryRun) {
    console.log("==================================================");
    console.log("✓ Simulasi verifikasi file backup BERHASIL!");
    console.log("  Jalankan tanpa flag --dry-run untuk memulihkan ke database aktif.");
    console.log("==================================================");
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  const sql = neon(dbUrl);
  console.log("📡 Menghubungkan ke Neon database tujuan...");

  let restoredTotal = 0;

  for (const table of RESTORE_ORDER) {
    const rows = tables[table] || [];
    if (rows.length === 0) continue;

    console.log(`⏳ Memulihkan tabel ${table} (${rows.length} baris)...`);
    for (const row of rows) {
      const keys = Object.keys(row);
      const cols = keys.join(", ");
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
      const values = keys.map((k) => row[k]);

      // Insert with ON CONFLICT DO NOTHING for safe idempotent restoration
      const queryStr = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      await sql.query(queryStr, values);
      restoredTotal++;
    }
    console.log(`✓ Tabel ${table} berhasil dipulihkan.`);
  }

  console.log("==================================================");
  console.log(`🎉 PEMULIHAN DATABASE SELESAI! Total ${restoredTotal} baris diproses.`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ Gagal saat memulihkan database:", err);
  process.exit(1);
});

