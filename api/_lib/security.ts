import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_ITERATIONS = 310_000;
const ACCESS_TTL_SECONDS = 60 * 60 * 2;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const value = String(process.env.SINAUU_SESSION_SECRET || "");
  if (value.length < 32) throw new Error("Konfigurasi server belum lengkap. Admin perlu mengisi SINAUU_SESSION_SECRET minimal 32 karakter di Vercel.");
  return value;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256");
  return "pbkdf2$" + PASSWORD_ITERATIONS + "$" + salt.toString("base64url") + "$" + derived.toString("base64url");
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algorithm, iterationsRaw, saltRaw, hashRaw] = stored.split("$");
    if (algorithm !== "pbkdf2" || !iterationsRaw || !saltRaw || !hashRaw) return false;
    const iterations = Number(iterationsRaw);
    if (iterations < 100_000 || iterations > 1_000_000) return false;
    const expected = Buffer.from(hashRaw, "base64url");
    const actual = pbkdf2Sync(password, Buffer.from(saltRaw, "base64url"), iterations, expected.length, "sha256");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

type TokenType = "access" | "refresh";
export type SessionClaims = { sub: string; email: string; typ: TokenType; iat: number; exp: number };

function makeToken(claims: SessionClaims): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const input = header + "." + payload;
  return input + "." + sign(input);
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
    user,
  };
}

export function verifyToken(token: string, expectedType: TokenType): SessionClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const input = parts[0] + "." + parts[1];
    const actual = Buffer.from(parts[2], "base64url");
    const expected = Buffer.from(sign(input), "base64url");
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
