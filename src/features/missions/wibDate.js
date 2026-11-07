/**
 * Return the active calendar date in Asia/Jakarta (UTC+07:00).
 * Pass a Date to make the calculation deterministic in tests.
 */
export function getWibDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("Tanggal WIB tidak valid.");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
