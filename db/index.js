import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // If no DATABASE_URL is set, log a warning (e.g. during build or static analysis)
  console.warn("[Database] DATABASE_URL belum diatur di environment variable.");
}

// Stateless HTTP client — zero persistent connection pool overhead, perfectly suited for Vercel Functions
const sql = neon(connectionString || "");

export const db = drizzle(sql, { schema });
export { schema };
