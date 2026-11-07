/**
 * GET /api/matching/round
 *
 * Creates a short-lived, account-bound Matching challenge from the official
 * vocabulary catalogue. The signed token is required to submit its result.
 */

import { authenticateRequest } from "../../_lib/auth.js";
import { createOfficialMatchingRound } from "../../_lib/matchingCatalog.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

const ALLOWED_LEVELS = new Set(["all", "A1", "A2", "B1", "B2"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan GET." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const url = new URL(req.url, "http://localhost");
    const requestedLevel = String(url.searchParams.get("level") || "all");
    if (!ALLOWED_LEVELS.has(requestedLevel)) {
      return sendValidationError(res, "Filter level Matching tidak valid.");
    }

    const round = createOfficialMatchingRound(user.id, requestedLevel);
    return sendSuccess(res, round, "Ronde Matching resmi berhasil dibuat.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API matching/round] Error:", err);
    return sendServerError(res, "Gagal membuat ronde Matching.");
  }
}
