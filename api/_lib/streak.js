/**
 * SINAUENGLISH V2 — Server-side Streak Calculation (Asia/Jakarta WIB).
 *
 * A profile-row lock prevents two simultaneous requests from incrementing a
 * streak twice or consuming the same streak-freeze item more than once.
 */

import { eq, and } from "drizzle-orm";
import { getTransactionDb, schema } from "../../db/index.js";
import { getWibDateStr, getWibYesterdayStr } from "./wibDate.js";

export async function evaluateAndRecordStreakInTransaction(tx, userId) {
  const todayWib = getWibDateStr(new Date());
  const yesterdayWib = getWibYesterdayStr(new Date());

  const profileRow = await tx
    .select({
      streak: schema.profiles.streak,
      lastActiveDate: schema.profiles.lastActiveDate
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .for("update")
    .limit(1);

  if (!profileRow.length) return null;

  const currentStreak = Number(profileRow[0].streak) || 0;
  const lastActiveDate = profileRow[0].lastActiveDate;

  if (lastActiveDate === todayWib) {
    return {
      streak: currentStreak,
      freezeUsed: false,
      recordedDate: todayWib
    };
  }

  let newStreak = 1;
  let freezeUsed = false;

  if (lastActiveDate === yesterdayWib) {
    newStreak = currentStreak + 1;
  } else if (lastActiveDate && lastActiveDate < yesterdayWib && currentStreak > 0) {
    const freezeItems = await tx
      .select({ id: schema.inventory.id })
      .from(schema.inventory)
      .where(and(
        eq(schema.inventory.userId, userId),
        eq(schema.inventory.itemId, "streak_freeze")
      ))
      .for("update")
      .limit(1);

    if (freezeItems.length > 0) {
      const consumed = await tx
        .delete(schema.inventory)
        .where(eq(schema.inventory.id, freezeItems[0].id))
        .returning({ id: schema.inventory.id });

      if (consumed.length > 0) {
        newStreak = currentStreak + 1;
        freezeUsed = true;
      }
    }
  }

  await tx
    .update(schema.profiles)
    .set({
      streak: newStreak,
      lastActiveDate: todayWib,
      updatedAt: new Date()
    })
    .where(eq(schema.profiles.userId, userId));

  return {
    streak: newStreak,
    freezeUsed,
    recordedDate: todayWib
  };
}

export async function evaluateAndRecordStreak(userId) {
  return getTransactionDb().transaction((tx) =>
    evaluateAndRecordStreakInTransaction(tx, userId)
  );
}
