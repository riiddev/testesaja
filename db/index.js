import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // The client bundle can be built without a database connection. Any API
  // request that needs the database will fail explicitly at runtime.
  console.warn("[Database] DATABASE_URL belum diatur di environment variable.");
}

// Stateless HTTP client for ordinary single-statement reads and writes.
const httpClient = neon(connectionString || "");
export const db = drizzleHttp(httpClient, { schema });

/**
 * Run an interactive Drizzle transaction using a request-scoped Neon
 * WebSocket pool. Neon advises that Pool/Client connections in serverless
 * handlers must be created, used and closed within the same request.
 */
export async function withTransaction(callback) {
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur untuk transaksi database.");
  }

  if (typeof globalThis.WebSocket !== "function") {
    throw new Error("Runtime Node.js tidak menyediakan WebSocket untuk transaksi database.");
  }

  neonConfig.webSocketConstructor = globalThis.WebSocket;
  const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000
  });

  try {
    const transactionDb = drizzleWs(pool, { schema });
    return await transactionDb.transaction(callback);
  } finally {
    // Do not leave WebSocket connections attached to a warm serverless
    // instance. A new pool is created only for the next transaction request.
    await pool.end();
  }
}

export { schema };
