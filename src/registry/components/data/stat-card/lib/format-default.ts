// Locale-aware default delta formatter. Convention: `delta.value` is a
// fraction (0.124 = +12.4%); the percent style multiplies by 100 internally.
// `signDisplay: "exceptZero"` produces "+12.4%" / "−8.0%" / "0%" — the sign
// communicates direction; the visual arrow + sr-only label add semantics.
const enPercentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** Default delta formatter — convention: value is a fraction (0.124 = 12.4%). */
export function defaultDeltaFormat(value: number): string {
  return enPercentFormatter.format(value);
}
