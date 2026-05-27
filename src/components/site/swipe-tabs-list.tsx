"use client";

import * as React from "react";
import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Docs-site replacement for shadcn `<TabsList>` used inside component demos.
 *
 * Why it exists: shadcn `TabsTrigger` has `flex-1` baked in, so when a demo
 * declares 8+ tabs the triggers compress to share container width and
 * `whitespace-nowrap` text overlaps visually on mobile.
 *
 * Layout: outer scroll container holds an `inline-flex w-max` `<TabsList>`.
 * Each trigger renders at its natural content width (we override `flex-1`
 * with `flex-none` + give them `px-3`). Stable widths mean snap targets are
 * at predictable positions.
 *
 * Interactions:
 *  - Touch swipe: native horizontal pan + CSS scroll-snap (snap-start on
 *    each trigger) — swipes settle on a clean tab boundary on release.
 *  - Trackpad scroll: same path as touch — native + CSS snap.
 *  - Mouse drag-to-swipe on desktop: pointerdown → live scrollLeft update
 *    → on release, JS snap to nearest tab boundary (CSS snap doesn't engage
 *    after JS-set scrollLeft, so we compute it manually via
 *    getBoundingClientRect — robust to positioning context).
 *  - Mouse wheel: vertical wheel deltas translate to horizontal scroll for
 *    users without a trackpad. Snap fires 120ms after wheel idle.
 *  - Tab clicks still work because we only swallow click events when the
 *    pointer gesture actually moved > 3px.
 *
 * Pattern lifted from engagement-bar-01 LikersStrip's `useDragScroll`.
 */
export function SwipeTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const dragState = React.useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    pointerId: -1,
    movedDistance: 0,
  });

  const snapToNearest = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;
    const containerLeft = el.getBoundingClientRect().left;
    const tabs = Array.from(
      el.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]'),
    );
    let bestTarget = el.scrollLeft;
    let bestDist = Infinity;
    for (const tab of tabs) {
      const visualOffset = tab.getBoundingClientRect().left - containerLeft;
      const target = el.scrollLeft + visualOffset;
      const dist = Math.abs(visualOffset);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: Math.max(0, Math.min(bestTarget, max)),
      behavior: "smooth",
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return; // touch / pen handled natively
    const el = ref.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
      movedDistance: 0,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s.active || s.pointerId !== e.pointerId) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    s.movedDistance = Math.max(s.movedDistance, Math.abs(dx));
    el.scrollLeft = s.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s.active) return;
    const moved = s.movedDistance > 3;
    s.active = false;
    s.pointerId = -1;
    const el = ref.current;
    if (el) {
      el.style.cursor = "";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* may already be released */
      }
    }
    if (moved) snapToNearest();
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.movedDistance > 3) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.movedDistance = 0;
    }
  };

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let wheelIdle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      if (wheelIdle) clearTimeout(wheelIdle);
      wheelIdle = setTimeout(snapToNearest, 120);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelIdle) clearTimeout(wheelIdle);
    };
  }, [snapToNearest]);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      className="w-full cursor-grab select-none overflow-x-auto overflow-y-hidden snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <TabsList
        className={cn(
          "inline-flex h-8 w-max rounded-lg [&>button]:flex-none [&>button]:px-3 [&>button]:snap-start",
          className,
        )}
        {...props}
      />
    </div>
  );
}
