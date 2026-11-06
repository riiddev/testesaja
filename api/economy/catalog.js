/**
 * GET /api/economy/catalog
 * 
 * Returns collection store catalog items.
 */

import { eq, asc } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { sendSuccess, sendServerError } from "../_lib/response.js";

export default async function handler(req, res) {
  try {
    const items = await db
      .select()
      .from(schema.catalog)
      .where(eq(schema.catalog.isActive, true))
      .orderBy(asc(schema.catalog.levelReq), asc(schema.catalog.price));

    return sendSuccess(res, { catalog: items });
  } catch (err) {
    console.error("[API economy/catalog] Error:", err);
    return sendServerError(res, "Gagal memuat katalog koleksi: " + err.message);
  }
}

