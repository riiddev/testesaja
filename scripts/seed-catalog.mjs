/**
 * SINAUENGLISH V2 — Catalog Seeder Script
 * 
 * Seeds the initial 11 collection catalog items (6 borders, 4 outfits, 1 utility)
 * into Neon PostgreSQL without exposing database credentials.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { catalog } from "../db/schema.js";
import { CATALOG_ITEMS } from "../src/features/collection/collectionCatalog.js";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL tidak ditemukan di environment variables / file .env.");
    console.error("   Pastikan Anda telah mengisi DATABASE_URL di file .env lokal.");
    process.exit(1);
  }

  console.log("🌱 Menyiapkan seed katalog toko koleksi...");
  const sql = neon(dbUrl);
  const db = drizzle(sql);

  let insertedCount = 0;

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

    await db
      .insert(catalog)
      .values(itemData)
      .onConflictDoUpdate({
        target: catalog.id,
        set: {
          name: itemData.name,
          type: itemData.type,
          category: itemData.category,
          price: itemData.price,
          levelReq: itemData.levelReq,
          rarity: itemData.rarity,
          assetUrl: itemData.assetUrl,
          isActive: itemData.isActive
        }
      });

    insertedCount++;
  }

  console.log(`✓ Berhasil memuat ${insertedCount} item katalog ke tabel 'catalog'!`);
}

main().catch((err) => {
  console.error("❌ Gagal melakukan seed katalog:", err.message);
  process.exit(1);
});
