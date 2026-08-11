"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkPreview } from "../types";

export interface LinkPreviewCardProps {
  preview: LinkPreview;
  /**
   * Click handler — overrides the default `<a href={url} target="_blank">`
   * navigation. When provided, the card renders as a `<button>` and fires
   * the callback with the URL; when omitted, the card renders as a plain
   * anchor and opens in a new tab.
   */
  onClick?: (url: string) => void;
  className?: string;
}

/** Safe hostname extraction — falls back to the raw URL string if parsing throws. */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Sealed client component rendering an OG-style link preview card below the
 * post content body and above the media block.
 *
 * Per Q-D4 lock: host pre-fetches `post.linkPreview` data; library is fully
 * fetch-free. v0.3+ may add an optional `linkPreviewFetcher` prop for
 * library-side resolution.
 *
 * Renders nothing if `preview.url` is the only populated field — bare URL
 * with no title / description / image / siteName looks empty; consumers
 * supplying just a URL should suppress via `disableLinkPreviewRender`.
 */
export function LinkPreviewCard({
  preview,
  onClick,
  className,
}: LinkPreviewCardProps) {
  const interactive = !!onClick;

  // Render-skip guard: bare URL without metadata produces an empty card.
  // The library defaults to skipping it; consumers wanting a bare URL chip
  // can render their own via the renderLinkPreview slot.
  if (
    !preview.title &&
    !preview.description &&
    !preview.image &&
    !preview.siteName
  ) {
    return null;
  }

  const body = (
    <>
      {preview.image ? (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-1 p-3">
        {preview.siteName ? (
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {preview.siteName}
          </div>
        ) : null}
        {preview.title ? (
          <div className="line-clamp-2 text-sm font-semibold text-foreground">
            {preview.title}
          </div>
        ) : null}
        {preview.description ? (
          <div className="line-clamp-2 text-xs text-muted-foreground">
            {preview.description}
          </div>
        ) : null}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{getHostname(preview.url)}</span>
        </div>
      </div>
    </>
  );

  const baseClasses = cn(
    "block overflow-hidden rounded-lg border border-border bg-card transition-colors",
    interactive
      ? "w-full text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      : "hover:bg-muted/30",
    className,
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={() => onClick(preview.url)}
        className={baseClasses}
      >
        {body}
      </button>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClasses}
    >
      {body}
    </a>
  );
}

LinkPreviewCard.displayName = "LinkPreviewCard";
