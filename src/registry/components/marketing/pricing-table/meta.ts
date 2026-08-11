import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "pricing-table",
  name: "Pricing Table",
  category: "marketing",

  description:
    "Pricing tiers side by side — monthly and annual toggle, highlighted tier, per-feature tooltips, and a comparison layout. RTL-safe, full i18n.",
  context:
    "Second component in the marketing category. Greenfield (no migration). Mirrors newsletter-signup's controlled-or-uncontrolled state pattern and share-bar's analytics callback shape. Part of the CMS conversion-block batch (sibling: signup-form). Tiers accept ReactNode CTAs so consumers wrap with their own router primitive (registry can't import next/*); a CtaSpec convenience overload renders a plain anchor/button for the common case.",
  features: [
    "2 layout variants — cards (default, 2–4 tier grid) and table (feature-comparison grid, one column per tier)",
    "Optional monthly/annual billing toggle (radiogroup, arrow-key + Home/End navigable)",
    "2–4 tiers via ReadonlyArray<PricingTier> with dev-mode length warning",
    "Highlighted tier — signal-lime (`--primary`) accent border + ring + 'Most popular' badge (label overridable per-tier)",
    "Per-feature included/excluded rows with optional shadcn Tooltip hint",
    "Intl.NumberFormat price formatting pinned to en-US, ISO 4217 currencyCode, symbol-or-code display",
    "Annual mode renders the per-month equivalent with strikethrough monthly when priceAnnual < priceMonthly + optional yearly-lump label via labels.yearlyHint",
    "ReactNode CTAs (load-bearing) OR CtaSpec convenience overload ({ label, href?, onClick?, variant?, ariaLabel? })",
    "Controlled-or-uncontrolled billing-period state (mirrors newsletter-signup's input convention)",
    "Localizable labels bag with English defaults — toggle labels, sr-only a11y strings, period strings, optional freeLabel + yearlyHint",
    "3 tones — primary / accent / muted, palette aligned with newsletter-signup",
    "Analytics hook (onTierCtaClick) — auto-fires for CtaSpec; consumer wires their own for ReactNode CTAs",
    "Real <table> with scope=col/row semantics for the comparison layout; sticky-start first column on overflow scroll",
    "React.memo wrapped",
  ],
  tags: [
    "pricing-table",
    "marketing",
    "pricing",
    "conversion",
    "cms-block",
    "form",
  ],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-22",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "tooltip"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["newsletter-signup", "share-bar"],
};
