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
        "inline-flex h-5 shrink-0 items-center gap-1 rounded bg-card/95 px-1.5 text-[10px] font-semibold uppercase tracking-wide leading-none text-muted-foreground ring-1 ring-border",
        className,
      )}
    >
      <Megaphone className="size-2.5" aria-hidden />
      {text}
    </span>
  );
}
