import { TITLES_CATALOG } from "../src/features/profile/titleSystem.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  getUserScopedStorageKey,
  normalizeServerProfile,
  normalizeServerUserStats
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


test("server review ledger is mapped to the title-system totalReviewsDone counter", () => {
  const stats = normalizeServerUserStats({
    wordsStarted: 12,
    wordsMastered: 4,
    b2Mastered: 1,
    totalReviews: 37
  });

  assert.deepEqual(stats, {
    totalStartedWords: 12,
    masteredWordsCount: 4,
    b2MasteredCount: 1,
    totalReviewsDone: 37
  });
});

test("server review counters do not derive from progress correct/wrong balances", () => {
  // A wrong answer decreases correctCount and increases wrongCount, while the
  // server's totalReviews ledger still advances by exactly one event.
  const stats = normalizeServerUserStats({
    wordsStarted: 1,
    wordsMastered: 0,
    b2Mastered: 0,
    totalReviews: 9
  });

  assert.equal(stats.totalReviewsDone, 9);
  assert.equal(stats.totalReviewsDone > (2 + 2), true);
});

test("missing server statistics signal an offline/local fallback rather than fake zero cloud data", () => {
  assert.equal(normalizeServerUserStats(undefined), null);
  assert.equal(normalizeServerUserStats(null), null);
  assert.equal(normalizeServerUserStats([]), null);
});


test("zero streak remains zero in consistency title progress", () => {
  const streakTitles = TITLES_CATALOG.filter((title) =>
    title.id === "cadence_keeper" || title.id === "endurance_polymath"
  );

  assert.equal(streakTitles.length, 2);
  for (const title of streakTitles) {
    const progress = title.evaluate({ streak: 0 });
    assert.equal(progress.current, 0);
    assert.equal(progress.percentage, 0);
    assert.equal(progress.unlocked, false);
  }
});
