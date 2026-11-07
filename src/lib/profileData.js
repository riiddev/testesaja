export function getUserScopedStorageKey(baseKey, userId) {
  if (typeof baseKey !== "string" || !baseKey) {
    throw new TypeError("Cache key harus berupa teks yang tidak kosong.");
  }
  return userId ? `${baseKey}_${String(userId)}` : baseKey;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

/**
 * Normalize the canonical server profile. Deliberately do not merge previous
 * local state: a legitimate server-side zero must replace any stale cached
 * XP, coin, or streak value.
 */
export function normalizeServerProfile(remoteProfile = {}, fallbackDisplayName = "") {
  const displayName = typeof remoteProfile.displayName === "string" &&
    remoteProfile.displayName.trim()
    ? remoteProfile.displayName.trim()
    : (String(fallbackDisplayName || "").trim() || "Pelajar Sinau");

  return {
    displayName,
    activeTitle: typeof remoteProfile.activeTitle === "string" ? remoteProfile.activeTitle : "",
    avatarKey: typeof remoteProfile.avatarKey === "string" && remoteProfile.avatarKey
      ? remoteProfile.avatarKey
      : "avatar_1",
    xp: toNonNegativeInteger(remoteProfile.xp),
    coins: toNonNegativeInteger(remoteProfile.coins),
    streak: toNonNegativeInteger(remoteProfile.streak),
    lastActiveDate: remoteProfile.lastActiveDate ?? null
  };
}
