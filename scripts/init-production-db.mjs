/**
 * SINAUENGLISH V2 — Production Database Initializer
 * 
 * Applies complete schema DDL (18 tables) and initial seed data (catalog items)
 * to a target Neon PostgreSQL database (e.g., Neon production branch).
 * 
 * Usage:
 *   node scripts/init-production-db.mjs
 *   node scripts/init-production-db.mjs --url="postgresql://..."
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CATALOG_ITEMS } from "../src/features/collection/collectionCatalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
  const targetUrl = urlArg ? urlArg.split("=")[1] : process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

  if (!targetUrl) {
    console.error("❌ ERROR: URL database tujuan tidak ditentukan.");
    console.error("   Gunakan: node scripts/init-production-db.mjs --url=\"postgresql://...\"");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("   SINAUENGLISH V2 — DATABASE INITIALIZER         ");
  console.log("==================================================");

  const sql = neon(targetUrl);

  console.log("📡 Menghubungkan ke database tujuan...");
  const [dbInfo] = await sql`SELECT current_database() AS db_name, version() AS ver`;
  console.log(`✓ Terhubung ke database: ${dbInfo.db_name}`);

  // 1. Read schema DDL
  const schemaPath = path.resolve(__dirname, "../drizzle/0000_init_neon_schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ File schema DDL tidak ditemukan di: ${schemaPath}`);
    process.exit(1);
  }

  console.log("📜 Membaca file DDL schema...");
  const rawSql = fs.readFileSync(schemaPath, "utf-8");

  // Drizzle migration files use `--> statement-breakpoint` to delimit statements
  const statements = rawSql
    .split(/-->\s*statement-breakpoint/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`⏳ Mengeksekusi ${statements.length} DDL statements...`);

  let appliedCount = 0;
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      appliedCount++;
    } catch (err) {
      // Ignore if table/type/constraint already exists
      if (err.message.includes("already exists") || err.message.includes("duplikat")) {
        // Safe to ignore on repeated runs
      } else {
        console.warn(`  ⚠️ Peringatan saat menjalankan statement: ${err.message}`);
      }
    }
  }

  console.log(`✓ ${appliedCount} statements berhasil dieksekusi.`);

  // 2. Seed catalog items
  console.log("🌱 Menyiapkan 11 item katalog toko koleksi...");
  let seededCatalog = 0;

  for (const item of CATALOG_ITEMS) {
    const itemData = {
      id: item.id,
      name: item.name,
      type: item.type,
      category: item.type === "border" ? "Avatar Border" : item.type === "outfit" ? "Mascot Outfit" : "Belajar",
      price: item.price,
      levelReq: item.levelReq,
      rarity: item.levelReq >= 8 ? "legendary" : item.levelReq >= 5 ? "rare" : "common",
      assetUrl: `/assets/${item.type === "border" ? "borders" : item.type === "outfit" ? "mascot" : "ui"}/${item.assetKey || item.id}.png`,
      isActive: true
    };

    await sql.query(`
      INSERT INTO catalog (id, name, type, category, price, level_req, rarity, asset_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        level_req = EXCLUDED.level_req,
        rarity = EXCLUDED.rarity,
        asset_url = EXCLUDED.asset_url,
        is_active = EXCLUDED.is_active;
    `, [
      itemData.id,
      itemData.name,
      itemData.type,
      itemData.category,
      itemData.price,
      itemData.levelReq,
      itemData.rarity,
      itemData.assetUrl,
      itemData.isActive
    ]);

    seededCatalog++;
  }

  console.log(`✓ ${seededCatalog} item katalog berhasil diverifikasi/diisi.`);

  // 3. Final verification
  const [catalogCount] = await sql`SELECT count(*)::int AS cnt FROM catalog`;
  const [userCount] = await sql`SELECT count(*)::int AS cnt FROM users`;

  console.log("==================================================");
  console.log("🎉 INITIALISASI DATABASE BERHASIL!");
  console.log(`  - Total Akun Pengguna : ${userCount.cnt} (Murni/Clean Slate)`);
  console.log(`  - Total Item Katalog : ${catalogCount.cnt} item`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ Gagal menginisialisasi database:", err);
  process.exit(1);
});

