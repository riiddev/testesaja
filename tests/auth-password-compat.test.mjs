import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, needsPasswordRehash } from "../api/_lib/auth.js";

function legacyHash(password, salt) {
  let digest = crypto
    .createHash("sha256")
    .update(`${salt}:${password}`, "utf8")
    .digest();

  for (let iteration = 1; iteration < 5000; iteration++) {
    digest = crypto.createHash("sha256").update(digest).digest();
  }

  return digest.toString("hex");
}

test("verifies legacy Apps Script SHA-256 × 5,000 hashes", () => {
  const password = "LegacyPassword#2026";
  const salt = "legacy-salt-123456";
  const hash = legacyHash(password, salt);

  assert.equal(hash.length, 64);
  assert.equal(verifyPassword(password, hash, salt), true);
  assert.equal(verifyPassword("wrong-password", hash, salt), false);
  assert.equal(needsPasswordRehash(hash), true);
});

test("verifies current Vercel scrypt hashes and does not request rehash", () => {
  const password = "CurrentPassword#2026";
  const { hash, salt } = hashPassword(password);

  assert.equal(hash.length, 128);
  assert.equal(verifyPassword(password, hash, salt), true);
  assert.equal(verifyPassword("wrong-password", hash, salt), false);
  assert.equal(needsPasswordRehash(hash), false);
});

test("rejects malformed or unsupported password hash formats", () => {
  assert.equal(verifyPassword("x", "not-a-hash", "salt"), false);
  assert.equal(verifyPassword("x", "a".repeat(96), "salt"), false);
  assert.equal(needsPasswordRehash("a".repeat(96)), false);
});
