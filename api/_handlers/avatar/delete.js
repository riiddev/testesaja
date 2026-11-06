/**
 * POST /api/avatar/delete
 * 
 * Removes custom avatar and resets avatarUpdatedAt in user profile.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST atau DELETE." });
  }

  try {
    const { user } = await authenticateRequest(req);

    await db.delete(schema.avatars).where(eq(schema.avatars.userId, user.id));

    await db
      .update(schema.profiles)
      .set({
        avatarUpdatedAt: null,
        updatedAt: new Date()
      })
      .where(eq(schema.profiles.userId, user.id));

    return sendSuccess(res, { hasAvatar: false }, "Foto profil berhasil dihapus.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API avatar/delete] Error:", err);
    return sendServerError(res, "Gagal menghapus foto profil: " + err.message);
  }
}
