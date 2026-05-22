export default function PricingTable01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PricingTable01</code> for any marketing-page pricing
        block: 2–4 tier cards with an optional monthly/annual billing toggle
        and a highlighted "Most popular" tier. Switch to{" "}
        <code>layout="table"</code> for a feature-comparison grid when buyers
        scroll deep before deciding.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { PricingTable01 } from "@/components/pricing-table-01";

<PricingTable01
  heading="Plans"
  billingToggle="monthly-annual"
  tiers={[starter, pro, enterprise]}
  onTierCtaClick={(name) =>
    analytics.track("pricing_cta_click", { tier: name })
  }
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">CTA shape</h3>
      <p className="text-muted-foreground">
        Each tier's <code>cta</code> accepts either a <code>ReactNode</code>{" "}
        (load-bearing — pass your router primitive, e.g. Next{" "}
        <code>&lt;Link&gt;</code>) or a <code>CtaSpec</code> convenience
        overload. Registry code can't import <code>next/*</code>, so for SPA
        navigation you wrap the button yourself:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import Link from "next/link";
import { Button } from "@/components/ui/button";

// CtaSpec — renders a plain <a> wrapped by <Button asChild>
cta: { label: "Start free", href: "/signup", variant: "outline" }

// ReactNode — load-bearing, consumer wraps for SPA navigation
cta: (
  <Button asChild>
    <Link href="/signup?plan=pro">Start Pro trial</Link>
  </Button>
)`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        <code>onTierCtaClick(tierName)</code> auto-fires for{" "}
        <code>CtaSpec</code> tiers. For <code>ReactNode</code> tiers, wire your
        own click handler — analytics on a custom router primitive is your
        call.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Billing toggle (controlled or uncontrolled)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`// Uncontrolled (default)
<PricingTable01
  billingToggle="monthly-annual"
  defaultBilling="annual"
  tiers={tiers}
/>;

// Controlled — useful when toggle state lives in a CMS editor preview
const [billing, setBilling] = useState<BillingPeriod>("monthly");
<PricingTable01
  billingToggle="monthly-annual"
  billing={billing}
  onBillingChange={setBilling}
  tiers={tiers}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        <code>priceAnnual</code> is the per-month rate when billed annually
        (not a yearly lump sum). When the toggle is in annual mode and{" "}
        <code>priceAnnual &lt; priceMonthly</code>, the original monthly price
        renders alongside with strikethrough. A small yearly-lump label
        (derived as <code>priceAnnual * 12</code>) renders below the period
        string via <code>labels.yearlyHint</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Comparison table</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PricingTable01
  heading="Compare plans"
  layout="table"
  billingToggle="monthly-annual"
  tiers={tiers}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Renders a real semantic <code>&lt;table&gt;</code> with{" "}
        <code>&lt;th scope="col"&gt;</code> per tier and{" "}
        <code>&lt;th scope="row"&gt;</code> per feature label. The first column
        is sticky-start on horizontal overflow.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Free-tier label</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PricingTable01
  labels={{ freeLabel: "Free" }}
  tiers={[{ ...starter, priceMonthly: 0 }, pro]}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Opt-in: when <code>priceMonthly === 0</code> and{" "}
        <code>labels.freeLabel</code> is set, the free label renders instead of
        the currency-formatted <code>0</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localization</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PricingTable01
  labels={{
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
  }}
  tiers={tiers}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Three tones</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>primary</code> (default) — signal-lime accent on highlighted
          tier ring + badge. Matches <code>newsletter-card-01</code>'s primary
          tone.
        </li>
        <li>
          <code>accent</code> — accent-tone framing when primary is already in
          play elsewhere on the page.
        </li>
        <li>
          <code>muted</code> — neutral, low-noise placement (docs / API
          products).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Root wraps content in a single <code>&lt;section&gt;</code> with{" "}
          <code>aria-labelledby</code>; works for both layouts.
        </li>
        <li>
          Billing toggle is a WAI-ARIA <code>role="radiogroup"</code>; segments
          are <code>role="radio"</code>; arrow keys, Home, and End move
          focus + selection.
        </li>
        <li>
          Tier cards are <code>&lt;article role="region"&gt;</code> with{" "}
          <code>aria-labelledby</code> pointing at the tier name. The "Most
          popular" badge announces via <code>aria-label</code>.
        </li>
        <li>
          Feature rows are an <code>&lt;ul role="list"&gt;</code>; check/x icons
          are <code>aria-hidden</code>; state is announced via sr-only{" "}
          <code>labels.featureIncluded</code> / <code>featureExcluded</code>.
        </li>
        <li>
          Tooltips use shadcn Tooltip (Radix-backed) — open on focus + hover,
          dismiss on Escape and blur.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Development warnings</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>tiers.length &lt; 2</code> or <code>&gt; 4</code> logs a
          dev-only warning (layout is designed for 2–4 tiers).
        </li>
        <li>
          More than one tier marked <code>highlighted</code> logs a dev-only
          warning.
        </li>
        <li>
          A <code>CtaSpec</code> with neither <code>href</code> nor{" "}
          <code>onClick</code> renders a disabled button + dev warn.
        </li>
      </ul>
    </div>
  );
}
