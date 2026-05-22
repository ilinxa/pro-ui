import type { ReactNode } from "react";

export type PricingLayout = "cards" | "table";

export type PricingBillingToggle = "none" | "monthly-annual";

export type BillingPeriod = "monthly" | "annual";

export type PricingTone = "primary" | "accent" | "muted";

export type CurrencyDisplay = "symbol" | "code";

export type PricingHeadingLevel = "h2" | "h3" | "h4";

export type CtaVariant = "primary" | "outline";

export interface CtaSpec {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: CtaVariant;
  ariaLabel?: string;
}

export interface PricingFeature {
  label: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingTier {
  name: string;
  description?: string;
  /** Per-month price. Always required (annual mode shows the monthly equivalent). */
  priceMonthly: number;
  /** Per-month rate when billed annually. The optional yearly hint is derived as priceAnnual * 12. */
  priceAnnual?: number;
  /** ISO 4217 (e.g. "USD", "EUR", "TRY"). */
  currencyCode: string;
  /** Default: "symbol". */
  currencyDisplay?: CurrencyDisplay;
  /** Overrides default periodLabel from the labels bag (e.g. "per user / month"). */
  periodLabel?: string;
  features: ReadonlyArray<PricingFeature>;
  /** Load-bearing: ReactNode. Pass a CtaSpec for the convenience case. */
  cta: ReactNode | CtaSpec;
  highlighted?: boolean;
  /** Per-tier override of the "Most popular" badge text. */
  badge?: string;
}

export interface PricingTableLabels {
  monthlyLabel?: string;
  annualLabel?: string;
  /** sr-only label for the toggle radiogroup. */
  toggleGroupLabel?: string;
  popularBadge?: string;
  periodMonthly?: string;
  periodAnnual?: string;
  /** Opt-in: rendered when priceMonthly === 0 (instead of the formatted "0"). */
  freeLabel?: string;
  /**
   * Small label next to the annual price. String form supports the "{amount}"
   * placeholder; function form receives the formatted yearly total.
   * Pass `null` to hide.
   */
  yearlyHint?: string | ((yearlyTotal: string) => string) | null;
  /** sr-only state label for "included" features. */
  featureIncluded?: string;
  /** sr-only state label for "not included" features. */
  featureExcluded?: string;
}

export interface ResolvedLabels {
  monthlyLabel: string;
  annualLabel: string;
  toggleGroupLabel: string;
  popularBadge: string;
  periodMonthly: string;
  periodAnnual: string;
  freeLabel: string | undefined;
  yearlyHint: string | ((yearlyTotal: string) => string) | null;
  featureIncluded: string;
  featureExcluded: string;
}

export const DEFAULT_LABELS: ResolvedLabels = {
  monthlyLabel: "Monthly",
  annualLabel: "Annual",
  toggleGroupLabel: "Billing period",
  popularBadge: "Most popular",
  periodMonthly: "per month",
  periodAnnual: "per month, billed annually",
  freeLabel: undefined,
  yearlyHint: "{amount} / yr",
  featureIncluded: "Included",
  featureExcluded: "Not included",
};

export interface PricingTable01Props {
  heading?: string;
  subheading?: string;
  headingAs?: PricingHeadingLevel;

  /** 2–4 tiers. Out-of-range length logs a dev-mode warn but still renders. */
  tiers: ReadonlyArray<PricingTier>;

  /** Layout variant. Default: "cards". */
  layout?: PricingLayout;

  /** Billing toggle mode. Default: "none". */
  billingToggle?: PricingBillingToggle;

  /** Controlled billing period. */
  billing?: BillingPeriod;
  /** Uncontrolled initial value. Default: "monthly". */
  defaultBilling?: BillingPeriod;
  onBillingChange?: (period: BillingPeriod) => void;

  /** Color tone. Default: "primary". */
  tone?: PricingTone;

  /** Fires for CtaSpec tiers after the consumer's onClick. ReactNode CTAs wire their own. */
  onTierCtaClick?: (tierName: string) => void;

  labels?: PricingTableLabels;

  className?: string;
  /** Class on each tier card / column. */
  tierCardClassName?: string;
  /** Class on the highlighted-tier ring/border. */
  highlightedRingClassName?: string;

  /** Override the root id (drives aria-labelledby wiring). Default: useId(). */
  id?: string;
}

export interface ResolvedTone {
  cardBorder: string;
  highlightRing: string;
  highlightBorder: string;
  badgeBg: string;
  badgeText: string;
  toggleActiveBg: string;
  toggleActiveText: string;
}
