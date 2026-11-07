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

// Fast stateless HTTP client for ordinary single-statement reads and writes.
const httpClient = neon(connectionString || "");
export const db = drizzleHttp(httpClient, { schema });

// Neon HTTP does not support interactive Drizzle transactions. Keep a lazy,
// bounded WebSocket pool for the few operations that must be atomic.
let transactionPool;
let transactionDb;

export function getTransactionDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur untuk transaksi database.");
  }

  if (!transactionDb) {
    if (typeof globalThis.WebSocket !== "function") {
      throw new Error("Runtime Node.js tidak menyediakan WebSocket untuk transaksi database.");
    }

    neonConfig.webSocketConstructor = globalThis.WebSocket;
    transactionPool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000
    });
    transactionDb = drizzleWs(transactionPool, { schema });
  }

  return transactionDb;
}

export { schema };
