import test from "node:test";
import assert from "node:assert/strict";
import {
  getUserScopedStorageKey,
  normalizeServerProfile
} from "../src/lib/profileData.js";

test("authenticated profile cache keys are isolated by user", () => {
  assert.equal(getUserScopedStorageKey("sinau_local_profile", "user-a"), "sinau_local_profile_user-a");
  assert.equal(getUserScopedStorageKey("sinau_local_profile", "user-b"), "sinau_local_profile_user-b");
  assert.notEqual(
    getUserScopedStorageKey("sinau_local_profile", "user-a"),
    getUserScopedStorageKey("sinau_local_profile", "user-b")
  );
});

test("guest cache key remains compatible with the old guest namespace", () => {
  assert.equal(getUserScopedStorageKey("sinau_local_profile", null), "sinau_local_profile");
});

test("server zeros replace stale positive local profile values", () => {
  const profile = normalizeServerProfile({
    displayName: "Pelajar",
    activeTitle: "",
    avatarKey: "avatar_1",
    xp: 0,
    coins: 0,
    streak: 0,
    lastActiveDate: null
  }, "Fallback");

  assert.deepEqual(profile, {
    displayName: "Pelajar",
    activeTitle: "",
    avatarKey: "avatar_1",
    xp: 0,
    coins: 0,
    streak: 0,
    lastActiveDate: null
  });
});

test("missing or malformed server counters never reuse stale client values", () => {
  const profile = normalizeServerProfile({
    xp: undefined,
    coins: null,
    streak: "not-a-number"
  }, "Nama dari sesi");

  assert.equal(profile.displayName, "Nama dari sesi");
  assert.equal(profile.xp, 0);
  assert.equal(profile.coins, 0);
  assert.equal(profile.streak, 0);
});
