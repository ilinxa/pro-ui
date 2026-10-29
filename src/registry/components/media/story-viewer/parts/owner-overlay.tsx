"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { resolveLocale } from "../lib/relative-time";
import { useLayerFocusReturn } from "../hooks/use-layer-focus-return";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  ResolvedStoryViewer01Labels,
  Story,
  StoryItem,
  StoryViewersPage,
  ViewerListItem,
} from "../types";

export interface OwnerOverlayProps {
  story: Story;
  item: StoryItem;
  /**
   * Pages the viewers of the current item: `(item.id, null)` on first open, then the
   * previous `nextCursor` for each "load more". A rejection shows a Retry row.
   */
  onLoadViewers?: (itemId: string, cursor: string | null) => Promise<StoryViewersPage>;
  labels: ResolvedStoryViewer01Labels;
  /** Locale for the view count (`Intl.NumberFormat`); invalid / absent → `"en"`. */
  locale?: string;
  className?: string;
  /**
   * Internal (not exported from the barrel): lets the root own the viewers
   * list's open state so it counts as a layer (pauses the timer, closes on
   * Escape). Uncontrolled when omitted.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

/**
 * Owner overlay — bottom-anchored view-count chip + tap-to-expand viewers
 * list panel. Mounts only when `viewerMode === "owner"` + `!disableOwnerOverlay`.
 *
 * Per Q-V5 hybrid lock: count is eager (`item.viewerCount`, falling back to
 * `story.viewerCount`; `null` = no number), users list is lazy and paged
 * (`onLoadViewers(itemId, cursor)` on first tap, then on each "load more"; a
 * rejection shows Retry). Optional eager seed via `story.viewers`
 * short-circuits the fetch. The list resets when the current item changes.
 *
 * The expanded panel renders avatars + names inline (a simple list — not the
 * cross-cat LikersStrip — to keep the F-S1 surface minimal; LikersStrip can
 * be wired via `renderOwnerOverlay` slot if the host wants the swipable
 * variant).
 */
function OwnerOverlayInner(props: OwnerOverlayProps) {
  // This item's count wins (`null` = withheld); the story's is the fallback.
  const itemCount = props.item.viewerCount;
  const storyCount = props.story.viewerCount;
  const countValue: number | null =
    itemCount !== undefined
      ? itemCount
      : storyCount !== undefined
        ? storyCount
        : (props.story.viewers?.length ?? 0);
  const [localOpen, setLocalOpen] = useState(false);
  const open = props.open ?? localOpen;
  const { onOpenChange } = props;
  const setOpen = useCallback(
    (next: boolean) => {
      setLocalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const seeded = props.story.viewers !== undefined;
  const [viewers, setViewers] = useState<ViewerListItem[]>(props.story.viewers ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // The cursor the failed / in-flight request uses; Retry repeats exactly that call.
  const [pendingCursor, setPendingCursor] = useState<string | null>(null);
  const [didFetch, setDidFetch] = useState(false);
  // Bumped on every item change so a response for a previous item is dropped.
  const requestRef = useRef(0);

  // The list belongs to ONE item: reset it when the current item changes (cursor
  // navigation). Render-time prev-props adjustment (React docs "adjusting state when a
  // prop changes") instead of an effect — same reset semantics without the
  // set-state-in-effect cascading re-render (and no one-frame stale panel).
  const itemKey = `${props.story.id}:${props.item.id}`;
  const [prevItemKey, setPrevItemKey] = useState(itemKey);
  if (prevItemKey !== itemKey) {
    setPrevItemKey(itemKey);
    // The root closes a controlled list on the same cursor change.
    setLocalOpen(false);
    setViewers(props.story.viewers ?? []);
    setNextCursor(null);
    setPendingCursor(null);
    setStatus("idle");
    setDidFetch(false);
  }
  useEffect(() => {
    requestRef.current += 1;
  }, [itemKey]);

  const { onLoadViewers } = props;
  const itemId = props.item.id;
  const loadPage = useCallback(
    async (cursor: string | null) => {
      if (!onLoadViewers) return;
      const token = ++requestRef.current;
      setStatus("loading");
      setPendingCursor(cursor);
      try {
        const page = await onLoadViewers(itemId, cursor);
        if (token !== requestRef.current) return;
        setViewers((prev) => {
          if (cursor === null) return page.items;
          const seen = new Set(prev.map((v) => v.id));
          return prev.concat(page.items.filter((v) => !seen.has(v.id)));
        });
        setNextCursor(page.nextCursor);
        setDidFetch(true);
        setStatus("idle");
      } catch {
        if (token !== requestRef.current) return;
        setStatus("error");
      }
    },
    [onLoadViewers, itemId],
  );

  const handleToggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!seeded && onLoadViewers && status === "idle" && !didFetch) {
      void loadPage(null);
    }
  }, [open, setOpen, seeded, onLoadViewers, status, didFetch, loadPage]);

  // A tap outside the list dismisses it (no backdrop). The chip carries `data-story-layer` so
  // tapping it only toggles (via its click), never dismisses-then-reopens.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-story-layer="viewers"]')) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, setOpen]);
  // Focus returns to the opener on close (0.7.1: the shared layer hand-off, with the Safari /
  // macOS Firefox last-pressed fallback).
  const listRef = useRef<HTMLDivElement | null>(null);
  useLayerFocusReturn(open, { layerRef: listRef });

  const timeStr = props.labels.formatTime(new Date(props.item.createdAt ?? props.story.createdAt));
  const formattedCount =
    countValue === null ? "" : new Intl.NumberFormat(resolveLocale(props.locale)).format(countValue);
  // 0.7.1 - the chip SHOWS its name (no `aria-label`): the visible text and the accessible name
  // are one host-localized string, so axe `label-content-name-mismatch` / WCAG 2.5.3 hold. A
  // withheld (`null`) count shows no number.
  const chipText =
    countValue === null
      ? `${props.labels.viewersHeading} · ${timeStr}`
      : props.labels.viewerCountLabel(countValue, timeStr, formattedCount);
  const retry = () => void loadPage(pendingCursor);

  return (
    <>
      {/* View-count chip — bottom-left of viewer (replaces reply composer in owner mode). */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex items-center px-4 pb-4 pt-8",
          "bg-linear-to-t from-media-overlay via-media-overlay/70 to-transparent",
          props.className,
        )}
      >
        <button
          type="button"
          data-story-layer="viewers"
          onClick={handleToggle}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-11 text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground",
          )}
          aria-expanded={open}
        >
          <Eye aria-hidden="true" className="me-2 h-4 w-4" />
          <span className={countValue === null ? "text-media-overlay-foreground/70" : "font-semibold"}>
            {chipText}
          </span>
        </button>
      </div>

      {/* Viewers panel — bottom-anchored sheet that slides up. */}
      {open ? (
        <div ref={listRef} data-story-layer="viewers" className="absolute inset-x-0 bottom-0 z-40 max-h-[60%] overflow-hidden rounded-t-2xl bg-card text-foreground shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{props.labels.viewersHeading}</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
              )}
              aria-label={props.labels.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {viewers.length === 0 && status === "loading" ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {props.labels.viewersLoading}
              </p>
            ) : viewers.length === 0 && status === "error" ? (
              <ViewersError labels={props.labels} onRetry={retry} />
            ) : viewers.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {props.labels.viewersEmpty}
              </p>
            ) : (
              <>
                <ul className="flex flex-col">
                  {viewers.map((viewer) => (
                    <li
                      key={viewer.id}
                      className="flex items-center gap-3 border-b border-border/30 px-4 py-2 last:border-b-0"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {viewer.avatar ? <AvatarImage src={viewer.avatar} alt="" /> : null}
                        <AvatarFallback className="text-xs">{initials(viewer.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium">{viewer.name}</span>
                      {viewer.viewedAt ? (
                        <span className="text-xs text-muted-foreground">
                          {props.labels.formatTime(new Date(viewer.viewedAt))}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {status === "loading" ? (
                  <p className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {props.labels.viewersLoading}
                  </p>
                ) : status === "error" ? (
                  <ViewersError labels={props.labels} onRetry={retry} />
                ) : nextCursor !== null ? (
                  <div className="flex justify-center px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void loadPage(nextCursor)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      {props.labels.viewersLoadMore}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ViewersError(props: { labels: ResolvedStoryViewer01Labels; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground"
    >
      <p>{props.labels.viewersError}</p>
      <button
        type="button"
        onClick={props.onRetry}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {props.labels.viewersRetry}
      </button>
    </div>
  );
}

export const OwnerOverlay = memo(OwnerOverlayInner);
OwnerOverlay.displayName = "OwnerOverlay";
