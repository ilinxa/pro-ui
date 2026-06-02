import { AlertTriangle, Pin, Star, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ContentCardItem, ContentCardNewsLabels } from "../types";
import { StatusBadge } from "./status-badge";
import { SponsorBadge } from "./sponsor-badge";

interface NewsBadgesProps {
  item: ContentCardItem;
  labels: Required<ContentCardNewsLabels>;
  /**
   * When `true`, only the highest-priority badge renders. Used by the `small`
   * variant per Q-PA matrix.
   */
  highestPriorityOnly?: boolean;
  /**
   * Whether the viewer is in editor mode — status badge only renders then.
   */
  isEditorMode?: boolean;
  className?: string;
}

/**
 * Ordered editorial badge stack per Q-P42 priority:
 *  1. isBreaking
 *  2. isLive
 *  3. isExclusive
 *  4. isFeatured
 *  5. isPinned
 *  6. isSponsored
 *  7. status (editor mode only; renders nothing for `published`)
 *
 * `small` variant passes `highestPriorityOnly` to limit to the top badge.
 * RSC-compatible.
 */
export function NewsBadges({
  item,
  labels,
  highestPriorityOnly = false,
  isEditorMode = false,
  className,
}: NewsBadgesProps) {
  const candidates: ReactNode[] = [];

  if (item.isBreaking) {
    candidates.push(
      <span
        key="breaking"
        className="inline-flex items-center gap-1 rounded-md border border-red-600/40 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      >
        <AlertTriangle className="size-3" aria-hidden />
        {labels.breakingBadgeLabel}
      </span>,
    );
  }
  if (item.isLive) {
    candidates.push(
      <span
        key="live"
        className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400"
      >
        <span
          className="relative inline-flex size-1.5 rounded-full bg-red-500 motion-safe:animate-pulse"
          aria-hidden
        />
        {labels.liveBadgeLabel}
      </span>,
    );
  }
  if (item.isExclusive) {
    candidates.push(
      <span
        key="exclusive"
        className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400"
      >
        <ShieldCheck className="size-3" aria-hidden />
        {labels.exclusiveBadgeLabel}
      </span>,
    );
  }
  if (item.isFeatured) {
    candidates.push(
      <span
        key="featured"
        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
      >
        <Star className="size-3" aria-hidden />
        {labels.featuredBadgeLabel}
      </span>,
    );
  }
  if (item.isPinned) {
    candidates.push(
      <span
        key="pinned"
        className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground"
      >
        <Pin className="size-3" aria-hidden />
        {labels.pinnedBadgeLabel}
      </span>,
    );
  }
  if (item.isSponsored) {
    candidates.push(
      <SponsorBadge
        key="sponsored"
        isSponsored={item.isSponsored}
        sponsorLabel={item.sponsorLabel}
        labels={labels}
      />,
    );
  }
  if (isEditorMode && item.status && item.status !== "published") {
    candidates.push(
      <StatusBadge key="status" status={item.status} labels={labels} />,
    );
  }

  if (candidates.length === 0) return null;

  const visible = highestPriorityOnly ? candidates.slice(0, 1) : candidates;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible}
    </div>
  );
}
