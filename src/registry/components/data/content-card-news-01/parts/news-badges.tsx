import { AlertTriangle, Pin, Star, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ContentCardItem, ContentCardNewsLabels } from "../types";
import { StatusBadge } from "./status-badge";
import { SponsorBadge } from "./sponsor-badge";

/**
 * Two logical groups inside the badge stack — they're conceptually different
 * and editorial design wants them in different positions on the card:
 *
 *   - `"state"` — Breaking / Live / Pinned / Sponsored / Status: WHAT IS THE
 *     STATE of this content (urgency / admin / commercial disclosure).
 *     Belongs on the IMAGE overlay (top-right corner in medium / large; top
 *     of the hero in featured) — they answer "should I look at this now?".
 *
 *   - `"curation"` — Exclusive / Featured: WHAT KIND OF EDITORIAL PRODUCT
 *     is this (Exclusive scoop / Featured pick). Belongs as a KICKER above
 *     the title in the body — they answer "what kind of journalism is this?".
 *
 * The priority order from Q-P42 is preserved within each group; the split
 * is purely visual layout (not a re-prioritization).
 */
export type NewsBadgeGroup = "all" | "state" | "curation";

interface NewsBadgesProps {
  item: ContentCardItem;
  labels: Required<ContentCardNewsLabels>;
  /**
   * When `true`, only the highest-priority badge renders. Used by the `small`
   * variant per Q-PA matrix. Operates AFTER the group filter when both are set.
   */
  highestPriorityOnly?: boolean;
  /**
   * Whether the viewer is in editor mode — status badge only renders then.
   */
  isEditorMode?: boolean;
  /**
   * Which logical group to render. Default `"all"`. See {@link NewsBadgeGroup}
   * for the split rationale.
   */
  group?: NewsBadgeGroup;
  className?: string;
}

/**
 * Uniform editorial badge — same shape + sizing across all states (h-5,
 * px-2, py-0, text-[10px], font-semibold, uppercase, tracking-wide). Visual
 * hierarchy lives in saturation: vivid solid for breaking-tier (Breaking /
 * Live); accent solid for editorial-curation (Featured / Exclusive); subtle
 * card-tone for low-tier (Pinned / Sponsored / status). No border-tint mix.
 * Drop-shadow on the vivid tier so they read against bright hero images.
 *
 * Sized for ~5 badges to fit on a single line at medium-card width (~280px)
 * without wrapping. Beyond that, flex-wrap kicks in.
 */
const BADGE_BASE =
  "inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide leading-none";

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
  group = "all",
  className,
}: NewsBadgesProps) {
  const candidates: ReactNode[] = [];

  // ─── State-group candidates ────────────────────────────────────────────
  const wantsState = group === "all" || group === "state";

  if (wantsState && item.isBreaking) {
    candidates.push(
      <span
        key="breaking"
        className={cn(
          BADGE_BASE,
          "bg-red-600 text-white shadow-sm shadow-red-950/30 ring-1 ring-red-700/40",
        )}
      >
        <AlertTriangle className="size-2.5" aria-hidden />
        {labels.breakingBadgeLabel}
      </span>,
    );
  }
  if (wantsState && item.isLive) {
    candidates.push(
      <span
        key="live"
        className={cn(
          BADGE_BASE,
          "bg-red-500 text-white shadow-sm shadow-red-950/30 ring-1 ring-red-700/40",
        )}
      >
        <span
          className="relative inline-flex size-1.5 rounded-full bg-white motion-safe:animate-pulse"
          aria-hidden
        />
        {labels.liveBadgeLabel}
      </span>,
    );
  }

  // ─── Curation-group candidates ─────────────────────────────────────────
  const wantsCuration = group === "all" || group === "curation";

  if (wantsCuration && item.isExclusive) {
    candidates.push(
      <span
        key="exclusive"
        className={cn(
          BADGE_BASE,
          "bg-amber-500 text-amber-950 shadow-sm shadow-amber-950/20",
        )}
      >
        <ShieldCheck className="size-2.5" aria-hidden />
        {labels.exclusiveBadgeLabel}
      </span>,
    );
  }
  if (wantsCuration && item.isFeatured) {
    candidates.push(
      <span
        key="featured"
        className={cn(
          BADGE_BASE,
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
        )}
      >
        <Star className="size-2.5 fill-current" aria-hidden />
        {labels.featuredBadgeLabel}
      </span>,
    );
  }

  // ─── State-group continuation (Pinned / Sponsored / Status) ────────────
  if (wantsState && item.isPinned) {
    candidates.push(
      <span
        key="pinned"
        className={cn(BADGE_BASE, "bg-card/95 text-foreground ring-1 ring-border")}
      >
        <Pin className="size-2.5 fill-current" aria-hidden />
        {labels.pinnedBadgeLabel}
      </span>,
    );
  }
  if (wantsState && item.isSponsored) {
    candidates.push(
      <SponsorBadge
        key="sponsored"
        isSponsored={item.isSponsored}
        sponsorLabel={item.sponsorLabel}
        labels={labels}
      />,
    );
  }
  if (
    wantsState &&
    isEditorMode &&
    item.status &&
    item.status !== "published"
  ) {
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
