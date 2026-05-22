# pricing-table-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [description](./pricing-table-01-procomp-description.md) for what & why.
>
> **Greenfield** — no migration origin. Mirrors `newsletter-card-01`'s async-aware status / controlled-or-uncontrolled state shape and `share-bar-01`'s analytics hook.
>
> Sign-off decisions from GATE 1 review carried in:
> - `priceAnnual` is the **per-month** rate when billed annually (NOT a yearly lump sum). Optional small yearly-lump label is derived as `priceAnnual * 12` and rendered alongside.
> - `labels.freeLabel` is opt-in; unset → currency-formatted `0`.
> - `tiers: ReadonlyArray<Tier>` + dev-mode `console.warn` when length is `< 2` or `> 4`. No tuple-union.
> - `cta` is `ReactNode` (the **load-bearing** form). Optional convenience overload `cta: { label; href?; onClick?; variant? }` renders a plain `<a>` (if `href`) or `<button>` (if `onClick`) wrapped in `<Button asChild>` / `<Button>`.

## Final API

```ts
// types.ts
import type { ReactNode } from "react";

export type PricingLayout = "cards" | "table";

export type PricingBillingToggle = "none" | "monthly-annual";

export type BillingPeriod = "monthly" | "annual";

export type PricingTone = "primary" | "accent" | "muted";

export type CurrencyDisplay = "symbol" | "code";

export type PricingHeadingLevel = "h2" | "h3" | "h4";

export type CtaVariant = "primary" | "outline";

/** Convenience CTA spec — rendered as <Button asChild><a/></Button> or <Button onClick>. */
export interface CtaSpec {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: CtaVariant;
  /** Forwarded to the underlying button/anchor. */
  ariaLabel?: string;
}

export interface PricingFeature {
  label: string;
  included: boolean;
  /** Optional hint rendered via shadcn Tooltip on the feature row. */
  tooltip?: string;
}

export interface PricingTier {
  name: string;
  description?: string;
  /** Per-month price. Always required (annual mode shows the monthly equivalent). */
  priceMonthly: number;
  /**
   * Per-month rate when billed annually. Optional.
   * Yearly lump label rendered alongside is `priceAnnual * 12`.
   * Strikethrough monthly equivalent uses `priceMonthly` for contrast.
   */
  priceAnnual?: number;
  /** ISO 4217 (e.g. "USD", "EUR", "TRY"). */
  currencyCode: string;
  /** Default: "symbol". */
  currencyDisplay?: CurrencyDisplay;
  /** Overrides default periodLabel from labels bag (e.g. "per user / month"). */
  periodLabel?: string;
  features: ReadonlyArray<PricingFeature>;
  /** Load-bearing: ReactNode. Consumer wraps with their router primitive. */
  cta: ReactNode | CtaSpec;
  highlighted?: boolean;
  /** Override the "Most popular" badge text on this tier specifically. */
  badge?: string;
}

export interface PricingTableLabels {
  /** Toggle "Monthly" segment. Default: "Monthly". */
  monthlyLabel?: string;
  /** Toggle "Annual" segment. Default: "Annual". */
  annualLabel?: string;
  /** Default badge text on highlighted tiers. Default: "Most popular". */
  popularBadge?: string;
  /** Period string under price in monthly mode. Default: "per month". */
  periodMonthly?: string;
  /** Period string under price in annual mode. Default: "per month, billed annually". */
  periodAnnual?: string;
  /** Optional opt-in: display this string when priceMonthly === 0 (instead of "$0"). */
  freeLabel?: string;
  /** Heading hidden visually but read by SR for the toggle radiogroup. Default: "Billing period". */
  toggleGroupLabel?: string;
  /** Annotation shown next to the annual price (small text). Default: "/yr {amount}". Pass undefined to hide. */
  yearlyHint?: string | ((yearlyTotal: string) => string);
  /** Feature-table "Included" tooltip / sr label. Default: "Included". */
  featureIncluded?: string;
  /** Feature-table "Not included" sr label. Default: "Not included". */
  featureExcluded?: string;
}

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

  // ─── Billing state — controlled or uncontrolled ─────────────────
  /** Controlled billing period. */
  billing?: BillingPeriod;
  /** Uncontrolled initial value. Default: "monthly". */
  defaultBilling?: BillingPeriod;
  onBillingChange?: (period: BillingPeriod) => void;

  /** Color tone. Default: "primary". */
  tone?: PricingTone;

  /** Analytics. Fires after the consumer's onClick if cta is a CtaSpec. For ReactNode CTAs, consumer wires their own. */
  onTierCtaClick?: (tierName: string) => void;

  labels?: PricingTableLabels;

  className?: string;
  /** Class on each tier card. */
  tierCardClassName?: string;
  /** Class on the highlighted-tier ring. */
  highlightedRingClassName?: string;

  /** Override the root id (drives aria-labelledby wiring). Default: useId(). */
  id?: string;
}
```

## File-by-file plan

```
src/registry/components/marketing/pricing-table-01/
├── pricing-table-01.tsx        # 1  root, dispatches to layouts
├── parts/
│   ├── billing-toggle.tsx      # 2  radiogroup toggle (rendered only when billingToggle="monthly-annual")
│   ├── tier-card.tsx           # 3  single card for `layout="cards"`
│   ├── tier-feature-row.tsx    # 4  shared check / x + label + tooltip
│   ├── tier-cta.tsx            # 5  CtaSpec → Button asChild | Button; ReactNode passthrough
│   ├── price-display.tsx       # 6  price formatter + period + yearly hint
│   ├── comparison-table.tsx    # 7  layout="table" grid
│   ├── tone.ts                 # 8  tone → tailwind class fragments
│   └── format.ts               # 9  Intl.NumberFormat helpers + dev-warn
├── types.ts                    # 10
├── dummy-data.ts               # 11
├── demo.tsx                    # 12
├── usage.tsx                   # 13
├── meta.ts                     # 14
└── index.ts                    # 15
```

### 1. `pricing-table-01.tsx` — root

- `"use client"` (uses hooks).
- Wrapped in `React.memo`.
- Resolves controlled-vs-uncontrolled `billing` (matches `newsletter-card-01`'s pattern):
  - `useState(defaultBilling ?? "monthly")`.
  - If `billing` is provided, it wins; `setInternalBilling` is a no-op for controlled mode but `onBillingChange` still fires.
- Resolves merged `labels` via `useMemo` (defaults + consumer overrides).
- Dev-mode-only `useEffect`: `if (tiers.length < 2 || tiers.length > 4) console.warn(...)`. Wrapped in `process.env.NODE_ENV !== "production"` so it tree-shakes.
- Resolves `tonalClasses` from `tone`.
- `handleTierCtaClick(tierName)` — fires `onTierCtaClick?.(tierName)`. Passed to tier-cta.
- Computes `headingId` via `useId()` (root id override allowed via `id` prop).
- Renders a single `<section aria-labelledby={headingId}>` wrapper around: heading + optional subheading + optional billing toggle + layout body. Inside the wrapper, dispatches body to:
  - `<ComparisonTable>` when `layout === "table"`.
  - Otherwise the cards grid (`<TierCard>` × N).

  This guarantees the `<section>` + `aria-labelledby` wiring is universal across both layouts.

### 2. `parts/billing-toggle.tsx`

- Two-segment toggle implemented as a `role="radiogroup"` with `aria-label={labels.toggleGroupLabel}`.
- Two `<button role="radio" aria-checked={current === period}>` segments.
- Arrow-key handling: Left/Right move between segments (per WAI-ARIA radiogroup pattern).
- Tailwind: pill container with active-state ring (signal-lime `--primary` accent on the selected segment when `tone === "primary"`).
- Calls `onChange(period)` on click / Enter / Space.

### 3. `parts/tier-card.tsx`

- `<article role="region" aria-labelledby={tierTitleId}>`.
- Frame:
  - Base: `rounded-2xl border p-6 bg-card`.
  - Highlighted: `border-primary ring-2 ring-primary/30` + signal-lime `--primary` accent on the badge.
- Header: tier name + optional description + optional "Most popular" badge.
- `<PriceDisplay>` (file 6).
- CTA via `<TierCta>` (file 5).
- Feature list as `<ul role="list">` with `<TierFeatureRow>` (file 4) per item.

### 4. `parts/tier-feature-row.tsx`

- `<li>` with `<Check>` or `<X>` icon + label.
- Included: lime-tinted check (`text-primary`).
- Excluded: muted-foreground X.
- If `tooltip` present, wraps the label in `<Tooltip>` (shadcn primitive). Trigger has `aria-describedby` semantic via Tooltip wiring; `<Tooltip.Trigger asChild>` on the label span; `<Tooltip.Content>` carries the tooltip text.

### 5. `parts/tier-cta.tsx`

- Accepts `cta: ReactNode | CtaSpec`.
- Narrow via `isCtaSpec(cta)`:
  - Has `label` AND (`href` OR `onClick`) AND no `props.children` → spec.
- Spec path:
  - If `href`: `<Button asChild variant={...}><a href={href} onClick={wrappedOnClick}>{label}</a></Button>` (note: doesn't import `next/link` — consumer's job for SPA navigation).
  - Else `onClick`: `<Button variant={...} onClick={wrappedOnClick}>{label}</Button>`.
  - `wrappedOnClick` calls `onTierCtaClick(tierName)` first, then the consumer's `onClick`.
- ReactNode path: returns `<>{cta}</>`. Analytics not auto-wired — consumer wires their own (documented).

### 6. `parts/price-display.tsx`

- Resolves the active price from `(billing === "annual" && priceAnnual !== undefined) ? priceAnnual : priceMonthly`.
- Formats via `formatPrice` (file 9) using `Intl.NumberFormat`.
- Period string: `billing === "annual" ? labels.periodAnnual : labels.periodMonthly` (or tier-level override).
- Yearly hint (annual mode only, `priceAnnual` set):
  - Default text: e.g. `"$180 / yr"` resolved via `labels.yearlyHint` (string with `{amount}` template or function).
  - Rendered as small text below the period.
- Strikethrough monthly equivalent: when `billing === "annual"` AND `priceAnnual < priceMonthly`, render `<s>{format(priceMonthly)}</s>` next to the active price.
- `priceMonthly === 0` AND `labels.freeLabel` set → renders the free label instead of "$0".

### 7. `parts/comparison-table.tsx`

- For `layout="table"`.
- Renders a `<table>` (real semantic table) with:
  - `<thead>` row: empty cell + one `<th scope="col">` per tier (name + highlighted-tier emphasis).
  - Below header: price row (one `<td>` per tier with `<PriceDisplay>`).
  - Below price: CTA row (one `<td>` per tier with `<TierCta>`).
  - Feature rows: union of all feature labels across tiers; each `<tr>` has `<th scope="row">{label}</th>` + one `<td>` per tier (check / x icon).
  - Tooltip on `<th scope="row">` if any tier's matching feature carries a tooltip (uses the first non-empty).
- Horizontal scroll at narrow widths via `overflow-x-auto` on a wrapper; first column (`<th scope="row">`) is sticky-left.

### 8. `parts/tone.ts`

```ts
import type { PricingTone } from "../types";

const TONE_MAP: Record<PricingTone, { section: string; heading: string; cardBorder: string; highlightRing: string; highlightBorder: string; badgeBg: string; badgeText: string }> = {
  primary: {
    section: "",
    heading: "text-foreground",
    cardBorder: "border-border/60",
    highlightRing: "ring-primary/30",
    highlightBorder: "border-primary",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
  },
  accent: {
    section: "",
    heading: "text-foreground",
    cardBorder: "border-accent/40",
    highlightRing: "ring-accent/40",
    highlightBorder: "border-accent",
    badgeBg: "bg-accent",
    badgeText: "text-accent-foreground",
  },
  muted: {
    section: "",
    heading: "text-foreground",
    cardBorder: "border-border/50",
    highlightRing: "ring-foreground/15",
    highlightBorder: "border-foreground/50",
    badgeBg: "bg-muted",
    badgeText: "text-foreground",
  },
};

export const resolveTone = (tone: PricingTone) => TONE_MAP[tone];
```

### 9. `parts/format.ts`

- `formatPrice(value, currencyCode, currencyDisplay)`: `Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode, currencyDisplay })`.
  - `currencyDisplay: "symbol"` → "$15". `"code"` → "USD 15".
  - Strips trailing `.00` for clean integers.
- `formatYearly(priceAnnual, currencyCode)`: returns the formatted `priceAnnual * 12` string for the yearly hint.
- `warnTierCount(length)`: dev-mode only, logs once per mount.

### 10. `types.ts` — already shown above.

### 11. `dummy-data.ts`

```ts
import type { PricingTier, PricingTableLabels } from "./types";

export const PRICING_DEMO_TIERS: ReadonlyArray<PricingTier> = [
  { name: "Starter", description: "For individuals.", priceMonthly: 0, currencyCode: "USD",
    features: [
      { label: "1 workspace", included: true },
      { label: "Community support", included: true },
      { label: "Advanced analytics", included: false, tooltip: "Available on Pro and above." },
      { label: "Custom domains", included: false },
    ],
    cta: { label: "Start free", href: "/signup", variant: "outline" },
  },
  { name: "Pro", description: "For growing teams.", priceMonthly: 19, priceAnnual: 15, currencyCode: "USD",
    highlighted: true,
    features: [
      { label: "Unlimited workspaces", included: true },
      { label: "Priority email support", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Custom domains", included: false },
    ],
    cta: { label: "Start Pro trial", href: "/signup?plan=pro", variant: "primary" },
  },
  { name: "Enterprise", description: "For larger orgs.", priceMonthly: 49, priceAnnual: 39, currencyCode: "USD",
    features: [
      { label: "Unlimited workspaces", included: true },
      { label: "Dedicated support", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Custom domains", included: true },
    ],
    cta: { label: "Contact sales", href: "/contact", variant: "outline" },
  },
];

export const PRICING_DEMO_LABELS_TR: PricingTableLabels = {
  monthlyLabel: "Aylık",
  annualLabel: "Yıllık",
  popularBadge: "En popüler",
  periodMonthly: "/ ay",
  periodAnnual: "/ ay (yıllık ödeme)",
  freeLabel: "Ücretsiz",
};
```

### 12. `demo.tsx`

5-tab demo:
1. **3-tier cards with toggle** — default usage, uncontrolled toggle.
2. **2-tier (Free / Paid)** — minimal config.
3. **Feature comparison table** — `layout="table"`.
4. **Controlled toggle + analytics** — external state, `onTierCtaClick` logs to a tail panel below.
5. **Custom labels (TR)** — i18n proof.

### 13. `usage.tsx`

Code blocks: minimal cards, billing toggle, custom CTA as ReactNode (e.g. `<Link>`), controlled billing, layout=table, free tier with `freeLabel`.

### 14. `meta.ts`

```ts
{
  slug: "pricing-table-01",
  name: "Pricing Table 01",
  category: "marketing",
  description: "Side-by-side pricing tier cards (2–4 tiers) with optional monthly/annual toggle, highlighted-tier badge, per-feature included rows with tooltips, and a feature-comparison table layout — controlled-or-uncontrolled toggle state, full i18n, three tones, RTL-safe.",
  context: "Second component in the marketing category. Greenfield (no migration). Mirrors newsletter-card-01's controlled-or-uncontrolled state pattern and share-bar-01's analytics callback shape. Part of the CMS conversion-block batch (sibling: registration-form-01). Tiers accept ReactNode CTAs so consumers wrap with their own router primitive (registry can't import next/*).",
  features: [
    "2 layout variants — cards (default) and table (feature-comparison grid)",
    "Optional monthly/annual billing toggle (radiogroup, arrow-key navigable)",
    "2–4 tiers with dev-mode length warning",
    "Highlighted tier with aurora-cyan accent + 'Most popular' badge (label overridable per-tier)",
    "Per-feature included/excluded rows with optional shadcn Tooltip hint",
    "Intl.NumberFormat price formatting, ISO 4217 currencyCode, symbol-or-code display",
    "Annual mode shows strikethrough monthly equivalent + optional yearly-lump small label",
    "ReactNode CTAs (load-bearing) OR CtaSpec convenience overload",
    "Controlled-or-uncontrolled billing-period state",
    "Localizable labels bag with English defaults",
    "3 tones — primary / accent / muted",
    "Analytics hook (onTierCtaClick) — fires for CtaSpec; consumer wires for ReactNode",
    "React.memo wrapped"
  ],
  tags: ["pricing-table-01", "marketing", "pricing", "conversion", "cms-block"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-22",
  updatedAt: "2026-05-22",
  author: { name: "ilinxa" },
  dependencies: {
    shadcn: ["button", "tooltip"],
    npm: {},
    internal: [],
  },
  related: ["newsletter-card-01", "share-bar-01"],
}
```

### 15. `index.ts`

```ts
export { PricingTable01, default } from "./pricing-table-01";
export type {
  BillingPeriod,
  CtaSpec,
  CtaVariant,
  CurrencyDisplay,
  PricingBillingToggle,
  PricingFeature,
  PricingHeadingLevel,
  PricingLayout,
  PricingTable01Props,
  PricingTableLabels,
  PricingTier,
  PricingTone,
} from "./types";
export { meta } from "./meta";
```

---

## Dependencies

### Internal (pro-ui)
- `@/components/ui/button`
- `@/components/ui/tooltip` (new dep — verify it's already installed; if not, `pnpm dlx shadcn@latest add tooltip`)
- `@/lib/utils` (`cn`)
- `lucide-react` icons: `Check`, `X` (already in the lucide bundle, no new dep)

### NPM
- `react`

### No new NPM deps; one new shadcn primitive (`tooltip`) if missing.

---

## Composition pattern

**Headless wrapping + presentational parts.** Root owns billing-toggle state, dev-warn lifecycle, and analytics dispatch. Parts are stateless renderers.

`HeadingTag = headingAs ?? "h2"` resolved at the root. (Bumped from h3 vs newsletter-card-01 because pricing is usually a top-of-section block.)

**Cards vs table dispatch at the root** — like newsletter-card-01's variant dispatch. No compound API.

---

## Client vs server

**Client component** — `"use client"` required because of `useState` (billing state), `useId`, `useCallback`, `useMemo`, `useEffect` (dev-warn). Consistent with other pro-ui interactive components.

---

## Edge cases

| Case | Behavior |
|---|---|
| `tiers.length < 2` or `> 4` | Renders anyway; dev-mode `console.warn` logged once per mount. |
| `billingToggle="none"` AND `priceAnnual` set | Annual price is ignored; only monthly shown. |
| `billingToggle="monthly-annual"` AND no tier has `priceAnnual` | Toggle still renders (user expectation: it's a toggle), but the "annual" segment shows the same monthly prices. Documented edge case; consumers can omit toggle if no annual data. |
| `priceMonthly === 0` AND `labels.freeLabel` unset | Renders formatted `0` (e.g. "$0"). |
| `priceMonthly === 0` AND `labels.freeLabel` set | Renders the free label. |
| `cta` is `ReactNode` | Rendered verbatim; `onTierCtaClick` NOT auto-fired (consumer's job). Documented in usage. |
| `cta` is `CtaSpec` with neither `href` nor `onClick` | Renders a disabled-looking `<Button>` with the label; logs dev-warn ("CTA spec needs href or onClick"). |
| `layout="table"` with a single tier | Renders one column; visually fine but unusual — same dev-warn covers length. |
| `layout="table"` with 4 tiers + 12 features on narrow viewport | Wrapper `overflow-x-auto` provides horizontal scroll; sticky `<th scope="row">` keeps feature names visible. |
| Tooltip on a feature row + touch device | Radix Tooltip handles touch via long-press; otherwise hover/focus. |
| `currencyCode` invalid | `Intl.NumberFormat` throws; we catch and render the raw number with a warning. |
| Multiple tiers `highlighted: true` | All render highlighted; visually noisy but not blocked. Dev-warn on > 1 highlighted. |
| RTL (`dir="rtl"`) | Flex direction reverses via logical properties; "Most popular" badge stays at the start (inset-inline-start). |
| Reduced motion | No transitions on toggle swap (instant). N/A. |

---

## Accessibility

- **`<section aria-labelledby={headingId}>`** with heading rendered via configurable `headingAs`.
- **Billing toggle**: `role="radiogroup"` + `aria-label`; segments `role="radio"` + `aria-checked`; arrow-keys move focus + selection per WAI-ARIA.
- **Tier cards**: `<article role="region" aria-labelledby={tierTitleId}>`; highlighted tier announces "Most popular" via `aria-label` on the badge.
- **Feature list**: `<ul role="list">` with `<li>`; check/x icons are decorative (`aria-hidden`); included/excluded state conveyed via screen-reader-only `<span className="sr-only">{labels.featureIncluded|featureExcluded}</span>`.
- **Comparison table**: real `<table>` with `<th scope="col">` for tiers and `<th scope="row">` for feature names. Caption: hidden heading reference.
- **Tooltip**: Radix Tooltip — focus + hover triggers, Escape dismisses, `aria-describedby` wiring auto-managed.
- **CTA**: `<a>` inside `<Button asChild>` keeps button semantics; consumer's `ReactNode` CTA inherits the row's region context.

WCAG 2.1 AA target. Axe-clean on demo.

---

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean.
- [ ] `pnpm lint` clean.
- [ ] `pnpm build` clean — all routes prerendered including `/components/pricing-table-01`.
- [ ] SSR returns 200 with all 5 demo tabs rendered.
- [ ] `/components` index lists the new entry under the "Marketing" group.
- [ ] Visual: highlighted tier ring visible in light + dark; toggle animates between segments cleanly; tooltips render at correct positions.
- [ ] Keyboard: Tab into toggle, Arrow swaps period; Tab through feature rows reaches each tooltip.
- [ ] RTL spot-check (`<html dir="rtl">`): highlighted badge stays on the start side.
- [ ] `pnpm validate:meta-deps` — no drift between `meta.ts` deps and actual imports.
- [ ] `registry.json`: base + fixtures entries added; `pnpm registry:build` regenerates `public/r/pricing-table-01.json`.

---

## Risks & alternatives

### Risk 1: Tooltip dep growth

Adding the shadcn `tooltip` primitive adds Radix-Popper + Radix-Tooltip to the bundle. If a consumer doesn't use tooltips at all, the dep is still pulled. **Mitigation:** consider lazy-import via `dynamic()` in the row part — but registry code can't import `next/dynamic`. Instead, accept the dep cost and document. Bundle impact is ~6kb gz.

### Risk 2: `Intl.NumberFormat` locale behavior

`Intl.NumberFormat()` with no locale uses runtime default. SSR may pick a different locale than the client → hydration mismatch. **Mitigation:** pin locale to `"en-US"` for v0.1 (or accept a `locale?: string` prop later). The currency code itself is the load-bearing input; the digits-grouping convention is the only locale-dependent thing.

### Risk 3: CtaSpec vs ReactNode narrowing edge cases

A consumer could pass a plain object that happens to have a `label` property — gets misclassified as a `CtaSpec`. **Mitigation:** the narrowing also requires `(href || onClick) && !cta.$$typeof` — React elements have a `$$typeof` symbol that distinguishes them from POJOs. This is defensible TypeScript narrowing.

### Risk 4: `layout="table"` semantic correctness

Using a real `<table>` is the a11y-correct choice but constrains visual layout. The alternative — `display: grid` with ARIA roles — is more flexible but harder to get right. **Decision:** real `<table>`. Use Tailwind's `table-auto` + `min-w-full` for the look.

### Alternatives considered

1. **Tuple-union for `tiers`** — rejected per GATE-1 sign-off. `ReadonlyArray<Tier>` + dev-warn it is.
2. **CSS-only annual / monthly swap (no JS state)** — would use `:has(#monthly:checked) .price-monthly` selectors. Rejected because the controlled-billing prop is a documented requirement (CMS preview state lives outside).
3. **`Drawer` for tier details on mobile** — out of v0.1 scope; tier description handles it.
4. **Live currency conversion via API** — out of scope per description.
5. **Per-feature category groups** — v0.2+ per description.
