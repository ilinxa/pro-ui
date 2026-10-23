"use client";

import { memo, useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ResolvedStoryRailLabels, StoryRailItem } from "../types";

export interface StoryThumbnailProps {
  item: StoryRailItem;
  index: number;
  baseId: string;
  onItemClick?: (item: StoryRailItem, index: number) => void;
  onPreviewError?: (item: StoryRailItem) => Promise<string | void>;
  getHref?: (item: StoryRailItem) => string;
  linkComponent?: ElementType;
  labels: ResolvedStoryRailLabels;
  className?: string;
}

/** Tile box — the prototype's 80×112 portrait. Also the `<img>` intrinsic size. */
const TILE_W = 80;
const TILE_H = 112;

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

type PreviewPhase = "primary" | "refreshing" | "retry" | "failed";

interface StoryPreviewProps {
  item: StoryRailItem;
  onPreviewError?: (item: StoryRailItem) => Promise<string | void>;
  /**
   * URLs this tile already obtained from `onPreviewError`. Owned by the
   * (un-keyed) thumbnail so it survives the preview remounting when a host
   * writes a refreshed URL back onto the item — that URL gets ONE attempt and
   * no further refresh, so a backend that keeps minting dead URLs cannot loop.
   */
  refreshed: Set<string>;
}

/**
 * Preview image with an avatar-card fallback. Keyed by `previewImage` at the
 * call site, so a new URL from the host starts over.
 *
 * Flow: no preview → avatar card. Load error → `onPreviewError(item)` (once);
 * a resolved URL is tried once, as a plain `src` (the item's `srcSet` holds the
 * same expired URLs, and browsers prefer `srcset` over `src`); nothing / a
 * rejection / a second error → avatar card. The avatar card also covers the
 * refresh wait (no broken-image icon).
 */
function StoryPreview({ item, onPreviewError, refreshed }: StoryPreviewProps) {
  const initialSrc = item.previewImage || undefined;
  const [src, setSrc] = useState(initialSrc);
  const [phase, setPhase] = useState<PreviewPhase>(
    !initialSrc ? "failed" : refreshed.has(initialSrc) ? "retry" : "primary",
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const aliveRef = useRef(true);
  // Error handling may be entered twice for one failure (the hydration probe
  // and a queued `error` event, or StrictMode effects) — the ref, unlike the
  // `phase` closure, sees the first entry.
  const phaseRef = useRef(phase);
  const itemRef = useRef(item);
  const onPreviewErrorRef = useRef(onPreviewError);
  useEffect(() => {
    itemRef.current = item;
    onPreviewErrorRef.current = onPreviewError;
  });
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const moveTo = (next: PreviewPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const handleError = () => {
    const current = phaseRef.current;
    if (current === "refreshing" || current === "failed") return;
    const refresh = onPreviewErrorRef.current;
    if (current !== "primary" || !refresh) {
      moveTo("failed");
      return;
    }
    moveTo("refreshing");
    let pending: Promise<string | void>;
    try {
      pending = refresh(itemRef.current);
    } catch {
      moveTo("failed");
      return;
    }
    Promise.resolve(pending).then(
      (next) => {
        if (!aliveRef.current) return;
        if (typeof next === "string" && next) {
          refreshed.add(next);
          setSrc(next);
          moveTo("retry");
        } else {
          moveTo("failed");
        }
      },
      () => {
        if (aliveRef.current) moveTo("failed");
      },
    );
  };

  // An image that failed before hydration never fires React's onError.
  // `complete` with no natural width is ambiguous (broken, or an SVG without
  // intrinsic size), so let `decode()` decide: it rejects only when broken.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth !== 0 || !img.currentSrc) return;
    if (typeof img.decode !== "function") return;
    img.decode().then(
      () => {},
      () => {
        if (aliveRef.current) handleError();
      },
    );
    // Mount-only probe; later errors arrive through onError.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "failed" || phase === "refreshing" || !src) {
    return (
      <div
        data-slot="story-rail-avatar-card"
        className="flex h-full w-full items-center justify-center bg-muted"
      >
        <Avatar className="h-12 w-12">
          {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
          <AvatarFallback className="text-sm">
            {initials(item.username)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      srcSet={phase === "primary" ? item.previewSrcSet : undefined}
      sizes={
        phase === "primary" && item.previewSrcSet
          ? (item.previewSizes ?? `${TILE_W}px`)
          : undefined
      }
      alt=""
      width={TILE_W}
      height={TILE_H}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className="h-full w-full object-cover duration-300 motion-safe:transition-transform motion-safe:group-hover:scale-105"
    />
  );
}

function StoryThumbnailInner({
  item,
  index,
  baseId,
  onItemClick,
  onPreviewError,
  getHref,
  linkComponent,
  labels,
  className,
}: StoryThumbnailProps) {
  // Stable per tile (not per preview): see StoryPreviewProps.refreshed.
  const [refreshed] = useState(() => new Set<string>());
  const isMuted = !!item.muted;
  const showRing = !!item.hasUnread && !isMuted;
  const ariaLabel = labels.thumbnailAriaLabel(item);
  const hasLink = !!getHref;
  const href = hasLink ? getHref!(item) : undefined;
  const handleClick = () => onItemClick?.(item, index);

  const inner = (
    <>
      <div
        data-slot="story-rail-ring"
        data-state={isMuted ? "muted" : showRing ? "unread" : "read"}
        className={cn(
          "rounded-2xl p-0.5 motion-safe:transition-colors",
          showRing
            ? "bg-linear-to-br from-story-ring-from to-story-ring-to"
            : "bg-muted",
          isMuted && "opacity-60",
        )}
      >
        <div className="h-28 w-20 overflow-hidden rounded-[14px] border-2 border-card bg-card">
          <StoryPreview
            key={item.previewImage ?? ""}
            item={item}
            onPreviewError={onPreviewError}
            refreshed={refreshed}
          />
        </div>
      </div>
      <div className={cn("flex items-center gap-1.5", isMuted && "opacity-60")}>
        <Avatar className="h-5 w-5 border border-card">
          {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
          <AvatarFallback className="text-[8px]">
            {initials(item.username)}
          </AvatarFallback>
        </Avatar>
        <span
          id={`${baseId}-name`}
          className="max-w-14 truncate text-center text-xs font-medium"
        >
          {item.username}
        </span>
      </div>
    </>
  );

  const rootClassName = cn(
    "group flex shrink-0 flex-col items-center gap-2 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  if (hasLink && href) {
    const LinkComponent = linkComponent ?? "a";
    return (
      <LinkComponent
        href={href}
        onClick={onItemClick ? handleClick : undefined}
        aria-label={ariaLabel}
        className={rootClassName}
      >
        {inner}
      </LinkComponent>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={rootClassName}
    >
      {inner}
    </button>
  );
}

export const StoryThumbnail = memo(StoryThumbnailInner);
StoryThumbnail.displayName = "StoryThumbnail";
