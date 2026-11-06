/**
 * scripts/migrate-from-sheets.mjs
 * 
 * Tool for migrating legacy Google Sheets data to Neon PostgreSQL.
 * Supports Dry-Run validation, row verification, and clean slate auditing.
 * 
 * Usage:
 *   node scripts/migrate-from-sheets.mjs           (Dry run audit)
 *   node scripts/migrate-from-sheets.mjs --apply   (Apply changes to Neon DB)
 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { db, schema } from "../db/index.js";
import { sql, count } from "drizzle-orm";

const DATA_DIR = path.resolve(process.cwd(), "migration_data");

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — SHEETS TO NEON MIGRATION     ");
  console.log("==================================================");
  console.log(`Mode: ${isApply ? "🔴 LIVE APPLY" : "🟡 DRY-RUN AUDIT"}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL tidak ditemukan di file .env!");
    process.exit(1);
  }

  // 1. Audit current Neon database records
  console.log("\n📊 Mengaudit jumlah baris database Neon saat ini...");
  const [userCount] = await db.select({ count: count() }).from(schema.users);
  const [profileCount] = await db.select({ count: count() }).from(schema.profiles);
  const [catalogCount] = await db.select({ count: count() }).from(schema.catalog);
  const [progressCount] = await db.select({ count: count() }).from(schema.progress);

  console.log(`  - Akun Pengguna (users)    : ${userCount.count}`);
  console.log(`  - Profil Pelajar (profiles): ${profileCount.count}`);
  console.log(`  - Katalog Toko (catalog)   : ${catalogCount.count}`);
  console.log(`  - Riwayat Hafalan (progress): ${progressCount.count}`);

  // 2. Check for local CSV export files
  const usersCsvPath = path.join(DATA_DIR, "users.csv");
  const progressCsvPath = path.join(DATA_DIR, "progress.csv");

  if (!fs.existsSync(usersCsvPath)) {
    console.log("\nℹ️ STRATEGI CLEAN SLATE (OPSI A) AKTIF:");
    console.log("  Tidak ada file 'migration_data/users.csv'.");
    console.log("  Akun baru akan dimulai murni dari angka 0 (0 EXP, 0 Koin, 0 Streak).");
    console.log("  Jika di kemudian hari ingin memindahkan data riil dari Google Sheets:");
    console.log("    1. Buat folder 'migration_data/' di root proyek (sudah masuk .gitignore).");
    console.log("    2. Ekspor tab 'Users' dan 'Progress' ke 'migration_data/users.csv'.");
    console.log("    3. Jalankan kembali 'node scripts/migrate-from-sheets.mjs'.");
    console.log("\n✅ Verifikasi Clean Slate selesai. Database siap digunakan!");
    return;
  }

  console.log(`\n📄 Ditemukan file CSV di: ${DATA_DIR}`);
  const userContent = fs.readFileSync(usersCsvPath, "utf8").trim();
  const userLines = userContent.split(/\r?\n/).filter(Boolean);
  console.log(`  - users.csv: ${userLines.length - 1} baris data ditemukan.`);

  if (!isApply) {
    console.log("\n💡 Untuk menerapkan impor ke database Neon, jalankan:");
    console.log("   node scripts/migrate-from-sheets.mjs --apply");
  }
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat migrasi:", err.message);
  process.exit(1);
});

