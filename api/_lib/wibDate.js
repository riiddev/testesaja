/**
 * SINAUENGLISH V2 — Timezone Utilities (Asia/Jakarta WIB = UTC+7)
 */

export function getWibDateStr(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date); // YYYY-MM-DD in WIB
}

export function getWibYesterdayStr(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getWibDateStr(d);
}

export function getWibDateObject(date = new Date()) {
  const wibStr = new Date(date).toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  return new Date(wibStr);
}

