"use client";

import { useMemo, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { PostCard01 } from "../post-card-01";
import type { Post, PostCard01Props } from "../types";

export interface RepostOfCardProps {
  /** The original post being reposted (`statefulPost.repostOf`). */
  originalPost: Post;
  /**
   * Click handler — overrides default `getHref`-based navigation. When
   * provided, the foreground click target renders as a `<button>` and fires
   * with the original post. When omitted and `getHref` is set, renders as
   * an `<a>`. When neither is set, the card is non-interactive.
   */
  onClick?: (originalPost: Post) => void;
  /** Used to derive the default href when `onClick` is omitted. */
  getHref?: PostCard01Props["getHref"];
  /** Polymorphic root for the anchor case. Default `"a"`. */
  linkComponent?: PostCard01Props["linkComponent"];
  /** Forwarded to the nested compact `<PostCard01>` for header label strings. */
  labels?: PostCard01Props["labels"];
  className?: string;
}

/**
 * Sealed client component rendering a nested counts-only mini-card for a
 * reposted post. Nests `<PostCard01 variant="compact" engagementMode="navigate"
 * viewerMode="viewer" engagementActions={() => []}>` per plan Q-P30 — the
 * empty-array slot suppresses the engagement bar entirely (engagement-bar-01
 * short-circuits when actions.length === 0), leaving only the compact header
 * and content body. Result: counts-only meta row inside the nested compact card.
 *
 * Recursion-strip: `originalPost.repostOf` is forced to `undefined` before being
 * passed down, so a repost-of-a-repost renders only one level deep.
 *
 * Polymorphic root + interaction model:
 *   - `onClick` provided → foreground `<button>` captures click + keyboard.
 *   - `getHref` provided → foreground `<LinkComponent href>` captures click +
 *     middle-click + right-click-open-in-new-tab semantics.
 *   - Neither → non-interactive.
 * The nested mini-card is wrapped in `pointer-events-none` so any descendant
 * interactivity (kebab if labels populated, mention/tag chips, etc.) cannot
 * conflict with the outer click target. The foreground click target sits at
 * `z-10` above the nested card.
 */
export function RepostOfCard({
  originalPost,
  onClick,
  getHref,
  linkComponent,
  labels,
  className,
}: RepostOfCardProps) {
  // Recursion-strip: prevent infinite nesting of repost mini-cards.
  const strippedOriginal = useMemo<Post>(
    () => ({ ...originalPost, repostOf: undefined }),
    [originalPost],
  );

  const overlayClasses =
    "absolute inset-0 z-10 cursor-pointer rounded-lg transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const ariaLabel = `Open ${originalPost.author.name}'s post`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-muted/30",
        className,
      )}
    >
      <div className="pointer-events-none">
        <PostCard01
          variant="compact"
          engagementMode="navigate"
          viewerMode="viewer"
          engagementActions={() => []}
          post={strippedOriginal}
          labels={labels}
        />
      </div>
      {onClick ? (
        <button
          type="button"
          onClick={() => onClick(originalPost)}
          className={overlayClasses}
          aria-label={ariaLabel}
        />
      ) : getHref ? (
        (() => {
          const LinkComponent: ElementType = linkComponent ?? "a";
          return (
            <LinkComponent
              href={getHref(originalPost)}
              className={overlayClasses}
              aria-label={ariaLabel}
            />
          );
        })()
      ) : null}
    </div>
  );
}

RepostOfCard.displayName = "RepostOfCard";
