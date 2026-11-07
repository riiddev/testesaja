/**
 * SINAUENGLISH V2 — Server-side Economy & XP/Coin Ledger Engine.
 *
 * All balance changes lock the user's profile row and write the ledger plus
 * profile balance in one PostgreSQL transaction.
 */

import { eq, and } from "drizzle-orm";
import { getTransactionDb, schema } from "../../db/index.js";

function validateAmount(value, label) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    const error = new Error("Nilai " + label + " transaksi tidak valid.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return amount;
}

export async function recordLedgerTransactionInTransaction(tx, {
  userId,
  eventId,
  source,
  xpEarned = 0,
  coinsEarned = 0
}) {
  if (!userId || !eventId || !source) {
    throw new Error("Parameter ledger transaksi tidak lengkap.");
  }

  const xpAmount = validateAmount(xpEarned, "XP");
  const coinsAmount = validateAmount(coinsEarned, "koin");

  // Serialize every economy operation for the same account. The lock is held
  // until the enclosing transaction commits or rolls back.
  const profileRows = await tx
    .select({ xp: schema.profiles.xp, coins: schema.profiles.coins })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .for("update")
    .limit(1);

  if (!profileRows.length) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const currentXp = Number(profileRows[0].xp) || 0;
  const currentCoins = Number(profileRows[0].coins) || 0;

  // Check idempotency only after the profile lock has been acquired. A
  // concurrent retry therefore sees the transaction committed by the first
  // request rather than attempting to apply the same event twice.
  const existingTx = await tx
    .select({ id: schema.transactions.id })
    .from(schema.transactions)
    .where(and(
      eq(schema.transactions.userId, userId),
      eq(schema.transactions.eventId, eventId)
    ))
    .limit(1);

  if (existingTx.length > 0) {
    return {
      alreadyProcessed: true,
      xpEarned: 0,
      coinsEarned: 0,
      totalXp: currentXp,
      totalCoins: currentCoins,
      balanceAfterCoins: currentCoins
    };
  }

  const newCoins = currentCoins + coinsAmount;
  if (!Number.isSafeInteger(newCoins) || newCoins < 0) {
    const error = new Error(
      "Saldo Sinau Coin tidak mencukupi (Butuh " +
      Math.abs(coinsAmount) +
      " Coin, saldomu " +
      currentCoins +
      " Coin)."
    );
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const newXp = Math.max(0, currentXp + xpAmount);
  if (!Number.isSafeInteger(newXp)) {
    const error = new Error("Jumlah XP melewati batas yang diizinkan.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  await tx.insert(schema.transactions).values({
    userId,
    eventId,
    source,
    xpAmount,
    coinsAmount,
    balanceAfterCoins: newCoins,
    createdAt: new Date()
  });

  const updatedRows = await tx
    .update(schema.profiles)
    .set({
      xp: newXp,
      coins: newCoins,
      updatedAt: new Date()
    })
    .where(eq(schema.profiles.userId, userId))
    .returning({ xp: schema.profiles.xp, coins: schema.profiles.coins });

  if (!updatedRows.length) {
    throw new Error("Saldo pengguna gagal diperbarui.");
  }

  return {
    alreadyProcessed: false,
    xpEarned: xpAmount,
    coinsEarned: coinsAmount,
    totalXp: Number(updatedRows[0].xp),
    totalCoins: Number(updatedRows[0].coins),
    balanceAfterCoins: Number(updatedRows[0].coins)
  };
}

export async function recordLedgerTransaction(params) {
  return getTransactionDb().transaction((tx) =>
    recordLedgerTransactionInTransaction(tx, params)
  );
}
