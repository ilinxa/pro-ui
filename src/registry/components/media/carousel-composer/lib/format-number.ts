// Formatters are pure, so one per locale is shared by every call.
const cache = new Map<string, Intl.NumberFormat>();

function build(locale: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 4 });
}

function formatterFor(locale: string): Intl.NumberFormat {
  const hit = cache.get(locale);
  if (hit) return hit;
  let made: Intl.NumberFormat;
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
 * Formats a number with digits from `locale`, ungrouped (a ratio such as `1920:1080`
 * must not read `1,920:1,080`) and at most four fraction digits. An invalid `locale` reads as `"en"`.
 */
export function formatNumber(n: number, locale = "en"): string {
  return formatterFor(locale).format(n);
}
