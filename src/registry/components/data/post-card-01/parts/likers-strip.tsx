"use client";

import { memo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PostLikeUser } from "../types";

/** Pointer-event drag-to-scroll for the likers strip (desktop). Touch devices get
 * native swipe via `touch-action: pan-x`. */
function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    down: boolean;
    startX: number;
    startScroll: number;
    pointerId: number | null;
  }>({
    down: false,
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
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.down || s.pointerId !== e.pointerId) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    el.scrollLeft = s.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.down) return;
    s.down = false;
    s.pointerId = null;
    const el = scrollRef.current;
    if (el) {
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

export interface LikersStripProps {
  /** Total likes on the post (drives the "+N" pill). */
  totalCount: number;
  /** Already-loaded likers. */
  likers: PostLikeUser[];
  /** Heading label (e.g. "Beğenenler" / "Likes"). */
  heading: string;
  /** Fetch more likers. Component appends results to local state. */
  onLoadMore?: () => Promise<PostLikeUser[]>;
  /** "+N" pill aria-label template — `{count}` is replaced. Default "+{count} more". */
  moreAriaLabelTemplate?: string;
  /** Hide-button label (kasder's "Gizle"). When provided, renders a Hide button next to the heading. */
  onClose?: () => void;
  /** Hide-button label text. Default "Hide". */
  closeLabel?: string;
  className?: string;
}

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

function LikersStripInner({
  totalCount,
  likers: initialLikers,
  heading,
  onLoadMore,
  moreAriaLabelTemplate = "+{count} more",
  onClose,
  closeLabel = "Hide",
  className,
}: LikersStripProps) {
  const [likers, setLikers] = useState(initialLikers);
  const [isLoading, setIsLoading] = useState(false);
  const remaining = Math.max(0, totalCount - likers.length);
  const {
    scrollRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDragScroll();

  const handleLoadMore = async () => {
    if (!onLoadMore || isLoading) return;
    setIsLoading(true);
    try {
      const next = await onLoadMore();
      setLikers((prev) => [...prev, ...next]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{heading}</span>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-xs"
          >
            {closeLabel}
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
        {likers.map((user) => (
          <div
            key={user.id}
            role="listitem"
            className="flex w-20 shrink-0 flex-col items-center gap-1"
          >
            <Avatar className="h-12 w-12">
              {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            {/* Fixed-height name+username slot — keeps every column the same total height
                so the strip looks symmetric regardless of which users have a username. */}
            <div className="flex h-8 w-full flex-col justify-start text-center">
              <span className="truncate text-xs font-medium leading-tight">
                {user.name.split(" ")[0]}
              </span>
              <span className="truncate text-[10px] leading-tight text-muted-foreground">
                {user.username ? `@${user.username}` : " "}
              </span>
            </div>
          </div>
        ))}
        {remaining > 0 && onLoadMore ? (
          <div className="flex w-20 shrink-0 flex-col items-center gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleLoadMore();
              }}
              disabled={isLoading}
              aria-label={moreAriaLabelTemplate.replace(
                "{count}",
                String(remaining),
              )}
              className="h-12 w-12 shrink-0 rounded-full p-0 text-xs font-semibold"
            >
              {isLoading ? "…" : `+${remaining > 99 ? "99" : remaining}`}
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
