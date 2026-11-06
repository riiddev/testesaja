/**
 * POST /api/quests/update
 * 
 * Updates daily quest progress for today (Asia/Jakarta WIB).
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
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
    const questId = String(body.questId || "").trim();
    const progress = Math.max(0, parseInt(body.progress, 10) || 0);
    const target = Math.max(1, parseInt(body.target, 10) || 1);
    const todayWib = getWibDateStr(new Date());

    if (!questId) {
      return sendValidationError(res, "Parameter questId wajib disertakan.");
    }

    const isCompleted = progress >= target;

    // Check if quest row exists
    const existing = await db
      .select()
      .from(schema.dailyQuests)
      .where(
        and(
          eq(schema.dailyQuests.userId, user.id),
          eq(schema.dailyQuests.questDate, todayWib),
          eq(schema.dailyQuests.questId, questId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.dailyQuests).values({
        userId: user.id,
        questDate: todayWib,
        questId,
        currentProgress: Math.min(progress, target),
        target,
        isCompleted
      });
    } else {
      const current = existing[0].currentProgress;
      const updated = Math.min(target, Math.max(current, progress));
      await db
        .update(schema.dailyQuests)
        .set({
          currentProgress: updated,
          target,
          isCompleted: updated >= target,
          updatedAt: new Date()
        })
        .where(eq(schema.dailyQuests.id, existing[0].id));
    }

    return sendSuccess(res, { questId, progress, isCompleted }, "Progres misi berhasil disimpan.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API quests/update] Error:", err);
    return sendServerError(res, "Gagal menyimpan progres misi: " + err.message);
  }
}

