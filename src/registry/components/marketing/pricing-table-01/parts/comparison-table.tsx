import { Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./price-display";
import { TierCta } from "./tier-cta";
import type {
  BillingPeriod,
  PricingFeature,
  PricingTier,
  ResolvedLabels,
  ResolvedTone,
} from "../types";

interface ComparisonTableProps {
  tiers: ReadonlyArray<PricingTier>;
  billing: BillingPeriod;
  labels: ResolvedLabels;
  toneClasses: ResolvedTone;
  onTierCtaClick: (tierName: string) => void;
  className?: string;
  highlightedRingClassName?: string;
}

interface FeatureRow {
  label: string;
  tooltip: string | undefined;
  perTier: Array<PricingFeature | undefined>;
}

function buildFeatureRows(
  tiers: ReadonlyArray<PricingTier>,
): ReadonlyArray<FeatureRow> {
  const seen = new Map<string, FeatureRow>();
  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
    const tier = tiers[tierIndex];
    for (const feature of tier.features) {
      const existing = seen.get(feature.label);
      if (existing) {
        existing.perTier[tierIndex] = feature;
        if (!existing.tooltip && feature.tooltip) {
          existing.tooltip = feature.tooltip;
        }
      } else {
        const perTier: Array<PricingFeature | undefined> = new Array(
          tiers.length,
        ).fill(undefined);
        perTier[tierIndex] = feature;
        seen.set(feature.label, {
          label: feature.label,
          tooltip: feature.tooltip,
          perTier,
        });
      }
    }
  }
  return Array.from(seen.values());
}

export function ComparisonTable({
  tiers,
  billing,
  labels,
  toneClasses,
  onTierCtaClick,
  className,
  highlightedRingClassName,
}: ComparisonTableProps) {
  const rows = buildFeatureRows(tiers);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-1/4 p-3 text-start font-normal" />
            {tiers.map((tier) => {
              const isHighlighted = !!tier.highlighted;
              const badgeText = tier.badge ?? labels.popularBadge;
              return (
                <th
                  key={tier.name}
                  scope="col"
                  className={cn(
                    "p-3 text-start align-top",
                    isHighlighted
                      ? cn(
                          "rounded-t-xl ring-2 ring-inset",
                          toneClasses.highlightRing,
                          highlightedRingClassName,
                        )
                      : null,
                  )}
                >
                  <div className="flex flex-col gap-1.5">
                    {isHighlighted ? (
                      <span
                        className={cn(
                          "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          toneClasses.badgeBg,
                          toneClasses.badgeText,
                        )}
                      >
                        {badgeText}
                      </span>
                    ) : null}
                    <span className="text-base font-semibold text-foreground">
                      {tier.name}
                    </span>
                    {tier.description ? (
                      <span className="text-xs text-muted-foreground">
                        {tier.description}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border/60">
            <th scope="row" className="sticky start-0 bg-card p-3 text-start text-xs font-medium text-muted-foreground">
              {billing === "annual" ? labels.annualLabel : labels.monthlyLabel}
            </th>
            {tiers.map((tier) => (
              <td key={tier.name} className="p-3 align-top">
                <PriceDisplay tier={tier} billing={billing} labels={labels} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-border/60">
            <th
              scope="row"
              className="sticky start-0 bg-card p-3 text-start text-xs font-medium text-muted-foreground"
            >
              <span className="sr-only">Call to action</span>
            </th>
            {tiers.map((tier) => (
              <td key={tier.name} className="p-3 align-top">
                <TierCta
                  cta={tier.cta}
                  tierName={tier.name}
                  onTierCtaClick={onTierCtaClick}
                />
              </td>
            ))}
          </tr>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border/60">
              <th
                scope="row"
                className="sticky start-0 bg-card p-3 text-start text-sm font-normal text-foreground"
              >
                {row.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">
                        {row.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{row.tooltip}</TooltipContent>
                  </Tooltip>
                ) : (
                  row.label
                )}
              </th>
              {row.perTier.map((cell, index) => {
                const tier = tiers[index];
                const included = cell?.included ?? false;
                const stateLabel = included
                  ? labels.featureIncluded
                  : labels.featureExcluded;
                const Icon = included ? Check : X;
                return (
                  <td
                    key={tier.name}
                    className="p-3 align-top text-muted-foreground"
                  >
                    <span className="sr-only">{stateLabel}</span>
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4",
                        included ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
