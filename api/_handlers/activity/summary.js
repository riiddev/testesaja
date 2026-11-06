/**
 * GET /api/activity/summary
 * 
 * Generates 7-day learning summary & accuracy trend for Riwayat Latihan (Butir F).
 */

import { eq, and, gte, desc } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    // 7 Days ago in WIB
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        activityType: schema.activityLog.activityType,
        accuracyPercent: schema.activityLog.accuracyPercent,
        xpEarned: schema.activityLog.xpEarned,
        coinsEarned: schema.activityLog.coinsEarned,
        durationSeconds: schema.activityLog.durationSeconds,
        createdAt: schema.activityLog.createdAt
      })
      .from(schema.activityLog)
      .where(
        and(
          eq(schema.activityLog.userId, user.id),
          gte(schema.activityLog.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(schema.activityLog.createdAt));

    // Aggregate by day (last 7 days)
    const daysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getWibDateStr(d);
      daysMap[dateKey] = {
        dateStr: dateKey,
        dayLabel: d.toLocaleDateString("id-ID", { weekday: "short", timeZone: "Asia/Jakarta" }),
        sessionCount: 0,
        xpTotal: 0,
        coinsTotal: 0,
        accuracySum: 0,
        accuracyCount: 0
      };
    }

    let totalDuration = 0;
    let totalXp = 0;

    for (const r of rows) {
      const dayKey = getWibDateStr(r.createdAt);
      if (daysMap[dayKey]) {
        daysMap[dayKey].sessionCount += 1;
        daysMap[dayKey].xpTotal += r.xpEarned || 0;
        daysMap[dayKey].coinsTotal += r.coinsEarned || 0;
        if (r.accuracyPercent !== null && r.accuracyPercent !== undefined) {
          daysMap[dayKey].accuracySum += r.accuracyPercent;
          daysMap[dayKey].accuracyCount += 1;
        }
      }
      totalDuration += r.durationSeconds || 0;
      totalXp += r.xpEarned || 0;
    }

    const days = Object.values(daysMap).map((d) => ({
      dateStr: d.dateStr,
      dayLabel: d.dayLabel,
      sessionCount: d.sessionCount,
      xpTotal: d.xpTotal,
      coinsTotal: d.coinsTotal,
      avgAccuracy: d.accuracyCount > 0 ? Math.round(d.accuracySum / d.accuracyCount) : 0
    }));

    return sendSuccess(res, {
      days,
      totalSessions7Days: rows.length,
      totalXp7Days: totalXp,
      totalDurationMinutes: Math.round(totalDuration / 60)
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API activity/summary] Error:", err);
    return sendServerError(res, "Gagal memuat ringkasan latihan: " + err.message);
  }
}

