export const DEFAULT_REMINDER_CONFIG = Object.freeze({
  enabled: false,
  morningHour: "08:00",
  eveningHour: "19:00"
});

function normalizeHour(value, fallback) {
  const raw = String(value ?? "");
  if (/^([01]\d|2[0-3]):00$/.test(raw)) return raw;
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 23) {
    return String(numeric).padStart(2, "0") + ":00";
  }
  return fallback;
}

export function normalizeReminderConfig(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    morningHour: normalizeHour(value.morningHour, DEFAULT_REMINDER_CONFIG.morningHour),
    eveningHour: normalizeHour(value.eveningHour, DEFAULT_REMINDER_CONFIG.eveningHour)
  };
}

export function reminderConfigFromServerSettings(settings = {}) {
  return normalizeReminderConfig({
    enabled: settings.reminderEnabled,
    morningHour: settings.morningReminderHour,
    eveningHour: settings.eveningReminderHour
  });
}

export function reminderConfigToServerSettings(value = {}) {
  const config = normalizeReminderConfig(value);
  return {
    reminderEnabled: config.enabled,
    morningReminderHour: Number(config.morningHour.slice(0, 2)),
    eveningReminderHour: Number(config.eveningHour.slice(0, 2))
  };
}

export function getReminderStorageKey(userId) {
  return "sinau_pwa_settings_" + (userId ? String(userId) : "guest");
}

export function getWibDateTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: value.year + "-" + value.month + "-" + value.day,
    time: value.hour + ":" + value.minute
  };
}
