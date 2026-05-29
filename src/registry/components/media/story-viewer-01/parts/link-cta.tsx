"use client";

import { type ComponentProps, type ElementType, useEffect, useRef, useState } from "react";
import { Link as LinkIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { ResolvedStoryViewer01Labels, Story, StoryItem } from "../types";

export interface LinkCtaProps {
  story: Story;
  item: StoryItem;
  /**
   * Polymorphic root for the CTA. Defaults to `"a"`; consumers pass
   * framework-specific link components (e.g. Next.js `<Link>`, react-router
   * `<Link>`) to get client-side nav semantics. The rewriter does NOT touch
   * polymorphic component identifiers, so this is safe across registry CLI
   * installs (F-cross-13 safe).
   */
  linkComponent?: ElementType;
  onLinkClick?: (storyId: string, itemId: string, url: string) => void;
  labels: ResolvedStoryViewer01Labels;
}

/**
 * Top-anchored link affordance for `StoryItem.link`.
 *
 * v0.2.0 — was a bottom CTA button at `bottom-32` (collided visually with
 * the DM bar + the engagement column).
 *
 * v0.3.8 — redesigned as a collapsible drawer at the top of the visual
 * area:
 *   - Collapsed: small rounded chip in the top-right (link icon + host
 *     domain) — minimal visual footprint.
 *   - Expanded: the chip stays, plus a wider banner slides down below it
 *     with the host domain + the CTA button + a close X. Tap the chip
 *     again or X to collapse.
 *   - The actual link/anchor is rendered on the CTA button inside the
 *     expanded banner; tapping the chip alone does NOT navigate — it
 *     reveals the banner. This matches Instagram-canonical link-sticker UX.
 *
 * Polymorphic root via `linkComponent`. `target="_blank"` +
 * `rel="noopener noreferrer"` are applied ONLY when the root is the
 * default `"a"`. If `onLinkClick` is supplied, it fires alongside the
 * default href navigation (host can `preventDefault` inside the handler).
 *
 * Resets to collapsed on cursor change (caller controls mount/unmount via
 * key on the storyId+itemId pair effectively because the part is mounted
 * conditionally on `item.link`; story-viewer-01.tsx unmounts + remounts
 * across items naturally).
 */
export function LinkCta({
  item,
  linkComponent: LinkComponent = "a",
  onLinkClick,
  labels,
  story,
}: LinkCtaProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Outside-pointer-down collapses the drawer.
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [expanded]);

  if (!item.link) return null;
  const isDefaultAnchor = LinkComponent === "a";

  // Parse host for the chip subtitle. Falls back to the raw URL.
  let host = "";
  try {
    host = new URL(item.link.url).host;
  } catch {
    host = item.link.url;
  }

  const handleNavClick = onLinkClick
    ? () => onLinkClick(story.id, item.id, item.link!.url)
    : undefined;
  const anchorAttrs = isDefaultAnchor
    ? {
        target: "_blank" as const,
        rel: "noopener noreferrer" as const,
      }
    : {};
  const ctaProps: ComponentProps<"a"> = {
    href: item.link.url,
    onClick: handleNavClick,
    className: cn(
      buttonVariants({ variant: "default", size: "default" }),
      "h-10 w-full text-sm font-semibold",
    ),
    ...anchorAttrs,
  };

  const ctaLabel = item.link.cta ?? labels.openLink;

  return (
    <div
      ref={containerRef}
      // ProgressBars sit at top z-20 + ViewerHeader at top z-20 with `top-4`.
      // Place the chip at `top-16` so it sits just under the header strip.
      className="pointer-events-auto absolute top-16 right-3 z-25 flex flex-col items-end gap-2"
    >
      {/* Chip — always visible while the link is set. Tapping toggles the
          drawer below. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded ? "true" : "false"}
        aria-label={ctaLabel}
        className={cn(
          "flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white",
          "backdrop-blur-sm transition-colors",
          "hover:bg-black/70 focus-visible:bg-black/70 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-white/40",
        )}
      >
        <LinkIcon className="h-3.5 w-3.5" />
        <span className="max-w-32 truncate">{host}</span>
      </button>
      {/* Drawer — slides down + fades in when expanded. Closes via the X
          button (top-right of the drawer) or outside-pointer-down. */}
      <div
        className={cn(
          "w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-background text-foreground shadow-2xl",
          "origin-top-right transition-all duration-200 ease-out",
          expanded
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 -translate-y-2",
        )}
        aria-hidden={expanded ? undefined : "true"}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {host}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label={labels.commentsCloseLabel}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-3">
          <LinkComponent {...ctaProps}>{ctaLabel}</LinkComponent>
        </div>
      </div>
    </div>
  );
}
