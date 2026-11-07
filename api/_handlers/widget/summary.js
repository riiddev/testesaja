/**
 * GET /api/widget/summary
 * 
 * Lightweight, read-only endpoint optimized for Android Homescreen Widgets
 * (2x2 Quick Streak & SRS Card, 4x2 Mission & Progress Card) and launcher glanceables.
 * 
 * Response time target: < 100ms.
 */

import { neon } from "@neondatabase/serverless";
import { authenticateRequest } from "../../_lib/auth.js";
import { getWibDateStr } from "../../_lib/wibDate.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return sendServerError(res, "Database configuration missing");
    }

    const sql = neon(dbUrl);
    const todayWib = getWibDateStr();

    // 1. Fetch Profile and User Stats in parallel single-row lookups
    const [profile] = await sql`
      SELECT display_name, active_title, xp, coins, streak, avatar_key
      FROM profiles
      WHERE user_id = ${user.id}
    `;

    // 2. Fetch Due SRS Reviews Count
    const [srsDue] = await sql`
      SELECT count(*)::int AS count
      FROM progress
      WHERE user_id = ${user.id}
        AND (next_review_at IS NULL OR next_review_at <= NOW())
    `;

    // 3. Fetch Daily Quests for Today
    const quests = await sql`
      SELECT quest_id, current_progress, target, is_completed
      FROM daily_quests
      WHERE user_id = ${user.id} AND quest_date = ${todayWib}
    `;

    const xp = profile?.xp ?? 0;
    const coins = profile?.coins ?? 0;
    const streak = profile?.streak ?? 0;
    const level = Math.floor(xp / 100) + 1;

    const totalMissions = quests.length > 0 ? quests.length : 3;
    const completedMissions = quests.filter((q) => q.is_completed).length;
    const allCompleted = totalMissions > 0 && completedMissions === totalMissions;

    // Cache header: 60s private cache to prevent battery and bandwidth drain on Android
    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=120");

    return sendSuccess(res, {
      user: {
        id: user.id,
        displayName: profile?.display_name || user.displayName,
        activeTitle: profile?.active_title || "Penjelajah Kata"
      },
      stats: {
        level,
        xp,
        coins,
        streak
      },
      srs: {
        dueReviewsCount: srsDue?.count ?? 0
      },
      quests: {
        total: totalMissions,
        completed: completedMissions,
        allCompleted
      },
      timestamp: new Date().toISOString()
    }, "Widget summary berhasil diambil");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API widget summary] Error:", err);
    return sendServerError(res, "Gagal mengambil data widget: " + err.message);
  }
}
