/**
 * GET /api/settings/get
 * 
 * Retrieves user settings from database with safe defaults.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const rows = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.userId, user.id))
      .limit(1);

    const userSettings = rows[0] || {
      userId: user.id,
      dailyGoal: 10,
      theme: "light",
      soundEffects: true,
      morningReminderHour: 7,
      eveningReminderHour: 19,
      reminderEnabled: false
    };

    return sendSuccess(res, { settings: userSettings });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API settings/get] Error:", err);
    return sendServerError(res, "Gagal memuat pengaturan: " + err.message);
  }
}

