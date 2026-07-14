/**
 * Local-timezone-safe date helpers.
 *
 * IMPORTANT: Date#toISOString() always converts to UTC, which silently
 * rolls the calendar date backwards (or forwards) for any user whose
 * timezone offset isn't 0. That bug was causing new/edited todos to be
 * saved under the wrong day. Everything here works off the LOCAL
 * year/month/day instead, so 'today' always means the user's today.
 */

const pad2 = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' using local calendar fields (no UTC conversion). */
export const toDateStr = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 'YYYY-MM-DD' -> Date at local midnight. */
export const parseDateStr = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date -> 'HH:MM' using local time. */
export const toTimeStr = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** 'HH:MM' -> Date (today's date, given time). */
export const parseTimeStr = (s) => {
  const d = new Date();
  const [h, m] = s.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

export const todayStr = () => toDateStr(new Date());

/** Add `days` (can be negative) to a 'YYYY-MM-DD' string, returns a new string. */
export const addDaysToDateStr = (dateStr, days) => {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

/** True if dateStr is strictly before today (local). */
export const isPastDateStr = (dateStr) => dateStr < todayStr();

/** True if dateStr is today (local). */
export const isTodayDateStr = (dateStr) => dateStr === todayStr();
