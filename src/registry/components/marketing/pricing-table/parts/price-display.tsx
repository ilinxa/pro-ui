import { cn } from "@/lib/utils";
import type { BillingPeriod, PricingTier, ResolvedLabels } from "../types";
import { formatPrice, formatYearly, resolveYearlyHint } from "./format";

interface PriceDisplayProps {
  tier: PricingTier;
  billing: BillingPeriod;
  labels: ResolvedLabels;
  className?: string;
}

export function PriceDisplay({
  tier,
  billing,
  labels,
  className,
}: PriceDisplayProps) {
  const {
    priceMonthly,
    priceAnnual,
    currencyCode,
    currencyDisplay = "symbol",
    periodLabel,
  } = tier;

  const showAnnual = billing === "annual" && priceAnnual !== undefined;
  const activePrice = showAnnual ? (priceAnnual as number) : priceMonthly;

  const isFree =
    activePrice === 0 && labels.freeLabel !== undefined && billing === "monthly";

  const formattedActive = formatPrice(activePrice, currencyCode, currencyDisplay);
  const formattedMonthly = formatPrice(priceMonthly, currencyCode, currencyDisplay);

  const periodCopy =
    periodLabel ??
    (billing === "annual" ? labels.periodAnnual : labels.periodMonthly);

  const showStrikethrough =
    showAnnual && (priceAnnual as number) < priceMonthly;

  const yearlyHintText = showAnnual
    ? resolveYearlyHint(
        labels.yearlyHint,
        formatYearly(priceAnnual as number, currencyCode, currencyDisplay),
      )
    : null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-2">
        {isFree ? (
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {labels.freeLabel}
          </span>
        ) : (
          <>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {formattedActive}
            </span>
            {showStrikethrough ? (
              <s
                className="text-sm text-muted-foreground"
                aria-label={`Was ${formattedMonthly} per month`}
              >
                {formattedMonthly}
              </s>
            ) : null}
          </>
        )}
      </div>
      {!isFree ? (
        <span className="text-xs text-muted-foreground">{periodCopy}</span>
      ) : null}
      {yearlyHintText ? (
        <span className="text-xs text-muted-foreground/80">
          {yearlyHintText}
        </span>
      ) : null}
    </div>
  );
}
