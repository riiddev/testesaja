/**
 * GET /api/activity/history
 * 
 * Retrieves practice history with cursor-based pagination and module filtering.
 * BUTIR F: Riwayat Latihan with 90-day retention and mistake details.
 */

import { eq, and, lt, desc } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);
    const url = new URL(req.url, "http://localhost");
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit"), 10) || 10));
    const cursor = url.searchParams.get("cursor"); // ISO string timestamp
    const typeFilter = url.searchParams.get("type"); // optional module filter

    const conditions = [eq(schema.activityLog.userId, user.id)];

    if (typeFilter && typeFilter !== "all") {
      conditions.push(eq(schema.activityLog.activityType, typeFilter));
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        conditions.push(lt(schema.activityLog.createdAt, cursorDate));
      }
    }

    const rows = await db
      .select({
        id: schema.activityLog.id,
        activityType: schema.activityLog.activityType,
        title: schema.activityLog.title,
        score: schema.activityLog.score,
        totalQuestions: schema.activityLog.totalQuestions,
        accuracyPercent: schema.activityLog.accuracyPercent,
        durationSeconds: schema.activityLog.durationSeconds,
        xpEarned: schema.activityLog.xpEarned,
        coinsEarned: schema.activityLog.coinsEarned,
        createdAt: schema.activityLog.createdAt,
        wrongItems: schema.attemptDetails.wrongItems
      })
      .from(schema.activityLog)
      .leftJoin(
        schema.attemptDetails,
        eq(schema.activityLog.id, schema.attemptDetails.activityId)
      )
      .where(and(...conditions))
      .orderBy(desc(schema.activityLog.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return sendSuccess(res, {
      items: items.map((it) => ({
        ...it,
        createdAt: it.createdAt ? it.createdAt.toISOString() : null,
        wrongItems: Array.isArray(it.wrongItems) ? it.wrongItems : []
      })),
      nextCursor,
      hasMore
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API activity/history] Error:", err);
    return sendServerError(res, "Gagal memuat riwayat latihan: " + err.message);
  }
}

