"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { EngagementLikerProfile } from "../types";
import { resolveLocale } from "../lib/format-count";

/** Pixels the mouse must move before a press becomes a drag (a smaller move is a click). */
const DRAG_THRESHOLD_PX = 4;

/** Pointer-event drag-to-scroll for the likers strip (desktop). Touch devices get
 * native swipe via `touch-action: pan-x`. */
function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    down: boolean;
    dragging: boolean;
    startX: number;
    startScroll: number;
    pointerId: number | null;
  }>({
    down: false,
    dragging: false,
    startX: 0,
    startScroll: 0,
    pointerId: null,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return; // touch handled natively
    const el = scrollRef.current;
    if (!el) return;
    stateRef.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.down || s.pointerId !== e.pointerId) return;
    // The button was released outside the strip (no pointerup reached it): the press is over.
    if (e.buttons === 0) {
      s.down = false;
      s.pointerId = null;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    // Capture only once the pointer really drags: capturing on pointerdown retargeted the
    // click of a button inside the strip (the "+N" pill) to the strip, so a mouse click
    // on the pill did nothing (0.6.1).
    if (!s.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      s.dragging = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // the pointer may already be gone
      }
      el.style.cursor = "grabbing";
    }
    el.scrollLeft = s.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.down) return;
    s.down = false;
    s.pointerId = null;
    const wasDragging = s.dragging;
    s.dragging = false;
    const el = scrollRef.current;
    if (el && wasDragging) {
      el.style.cursor = "";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
    }
  };

  return {
    scrollRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

/** Every user-facing string of `LikersStrip`. Override per key via `labels`. */
export interface LikersStripLabels {
  heading: string;
  close: string;
  loading: string;
  /** Pill text AND accessible name when the total is withheld (`totalCount={null}`). */
  loadMore: string;
  moreAriaLabel: (count: number, formatted: string) => string;
  morePill: (formatted: string) => string;
}

export const defaultLikersStripLabels: LikersStripLabels = {
  heading: "Likes",
  close: "Hide",
  loading: "…",
  loadMore: "More",
  moreAriaLabel: (_, f) => `+${f} more`,
  morePill: (f) => `+${f}`,
};

export interface LikersStripProps {
  /** Total likes on the post (drives the "+N" pill). `null` = withheld: no number is shown anywhere. */
  totalCount: number | null;
  /**
   * Already-loaded likers. With `onLikersChange` the strip is controlled (shows exactly this
   * list). Without it, the prop is still shown on every render, plus anything the strip loaded.
   */
  likers?: EngagementLikerProfile[];
  /** Uncontrolled seed, read once. */
  defaultLikers?: EngagementLikerProfile[];
  /** Controlled mode: called with the prop list plus the newly loaded likers. */
  onLikersChange?: (next: EngagementLikerProfile[]) => void;
  /** Fetch more likers. */
  onLoadMore?: () => Promise<EngagementLikerProfile[]>;
  /** Whether more likers exist. Overrides the count-derived pill visibility. */
  hasMore?: boolean;
  /** Override any user-facing string. An `undefined` value keeps the default. */
  labels?: Partial<LikersStripLabels>;
  /** BCP-47 locale for number formatting and initials. Default "en". */
  locale?: string;
  /** Replaces the compact `Intl.NumberFormat` count formatter. */
  formatCount?: (n: number) => string;
  /** @deprecated Use `labels.heading`. */
  heading?: string;
  /** @deprecated Use `labels.moreAriaLabel`. `{count}` is replaced. */
  moreAriaLabelTemplate?: string;
  /** When provided, renders a Hide button next to the heading. */
  onClose?: () => void;
  /** @deprecated Use `labels.close`. */
  closeLabel?: string;
  className?: string;
}

function initials(name: string, locale: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toLocaleUpperCase(locale) ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function dedupeById(list: EngagementLikerProfile[]): EngagementLikerProfile[] {
  const seen = new Set<string>();
  const out: EngagementLikerProfile[] = [];
  for (const u of list) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  return out;
}

function LikersStripInner({
  totalCount,
  likers,
  defaultLikers,
  onLikersChange,
  onLoadMore,
  hasMore,
  labels: labelsProp,
  locale: localeProp = "en",
  formatCount,
  heading,
  moreAriaLabelTemplate,
  onClose,
  closeLabel,
  className,
}: LikersStripProps) {
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const controlled = likers !== undefined && onLikersChange !== undefined;
  // Likers this strip loaded itself (and the uncontrolled seed, read once).
  const [own, setOwn] = useState<EngagementLikerProfile[]>(() => defaultLikers ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const latestLikers = useRef<EngagementLikerProfile[]>(likers ?? []);
  useEffect(() => {
    latestLikers.current = likers ?? [];
  }, [likers]);

  const shown = useMemo(
    () => (controlled ? likers : dedupeById([...(likers ?? []), ...own])),
    [controlled, likers, own],
  );

  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact" }),
    [locale],
  );
  const format = formatCount ?? numberFormat.format;

  const labels = useMemo<LikersStripLabels>(() => {
    const merged: LikersStripLabels = {
      ...defaultLikersStripLabels,
      heading: heading ?? defaultLikersStripLabels.heading,
      close: closeLabel ?? defaultLikersStripLabels.close,
    };
    if (moreAriaLabelTemplate !== undefined) {
      const template = moreAriaLabelTemplate;
      merged.moreAriaLabel = (_, formatted) =>
        // template-ok: deprecated alias moreAriaLabelTemplate, kept for existing callers (post-card stopped passing it in 0.6.0)
        template.replace("{count}", formatted);
    }
    if (labelsProp) {
      for (const key of Object.keys(labelsProp) as (keyof LikersStripLabels)[]) {
        const value = labelsProp[key];
        if (value !== undefined) (merged as unknown as Record<string, unknown>)[key] = value;
      }
    }
    return merged;
  }, [labelsProp, heading, closeLabel, moreAriaLabelTemplate]);

  const remaining = totalCount === null ? null : Math.max(0, totalCount - shown.length);
  const pillVisible =
    Boolean(onLoadMore) && (hasMore ?? (remaining === null ? true : remaining > 0));
  const pending = remaining !== null && remaining > 0 ? remaining : null;
  const {
    scrollRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDragScroll();

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const next = await onLoadMore();
      if (onLikersChange && likers !== undefined) {
        onLikersChange([...latestLikers.current, ...next]);
      } else {
        setOwn((prev) => [...prev, ...next]);
      }
    } catch {
      // A failed load leaves the list unchanged; the button re-enables for a retry.
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [onLoadMore, onLikersChange, likers]);

  const pillText = isLoading
    ? labels.loading
    : pending !== null
      ? // The full count (compact), so the visible text is part of the accessible name
        // (WCAG 2.5.3) — it was capped at "+99" while the name said "+379 more" (0.6.1).
        labels.morePill(format(pending))
      : labels.loadMore;
  const pillAria = pending !== null
    ? labels.moreAriaLabel(pending, format(pending))
    : labels.loadMore;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{labels.heading}</span>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-xs"
          >
            {labels.close}
          </Button>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{ touchAction: "pan-x" }}
        className="flex cursor-grab select-none items-stretch gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]"
        role="list"
      >
        {shown.map((user) => (
          <div
            key={user.id}
            role="listitem"
            className="flex w-16 shrink-0 flex-col items-center gap-1 sm:w-20"
          >
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
              <AvatarFallback>{initials(user.name, locale)}</AvatarFallback>
            </Avatar>
            {/* Fixed-height name+username slot — keeps every column the same total height
                so the strip looks symmetric regardless of which users have a username. */}
            <div className="flex h-8 w-full flex-col justify-start text-center">
              <span className="truncate text-xs font-medium leading-tight">
                {user.name.split(" ")[0]}
              </span>
              <span className="truncate text-[10px] leading-tight text-muted-foreground">
                {user.username ? `@${user.username}` : " "}
              </span>
            </div>
          </div>
        ))}
        {pillVisible ? (
          <div role="listitem" className="flex w-16 shrink-0 flex-col items-center gap-1 sm:w-20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleLoadMore();
              }}
              disabled={isLoading}
              aria-busy={isLoading ? "true" : undefined}
              aria-label={pillAria}
              className="h-11 w-11 shrink-0 rounded-full p-0 text-xs font-semibold sm:h-12 sm:w-12"
            >
              {pillText}
            </Button>
            <div className="h-8" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const LikersStrip = memo(LikersStripInner);
LikersStrip.displayName = "LikersStrip";
