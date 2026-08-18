# `pricing-table` — Pro-component Guide (Stage 3)

> **Status:** shipped · **v0.2.0** · maturity `alpha` · category `marketing`
> **Planning trio:** [description](pricing-table-procomp-description.md) · [plan](pricing-table-procomp-plan.md) · this guide
>
> Written 2026-08-19 as part of closing the guide-doc gap (three components had shipped without a
> Stage-3 guide). Documented against source, not against the planning docs.

---

## 1. What it is

A pricing section: 2–4 tiers side by side, an optional monthly/annual toggle, one highlighted
"most popular" tier, and per-feature include/exclude rows. Two layouts — independent cards, or a
real `<table>` feature-comparison grid.

It is a **presentational** component. It formats and lays out prices; it does not know about your
billing provider, and it never navigates. Your CTA is a `ReactNode` you supply.

## 2. When to use / when NOT to use

**Use when** you need a conversion-ready pricing block on a marketing page, a plan picker in a
settings screen, or a CMS-driven pricing section.

**Skip when:**
- **You need per-seat calculators, usage sliders, or quote builders.** This renders prices; it
  does not compute them. Do the math in the host and pass the result.
- **You need more than 4 tiers.** 2–4 is the supported range; outside it you get a dev warning and
  a layout that was not designed for the count. A long plan matrix wants a data table.
- **You need locale-specific currency formatting.** See the pinned-locale gotcha in §8 — this is
  the single most surprising thing about the component.

## 3. Installation

```bash
pnpm dlx shadcn@latest add @ilinxa/pricing-table
```

Registry dependencies: `button`, `tooltip`. npm: `lucide-react`.

```tsx
import { PricingTable } from "@/components/pricing-table";
```

## 4. Quick start

```tsx
<PricingTable
  heading="Simple pricing"
  tiers={[
    {
      name: "Starter",
      priceMonthly: 0,
      currencyCode: "USD",
      features: [
        { label: "3 projects", included: true },
        { label: "SSO", included: false },
      ],
      cta: { label: "Get started", href: "/signup" },
    },
    {
      name: "Pro",
      priceMonthly: 24,
      priceAnnual: 20,
      currencyCode: "USD",
      highlighted: true,
      features: [
        { label: "Unlimited projects", included: true },
        { label: "SSO", included: true, tooltip: "SAML + OIDC" },
      ],
      cta: { label: "Start trial", href: "/trial" },
    },
  ]}
  billingToggle="monthly-annual"
/>
```

## 5. The two layouts

| `layout` | Renders | Use for |
|---|---|---|
| `"cards"` (default) | A grid of independent tier cards | Marketing pages, 2–3 tiers, short feature lists |
| `"table"` | A real `<table>` with `scope="col"`/`scope="row"` and one column per tier | Feature comparison, longer lists, 3–4 tiers |

The table layout is a genuine `<table>`, not a grid of divs — so screen readers announce row and
column headers, and the first column sticks when the table overflows horizontally.

## 6. Pricing model

Every tier declares `priceMonthly`. `priceAnnual` is the **per-month rate when billed annually** —
not the yearly total. The yearly figure shown in the hint is derived as `priceAnnual * 12`.

```tsx
{ priceMonthly: 24, priceAnnual: 20, currencyCode: "USD" }
// monthly mode → $24 per month
// annual mode  → $20 per month, billed annually   (+ hint "$240 / yr")
//                with $24 struck through, because priceAnnual < priceMonthly
```

- The strikethrough appears **only** when `priceAnnual < priceMonthly`. Equal or higher values
  render without one, so a tier that is not discounted does not fake a discount.
- `labels.yearlyHint` takes a `"{amount}"` placeholder string, a function receiving the formatted
  yearly total, or `null` to hide it.
- `labels.freeLabel` is opt-in: set it and `priceMonthly: 0` renders that word instead of a
  formatted zero.

## 7. CTAs — the `ReactNode`-or-spec split

`cta` is **load-bearing `ReactNode`**, with a convenience object overload:

```tsx
// Convenience: renders a plain anchor/button.
cta: { label: "Start trial", href: "/trial", variant: "primary" }

// Load-bearing: your own router primitive. The registry cannot import next/*,
// so this is the path for framework links.
cta: <Link href="/trial"><Button>Start trial</Button></Link>
```

> ⚠️ **`onTierCtaClick` only fires for the `CtaSpec` form.** A `ReactNode` CTA owns its own click
> handling by definition — the component cannot intercept it without cloning your element. If you
> pass JSX and want analytics, wire it inside your own element.

## 8. Gotchas

1. **Currency formatting is pinned to `en-US`.** `Intl.NumberFormat` is constructed with a fixed
   `en-US` locale and your `currencyCode` (`parts/format.ts`), so `"EUR"` renders `€24`, not the
   `24,00 €` a German visitor expects. Trailing `.00` is stripped, so whole prices stay clean.
   The fixed locale makes SSR and client output byte-identical — no hydration mismatch — but it
   means the component is **currency-aware, not locale-aware**. If you need local number
   conventions, format upstream and pass display strings through `labels`. An unknown
   `currencyCode` falls back to `"<CODE> <value>"` rather than throwing.

2. **`priceAnnual` is a per-month rate.** Passing the yearly total there renders a tier that looks
   twelve times too expensive in annual mode. This trips people constantly.

3. **`billing` makes the toggle controlled.** Pass it and the toggle will not move unless you
   handle `onBillingChange`. Use `defaultBilling` for the uncontrolled case.

4. **Tier count outside 2–4 warns but still renders.** The dev warning is not a hard stop; the
   layout simply was not designed for 1 or 5+.

5. **`highlighted` on more than one tier** is not prevented. Two "most popular" badges is a
   content bug the component will happily render.

6. **Feature rows are positional in `table` layout.** The comparison grid pairs features by index
   across tiers, so give every tier the same feature list in the same order — otherwise rows
   misalign. Use `included: false` for the ones a tier lacks rather than omitting them.

## 9. Accessibility

- The billing toggle is a `radiogroup` with arrow-key + Home/End navigation and an sr-only group
  label (`labels.toggleGroupLabel`).
- Feature rows carry sr-only state text (`labels.featureIncluded` / `featureExcluded`) so a check
  or cross icon is never the only signal.
- `headingAs` sets the heading level (`h2` default) so the section nests correctly in your outline;
  the root is `aria-labelledby`-wired to it.
- The comparison layout uses real `<th scope>` semantics.

## 10. i18n

Every user-visible string is in the `labels` bag with English defaults (`DEFAULT_LABELS`). Prices
themselves are the exception — see the pinned-locale gotcha above.

## 11. Public exports

`PricingTable` (also the default export) · types `PricingTableProps`, `PricingTier`,
`PricingFeature`, `CtaSpec`, `CtaVariant`, `CurrencyDisplay`, `BillingPeriod`,
`PricingBillingToggle`, `PricingLayout`, `PricingTone`, `PricingHeadingLevel`,
`PricingTableLabels`.

`meta.ts` never ships — do not import from it.
