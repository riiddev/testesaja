/**
 * SINAUENGLISH V2 — Secure Neon Connectivity Check
 *
 * Checks the pooled runtime URL and, when provided, the direct migration URL.
 * Never prints connection strings, credentials, database hostnames, or raw
 * driver error messages.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const targets = [
  {
    label: "Runtime connection (pooled)",
    url: process.env.DATABASE_URL,
    required: true,
    mustBePooled: true
  },
  {
    label: "Migration/backup connection (direct)",
    url: process.env.DATABASE_URL_UNPOOLED,
    required: false,
    mustBePooled: false
  }
];

function isPostgresUrl(value) {
  return typeof value === "string" &&
    (value.startsWith("postgres://") || value.startsWith("postgresql://"));
}

function hasPoolerHostname(value) {
  try {
    return new URL(value).hostname.includes("-pooler");
  } catch {
    return false;
  }
}

async function checkTarget(target) {
  if (!target.url) {
    const status = target.required ? "MISSING" : "NOT SET (optional)";
    console.log("  - " + target.label + ": " + status);
    return target.required ? false : true;
  }

  if (!isPostgresUrl(target.url)) {
    console.error("  - " + target.label + ": INVALID URL FORMAT");
    return false;
  }

  const pooled = hasPoolerHostname(target.url);
  if (target.mustBePooled && !pooled) {
    console.error("  - " + target.label + ": EXPECTED A POOLED URL (-pooler hostname)");
    return false;
  }
  if (!target.mustBePooled && pooled) {
    console.error("  - " + target.label + ": EXPECTED A DIRECT URL (hostname without -pooler)");
    return false;
  }

  const startedAt = Date.now();

  try {
    const sql = neon(target.url);
    const result = await sql`SELECT 1::int AS ok, current_setting('server_version_num') AS version_num`;
    const row = result[0] || {};

    if (Number(row.ok) !== 1) {
      console.error("  - " + target.label + ": UNEXPECTED QUERY RESULT");
      return false;
    }

    const elapsed = Date.now() - startedAt;
    const versionNum = String(row.version_num || "");
    const major = versionNum.length >= 2 ? versionNum.slice(0, 2) : "unknown";

    console.log("  - " + target.label + ": CONNECTED");
    console.log("      PostgreSQL major: " + major);
    console.log("      Round-trip: " + elapsed + " ms");
    return true;
  } catch (error) {
    // Driver error messages can contain endpoint or connection details.
    const safeCode = typeof error?.code === "string"
      ? error.code.replace(/[^A-Z0-9_]/gi, "").slice(0, 32)
      : "CONNECTION_FAILED";
    console.error("  - " + target.label + ": FAILED (" + safeCode + ")");
    return false;
  }
}

async function main() {
  console.log("SINAUENGLISH V2 — NEON CONNECTION CHECK");
  console.log("No connection details or credentials will be printed.");

  let success = true;
  for (const target of targets) {
    const current = await checkTarget(target);
    if (!current) success = false;
  }

  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.log("  NOTE: Set DATABASE_URL_UNPOOLED before running db:migrate or pg_dump.");
  }

  if (!success) {
    console.error("RESULT: CONNECTION CHECK FAILED");
    process.exitCode = 1;
    return;
  }

  console.log("RESULT: ALL CONFIGURED CONNECTIONS PASSED");
}

main().catch(() => {
  console.error("RESULT: CHECKER FAILED (UNEXPECTED_ERROR)");
  process.exitCode = 1;
});
