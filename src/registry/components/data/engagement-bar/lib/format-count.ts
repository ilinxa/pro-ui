/**
 * Compact, locale-aware engagement count:
 *   formatEngagementCount(999)          → "999"
 *   formatEngagementCount(1_234)        → "1.2K"
 *   formatEngagementCount(12_345)       → "12K"
 *   formatEngagementCount(1_234_567)    → "1.2M"
 *   formatEngagementCount(1_200, "tr")  → "1,2 B"
 *
 * `Intl.NumberFormat(locale, { notation: "compact" })`. Negative values render as 0; a non-finite
 * value renders as "". The bar memoises its own formatter on `locale` — this helper builds one per
 * call, for hosts formatting a count outside the bar.
 */
export function formatEngagementCount(n: number, locale = "en"): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat(resolveLocale(locale), { notation: "compact" }).format(Math.max(0, n));
}

/**
 * A valid BCP 47 tag for `locale`, else `"en"`. An invalid tag (`"en_US"` from an i18n library)
 * makes `Intl` and `toLocale*Case` throw — that must not take down the render.
 */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}
