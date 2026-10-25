/**
 * A valid BCP 47 tag for `locale`, else `"en"`. An invalid tag (`"en_US"` from an i18n library)
 * makes `Intl.NumberFormat` throw — that must not take down the render.
 */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}
