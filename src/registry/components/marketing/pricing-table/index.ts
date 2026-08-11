export { PricingTable, default } from "./pricing-table";
export type {
  BillingPeriod,
  CtaSpec,
  CtaVariant,
  CurrencyDisplay,
  PricingBillingToggle,
  PricingFeature,
  PricingHeadingLevel,
  PricingLayout,
  PricingTableProps,
  PricingTableLabels,
  PricingTier,
  PricingTone,
} from "./types";
// No meta re-export: meta.ts never ships to consumers (locked registry
// convention) — a barrel reference breaks consumer tsc (F-cross-13 smoke).
