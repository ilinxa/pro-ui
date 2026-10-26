interface Formatters {
  plain: Intl.NumberFormat;
  two: Intl.NumberFormat;
}

// Formatters are pure, so one pair per locale is shared by every call.
const cache = new Map<string, Formatters>();

function build(locale: string): Formatters {
  return {
    plain: new Intl.NumberFormat(locale, { useGrouping: false }),
    two: new Intl.NumberFormat(locale, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }),
  };
}

function formattersFor(locale: string): Formatters {
  const hit = cache.get(locale);
  if (hit) return hit;
  let made: Formatters;
  try {
    made = build(locale);
  } catch {
    // An invalid tag such as "tr_TR" throws a RangeError; read it as English.
    made = cache.get("en") ?? build("en");
    cache.set("en", made);
  }
  cache.set(locale, made);
  return made;
}

/**
 * `m:ss` (or `h:mm:ss` past an hour) with digits from `locale`.
 * Non-finite or negative input reads as zero.
 * An invalid `locale` reads as `"en"`.
 */
export function formatDuration(seconds: number, locale = "en"): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const { plain, two } = formattersFor(locale);
  return h > 0
    ? `${plain.format(h)}:${two.format(m)}:${two.format(s)}`
    : `${plain.format(m)}:${two.format(s)}`;
}
