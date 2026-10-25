/**
 * Locale-aware number text for the values the editor shows to users (trim
 * seconds, crop-aspect count, adjust values). `locale` is a BCP 47 tag;
 * default `"en"` (deterministic, so server and client render the same text).
 * `grouping: false` drops thousands separators (e.g. "1000" not "1,000"). An invalid tag falls back to `"en"` instead of throwing.
 */
export function formatNumber(
  value: number,
  locale: string | undefined,
  fractionDigits: { min?: number; max?: number; grouping?: boolean } = {},
): string {
  const options: Intl.NumberFormatOptions = {
    useGrouping: fractionDigits.grouping ?? true,
    minimumFractionDigits: fractionDigits.min ?? 0,
    maximumFractionDigits: fractionDigits.max ?? fractionDigits.min ?? 0,
  };
  try {
    return new Intl.NumberFormat(locale ?? "en", options).format(value);
  } catch {
    return new Intl.NumberFormat("en", options).format(value);
  }
}
