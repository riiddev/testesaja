/**
 * POST /api/auth/register
 *
 * New credentials and primary session are created by Better Auth.
 * A short-lived compatibility bearer is issued for existing app endpoints.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { parseJsonBody } from "../../_lib/auth.js";
import { auth } from "../../_lib/better-auth.js";
import {
  createApplicationBridgeSession,
  getBetterAuthSessionFromHeaders,
  getLegacySessionCookie,
  getSetCookieHeaders
} from "../../_lib/app-auth-session.js";
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

  try {
    const body = await parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();

    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      errors.push({ field: "email", message: "Alamat email tidak valid." });
    }
    if (!password || password.length < 8 || password.length > 128) {
      errors.push({ field: "password", message: "Kata sandi harus terdiri dari 8–128 karakter." });
    }
    if (!displayName || displayName.length < 2 || displayName.length > 100) {
      errors.push({ field: "displayName", message: "Nama tampilan harus terdiri dari 2–100 karakter." });
    }

    if (errors.length > 0) {
      return sendValidationError(res, "Validasi pendaftaran gagal.", errors, 400);
    }

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

    const signup = await auth.api.signUpEmail({
      returnHeaders: true,
      body: {
        name: displayName,
        email,
        password
      }
    });

    const signupUser = signup?.response?.user;
    if (!signupUser?.id) {
      throw new Error("Better Auth tidak mengembalikan identitas akun setelah pendaftaran.");
    }

    const betterSession = await getBetterAuthSessionFromHeaders(signup.headers);
    if (!betterSession?.session?.id) {
      throw new Error("Sesi pendaftaran tidak berhasil dibuat. Silakan coba masuk kembali.");
    }

    const applicationSession = await createApplicationBridgeSession(
      signupUser.id,
      betterSession.session,
      signupUser.name || signupUser.displayName || displayName
    );

    const authCookies = getSetCookieHeaders(signup.headers);
    const cookies = [
      ...authCookies,
      getLegacySessionCookie(req, applicationSession.token)
    ];

    return sendSuccess(
      res,
      {
        token: applicationSession.token,
        user: applicationSession.user
      },
      "Pendaftaran berhasil! Selamat datang di SinauEnglish.",
      201,
      { "Set-Cookie": cookies }
    );
  } catch (err) {
    // Better Auth owns password hashing and credential persistence. Never
    // fall back to the legacy custom hash during a new account registration.
    const status = Number(err?.statusCode || err?.status);
    if (status === 400 || status === 409 || err?.code === "VALIDATION_ERROR") {
      return sendValidationError(
        res,
        err.message || "Pendaftaran tidak dapat diproses.",
        [],
        status === 409 ? 409 : 400
      );
    }
    console.error("[API register] Better Auth registration failed:", err);
    return sendServerError(res, "Gagal membuat akun. Silakan coba lagi.");
  }
}
