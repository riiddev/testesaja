/**
 * GET /api/economy/inventory
 * 
 * Returns user's owned collection items.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../../db/index.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);

    const userInventory = await db
      .select({
        id: schema.inventory.id,
        itemId: schema.inventory.itemId,
        equipped: schema.inventory.equipped,
        unlockedAt: schema.inventory.unlockedAt,
        name: schema.catalog.name,
        type: schema.catalog.type,
        category: schema.catalog.category,
        assetUrl: schema.catalog.assetUrl
      })
      .from(schema.inventory)
      .innerJoin(schema.catalog, eq(schema.inventory.itemId, schema.catalog.id))
      .where(eq(schema.inventory.userId, user.id));

    return sendSuccess(res, { inventory: userInventory });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API economy/inventory] Error:", err);
    return sendServerError(res, "Gagal memuat inventori: " + err.message);
  }
}

