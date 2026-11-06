/**
 * GET /api/profile/get
 * 
 * Retrieves active user profile and unlocked titles from database.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const profileRows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);

    const unlockedTitles = await db
      .select({
        titleId: schema.titles.titleId,
        unlockedAt: schema.titles.unlockedAt
      })
      .from(schema.titles)
      .where(eq(schema.titles.userId, user.id));

    const profile = profileRows[0] || {
      userId: user.id,
      displayName: user.displayName,
      activeTitle: "",
      xp: 0,
      coins: 0,
      streak: 0,
      lastActiveDate: null,
      avatarKey: "avatar_1",
      avatarUpdatedAt: null
    };

    return sendSuccess(res, {
      profile,
      unlockedTitles: unlockedTitles.map((t) => t.titleId)
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API profile/get] Error:", err);
    return sendServerError(res, "Gagal memuat profil: " + err.message);
  }
}

