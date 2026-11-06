/**
 * POST /api/auth/register
 * 
 * Creates a brand-new user account starting strictly from ZERO.
 * Server is the source of truth.
 */

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import {
  hashPassword,
  createSessionToken,
  parseJsonBody,
  getSessionCookieSecurity
} from "../../_lib/auth.js";
import {
  sendSuccess,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  let createdUserId = null;

  try {
    const body = await parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();

    // 1. Validation
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      errors.push({ field: "email", message: "Alamat email tidak valid." });
    }
    if (!password || password.length < 8) {
      errors.push({ field: "password", message: "Kata sandi minimal harus 8 karakter." });
    }
    if (!displayName || displayName.length < 2) {
      errors.push({ field: "displayName", message: "Nama tampilan minimal harus 2 karakter." });
    }

    if (errors.length > 0) {
      return sendValidationError(res, "Validasi pendaftaran gagal.", errors, 400);
    }

    // 2. Check if email already registered
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return sendValidationError(res, "Email ini sudah terdaftar. Silakan masuk.", [
        { field: "email", message: "Email sudah digunakan." }
      ], 409);
    }

    // 3. Hash Password
    const { hash, salt } = hashPassword(password);
    const userId = "u_" + crypto.randomBytes(8).toString("hex");
    createdUserId = userId;
    const { rawToken, tokenHash } = createSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // 4. Create Account (Sequential inserts with compensation rollback)
    // a. Insert User
    await db.insert(schema.users).values({
      id: userId,
      email,
      displayName,
      passwordHash: hash,
      salt,
      role: "student",
      lastLoginAt: new Date()
    });

    // b. Insert Profile starting strictly from 0
    await db.insert(schema.profiles).values({
      userId,
      displayName,
      activeTitle: "",
      xp: 0,
      coins: 0,
      streak: 0,
      avatarKey: "avatar_1"
    });

    // c. Insert User Stats starting strictly from 0
    await db.insert(schema.userStats).values({
      userId,
      wordsStarted: 0,
      wordsMastered: 0,
      b2Mastered: 0,
      totalReviews: 0,
      grammarCompleted: 0,
      readingCompleted: 0,
      storiesCompleted: 0,
      matchingCompleted: 0
    });

    // d. Insert Default Settings
    await db.insert(schema.settings).values({
      userId,
      dailyGoal: 10,
      theme: "light",
      soundEffects: true,
      morningReminderHour: 7,
      eveningReminderHour: 19,
      reminderEnabled: false
    });

    // e. Insert Active Session
    await db.insert(schema.sessions).values({
      id: "sess_" + crypto.randomBytes(8).toString("hex"),
      userId,
      tokenHash,
      expiresAt
    });

    const cookieHeader = `sinau_session=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; SameSite=Lax${getSessionCookieSecurity(req)}; Max-Age=${30 * 24 * 60 * 60}`;

    return sendSuccess(
      res,
      {
        token: rawToken,
        user: {
          id: userId,
          email,
          displayName,
          role: "student"
        }
      },
      "Pendaftaran berhasil! Selamat datang di SinauEnglish.",
      201,
      { "Set-Cookie": cookieHeader }
    );
  } catch (err) {
    console.error("[API register] Error:", err);
    // Compensation rollback if user was partially inserted
    if (createdUserId) {
      try {
        await db.delete(schema.users).where(eq(schema.users.id, createdUserId));
      } catch (e) {}
    }
    return sendServerError(res, "Gagal memproses pendaftaran. " + err.message);
  }
}
