/**
 * POST /api/avatar/upload
 * 
 * Uploads user avatar into PostgreSQL bytea column (Strict limit <= 35 KB).
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../_lib/response.js";

const MAX_AVATAR_BYTES = 35840; // 35 KB hard cap

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const body = await parseJsonBody(req);
    const rawImage = String(body.imageBase64 || "").trim();
    const mimeType = String(body.mimeType || "image/webp").slice(0, 30);

    if (!rawImage) {
      return sendValidationError(res, "Foto profil base64 tidak boleh kosong.");
    }

    // Strip data URL header if present (e.g. data:image/webp;base64,...)
    const base64Data = rawImage.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    if (imageBuffer.length > MAX_AVATAR_BYTES) {
      return sendValidationError(
        res,
        `Ukuran foto terlalu besar (${Math.round(imageBuffer.length / 1024)} KB). Maksimal batas foto adalah 35 KB.`
      );
    }

    const now = new Date();

    // Upsert into avatars table
    const existing = await db
      .select({ userId: schema.avatars.userId })
      .from(schema.avatars)
      .where(eq(schema.avatars.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.avatars).values({
        userId: user.id,
        mimeType,
        imageData: imageBuffer,
        fileSize: imageBuffer.length,
        updatedAt: now
      });
    } else {
      await db
        .update(schema.avatars)
        .set({
          mimeType,
          imageData: imageBuffer,
          fileSize: imageBuffer.length,
          updatedAt: now
        })
        .where(eq(schema.avatars.userId, user.id));
    }

    // Update avatarUpdatedAt in profiles table
    await db
      .update(schema.profiles)
      .set({
        avatarUpdatedAt: now,
        updatedAt: now
      })
      .where(eq(schema.profiles.userId, user.id));

    return sendSuccess(
      res,
      {
        avatarUpdatedAt: now.toISOString(),
        fileSize: imageBuffer.length
      },
      "Foto profil berhasil diunggah."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API avatar/upload] Error:", err);
    return sendServerError(res, "Gagal mengunggah foto profil: " + err.message);
  }
}

