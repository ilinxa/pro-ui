/**
 * 0.6.0 (SV12) - locale-aware relative time for the viewer header.
 * Formatters are built per call (never at module scope) so SSR and the client agree on the
 * locale that is passed in.
 */

/** A valid BCP 47 tag, else `"en"`. */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "now", "5 min. ago", "3 hr. ago", "2 days ago"; a week or older falls back to a medium date.
 * An unparsable date renders as an empty string rather than "Invalid Date".
 */
export function formatRelativeTime(date: Date, locale: string | undefined, nowMs?: number): string {
  const time = date.getTime();
  if (Number.isNaN(time)) return "";
  const tag = resolveLocale(locale);
  // now-ok: relative time is anchored to the present by definition; this runs from a formatter callback
  const reference = nowMs ?? Date.now();
  const diffSeconds = Math.round((time - reference) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "short" });
  if (abs < MINUTE) return rtf.format(0, "second");
  if (abs < HOUR) return rtf.format(Math.trunc(diffSeconds / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.trunc(diffSeconds / HOUR), "hour");
  if (abs < 7 * DAY) return rtf.format(Math.trunc(diffSeconds / DAY), "day");
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(date);
}
