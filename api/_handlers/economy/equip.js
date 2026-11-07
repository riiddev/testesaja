/**
 * POST /api/economy/equip
 *
 * Equips one owned border or outfit. Unequipping the previous item and
 * equipping the selected item are committed as one transaction.
 */

import { eq, and } from "drizzle-orm";
import { getTransactionDb, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import {
  sendSuccess,
  sendAuthError,
  sendValidationError,
  sendServerError,
  sendJson
} from "../../_lib/response.js";

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metode HTTP tidak diizinkan. Gunakan POST." });
  }

  try {
    const { user } = await authenticateRequest(req);
    const body = await parseJsonBody(req);
    const itemId = String(body.itemId || "").trim();
    const type = body.type === "outfit" ? "outfit" : "border";

    if (!itemId) {
      return sendValidationError(res, "Parameter itemId wajib disertakan.");
    }

    await getTransactionDb().transaction(async (tx) => {
      await tx
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      const ownedItems = await tx
        .select({
          id: schema.inventory.id,
          itemId: schema.inventory.itemId,
          type: schema.catalog.type
        })
        .from(schema.inventory)
        .innerJoin(schema.catalog, eq(schema.inventory.itemId, schema.catalog.id))
        .where(and(
          eq(schema.inventory.userId, user.id),
          eq(schema.inventory.itemId, itemId)
        ))
        .limit(1);

      if (!ownedItems.length || ownedItems[0].type !== type) {
        throw validationError("Item tidak ditemukan dalam inventori Anda.");
      }

      await tx
        .update(schema.inventory)
        .set({ equipped: false })
        .where(eq(schema.inventory.userId, user.id));

      await tx
        .update(schema.inventory)
        .set({ equipped: true })
        .where(eq(schema.inventory.id, ownedItems[0].id));
    });

    return sendSuccess(res, { equippedItemId: itemId }, "Item berhasil dipasang!");
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API economy/equip] Error:", err);
    return sendServerError(res, "Gagal memasang item.");
  }
}
