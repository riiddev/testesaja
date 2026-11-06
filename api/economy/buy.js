/**
 * POST /api/economy/buy
 * 
 * Purchases collection items with server-side catalog price & balance validation.
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest, parseJsonBody } from "../_lib/auth.js";
import { recordLedgerTransaction } from "../_lib/ledger.js";
import { calculateLevelFromXp } from "../_lib/rewardsConfig.js";
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
    const itemId = String(body.itemId || "").trim();

    if (!itemId) {
      return sendValidationError(res, "Parameter itemId wajib disertakan.");
    }

    // 1. Check Catalog Item
    const catRows = await db
      .select()
      .from(schema.catalog)
      .where(and(eq(schema.catalog.id, itemId), eq(schema.catalog.isActive, true)))
      .limit(1);

    if (!catRows.length) {
      return sendValidationError(res, "Item tidak ditemukan di katalog.");
    }

    const item = catRows[0];

    // 2. Fetch User Profile
    const profileRows = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);

    if (!profileRows.length) {
      return sendValidationError(res, "Profil pengguna tidak ditemukan.");
    }

    const { xp, coins } = profileRows[0];

    // 3. Level Requirement Check
    const userLevel = calculateLevelFromXp(xp);
    if (userLevel < item.levelReq) {
      return sendValidationError(
        res,
        `Level cendekiawanmu belum mencukupi (Butuh Level ${item.levelReq}, levelmu saat ini Level ${userLevel}).`
      );
    }

    // 4. Ownership Limit Check
    const existingItems = await db
      .select()
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.userId, user.id),
          eq(schema.inventory.itemId, itemId)
        )
      );

    if (item.type === "border" || item.type === "outfit") {
      if (existingItems.length > 0) {
        return sendValidationError(res, "Kamu sudah memiliki item ini di inventori.");
      }
    } else if (itemId === "streak_freeze") {
      if (existingItems.length >= 2) {
        return sendValidationError(res, "Kamu sudah mencapai batas simpanan Pelindung Streak (maksimal 2).");
      }
    }

    // 5. Coin Balance Check
    if (coins < item.price) {
      return sendValidationError(
        res,
        `Sinau Coin tidak mencukupi (Harga: ${item.price} Coin, saldomu: ${coins} Coin).`
      );
    }

    // 6. Execute Deduct Transaction in Ledger
    const eventId = `buy_item:${user.id}:${itemId}:${Date.now()}`;
    const tx = await recordLedgerTransaction({
      userId: user.id,
      eventId,
      source: "shop_purchase",
      xpEarned: 0,
      coinsEarned: -item.price
    });

    // 7. Insert Item into Inventory
    await db.insert(schema.inventory).values({
      userId: user.id,
      itemId: item.id,
      equipped: false
    });

    return sendSuccess(
      res,
      {
        item,
        remainingCoins: tx.balanceAfterCoins
      },
      `Berhasil membeli ${item.name} seharga ${item.price} Sinau Coin.`
    );
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    if (err.statusCode === 400 || err.code === "VALIDATION_ERROR") {
      return sendValidationError(res, err.message);
    }
    console.error("[API economy/buy] Error:", err);
    return sendServerError(res, "Gagal memproses pembelian item: " + err.message);
  }
}

