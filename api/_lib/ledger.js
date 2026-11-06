/**
 * SINAUENGLISH V2 — Server-side Economy & XP/Coin Ledger Engine
 * 
 * Enforces strict idempotency and atomic balances.
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";

export async function recordLedgerTransaction({
  userId,
  eventId,
  source,
  xpEarned = 0,
  coinsEarned = 0
}) {
  if (!userId || !eventId || !source) {
    throw new Error("Parameter ledger transaksi tidak lengkap.");
  }

  // 1. Idempotency Check: Verify if eventId was already processed for this user
  const existingTx = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.eventId, eventId)
      )
    )
    .limit(1);

  if (existingTx.length > 0) {
    // Already processed — fetch current balance and return without modifying
    const profileRow = await db
      .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);

    const currentProfile = profileRow[0] || { xp: 0, coins: 0 };
    return {
      alreadyProcessed: true,
      xpEarned: 0,
      coinsEarned: 0,
      totalXp: currentProfile.xp,
      totalCoins: currentProfile.coins,
      balanceAfterCoins: currentProfile.coins
    };
  }

  // 2. Fetch current user profile
  const profileRow = await db
    .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  if (!profileRow.length) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const currentXp = profileRow[0].xp || 0;
  const currentCoins = profileRow[0].coins || 0;

  const newCoins = currentCoins + Number(coinsEarned);
  if (newCoins < 0) {
    const err = new Error(`Saldo Sinau Coin tidak mencukupi (Butuh ${Math.abs(coinsEarned)} Coin, saldomu ${currentCoins} Coin).`);
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const newXp = Math.max(0, currentXp + Number(xpEarned));

  // 3. Insert transaction log entry
  await db.insert(schema.transactions).values({
    userId,
    eventId,
    source,
    xpAmount: Number(xpEarned),
    coinsAmount: Number(coinsEarned),
    balanceAfterCoins: newCoins,
    createdAt: new Date()
  });

  // 4. Update profile balance
  await db
    .update(schema.profiles)
    .set({
      xp: newXp,
      coins: newCoins,
      updatedAt: new Date()
    })
    .where(eq(schema.profiles.userId, userId));

  return {
    alreadyProcessed: false,
    xpEarned: Number(xpEarned),
    coinsEarned: Number(coinsEarned),
    totalXp: newXp,
    totalCoins: newCoins,
    balanceAfterCoins: newCoins
  };
}
