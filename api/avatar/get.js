/**
 * GET /api/avatar/get
 * 
 * Retrieves user custom avatar from bytea column as base64 data URL.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest } from "../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const rows = await db
      .select({
        mimeType: schema.avatars.mimeType,
        imageData: schema.avatars.imageData,
        updatedAt: schema.avatars.updatedAt
      })
      .from(schema.avatars)
      .where(eq(schema.avatars.userId, user.id))
      .limit(1);

    if (rows.length === 0 || !rows[0].imageData) {
      return sendSuccess(res, {
        hasAvatar: false,
        avatarUrl: null,
        avatarUpdatedAt: null
      });
    }

    const { mimeType, imageData, updatedAt } = rows[0];
    const base64 = Buffer.from(imageData).toString("base64");
    const avatarUrl = `data:${mimeType};base64,${base64}`;

    return sendSuccess(res, {
      hasAvatar: true,
      avatarUrl,
      avatarUpdatedAt: updatedAt ? updatedAt.toISOString() : null
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API avatar/get] Error:", err);
    return sendServerError(res, "Gagal memuat foto profil: " + err.message);
  }
}

