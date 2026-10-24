"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useDoubleTap } from "../../video-player/hooks/use-double-tap";
import { useDirection } from "../hooks/use-direction";
import { useEmblaWithState } from "../hooks/use-embla-with-state";
import { useFinePointer, useInView } from "../hooks/use-environment";
import type { MediaRecovery } from "../hooks/use-media-recovery";
import type { FrameStyle } from "../lib/aspect";
import type {
  MediaCarouselDirection,
  MediaCarouselHandle,
  MediaCarouselVariant,
  MediaItem,
  RenderItemContext,
  ResolvedMediaCarouselLabels,
} from "../types";
import { IndicatorDots } from "./indicator-dots";
import { NavButtons } from "./nav-buttons";
import { SlideRenderer } from "./slide-renderer";

interface CarouselTrackProps {
  items: MediaItem[];
  variant: MediaCarouselVariant;
  peekRatio: number;
  frame: FrameStyle;
  loop: boolean;
  showIndicators: boolean;
  showNavButtons: boolean | "fine-pointer";
  showCounter: boolean;
  /** Explicit direction (`dir`, or the deprecated `rtl`); otherwise resolved after mount. */
  dir?: MediaCarouselDirection;
  formatNumber: (n: number) => string;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onSlideChange?: (index: number) => void;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  recovery: MediaRecovery;
  onNaturalSize?: (width: number, height: number) => void;
  labels: ResolvedMediaCarouselLabels;
  className?: string;
  slideClassName?: string;
  ref?: Ref<MediaCarouselHandle>;
}

interface SlideProps {
  item: MediaItem;
  index: number;
  total: number;
  isActive: boolean;
  inView: boolean;
  isFirst: boolean;
  isLast: boolean;
  loop: boolean;
  variant: MediaCarouselVariant;
  peekRatio: number;
  frame: FrameStyle;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  /** Click on a peeking (inactive) neighbour. */
  onSelectNeighbour: (index: number) => void;
  recovery: MediaRecovery;
  onNaturalSize?: (width: number, height: number) => void;
  labels: ResolvedMediaCarouselLabels;
  slideClassName?: string;
}

const clampIndex = (i: number, total: number) =>
  Math.min(Math.max(0, Math.trunc(Number.isFinite(i) ? i : 0)), Math.max(0, total - 1));

function Slide({
  item,
  index,
  total,
  isActive,
  inView,
  isFirst,
  isLast,
  loop,
  variant,
  peekRatio,
  frame,
  renderItem,
  onDoubleTap,
  onSelectNeighbour,
  recovery,
  onNaturalSize,
  labels,
  slideClassName,
}: SlideProps) {
  // Image items: attach double-tap on the slide wrapper. Video items: handled
  // inside SlideRenderer via VideoPlayer's onDoubleTap. Both fire the same
  // unified onDoubleTap callback.
  const imageDoubleTap = useDoubleTap(
    item.type === "image" && onDoubleTap
      ? () => onDoubleTap(item, index)
      : undefined,
  );

  // An inactive slide's content is `inert` (out of the tab order and the accessibility tree,
  // and not a pointer target), so a click on it lands on this wrapper — which scrolls to it.
  // `aria-hidden` keeps the wrapper itself out of the tree too.
  const handleClick = isActive
    ? item.type === "image"
      ? imageDoubleTap
      : undefined
    : () => onSelectNeighbour(index);

  const content = (
    <SlideRenderer
      item={item}
      ctx={{ isActive, inView, index }}
      renderItem={renderItem}
      onDoubleTap={onDoubleTap}
      frame={frame}
      recovery={recovery}
      onNaturalSize={onNaturalSize}
      slideClassName={slideClassName}
    />
  );

  const a11y = {
    role: "group",
    "aria-roledescription": labels.slideRoleDescription,
    "aria-label": labels.slideAriaLabel(index + 1, total),
    "aria-hidden": isActive ? undefined : true,
  } as const;

  if (variant === "gallery") {
    // Edge peek padding only matters when NOT looping. Under loop, Embla
    // positions slides so first/last in view != first/last in source —
    // applying edge padding to the source first/last would create asymmetric
    // slide widths that break Embla's loop math.
    const edgePeekPercent = peekRatio * 100;
    return (
      <div
        {...a11y}
        className={cn("min-w-0 mx-1 flex-[0_0_85%]", !isActive && "cursor-pointer")}
        style={{
          marginInlineStart: !loop && isFirst ? `${edgePeekPercent}%` : undefined,
          marginInlineEnd: !loop && isLast ? `${edgePeekPercent}%` : undefined,
        }}
        onClick={handleClick}
      >
        <div
          inert={!isActive}
          className={cn(
            "overflow-hidden rounded-lg motion-safe:transition-all motion-safe:duration-300",
            isActive
              ? "scale-100 opacity-100"
              : "scale-95 opacity-60 blur-(--media-carousel-inactive-blur,1px)",
          )}
        >
          {content}
        </div>
      </div>
    );
  }

  // Linear: full-width slide, no peek, no scale.
  return (
    <div {...a11y} className="min-w-0 flex-[0_0_100%]" onClick={handleClick}>
      <div inert={!isActive}>{content}</div>
    </div>
  );
}

export function CarouselTrack({
  items,
  variant,
  peekRatio,
  frame,
  loop,
  showIndicators,
  showNavButtons,
  showCounter,
  dir: dirProp,
  formatNumber,
  index: indexProp,
  defaultIndex,
  onIndexChange,
  renderItem,
  onSlideChange,
  onDoubleTap,
  recovery,
  onNaturalSize,
  labels,
  className,
  slideClassName,
  ref: forwardedRef,
}: CarouselTrackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dir = useDirection(rootRef, dirProp);
  const inView = useInView(rootRef);
  const finePointer = useFinePointer();
  const total = items.length;

  const controlled = indexProp !== undefined;
  const target = controlled ? clampIndex(indexProp, total) : undefined;
  // Embla's start slide — read once; later moves go through scrollTo.
  const [startIndex] = useState(() => clampIndex(indexProp ?? defaultIndex ?? 0, total));

  // Memoize Embla options — useEmblaCarousel re-initializes on options identity change.
  // Under loop, Embla force-disables containScroll; we don't set it explicitly there.
  // Under linear+no-loop, we trim duplicate edge snaps so prev/next stop cleanly.
  const emblaOptions = useMemo(
    () => ({
      align: variant === "gallery" ? ("center" as const) : ("start" as const),
      ...(variant === "linear" && !loop
        ? { containScroll: "trimSnaps" as const }
        : {}),
      loop,
      direction: dir,
      startIndex,
    }),
    [variant, loop, dir, startIndex],
  );

  // The controlled index, read by the select handler without re-subscribing.
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  });

  const handleSelect = useCallback(
    (i: number) => {
      onSlideChange?.(i);
      // Controlled: only a move away from the prop is a request (the settle-back and a
      // prop-driven scroll land on the prop and stay silent).
      if (targetRef.current === undefined || i !== targetRef.current) onIndexChange?.(i);
    },
    [onSlideChange, onIndexChange],
  );

  const { ref, api, currentIndex, scrollTo, scrollPrev, scrollNext } =
    useEmblaWithState({ ...emblaOptions, onSelect: handleSelect });

  // Controlled: the prop wins. Scroll to it when it changes, and settle back to it after a
  // swipe the parent did not adopt (on `settle`, so a drag in progress is never yanked), and
  // after a re-init.
  useEffect(() => {
    if (!controlled || !api) return;
    const correct = () => {
      const t = targetRef.current;
      if (t !== undefined && api.selectedScrollSnap() !== t) api.scrollTo(t);
    };
    correct();
    api.on("settle", correct);
    api.on("reInit", correct);
    return () => {
      api.off("settle", correct);
      api.off("reInit", correct);
    };
  }, [controlled, api, target]);

  const shownIndex = target ?? currentIndex;

  // Stable ref-mirror for the shown index — keeps imperative handle identity
  // stable across slide changes. Ref write inside passive useEffect.
  const currentIndexRef = useRef(shownIndex);
  useEffect(() => {
    currentIndexRef.current = shownIndex;
  });

  useImperativeHandle(
    forwardedRef,
    () => ({
      scrollTo,
      scrollPrev,
      scrollNext,
      getCurrentIndex: () => currentIndexRef.current,
    }),
    [scrollTo, scrollPrev, scrollNext],
  );

  // A click that ends a drag never reaches a slide: Embla stops it in the capture phase on the
  // slide container.
  const selectNeighbour = scrollTo;

  // Gallery variant gets soft edge fades (mirrors kasder UX). Linear variant doesn't
  // — full-width slides have no peek to soften.
  const showEdgeGradients = variant === "gallery";
  const navButtonsVisible =
    showNavButtons === "fine-pointer" ? finePointer : showNavButtons;

  // Keyboard nav — APG carousel pattern: ArrowLeft/Right scroll prev/next
  // (direction-aware), Home/End jump to first/last. Wired on the focusable region
  // wrapper so users tabbing into the carousel get arrow-key control without
  // first focusing a child slide.
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const rtl = dir === "rtl";
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (rtl) scrollNext();
        else scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (rtl) scrollPrev();
        else scrollNext();
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollTo(total - 1);
      }
    },
    [dir, scrollPrev, scrollNext, scrollTo, total],
  );

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription={labels.carouselRoleDescription}
      aria-label={labels.carouselLabel}
      // Only an explicit direction is written, so an inherited one is never overridden.
      dir={dirProp}
      data-dir={dirProp}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/media-carousel relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
        className,
      )}
    >
      <div className="overflow-hidden" ref={ref}>
        <div className="flex">
          {items.map((item, index) => (
            <Slide
              key={item.id}
              item={item}
              index={index}
              total={total}
              isActive={index === shownIndex}
              inView={inView}
              isFirst={index === 0}
              isLast={index === total - 1}
              loop={loop}
              variant={variant}
              peekRatio={peekRatio}
              frame={frame}
              renderItem={renderItem}
              onDoubleTap={onDoubleTap}
              onSelectNeighbour={selectNeighbour}
              recovery={recovery}
              onNaturalSize={index === 0 ? onNaturalSize : undefined}
              labels={labels}
              slideClassName={slideClassName}
            />
          ))}
        </div>
      </div>

      {showEdgeGradients ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-0 z-5 w-12 bg-linear-to-r rtl:bg-linear-to-l group-data-[dir=ltr]/media-carousel:bg-linear-to-r from-(--media-carousel-fade,var(--background)) to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 z-5 w-12 bg-linear-to-l rtl:bg-linear-to-r group-data-[dir=ltr]/media-carousel:bg-linear-to-l from-(--media-carousel-fade,var(--background)) to-transparent"
          />
        </>
      ) : null}

      {showCounter ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-3 z-10 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground",
            // Gallery: inside the centred slide (85 % wide), not over the peeking neighbour.
            variant === "gallery" ? "end-[calc(7.5%_+_0.75rem)]" : "end-3",
          )}
        >
          {labels.counter(shownIndex + 1, total, formatNumber)}
        </div>
      ) : null}

      {navButtonsVisible && (
        <NavButtons
          scrollPrev={scrollPrev}
          scrollNext={scrollNext}
          labels={labels}
        />
      )}

      {showIndicators && (
        <IndicatorDots
          total={total}
          currentIndex={shownIndex}
          scrollTo={scrollTo}
          labels={labels}
        />
      )}
    </div>
  );
}
