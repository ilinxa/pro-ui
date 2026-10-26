/**
 * Default date + count formatters, built from `Intl` for an explicit locale / time zone
 * (consumer contract C3). Created inside the component and memoised on `locale` /
 * `timeZone` — never at module scope, never with an `undefined` locale.
 */

/** Locale used when none is passed, or when the tag is invalid. */
export const DEFAULT_LOCALE = "en";

/** The tag if `Intl` accepts it and supports it, else `"en"`. */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return DEFAULT_LOCALE;
  try {
    const tag = Intl.getCanonicalLocales(locale)[0];
    // A well-formed tag the runtime has no data for would silently use the runtime's own
    // locale (server/client mismatch), so only supported tags are kept.
    if (!tag || Intl.DateTimeFormat.supportedLocalesOf([tag]).length === 0) return DEFAULT_LOCALE;
    return tag;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** A time zone `Intl` accepts, else `undefined` (the runtime's zone). */
function resolveTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

export function createDateFormatters(locale: string, timeZone?: string) {
  const tz = resolveTimeZone(timeZone);
  const short = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: tz,
  });
  const long = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  });
  return {
    formatDate: (date: Date): string => long.format(date),
    formatDateRange: ({ from, to }: { from: Date; to: Date }): string =>
      `${short.format(from)} - ${short.format(to)}`,
  };
}

/**
 * Default count text: "1 item found" / "{n} items found". Plural selection uses English
 * rules because the text is English; override `labels.resultsCountText` to translate.
 * The number is grouped with `Intl.NumberFormat` only when the host passed a `locale`.
 */
export function createCountText(formatLocale: string | undefined) {
  const plural = new Intl.PluralRules(DEFAULT_LOCALE);
  const numberFormat = formatLocale ? new Intl.NumberFormat(formatLocale) : null;
  return (count: number): string => {
    const shown = numberFormat ? numberFormat.format(count) : String(count);
    return plural.select(count) === "one" ? `${shown} item found` : `${shown} items found`;
  };
}
