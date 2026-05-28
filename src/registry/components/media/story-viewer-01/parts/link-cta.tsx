"use client";

import { type ComponentProps, type ElementType } from "react";
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
 * v0.2.0 — bottom CTA button rendered when `StoryItem.link` is set. Sits
 * above the engagement overlay and (in viewer mode) below the reply
 * composer (per Q-V9 lock). Polymorphic root via `linkComponent`.
 *
 * `target="_blank"` + `rel="noopener noreferrer"` are applied ONLY when the
 * root is the default `"a"` — custom components manage their own nav
 * semantics. If `onLinkClick` is supplied, the click handler is wired but
 * the underlying `href` is preserved (host can call `preventDefault` inside
 * the handler).
 */
export function LinkCta({
  item,
  linkComponent: LinkComponent = "a",
  onLinkClick,
  labels,
  story,
}: LinkCtaProps) {
  if (!item.link) return null;
  const isDefaultAnchor = LinkComponent === "a";
  const handleClick = onLinkClick
    ? () => onLinkClick(story.id, item.id, item.link!.url)
    : undefined;
  const anchorAttrs = isDefaultAnchor
    ? {
        target: "_blank" as const,
        rel: "noopener noreferrer" as const,
      }
    : {};
  // We rely on structural-prop compat: every supported polymorphic root
  // accepts `href` + `onClick` + `className` + children, so a single shape
  // works for `"a"` / Next.js Link / etc.
  const rootProps: ComponentProps<"a"> = {
    href: item.link.url,
    onClick: handleClick,
    className: cn(
      buttonVariants({ variant: "default", size: "lg" }),
      "h-11 w-full text-sm font-semibold",
    ),
    ...anchorAttrs,
  };
  return (
    <div className="pointer-events-auto absolute right-0 bottom-32 left-0 z-25 px-4">
      <LinkComponent {...rootProps}>
        {item.link.cta ?? labels.openLink}
      </LinkComponent>
    </div>
  );
}
