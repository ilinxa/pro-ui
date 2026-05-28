"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useDoubleTap } from "../../video-player-01/hooks/use-double-tap";
import { useEmblaWithState } from "../hooks/use-embla-with-state";
import type {
  LinearAspect,
  MediaCarousel01Handle,
  MediaCarousel01Labels,
  MediaCarousel01Variant,
  MediaItem,
  RenderItemContext,
} from "../types";
import { IndicatorDots } from "./indicator-dots";
import { NavButtons } from "./nav-buttons";
import { SlideRenderer } from "./slide-renderer";

interface CarouselTrackProps {
  items: MediaItem[];
  variant: MediaCarousel01Variant;
  peekRatio: number;
  aspect: LinearAspect;
  loop: boolean;
  showIndicators: boolean;
  showNavButtons: boolean;
  rtl: boolean;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onSlideChange?: (index: number) => void;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  labels: Required<MediaCarousel01Labels>;
  className?: string;
  slideClassName?: string;
  ref?: Ref<MediaCarousel01Handle>;
}

interface SlideProps {
  item: MediaItem;
  index: number;
  total: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  loop: boolean;
  variant: MediaCarousel01Variant;
  peekRatio: number;
  aspect: LinearAspect;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  labels: Required<MediaCarousel01Labels>;
  slideClassName?: string;
}

function Slide({
  item,
  index,
  total,
  isActive,
  isFirst,
  isLast,
  loop,
  variant,
  peekRatio,
  aspect,
  renderItem,
  onDoubleTap,
  labels,
  slideClassName,
}: SlideProps) {
  // Image items: attach double-tap on the slide wrapper. Video items: handled
  // inside SlideRenderer via VideoPlayer01's onDoubleTap. Both fire the same
  // unified onDoubleTap callback.
  const imageDoubleTap = useDoubleTap(
    item.type === "image" && onDoubleTap
      ? () => onDoubleTap(item, index)
      : undefined,
  );

  const slideAriaLabel = labels.slideAriaLabel
    .replace("{index}", String(index + 1))
    .replace("{total}", String(total));

  // Match kasder layout exactly: outer slide gets flex-basis + small horizontal
  // gutter via `mx-1`; first/last get larger edge padding so the peek shows on
  // both ends (only meaningful when loop=false; under loop the clones eat it).
  // Inner wrapper is the visual frame — scale + opacity for inactive neighbors,
  // matching the kasder peek-scale aesthetic.
  if (variant === "gallery") {
    // Edge peek padding only matters when NOT looping. Under loop, Embla clones
    // the slides so first/last in DOM != first/last in source — applying edge
    // padding to the source first/last would create asymmetric slide widths
    // that break Embla's loop math.
    const edgePeekPercent = peekRatio * 100;
    return (
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={slideAriaLabel}
        inert={!isActive}
        className={cn("min-w-0 mx-1 flex-[0_0_85%]")}
        style={{
          marginLeft: !loop && isFirst ? `${edgePeekPercent}%` : undefined,
          marginRight: !loop && isLast ? `${edgePeekPercent}%` : undefined,
        }}
        onClick={item.type === "image" ? imageDoubleTap : undefined}
      >
        <div
          className={cn(
            "overflow-hidden rounded-lg transition-all duration-300",
            isActive
              ? "scale-100 opacity-100"
              : "scale-95 opacity-60 blur-[1px]",
          )}
        >
          <SlideRenderer
            item={item}
            ctx={{ isActive, index }}
            renderItem={renderItem}
            onDoubleTap={onDoubleTap}
            variant={variant}
            aspect={aspect}
            slideClassName={slideClassName}
          />
        </div>
      </div>
    );
  }

  // Linear: full-width slide, no peek, no scale.
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={slideAriaLabel}
      inert={!isActive}
      className={cn("min-w-0 flex-[0_0_100%]")}
      onClick={item.type === "image" ? imageDoubleTap : undefined}
    >
      <SlideRenderer
        item={item}
        ctx={{ isActive, index }}
        renderItem={renderItem}
        onDoubleTap={onDoubleTap}
        variant={variant}
        aspect={aspect}
        slideClassName={slideClassName}
      />
    </div>
  );
}

export function CarouselTrack({
  items,
  variant,
  peekRatio,
  aspect,
  loop,
  showIndicators,
  showNavButtons,
  rtl,
  renderItem,
  onSlideChange,
  onDoubleTap,
  labels,
  className,
  slideClassName,
  ref: forwardedRef,
}: CarouselTrackProps) {
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
      direction: rtl ? ("rtl" as const) : ("ltr" as const),
    }),
    [variant, loop, rtl],
  );

  const { ref, currentIndex, scrollTo, scrollPrev, scrollNext } =
    useEmblaWithState({ ...emblaOptions, onSelect: onSlideChange });

  // Stable ref-mirror for currentIndex — keeps imperative handle identity
  // stable across slide changes. Ref write inside passive useEffect.
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
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

  // Gallery variant gets soft edge fades (mirrors kasder UX). Linear variant doesn't
  // — full-width slides have no peek to soften.
  const showEdgeGradients = variant === "gallery";

  // Keyboard nav — APG carousel pattern: ArrowLeft/Right scroll prev/next
  // (RTL-aware), Home/End jump to first/last. Wired on the focusable region
  // wrapper so users tabbing into the carousel get arrow-key control without
  // first focusing a child slide.
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
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
        scrollTo(items.length - 1);
      }
    },
    [rtl, scrollPrev, scrollNext, scrollTo, items.length],
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.carouselLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
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
              total={items.length}
              isActive={index === currentIndex}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              loop={loop}
              variant={variant}
              peekRatio={peekRatio}
              aspect={aspect}
              renderItem={renderItem}
              onDoubleTap={onDoubleTap}
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
            className="pointer-events-none absolute inset-y-0 left-0 z-5 w-12 bg-linear-to-r from-background to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-5 w-12 bg-linear-to-l from-background to-transparent"
          />
        </>
      ) : null}

      {showNavButtons && (
        <NavButtons
          scrollPrev={scrollPrev}
          scrollNext={scrollNext}
          labels={labels}
        />
      )}

      {showIndicators && (
        <IndicatorDots
          total={items.length}
          currentIndex={currentIndex}
          scrollTo={scrollTo}
          labels={labels}
        />
      )}
    </div>
  );
}
