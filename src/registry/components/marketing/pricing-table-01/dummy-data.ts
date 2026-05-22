import type { PricingTableLabels, PricingTier } from "./types";

export const PRICING_DEMO_TIERS_THREE: ReadonlyArray<PricingTier> = [
  {
    name: "Starter",
    description: "For individuals trying things out.",
    priceMonthly: 0,
    currencyCode: "USD",
    features: [
      { label: "1 workspace", included: true },
      { label: "Community support", included: true },
      {
        label: "Advanced analytics",
        included: false,
        tooltip: "Available on Pro and above.",
      },
      { label: "Custom domains", included: false },
      { label: "SLA", included: false },
    ],
    cta: { label: "Start free", href: "/signup", variant: "outline" },
  },
  {
    name: "Pro",
    description: "For growing teams.",
    priceMonthly: 19,
    priceAnnual: 15,
    currencyCode: "USD",
    highlighted: true,
    features: [
      { label: "Unlimited workspaces", included: true },
      { label: "Priority email support", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Custom domains", included: false },
      { label: "SLA", included: false },
    ],
    cta: {
      label: "Start Pro trial",
      href: "/signup?plan=pro",
      variant: "primary",
    },
  },
  {
    name: "Enterprise",
    description: "For larger organizations.",
    priceMonthly: 49,
    priceAnnual: 39,
    currencyCode: "USD",
    features: [
      { label: "Unlimited workspaces", included: true },
      { label: "Dedicated support", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Custom domains", included: true },
      {
        label: "SLA",
        included: true,
        tooltip: "99.95% uptime guarantee.",
      },
    ],
    cta: { label: "Contact sales", href: "/contact", variant: "outline" },
  },
];

export const PRICING_DEMO_TIERS_TWO: ReadonlyArray<PricingTier> = [
  {
    name: "Free",
    description: "All you need to get started.",
    priceMonthly: 0,
    currencyCode: "USD",
    features: [
      { label: "Up to 3 projects", included: true },
      { label: "Community support", included: true },
      { label: "Custom domains", included: false },
    ],
    cta: { label: "Sign up", href: "/signup", variant: "outline" },
  },
  {
    name: "Team",
    description: "Everything in Free, plus collaboration.",
    priceMonthly: 12,
    priceAnnual: 9,
    currencyCode: "USD",
    highlighted: true,
    features: [
      { label: "Unlimited projects", included: true },
      { label: "Priority support", included: true },
      { label: "Custom domains", included: true },
    ],
    cta: {
      label: "Try Team free for 14 days",
      href: "/signup?plan=team",
      variant: "primary",
    },
  },
];

export const PRICING_DEMO_LABELS_TR: PricingTableLabels = {
  monthlyLabel: "Aylık",
  annualLabel: "Yıllık",
  toggleGroupLabel: "Ödeme dönemi",
  popularBadge: "En popüler",
  periodMonthly: "/ ay",
  periodAnnual: "/ ay (yıllık ödeme)",
  freeLabel: "Ücretsiz",
  yearlyHint: "{amount} / yıl",
  featureIncluded: "Dahil",
  featureExcluded: "Dahil değil",
};
