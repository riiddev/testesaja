/**
 * GET /api/auth/me
 * 
 * Verifies active session token and returns authenticated user identity.
 */

import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);
    return sendSuccess(res, { user }, "Sesi aktif terverifikasi.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API me] Error:", err);
    return sendServerError(res, "Gagal memverifikasi sesi: " + err.message);
  }
}

