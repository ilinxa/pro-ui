import { useId } from "react";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./price-display";
import { TierCta } from "./tier-cta";
import { TierFeatureRow } from "./tier-feature-row";
import type {
  BillingPeriod,
  PricingTier,
  ResolvedLabels,
  ResolvedTone,
} from "../types";

interface TierCardProps {
  tier: PricingTier;
  billing: BillingPeriod;
  labels: ResolvedLabels;
  toneClasses: ResolvedTone;
  onTierCtaClick: (tierName: string) => void;
  className?: string;
  highlightedRingClassName?: string;
}

export function TierCard({
  tier,
  billing,
  labels,
  toneClasses,
  onTierCtaClick,
  className,
  highlightedRingClassName,
}: TierCardProps) {
  const titleId = useId();
  const isHighlighted = !!tier.highlighted;
  const badgeText = tier.badge ?? labels.popularBadge;

  return (
    <article
      role="region"
      aria-labelledby={titleId}
      className={cn(
        "relative flex flex-col gap-6 rounded-2xl border bg-card p-6 text-card-foreground",
        isHighlighted
          ? cn(
              "ring-2",
              toneClasses.highlightBorder,
              toneClasses.highlightRing,
              highlightedRingClassName,
            )
          : toneClasses.cardBorder,
        className,
      )}
    >
      {isHighlighted ? (
        <span
          className={cn(
            "absolute -top-3 start-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            toneClasses.badgeBg,
            toneClasses.badgeText,
          )}
          aria-label={badgeText}
        >
          {badgeText}
        </span>
      ) : null}

      <header className="flex flex-col gap-1.5">
        <h3 id={titleId} className="text-lg font-semibold text-foreground">
          {tier.name}
        </h3>
        {tier.description ? (
          <p className="text-sm text-muted-foreground">{tier.description}</p>
        ) : null}
      </header>

      <PriceDisplay tier={tier} billing={billing} labels={labels} />

      <TierCta
        cta={tier.cta}
        tierName={tier.name}
        onTierCtaClick={onTierCtaClick}
      />

      <ul role="list" className="flex flex-col gap-2">
        {tier.features.map((feature, index) => (
          <TierFeatureRow
            key={`${feature.label}-${index}`}
            feature={feature}
            labels={labels}
          />
        ))}
      </ul>
    </article>
  );
}
