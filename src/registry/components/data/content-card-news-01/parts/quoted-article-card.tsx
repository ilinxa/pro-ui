"use client";

import { useMemo, type ElementType, type MouseEvent } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentCardNews01 } from "../content-card-news-01";
import { stripQuotedRecursion } from "../lib/defaults";
import type { ContentCardItem, ContentCardNewsProps } from "../types";

export interface QuotedArticleCardProps {
  /** The original article being quoted. */
  quotedArticle: ContentCardItem;
  /**
   * Click handler — overrides default `href`-based navigation. When set,
   * the foreground click target renders as `<button>` and fires with the
   * quoted article. When omitted and `href` is set, renders as `<a href>`.
   * When neither set, the card is non-interactive (visual quote only).
   */
  onClick?: (quotedArticle: ContentCardItem) => void;
  /** Optional href for the default navigation case. */
  href?: string;
  /** Polymorphic root for the anchor case. Default 'a'. */
  linkComponent?: ContentCardNewsProps["linkComponent"];
  /** Forwarded to the nested `<ContentCardNews01>` for label strings. */
  labels?: ContentCardNewsProps["labels"];
  className?: string;
}

/**
 * Quoted article mini-card per Q-P32 + Q-PE.
 *
 * Renders a nested `<ContentCardNews01 variant="medium">` with:
 *  - `quotedArticle` stripped via {@link stripQuotedRecursion} (no infinite nesting)
 *  - `actions` undefined (no nested kebab; pointer-events-none wrapper blocks any leak)
 *  - `viewerMode` undefined (no role-aware UI in the nested card)
 *  - `disableQuotedRender` true (defense in depth — if recursion-strip ever drifts)
 *  - `disableEngagementCounts` true (no engagement on quoted articles)
 *  - `disableBadgesRender` false (quoted articles still show their own badges — important for "quoting a Breaking/Live piece")
 *
 * The inner card is wrapped in `pointer-events-none` so any descendant
 * interactivity cannot conflict with the foreground click target at `z-10`.
 *
 * Per the Q-PA matrix, this part renders only in `medium` + `list` variants
 * — the integration at C11 enforces that.
 */
export function QuotedArticleCard({
  quotedArticle,
  onClick,
  href,
  linkComponent: LinkComponent = "a" as ElementType,
  labels,
  className,
}: QuotedArticleCardProps) {
  const strippedItem = useMemo(
    () => stripQuotedRecursion(quotedArticle),
    [quotedArticle],
  );

  const handleClick = (event: MouseEvent) => {
    if (!onClick) return;
    event.preventDefault();
    onClick(quotedArticle);
  };

  const isInteractive = Boolean(onClick) || Boolean(href);

  return (
    <div
      className={cn(
        "relative rounded-md border border-border bg-card/40 p-3",
        className,
      )}
    >
      {/* Quote glyph */}
      <Quote
        className="absolute right-2 top-2 size-4 text-muted-foreground/40"
        aria-hidden
      />

      {/* Nested card — pointer-events-none stops nested interactives competing */}
      <div className="pointer-events-none">
        <ContentCardNews01
          item={strippedItem}
          variant="medium"
          labels={labels}
          actions={undefined}
          viewerMode={undefined}
          disableQuotedRender
          disableEngagementCounts
        />
      </div>

      {/* Foreground click target (when interactive) */}
      {isInteractive && (
        <>
          {onClick ? (
            <button
              type="button"
              onClick={handleClick}
              aria-label={`Read quoted article: ${quotedArticle.title}`}
              className="absolute inset-0 z-10 cursor-pointer rounded-md transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          ) : (
            <LinkComponent
              href={href}
              aria-label={`Read quoted article: ${quotedArticle.title}`}
              className="absolute inset-0 z-10 cursor-pointer rounded-md transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          )}
        </>
      )}
    </div>
  );
}
