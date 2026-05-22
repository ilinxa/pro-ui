import type { CurrencyDisplay } from "../types";

const FALLBACK_LOCALE = "en-US";

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  currencyCode: string,
  currencyDisplay: CurrencyDisplay,
): Intl.NumberFormat | null {
  const key = `${currencyCode}|${currencyDisplay}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  try {
    const fmt = new Intl.NumberFormat(FALLBACK_LOCALE, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatterCache.set(key, fmt);
    return fmt;
  } catch {
    return null;
  }
}

export function formatPrice(
  value: number,
  currencyCode: string,
  currencyDisplay: CurrencyDisplay = "symbol",
): string {
  const fmt = getFormatter(currencyCode, currencyDisplay);
  if (!fmt) return `${currencyCode} ${value}`;

  const raw = fmt.format(value);
  return raw.replace(/[.,]00(?=\D|$)/, "");
}

export function formatYearly(
  priceAnnual: number,
  currencyCode: string,
  currencyDisplay: CurrencyDisplay = "symbol",
): string {
  return formatPrice(priceAnnual * 12, currencyCode, currencyDisplay);
}

export function resolveYearlyHint(
  template: string | ((yearlyTotal: string) => string) | null,
  yearlyTotal: string,
): string | null {
  if (template === null) return null;
  if (typeof template === "function") return template(yearlyTotal);
  return template.replace("{amount}", yearlyTotal);
}
