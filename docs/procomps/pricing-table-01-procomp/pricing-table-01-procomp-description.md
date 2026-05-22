# pricing-table-01 — procomp description

> Stage 1: what & why.
>
> **Greenfield** — no migration origin. Authored to spec.
>
> Batch: 1 of 2 in the CMS conversion-block batch (sibling: [`registration-form-01`](../registration-form-01-procomp/)). Newsletter + share are already covered by `newsletter-card-01` and `share-bar-01` — no work needed there. This batch fills the remaining "convert the visitor" surfaces every CMS / marketing site needs.

## Problem

Every marketing site, SaaS landing page, and product CMS needs a pricing surface — side-by-side tier cards with a "popular" emphasized option, optional monthly / annual billing toggle, and a per-feature comparison fallback. It's the single highest-stakes block on a marketing page and gets reinvented on every project: bespoke price formatting, ad-hoc toggle state, inconsistent "Most popular" treatment, no shared analytics hook, no shared a11y floor for the toggle / feature-list semantics, no shared currency / period i18n. Pro-ui has zero pricing components today; the closest neighbor is `newsletter-card-01` (CTA card), which doesn't carry the comparison structure.

## In scope

- **Two layout variants** — `cards` (2–4 separate tier cards, the default marketing-page pattern) and `table` (feature-comparison grid, one column per tier, for "scroll deep before deciding" surfaces).
- **Optional billing toggle** — `billingToggle: "none" | "monthly-annual"`. When `monthly-annual`, a single toggle at the top swaps the displayed price + period across all tiers; annual mode shows the equivalent monthly figure with strikethrough of the original monthly price **when `priceAnnual < priceMonthly`**, for savings legibility.
- **2–4 tiers per table** — `tiers: ReadonlyArray<Tier>`; the component owns layout decisions (gutters, column widths, breakpoints). Dev-mode `console.warn` if `length < 2` or `> 4`; still renders.
- **Highlighted tier** — `highlighted: true` adds a "Most popular" badge + emphasized signal-lime (`--primary`) border + ring. Label is overridable (`badge` prop on the tier).
- **Per-feature included / not-included rows** — each feature carries `{ label, included, tooltip? }`. Tooltips render via shadcn Tooltip primitive (registry dep).
- **Price formatting** — `priceMonthly` + optional `priceAnnual` numbers, ISO 4217 `currencyCode`, `currencyDisplay: "symbol" | "code"`, fully overridable `periodLabel`. `priceAnnual` is the **per-month rate when billed annually** (not a yearly lump sum). In annual mode the headline price is the monthly equivalent; an optional small yearly-lump label (derived as `priceAnnual * 12`) renders alongside via `labels.yearlyHint`.
- **CTA shape** — `cta: ReactNode | CtaSpec`. `ReactNode` is the **load-bearing** form: consumer wraps with their router primitive (Next `<Link>`, etc.) since registry code can't import `next/*`. Optional `CtaSpec = { label, href?, onClick?, variant?, ariaLabel? }` convenience overload renders a plain `<Button>` / `<a>` for the common case (`ariaLabel` forwards to the underlying element).
- **Three tones** — `primary` / `accent` / `muted`, mirroring `newsletter-card-01`'s palette for visual consistency across marketing-category components.
- **Controlled-or-uncontrolled toggle state** — `billing` + `onBillingChange` controlled, OR `defaultBilling` uncontrolled. Mirrors React input convention and `newsletter-card-01`'s state shape.
- **i18n labels bag** — toggle labels (`monthlyLabel` / `annualLabel`), `toggleGroupLabel` (sr-only radiogroup name), `popularBadge` default, `periodMonthly` / `periodAnnual`, optional `freeLabel` for `priceMonthly === 0`, `yearlyHint` template / function, `featureIncluded` / `featureExcluded` (sr-only check/x state), currency-string fallback. English defaults.
- **Analytics hook** — `onTierCtaClick(tierName)` mirrors `share-bar-01`'s `onShare(targetKind)` pattern. Auto-fires for `CtaSpec`; consumer wires their own when `cta` is a `ReactNode`.
- **Heading semantic level** — `headingAs: "h2" | "h3" | "h4"` (default `h2`, since pricing is usually a top-of-section block).
- **a11y** — `<section>` with `aria-labelledby`, toggle as a `role="radiogroup"` (two radios, arrow-key navigable), tier cards as `role="region"` with `aria-labelledby`, feature lists as `<ul>` with `<li>`, "Most popular" badge announced via `aria-label` on the wrapping region, tooltip via shadcn (Radix-backed). `table` layout uses a real `<table>` with `<th scope="col">` per tier and `<th scope="row">` per feature.
- **RTL-safe** — uses logical properties + flex direction; no hardcoded `left` / `right`.

## Out of scope

- **More than 4 tiers** — the design assumes 2–4. Five-tier grids are a different layout problem (carousel, or vertical-list collapse).
- **Per-tier custom illustrations / icons** — tier header is text-only in v0.1. Slot-based icon is a v0.2 candidate if a real consumer asks.
- **Currency conversion / live rates** — `priceMonthly` and `priceAnnual` are raw numbers in the supplied currency; consumer does any conversion upstream.
- **Per-feature row groups / collapsible sections** — `table` layout is a flat grid in v0.1. Grouped comparison ("Storage features", "Support features") is v0.2+.
- **Anchor / coupon code input** — not a v0.1 concern. Belongs to a checkout block downstream.
- **More than one billing period** — only monthly ↔ annual swap. Quarterly / lifetime not supported in v0.1.
- **Tier add-ons / sub-pricing** — single price per tier per period.
- **In-card testimonials or social proof** — different component (a future `testimonial-card-01`).
- **Built-in `next/link` integration on CTAs** — `CtaSpec` renders a plain `<a>`; for SPA navigation the consumer passes their own `<Link>` as a `ReactNode` CTA. Registry code can't import `next/*`.
- **Locale-driven number formatting** — `Intl.NumberFormat` is pinned to `"en-US"` in v0.1 to avoid SSR/client hydration drift. A `locale?: string` prop is a v0.2 candidate.

## Target consumers

- Marketing landing pages with a "/pricing" section.
- SaaS product sites: "Compare plans" deep-linkable section.
- Headless CMS / website builder schemas where the pricing block ships as a reusable conversion block in the visual editor.
- Docs / API products with paid tiers.

## Rough API sketch

```tsx
<PricingTable01
  heading="Plans for every team"
  subheading="Start free, scale when you're ready."
  headingAs="h2"                       // default; override if nested deeper
  layout="cards"                       // or "table"
  billingToggle="monthly-annual"       // or "none"
  defaultBilling="monthly"             // uncontrolled, OR billing + onBillingChange
  tone="primary"                       // 'primary' | 'accent' | 'muted'
  onTierCtaClick={(name) => analytics.track("pricing_cta_click", { tier: name })}
  labels={{
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    popularBadge: "Most popular",
    periodMonthly: "per month",
    periodAnnual: "per month, billed annually",
    freeLabel: "Free",                 // opt-in; otherwise priceMonthly=0 renders "$0"
    yearlyHint: "${amount} / yr",      // small label next to annual price; "{amount}" interpolated
  }}
  tiers={[
    {
      name: "Starter",
      description: "For individuals trying things out.",
      priceMonthly: 0,
      currencyCode: "USD",
      features: [
        { label: "1 workspace", included: true },
        { label: "Community support", included: true },
        { label: "Advanced analytics", included: false, tooltip: "Pro plan or above." },
      ],
      // CtaSpec — convenience overload
      cta: { label: "Start free", href: "/signup", variant: "outline" },
    },
    {
      name: "Pro",
      description: "For growing teams.",
      priceMonthly: 19,
      priceAnnual: 15,                 // per-month rate when billed annually
      currencyCode: "USD",
      features: [/* ... */],
      // ReactNode — load-bearing; consumer wraps with their router primitive
      cta: <Link href="/signup?plan=pro"><Button>Start Pro trial</Button></Link>,
      highlighted: true,
    },
    /* up to 4 */
  ]}
/>
```

5 props are most-used: `tiers`, `layout`, `billingToggle`, `tone`, `onTierCtaClick`. Rest are labels / escape hatches.

## Example usages

**1. Three-tier SaaS pricing with monthly/annual toggle (the default pattern):**
```tsx
<PricingTable01
  heading="Plans"
  billingToggle="monthly-annual"
  tiers={[starter, pro, enterprise]}
  onTierCtaClick={trackCtaClick}
/>
```

**2. Feature-comparison table layout:**
```tsx
<PricingTable01
  layout="table"
  billingToggle="none"
  tone="muted"
  tiers={[free, team, enterprise]}
/>
```

**3. CMS conversion block — controlled toggle (state lives in the editor preview):**
```tsx
const [billing, setBilling] = useState<BillingPeriod>("monthly");
<PricingTable01
  billing={billing}
  onBillingChange={setBilling}
  billingToggle="monthly-annual"
  tiers={cmsBlock.tiers}
/>
```

## Success criteria

- `cards` layout renders 2 / 3 / 4-tier configurations correctly at desktop (≥ 1024px), tablet (≥ 768px collapses to 2-up or stacked), and mobile (single column).
- `table` layout renders feature-comparison grid with sticky tier-name header on horizontal scroll at narrow widths.
- Billing toggle swaps prices + period strings across all tiers in one render; annual mode shows strikethrough monthly equivalent.
- Highlighted tier renders with signal-lime (`--primary`) accent border + ring + "Most popular" badge, visually elevated above peers.
- Tooltip on a feature row opens on hover + focus, dismisses on blur / Escape (Radix Tooltip default).
- `onTierCtaClick(tierName)` fires on each tier's CTA click; cardinality matches the visible tiers.
- TypeScript: `tiers` is `ReadonlyArray<PricingTier>` enforced at the type level + dev-mode `console.warn` when `length` is outside 2–4; `billing` is the literal `"monthly" | "annual"`; `layout` and `tone` are literal unions; `cta` is `ReactNode | CtaSpec` with `CtaSpec` narrowing requiring a non-React-element shape (`$$typeof` check).
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR `/components/pricing-table-01` returns 200 with all demo tabs.
- a11y: axe-clean on demo page; toggle reachable via Tab + Arrow keys (radiogroup semantics); each tier region announces its name.
- RTL: rendering with `dir="rtl"` keeps the "Most popular" badge on the start side, not visually mirrored to the wrong corner.

## Resolved decisions

1. **Tier-count typing.** **Resolved:** `tiers: ReadonlyArray<PricingTier>` + dev-mode `console.warn` on `length < 2 || > 4`. Tuple-union rejected — doesn't fit CMS runtime tier-building.
2. **Annual-price input shape.** **Resolved:** `priceAnnual` is the **per-month rate when billed annually** — the headline number the user pays monthly under the annual plan. Component derives `priceAnnual * 12` for the optional small yearly-lump label rendered alongside the price.
3. **Free-tier label.** **Resolved:** opt-in `labels.freeLabel?: string`. When unset, `priceMonthly === 0` falls through to currency formatting (e.g. `"$0"`).
4. **Currency formatting.** **Resolved:** `Intl.NumberFormat` (zero dep). Pinned to `"en-US"` in v0.1 to avoid SSR/client hydration drift; `locale?: string` is a v0.2 candidate.
5. **CTA shape.** **Resolved:** `cta: ReactNode | CtaSpec`. `ReactNode` is **load-bearing** (consumer wraps with their router primitive — Next `<Link>`, etc.). `CtaSpec = { label, href?, onClick?, variant? }` is the optional convenience overload, rendering a plain `<a>` (with `href`) or `<button>` (with `onClick`) wrapped in `<Button>` / `<Button asChild>`.
6. **Tooltip dep.** **Resolved:** accept the `@/components/ui/tooltip` dep. Consumers wanting zero-dep can pass `tooltip: undefined` on each feature — Tooltip is only imported on the row when a tooltip string is provided.

## Open questions

_None at GATE 1 close. New questions surfacing during implementation roll into the plan's "Risks & alternatives" section._
