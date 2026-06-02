"use client";

import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ContentCardItem,
  ContentCardNewsLabels,
} from "../types";

interface EngagementHandlerBag {
  onLike?: (nextLiked: boolean) => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: (nextBookmarked: boolean) => void;
}

interface NewsEngagementCountsProps {
  item: ContentCardItem;
  handlers: EngagementHandlerBag;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Light engagement-counts row per Q-D6=(a) + Q-P35.
 *
 * Renders inline count chips for like / comment / bookmark / share. Each
 * chip:
 *   - Hides when count is missing AND its handler is missing (no data to show + no action to take)
 *   - Shows as a non-interactive count when count present but handler missing
 *   - Shows as an interactive button when handler present (count optional)
 *   - Suppresses comment chip when `item.commentsEnabled === false`
 *
 * The like chip has bistate styling — filled heart when `isLiked` true.
 * Bookmark chip same pattern.
 *
 * **Consumers wanting the full engagement-bar-01** (inline likers, share menu,
 * realtime subscribe) pass `<EngagementBar01>` into the
 * `renderEngagementCounts` slot — this part is the *default* render, swapped
 * out per the slot pattern per description §6.2. Engagement data shape on
 * `ContentCardItem` deliberately matches engagement-bar-01's counts shape so
 * the slot is drop-in.
 *
 * Sub-exported as `NewsEngagementCounts`.
 */
export function NewsEngagementCounts({
  item,
  handlers,
  labels,
  className,
}: NewsEngagementCountsProps) {
  const hasLike = Number.isFinite(item.likeCount) || Boolean(handlers.onLike);
  const hasComment =
    item.commentsEnabled !== false &&
    (Number.isFinite(item.commentCount) || Boolean(handlers.onComment));
  const hasBookmark =
    Number.isFinite(item.bookmarkCount) || Boolean(handlers.onBookmark);
  const hasShare = Number.isFinite(item.shareCount) || Boolean(handlers.onShare);

  if (!hasLike && !hasComment && !hasBookmark && !hasShare) return null;

  const formatCount = (n: number | undefined): string => {
    if (n === undefined) return "";
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
    return `${(n / 1_000_000).toFixed(1)}m`;
  };

  return (
    <div
      className={cn(
        "relative z-10 flex flex-wrap items-center gap-1",
        className,
      )}
    >
      {hasLike && (
        <EngagementChip
          interactive={Boolean(handlers.onLike)}
          onClick={() => handlers.onLike?.(!item.isLiked)}
          ariaLabel={labels.likeAriaLabel.replace(
            "{count}",
            String(item.likeCount ?? 0),
          )}
          active={item.isLiked}
          activeTone="text-red-600 dark:text-red-400"
        >
          <Heart
            className={cn(
              "size-3.5",
              item.isLiked ? "fill-current" : "",
            )}
            aria-hidden
          />
          {item.likeCount !== undefined && (
            <span className="text-xs font-medium">
              {formatCount(item.likeCount)}
            </span>
          )}
        </EngagementChip>
      )}

      {hasComment && (
        <EngagementChip
          interactive={Boolean(handlers.onComment)}
          onClick={() => handlers.onComment?.()}
          ariaLabel={labels.commentAriaLabel.replace(
            "{count}",
            String(item.commentCount ?? 0),
          )}
        >
          <MessageCircle className="size-3.5" aria-hidden />
          {item.commentCount !== undefined && (
            <span className="text-xs font-medium">
              {formatCount(item.commentCount)}
            </span>
          )}
        </EngagementChip>
      )}

      {hasBookmark && (
        <EngagementChip
          interactive={Boolean(handlers.onBookmark)}
          onClick={() => handlers.onBookmark?.(!item.isBookmarked)}
          ariaLabel={labels.bookmarkAriaLabel.replace(
            "{count}",
            String(item.bookmarkCount ?? 0),
          )}
          active={item.isBookmarked}
          activeTone="text-primary"
        >
          <Bookmark
            className={cn(
              "size-3.5",
              item.isBookmarked ? "fill-current" : "",
            )}
            aria-hidden
          />
          {item.bookmarkCount !== undefined && (
            <span className="text-xs font-medium">
              {formatCount(item.bookmarkCount)}
            </span>
          )}
        </EngagementChip>
      )}

      {hasShare && (
        <EngagementChip
          interactive={Boolean(handlers.onShare)}
          onClick={() => handlers.onShare?.()}
          ariaLabel={labels.shareAriaLabel.replace(
            "{count}",
            String(item.shareCount ?? 0),
          )}
        >
          <Share2 className="size-3.5" aria-hidden />
          {item.shareCount !== undefined && (
            <span className="text-xs font-medium">
              {formatCount(item.shareCount)}
            </span>
          )}
        </EngagementChip>
      )}
    </div>
  );
}

interface EngagementChipProps {
  interactive: boolean;
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  activeTone?: string;
  children: React.ReactNode;
}

function EngagementChip({
  interactive,
  onClick,
  ariaLabel,
  active,
  activeTone,
  children,
}: EngagementChipProps) {
  const baseClass = cn(
    "inline-flex h-11 min-w-11 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors",
    active && activeTone,
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={cn(
          baseClass,
          "cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={baseClass} aria-label={ariaLabel}>
      {children}
    </span>
  );
}
