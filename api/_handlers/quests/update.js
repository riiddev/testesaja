/**
 * POST /api/quests/update
 *
 * Compatibility refresh endpoint. Progress and targets are always calculated
 * from server-written learning events; client progress/target/date fields are ignored.
 */
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { getDailyQuestSnapshot } from "../../_lib/dailyQuestProgress.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    // Parse the body to preserve the API's existing request contract, but never
    // trust quest progress, target, or date values from the browser.
    await parseJsonBody(req);
    const todayWib = getWibDateStr(new Date());
    const snapshot = await getDailyQuestSnapshot(user.id, todayWib);

    return sendSuccess(
      res,
      snapshot,
      "Progres misi diperbarui berdasarkan aktivitas yang tercatat di server."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API quests/update] Error:", err);
    return sendServerError(res, "Gagal memperbarui progres misi: " + err.message);
  }
}
