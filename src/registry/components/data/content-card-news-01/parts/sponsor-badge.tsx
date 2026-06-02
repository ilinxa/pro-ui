import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentCardNewsLabels } from "../types";

interface SponsorBadgeProps {
  /** Whether the item is sponsored. */
  isSponsored: boolean | undefined;
  /** Sponsor name — renders as "Sponsored by {name}" via template. */
  sponsorLabel: string | undefined;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Sponsor badge — renders "Sponsored by {name}" when `sponsorLabel` is set,
 * otherwise "Sponsored". No render when `isSponsored !== true`.
 *
 * RSC-compatible.
 */
export function SponsorBadge({
  isSponsored,
  sponsorLabel,
  labels,
  className,
}: SponsorBadgeProps) {
  if (!isSponsored) return null;

  const text = sponsorLabel
    ? labels.sponsoredBadgeLabelTemplate.replace("{name}", sponsorLabel)
    : labels.sponsoredBadgeFallback;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      <Megaphone className="size-3" aria-hidden />
      {text}
    </span>
  );
}
