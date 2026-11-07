/**
 * GET /api/quests/get
 * Returns today's server-generated daily missions and server-verified progress.
 */
import { authenticateRequest } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { getDailyQuestSnapshot } from "../../_lib/dailyQuestProgress.js";
import { sendSuccess, sendAuthError, sendServerError, sendJson } from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan GET." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const todayWib = getWibDateStr(new Date());
    const snapshot = await getDailyQuestSnapshot(user.id, todayWib);
    return sendSuccess(res, snapshot);
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API quests/get] Error:", err);
    return sendServerError(res, "Gagal memuat misi harian: " + err.message);
  }
}
