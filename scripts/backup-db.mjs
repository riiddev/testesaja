/**
 * SINAUENGLISH V2 — Database Backup Script
 * 
 * Safely extracts all database tables into structured JSON format
 * for disaster recovery and offline archival.
 * 
 * Usage:
 *   node scripts/backup-db.mjs
 *   node scripts/backup-db.mjs --out=custom-backup.json
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TABLES = [
  "users",
  "sessions",
  "profiles",
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
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL tidak ditemukan di environment variables / .env.");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — NEON DATABASE BACKUP         ");
  console.log("==================================================");

  const sql = neon(dbUrl);

  const startTime = Date.now();
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");

  const backupsDir = path.resolve(__dirname, "../backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const customOutArg = process.argv.find((arg) => arg.startsWith("--out="));
  const filename = customOutArg ? customOutArg.split("=")[1] : `backup-${dateStr}.json`;
  const targetPath = path.isAbsolute(filename) ? filename : path.join(backupsDir, filename);

  console.log(`📡 Menghubungkan ke database Neon...`);
  const [dbInfo] = await sql`SELECT current_database() AS db_name, version() AS ver`;
  console.log(`✓ Terhubung ke: ${dbInfo.db_name}`);

  const backupData = {
    metadata: {
      createdAt: now.toISOString(),
      database: dbInfo.db_name,
      engine: dbInfo.ver,
      totalTables: TABLES.length,
      tables: {}
    },
    tables: {}
  };

  let totalRecords = 0;

  for (const table of TABLES) {
    try {
      const rows = await sql.query(`SELECT * FROM ${table}`);
      backupData.tables[table] = rows;
      backupData.metadata.tables[table] = rows.length;
      totalRecords += rows.length;
      console.log(`  📦 [${table.padEnd(18, " ")}] -> ${rows.length.toString().padStart(5, " ")} baris diekspor`);
    } catch (err) {
      console.warn(`  ⚠️ [${table.padEnd(18, " ")}] -> Dilewati (${err.message})`);
      backupData.metadata.tables[table] = 0;
      backupData.tables[table] = [];
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), "utf-8");
  const stats = fs.statSync(targetPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("==================================================");
  console.log(`✅ BACKUP SELESAI DALAM ${elapsedSec} DETIK!`);
  console.log(`  - Total Baris : ${totalRecords} baris`);
  console.log(`  - Ukuran File : ${sizeKb} KB`);
  console.log(`  - Lokasi File : ${targetPath}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ Gagal mengeksekusi backup database:", err);
  process.exit(1);
});
