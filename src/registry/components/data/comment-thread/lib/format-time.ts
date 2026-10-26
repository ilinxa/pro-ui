/** Coerces Date | string | number into a Date — matches event-card / progress-timeline. */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * A valid BCP 47 tag for `locale`, else `"en"`. An invalid tag (`"en_US"` from an i18n library)
 * makes `Intl` throw, and that must not take down the render.
 */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

/** A valid IANA time zone, else `undefined` (the runtime's). */
function resolveTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The English formatter. `now` is required here: nothing in this file reads the clock. */
function formatEnglish(date: Date, now: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  // A future date (a poll's closing time) reads "in 3d", never "Just now".
  if (diffSec <= -60) return formatIntl("en", undefined)(date, now);
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;

  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return sameYear
    ? `${MONTHS[date.getMonth()]} ${date.getDate()}`
    : `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** The `Intl` formatter for a resolved locale / zone (past and future). */
function formatIntl(
  tag: string,
  zone: string | undefined,
): (date: Date, now: Date) => string {
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "narrow" });
  const sameYearFmt = new Intl.DateTimeFormat(tag, { month: "long", day: "numeric", timeZone: zone });
  const otherYearFmt = new Intl.DateTimeFormat(tag, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: zone,
  });
  const yearFmt = new Intl.DateTimeFormat(tag, { year: "numeric", timeZone: zone });
  return (date, now) => {
    if (Number.isNaN(date.getTime())) return "";
    const diffSec = Math.trunc((date.getTime() - now.getTime()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(0, "second");
    if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.trunc(diffSec / 3600), "hour");
    if (abs < 7 * 86400) return rtf.format(Math.trunc(diffSec / 86400), "day");
    if (abs < 5 * 7 * 86400) return rtf.format(Math.trunc(diffSec / (7 * 86400)), "week");
    return (yearFmt.format(date) === yearFmt.format(now) ? sameYearFmt : otherYearFmt).format(date);
  };
}

/**
 * Default English relative-time formatter for comments and posts:
 *   < 1 min     → "Just now"
 *   < 60 min    → "5m"
 *   < 24 hours  → "2h"
 *   < 7 days    → "3d"
 *   < 5 weeks   → "2w"
 *   ≥ 5 weeks   → "March 5"  (or "March 5, 2025" if year differs)
 *   in the future (≥ 1 min) → "in 3d" (`Intl.RelativeTimeFormat("en", { style: "narrow" })`)
 *
 * Pass `now` explicitly; the default only serves a caller that omits it. Local-time getters
 * are used beyond five weeks — pass `createRelativeTimeFormatter("en", timeZone)` for a fixed zone.
 */
export function defaultRelativeTime(
  date: Date,
  now: Date = new Date(), // now-ok: a default only for callers that omit `now`; the thread always passes its own
): string {
  return formatEnglish(date, now);
}

/**
 * A relative-time formatter for `locale` (BCP 47; an invalid tag falls back to `"en"`) and an
 * optional IANA `timeZone` (an invalid one falls back to the runtime's).
 * - `"en"`: exactly {@link defaultRelativeTime}'s relative output; a `timeZone` only moves the absolute dates.
 * - Otherwise: `Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" })` up to five
 *   weeks either way ("5 dk. önce", "in 2h"), then a long `Intl.DateTimeFormat` date (the year only
 *   when it differs from `now`'s), in `timeZone`.
 *
 * Build it once per locale / zone (memoise it) — it creates the `Intl` formatters.
 */
export function createRelativeTimeFormatter(
  locale: string | undefined = "en",
  timeZone?: string,
): (date: Date, now: Date) => string {
  const tag = resolveLocale(locale);
  const zone = resolveTimeZone(timeZone);
  if (tag === "en" && !zone) return defaultRelativeTime;
  const intl = formatIntl(tag, zone);
  if (tag !== "en") return intl;
  // English with a time zone: the zone only moves the absolute dates ("March 5"); the relative
  // text stays exactly English ("Just now" / "5m" / "2w").
  return (date, now) => {
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec > -60 && diffSec < 5 * 7 * 86400) return formatEnglish(date, now);
    return intl(date, now);
  };
}
