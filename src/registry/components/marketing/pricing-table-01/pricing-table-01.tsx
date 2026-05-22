"use client";

import { memo, useCallback, useEffect, useId, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BillingToggle } from "./parts/billing-toggle";
import { ComparisonTable } from "./parts/comparison-table";
import { TierCard } from "./parts/tier-card";
import { resolveTone } from "./parts/tone";
import {
  DEFAULT_LABELS,
  type BillingPeriod,
  type PricingTable01Props,
} from "./types";

/**
 * PricingTable01 — side-by-side pricing tiers with optional monthly/annual toggle,
 * highlighted-tier badge, per-feature included rows, and a comparison-table layout.
 *
 * Billing-period state is controlled-or-uncontrolled (mirrors React input convention).
 * CTAs accept ReactNode (load-bearing, consumer wraps with router primitive) OR a
 * CtaSpec convenience overload that renders a plain anchor/button.
 */
function PricingTable01Impl(props: PricingTable01Props) {
  const {
    heading,
    subheading,
    headingAs = "h2",
    tiers,
    layout = "cards",
    billingToggle = "none",
    billing: controlledBilling,
    defaultBilling = "monthly",
    onBillingChange,
    tone = "primary",
    onTierCtaClick,
    labels: labelsProp,
    className,
    tierCardClassName,
    highlightedRingClassName,
    id: idProp,
  } = props;

  const HeadingTag = headingAs;
  const generatedId = useId();
  const rootId = idProp ?? generatedId;
  const headingId = `${rootId}-heading`;

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp],
  );
  const toneClasses = useMemo(() => resolveTone(tone), [tone]);

  const [internalBilling, setInternalBilling] =
    useState<BillingPeriod>(defaultBilling);
  const isControlled = controlledBilling !== undefined;
  const billing = isControlled ? controlledBilling : internalBilling;

  const handleBillingChange = useCallback(
    (period: BillingPeriod) => {
      if (!isControlled) setInternalBilling(period);
      onBillingChange?.(period);
    },
    [isControlled, onBillingChange],
  );

  const handleTierCtaClick = useCallback(
    (tierName: string) => {
      onTierCtaClick?.(tierName);
    },
    [onTierCtaClick],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (tiers.length < 2 || tiers.length > 4) {
      console.warn(
        `[pricing-table-01] expected 2–4 tiers, received ${tiers.length}. Layout assumes 2–4 tiers.`,
      );
    }
    const highlightedCount = tiers.filter((tier) => tier.highlighted).length;
    if (highlightedCount > 1) {
      console.warn(
        `[pricing-table-01] ${highlightedCount} tiers marked highlighted; only one tier per table is the intended pattern.`,
      );
    }
  }, [tiers]);

  const showToggle = billingToggle === "monthly-annual";

  // F-cross-13: dropped `delayDuration={150}` from <TooltipProvider> below —
  // Radix-vs-Base-UI prop-name divergence (`delayDuration` vs `delay`). Per
  // the locked defensive pattern, syntactically-divergent props are dropped
  // at the producer side so consumer-side shadcn-add installs (which ship
  // Base UI) don't carry a stale prop name. Default delay (~700ms Radix /
  // ~600ms Base UI) is acceptable for a pricing-table tooltip surface.
  return (
    <TooltipProvider>
      <section
        id={rootId}
        aria-labelledby={heading ? headingId : undefined}
        className={cn("flex flex-col gap-8", className)}
      >
        {(heading || subheading || showToggle) && (
          <header className="flex flex-col items-center gap-4 text-center">
            {heading ? (
              <HeadingTag
                id={headingId}
                className="text-2xl font-semibold text-foreground sm:text-3xl"
              >
                {heading}
              </HeadingTag>
            ) : null}
            {subheading ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {subheading}
              </p>
            ) : null}
            {showToggle ? (
              <BillingToggle
                billing={billing}
                onChange={handleBillingChange}
                labels={labels}
                toneClasses={toneClasses}
              />
            ) : null}
          </header>
        )}

        {layout === "table" ? (
          <ComparisonTable
            tiers={tiers}
            billing={billing}
            labels={labels}
            toneClasses={toneClasses}
            onTierCtaClick={handleTierCtaClick}
            highlightedRingClassName={highlightedRingClassName}
          />
        ) : (
          <div
            className={cn(
              "grid gap-6",
              "grid-cols-1",
              tiers.length === 2 && "md:grid-cols-2",
              tiers.length === 3 && "md:grid-cols-2 lg:grid-cols-3",
              tiers.length >= 4 && "md:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {tiers.map((tier) => (
              <TierCard
                key={tier.name}
                tier={tier}
                billing={billing}
                labels={labels}
                toneClasses={toneClasses}
                onTierCtaClick={handleTierCtaClick}
                className={tierCardClassName}
                highlightedRingClassName={highlightedRingClassName}
              />
            ))}
          </div>
        )}
      </section>
    </TooltipProvider>
  );
}

export const PricingTable01 = memo(PricingTable01Impl);
PricingTable01.displayName = "PricingTable01";

export default PricingTable01;
