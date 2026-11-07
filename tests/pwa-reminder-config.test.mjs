import test from "node:test";
import assert from "node:assert/strict";
import {
  getReminderStorageKey,
  getWibDateTimeParts,
  reminderConfigFromServerSettings,
  reminderConfigToServerSettings
} from "../src/lib/reminderConfig.js";

test("reminder preferences are namespaced by account", () => {
  assert.equal(getReminderStorageKey("user-a"), "sinau_pwa_settings_user-a");
  assert.equal(getReminderStorageKey("user-b"), "sinau_pwa_settings_user-b");
  assert.notEqual(getReminderStorageKey("user-a"), getReminderStorageKey("user-b"));
  assert.equal(getReminderStorageKey(null), "sinau_pwa_settings_guest");
});

test("server reminder settings map to and from the UI time format", () => {
  const config = reminderConfigFromServerSettings({
    reminderEnabled: true,
    morningReminderHour: 7,
    eveningReminderHour: 21
  });

  assert.deepEqual(config, {
    enabled: true,
    morningHour: "07:00",
    eveningHour: "21:00"
  });
  assert.deepEqual(reminderConfigToServerSettings(config), {
    reminderEnabled: true,
    morningReminderHour: 7,
    eveningReminderHour: 21
  });
});

test("invalid reminder hour values fall back to safe defaults", () => {
  assert.deepEqual(
    reminderConfigFromServerSettings({
      reminderEnabled: false,
      morningReminderHour: 99,
      eveningReminderHour: -1
    }),
    {
      enabled: false,
      morningHour: "08:00",
      eveningHour: "19:00"
    }
  );
});

test("scheduled reminder clock uses Asia/Jakarta rather than UTC or device locale", () => {
  const parts = getWibDateTimeParts(new Date("2026-11-06T17:15:00.000Z"));
  assert.deepEqual(parts, {
    date: "2026-11-07",
    time: "00:15"
  });
});
