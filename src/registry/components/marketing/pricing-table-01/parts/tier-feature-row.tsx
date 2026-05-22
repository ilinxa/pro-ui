import { Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PricingFeature, ResolvedLabels } from "../types";

interface TierFeatureRowProps {
  feature: PricingFeature;
  labels: ResolvedLabels;
  className?: string;
}

export function TierFeatureRow({
  feature,
  labels,
  className,
}: TierFeatureRowProps) {
  const Icon = feature.included ? Check : X;
  const iconClass = feature.included
    ? "text-primary"
    : "text-muted-foreground";
  const stateLabel = feature.included
    ? labels.featureIncluded
    : labels.featureExcluded;

  const labelContent = feature.tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">
          {feature.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{feature.tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    feature.label
  );

  return (
    <li
      className={cn(
        "flex items-start gap-2 text-sm",
        feature.included ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)}
      />
      <span className="sr-only">{stateLabel}:</span>
      <span>{labelContent}</span>
    </li>
  );
}
