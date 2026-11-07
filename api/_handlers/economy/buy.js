/**
 * POST /api/economy/buy
 *
 * Purchases collection items with server-side catalog price, level and
 * ownership checks. Coin deduction and inventory insertion commit together.
 */

import { eq, and } from "drizzle-orm";
import { withTransaction, schema } from "../../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../../_lib/auth.js";
import { recordLedgerTransactionInTransaction } from "../../_lib/ledger.js";
import { calculateLevelFromXp } from "../../_lib/rewardsConfig.js";
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

    if (!itemId) {
      return sendValidationError(res, "Parameter itemId wajib disertakan.");
    }

    const purchase = await withTransaction(async (tx) => {
      // Serialize purchases for this account before checking balance/ownership.
      const profileRows = await tx
        .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id))
        .for("update")
        .limit(1);

      if (!profileRows.length) {
        throw validationError("Profil pengguna tidak ditemukan.");
      }

      const catalogRows = await tx
        .select()
        .from(schema.catalog)
        .where(and(
          eq(schema.catalog.id, itemId),
          eq(schema.catalog.isActive, true)
        ))
        .limit(1);

      if (!catalogRows.length) {
        throw validationError("Item tidak ditemukan di katalog.");
      }

      const item = catalogRows[0];
      const xp = Number(profileRows[0].xp) || 0;
      const coins = Number(profileRows[0].coins) || 0;
      const userLevel = calculateLevelFromXp(xp);

      if (userLevel < item.levelReq) {
        throw validationError(
          "Level cendekiawanmu belum mencukupi (Butuh Level " +
          item.levelReq +
          ", levelmu saat ini Level " +
          userLevel +
          ")."
        );
      }

      const existingItems = await tx
        .select({ id: schema.inventory.id })
        .from(schema.inventory)
        .where(and(
          eq(schema.inventory.userId, user.id),
          eq(schema.inventory.itemId, itemId)
        ))
        .limit(1);

      // Inventory has a unique (user_id, item_id) key, so each catalog item
      // can have one owned row. Checking it inside the locked transaction
      // avoids concurrent duplicate purchases.
      if (existingItems.length > 0) {
        throw validationError("Kamu sudah memiliki item ini di inventori.");
      }

      if (coins < item.price) {
        throw validationError(
          "Sinau Coin tidak mencukupi (Harga: " +
          item.price +
          " Coin, saldomu: " +
          coins +
          " Coin)."
        );
      }

      const eventId = "buy_item:" + user.id + ":" + itemId + ":" + Date.now();
      const ledger = await recordLedgerTransactionInTransaction(tx, {
        userId: user.id,
        eventId,
        source: "shop_purchase",
        xpEarned: 0,
        coinsEarned: -Number(item.price)
      });

      await tx.insert(schema.inventory).values({
        userId: user.id,
        itemId: item.id,
        equipped: false
      });

      return {
        item,
        remainingCoins: ledger.balanceAfterCoins
      };
    });

    return sendSuccess(
      res,
      purchase,
      "Berhasil membeli " +
        purchase.item.name +
        " seharga " +
        purchase.item.price +
        " Sinau Coin."
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API economy/buy] Error:", err);
    return sendServerError(res, "Gagal memproses pembelian item.");
  }
}
