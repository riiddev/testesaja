/**
 * POST /api/economy/equip
 * 
 * Equips border or outfit item for active user.
 */

import { eq, and } from "drizzle-orm";
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
    const itemId = String(body.itemId || "").trim();
    const type = body.type === "outfit" ? "outfit" : "border";

    // 1. Verify user owns item
    const ownedItems = await db
      .select({
        id: schema.inventory.id,
        itemId: schema.inventory.itemId,
        type: schema.catalog.type
      })
      .from(schema.inventory)
      .innerJoin(schema.catalog, eq(schema.inventory.itemId, schema.catalog.id))
      .where(
        and(
          eq(schema.inventory.userId, user.id),
          eq(schema.inventory.itemId, itemId)
        )
      )
      .limit(1);

    if (!ownedItems.length) {
      return sendValidationError(res, "Item tidak ditemukan dalam inventori Anda.");
    }

    // 2. Find all user's items of the same type and unequip them
    const allUserItems = await db
      .select({
        id: schema.inventory.id,
        type: schema.catalog.type
      })
      .from(schema.inventory)
      .innerJoin(schema.catalog, eq(schema.inventory.itemId, schema.catalog.id))
      .where(eq(schema.inventory.userId, user.id));

    for (const it of allUserItems) {
      if (it.type === type) {
        await db
          .update(schema.inventory)
          .set({ equipped: false })
          .where(eq(schema.inventory.id, it.id));
      }
    }

    // 3. Equip target item
    await db
      .update(schema.inventory)
      .set({ equipped: true })
      .where(eq(schema.inventory.id, ownedItems[0].id));

    return sendSuccess(res, { equippedItemId: itemId }, "Item berhasil dipasang!");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API economy/equip] Error:", err);
    return sendServerError(res, "Gagal memasang item: " + err.message);
  }
}

