/**
 * SINAUENGLISH V2 — Secure Database Connection Checker
 * 
 * Verifies connectivity to Neon PostgreSQL via @neondatabase/serverless.
 * STRICT SECURITY: Never logs connection strings, passwords, or hostnames.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function checkConnection() {
  const dbUrl = process.env.DATABASE_URL;

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — DB CONNECTION CHECKER        ");
  console.log("==================================================");

  if (!dbUrl) {
    console.error("❌ STATUS: DATABASE_URL tidak ditemukan.");
    console.error("   Petunjuk: Buat berkas '.env' di root folder dan isi:");
    console.error("   DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
    console.log("==================================================");
    process.exit(1);
  }

  // Parse protocol to ensure it looks like postgresql://
  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.error("❌ STATUS: Format DATABASE_URL tidak valid (harus dimulai dengan postgresql:// atau postgres://).");
    process.exit(1);
  }

  console.log("🔄 Menghubungkan ke Neon PostgreSQL (Region Singapore)...");
  const startTime = Date.now();

  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT current_database() as db_name, version() as version, NOW() as server_time`;
    const latency = Date.now() - startTime;

    const row = result[0] || {};
    const dbName = row.db_name || "neondb";
    const pgVersion = (row.version || "").split(" ")[1] || "PostgreSQL";
    const serverTime = row.server_time ? new Date(row.server_time).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "WIB";

    console.log("✓ STATUS: BERHASIL TERHUBUNG!");
    console.log(`  - Database       : ${dbName}`);
    console.log(`  - Versi Mesin    : PostgreSQL ${pgVersion}`);
    console.log(`  - Waktu Server   : ${serverTime} WIB`);
    console.log(`  - Latensi Jaringan: ${latency} ms`);
    console.log("==================================================");
    console.log("🎉 Koneksi database Neon siap digunakan untuk migrasi!");
  } catch (err) {
    console.error("❌ STATUS: GAGAL TERHUBUNG KE DATABASE.");
    // Filter out any potential sensitive string from error message
    let safeMessage = err.message || "Unknown error";
    if (dbUrl.includes("@")) {
      const sensitivePart = dbUrl.split("@")[0];
      safeMessage = safeMessage.replaceAll(sensitivePart, "[REDACTED_CREDENTIALS]");
    }
    console.error(`  - Pesan Error   : ${safeMessage}`);
    console.error("  - Kemungkinan   : Endpoint sedang scale-to-zero (coba ulangi), kata sandi salah, atau SSL belum aktif.");
    console.log("==================================================");
    process.exit(1);
  }
}

checkConnection();
