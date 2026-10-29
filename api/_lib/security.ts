import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_BYTES = 64;
const ACCESS_TTL_SECONDS = 60 * 60 * 2;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const explicit = process.env.SINAI_SESSION_SECRET || process.env.SINAUU_SESSION_SECRET || "";
  if (explicit.length >= 32) return explicit;
  const apiKey = String(process.env.SINAI_API_KEY || "");
  if (apiKey.length >= 32) {
    return createHmac("sha256", apiKey).update("sinau/session-token-signing-key/v1").digest("hex");
  }
  throw new Error("Konfigurasi server belum lengkap. Admin perlu mengisi SINAI_API_KEY atau SINAI_SESSION_SECRET di Environment Variables Vercel.");
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export type PasswordRecord = { passwordHash: string; passwordSalt: string };

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, PASSWORD_BYTES, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }) as Buffer;
  return { passwordHash: Buffer.from(derived).toString("hex"), passwordSalt: salt.toString("hex") };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  try {
    if (!/^(?:[a-f0-9]{32,128})$/i.test(storedSalt) || !/^(?:[a-f0-9]{64,256})$/i.test(storedHash)) return false;
    const salt = Buffer.from(storedSalt, "hex");
    const expected = Buffer.from(storedHash, "hex");
    const actual = await scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export type TokenType = "access" | "refresh";
export type SessionClaims = { sub: string; email: string; typ: TokenType; iat: number; exp: number };

function makeToken(claims: SessionClaims): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const input = header + "." + payload;
  return input + "." + createHmac("sha256", secret()).update(input).digest("base64url");
}

export function issueSession(user: { id: string; email: string }) {
  const now = Math.floor(Date.now() / 1000);
  const access = makeToken({ sub: user.id, email: user.email, typ: "access", iat: now, exp: now + ACCESS_TTL_SECONDS });
  const refresh = makeToken({ sub: user.id, email: user.email, typ: "refresh", iat: now, exp: now + REFRESH_TTL_SECONDS });
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: ACCESS_TTL_SECONDS,
    expires_at: now + ACCESS_TTL_SECONDS,
    user: { id: user.id, email: user.email },
  };
}

export function verifyToken(token: string, expectedType: TokenType): SessionClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const input = parts[0] + "." + parts[1];
    const actual = Buffer.from(parts[2], "base64url");
    const expected = Buffer.from(createHmac("sha256", secret()).update(input).digest("base64url"), "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as SessionClaims;
    if (header.alg !== "HS256" || claims.typ !== expectedType || !claims.sub || !claims.email ||
      !Number.isFinite(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function bearerToken(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  const match = String(value || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}
