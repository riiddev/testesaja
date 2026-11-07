import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// Prefer the direct/unpooled Neon connection for schema migrations.
// The pooled DATABASE_URL remains the application runtime connection.
// Fallback keeps local schema generation usable before the direct URL is set.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "";

export default defineConfig({
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl
  }
});
