/**
 * SINAUENGLISH V2 — Server-side Streak Calculation (Asia/Jakarta WIB)
 */

import { eq, and } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { getWibDateStr, getWibYesterdayStr } from "./wibDate.js";

export async function evaluateAndRecordStreak(userId) {
  const todayWib = getWibDateStr(new Date());
  const yesterdayWib = getWibYesterdayStr(new Date());

  const profileRow = await db
    .select({
      streak: schema.profiles.streak,
      lastActiveDate: schema.profiles.lastActiveDate
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  if (!profileRow.length) return null;

  const currentStreak = profileRow[0].streak || 0;
  const lastActiveDate = profileRow[0].lastActiveDate;

  // 1. Already recorded activity today in WIB
  if (lastActiveDate === todayWib) {
    return {
      streak: currentStreak,
      freezeUsed: false,
      recordedDate: todayWib
    };
  }

  let newStreak = 1;
  let freezeUsed = false;

  // 2. Activity yesterday in WIB -> Increment streak
  if (lastActiveDate === yesterdayWib) {
    newStreak = currentStreak + 1;
  } else if (lastActiveDate && lastActiveDate < yesterdayWib && currentStreak > 0) {
    // 3. Gap detected: check if user owns a streak freeze in inventory
    const freezeItem = await db
      .select({ id: schema.inventory.id })
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.userId, userId),
          eq(schema.inventory.itemId, "streak_freeze")
        )
      )
      .limit(1);

    if (freezeItem.length > 0) {
      // Consume 1 streak freeze and preserve streak
      await db
        .delete(schema.inventory)
        .where(eq(schema.inventory.id, freezeItem[0].id));

      newStreak = currentStreak + 1;
      freezeUsed = true;
    } else {
      // Reset streak to 1
      newStreak = 1;
    }
  }

  // Update profile
  await db
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
