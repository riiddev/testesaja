/**
 * POST /api/profile/update
 * 
 * Updates safe profile fields: displayName, activeTitle, avatarKey.
 * STRICT SECURITY: Rejects any modification to XP, coins, or streak!
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../_lib/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const body = await parseJsonBody(req);

    // Whitelist allowed fields only
    const updates = {};

    // 1. Display Name
    if (body.displayName !== undefined) {
      const name = String(body.displayName).trim();
      if (name.length < 2 || name.length > 50) {
        return sendValidationError(res, "Nama tampilan harus antara 2 hingga 50 karakter.");
      }
      updates.displayName = name;
    }

    // 2. Avatar Key (preset avatars)
    if (body.avatarKey !== undefined) {
      updates.avatarKey = String(body.avatarKey).slice(0, 50);
    }

    // 3. Active Title
    if (body.activeTitle !== undefined) {
      const titleId = String(body.activeTitle).trim();
      if (titleId === "") {
        updates.activeTitle = "";
      } else {
        // Verify user actually owns this title
        const owned = await db
          .select({ id: schema.titles.id })
          .from(schema.titles)
          .where(
            and(
              eq(schema.titles.userId, user.id),
              eq(schema.titles.titleId, titleId)
            )
          )
          .limit(1);

        if (!owned.length) {
          return sendValidationError(res, "Gelar belum terbuka atau tidak ditemukan.");
        }
        updates.activeTitle = titleId;
      }
    }

    // Any attempt to forge XP, coins, or streak is completely ignored / discarded
    updates.updatedAt = new Date();

    await db
      .update(schema.profiles)
      .set(updates)
      .where(eq(schema.profiles.userId, user.id));

    if (updates.displayName) {
      await db
        .update(schema.users)
        .set({ displayName: updates.displayName })
        .where(eq(schema.users.id, user.id));
    }

    return sendSuccess(res, { profile: updates }, "Profil berhasil disimpan.");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API profile/update] Error:", err);
    return sendServerError(res, "Gagal memperbarui profil: " + err.message);
  }
}

