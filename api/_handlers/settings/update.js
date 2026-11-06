/**
 * POST /api/settings/update
 * 
 * Updates user settings in database.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
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
    const body = await parseJsonBody(req);
    const input = body.settings || body;

    const updates = {};

    if (input.dailyGoal !== undefined) {
      const goal = parseInt(input.dailyGoal, 10);
      if (isNaN(goal) || goal < 1 || goal > 100) {
        return sendValidationError(res, "Target belajar harian harus antara 1 dan 100 kata.");
      }
      updates.dailyGoal = goal;
    }

    if (input.theme !== undefined) {
      updates.theme = input.theme === "dark" ? "dark" : "light";
    }

    if (input.soundEffects !== undefined) {
      updates.soundEffects = Boolean(input.soundEffects);
    }

    if (input.reminderEnabled !== undefined) {
      updates.reminderEnabled = Boolean(input.reminderEnabled);
    }

    if (input.morningReminderHour !== undefined) {
      const h = parseInt(input.morningReminderHour, 10);
      if (!isNaN(h) && h >= 0 && h <= 23) {
        updates.morningReminderHour = h;
      }
    }

    if (input.eveningReminderHour !== undefined) {
      const h = parseInt(input.eveningReminderHour, 10);
      if (!isNaN(h) && h >= 0 && h <= 23) {
        updates.eveningReminderHour = h;
      }
    }

    updates.updatedAt = new Date();

    // Check if settings record exists
    const existing = await db
      .select({ userId: schema.settings.userId })
      .from(schema.settings)
      .where(eq(schema.settings.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.settings).values({
        userId: user.id,
        dailyGoal: updates.dailyGoal ?? 10,
        theme: updates.theme ?? "light",
        soundEffects: updates.soundEffects ?? true,
        reminderEnabled: updates.reminderEnabled ?? false,
        morningReminderHour: updates.morningReminderHour ?? 7,
        eveningReminderHour: updates.eveningReminderHour ?? 19
      });
    } else {
      await db
        .update(schema.settings)
        .set(updates)
        .where(eq(schema.settings.userId, user.id));
    }

    return sendSuccess(res, { settings: updates }, "Pengaturan berhasil disimpan.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API settings/update] Error:", err);
    return sendServerError(res, "Gagal memperbarui pengaturan: " + err.message);
  }
}

