"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useDoubleTap } from "../../video-player/hooks/use-double-tap";
import { useDirection } from "../hooks/use-direction";
import { useEmblaWithState } from "../hooks/use-embla-with-state";
import { useFinePointer, useInView } from "../hooks/use-environment";
import type { MediaRecovery } from "../hooks/use-media-recovery";
import type { FrameStyle } from "../lib/aspect";
import type { EmblaCarouselType } from "embla-carousel";
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
import { SlideCaption } from "./slide-caption";
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
  locale: string;
  captionLines: number;
  captionClassName?: string;
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
  /** Embla's EFFECTIVE loop (it drops loop when the slides can't fill it). */
  loop: boolean;
  variant: MediaCarouselVariant;
  peekRatio: number;
  frame: FrameStyle;
  locale: string;
  captionLines: number;
  captionClassName?: string;
  /** Shows the counter chip inside this (active) slide's frame. */
  counter?: string;
  slideRef: (el: HTMLDivElement | null) => void;
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

/** video-player reads it for its bottom control row; dots sit at 0.75rem + 6px. */
const DOTS_CLEARANCE = { "--video-player-controls-bottom": "1.75rem" } as CSSProperties;

const INTERACTIVE =
  'button, a[href], input, select, textarea, video, [contenteditable="true"], [role="slider"], [role="button"], [role="menu"], [role="menuitem"], [role="menuitemradio"], [role="listbox"], [role="combobox"], [role="spinbutton"]';

/**
 * Embla starts a drag on any `mousedown` / `touchstart` except form fields: scrubbing a video's
 * seek bar (or using a menu) inside a slide would also drag the carousel. Swiping on the video
 * itself still drags.
 */
const allowSlideDrag = (_api: unknown, evt: MouseEvent | TouchEvent) =>
  !(evt.target instanceof Element && evt.target.closest('[role="slider"], [role="menu"]'));

/**
 * The key came from an interactive element inside a SLIDE (a video's controls, a button, a field
 * in `renderItem` content) — not from the region itself or the carousel's own chevrons / dots,
 * whose arrow keys keep moving the carousel as before.
 */
function isFromInteractiveDescendant(e: ReactKeyboardEvent<HTMLElement>): boolean {
  const target = e.target;
  if (!(target instanceof Element) || target === e.currentTarget) return false;
  const control = target.closest(INTERACTIVE);
  return (
    control !== null &&
    control !== e.currentTarget &&
    e.currentTarget.contains(control) &&
    control.closest("[data-media-carousel-slide]") !== null
  );
}

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
  locale,
  captionLines,
  captionClassName,
  counter,
  slideRef,
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
      locale={locale}
      videoLabels={labels.video}
    />
  );

  // Inside the active frame (top-end), so it can never sit over a peeking neighbour.
  const chip = counter ? (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute end-3 top-3 z-10 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground"
    >
      {counter}
    </div>
  ) : null;
  // Under the frame, inside the slide group: read once with its slide.
  const caption = item.caption ? (
    <SlideCaption
      caption={item.caption}
      lines={captionLines}
      className={captionClassName}
      active={isActive}
      labels={labels}
    />
  ) : null;

  const a11y = {
    role: "group",
    "aria-roledescription": labels.slideRoleDescription,
    "aria-label": labels.slideAriaLabel(index + 1, total),
    "aria-hidden": isActive ? undefined : true,
    "data-media-carousel-slide": "",
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
        ref={slideRef}
        className={cn("min-w-0 mx-1", !isActive && "cursor-pointer")}
        style={{
          // Slide width = the viewport minus a peek per side (85 % at the default 0.075).
          flex: `0 0 ${Math.round((1 - 2 * peekRatio) * 1e4) / 100}%`,
          marginInlineStart: !loop && isFirst ? `${edgePeekPercent}%` : undefined,
          marginInlineEnd: !loop && isLast ? `${edgePeekPercent}%` : undefined,
        }}
        onClick={handleClick}
      >
        <div
          inert={!isActive}
          className={cn(
            "relative overflow-hidden rounded-lg motion-safe:transition-all motion-safe:duration-300",
            isActive
              ? "scale-100 opacity-100"
              : "scale-95 opacity-60 blur-(--media-carousel-inactive-blur,1px)",
          )}
        >
          {content}
          {chip}
        </div>
        {caption}
      </div>
    );
  }

  // Linear: full-width slide, no peek, no scale.
  return (
    <div {...a11y} ref={slideRef} className="min-w-0 flex-[0_0_100%]" onClick={handleClick}>
      <div inert={!isActive} className="relative">
        {content}
        {chip}
      </div>
      {caption}
    </div>
  );
}

/**
 * Embla rebuilds itself with `loop: false` when the slides can't fill the loop (2 slides at 85 %):
 * the engine's own options, not ours, say whether it really loops
 * (node_modules/embla-carousel/esm/embla-carousel.esm.js:1528, createEngine).
 */
const readEngineLoop = (api: EmblaCarouselType | null, requested: boolean) =>
  requested && (api ? api.internalEngine().options.loop : true);

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
  locale,
  captionLines,
  captionClassName,
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
      watchDrag: allowSlideDrag,
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

  // The loop Embla really runs (see readEngineLoop). Not looping => edge margins on the first /
  // last slide, and Prev / Next stop at the ends.
  const subscribeReInit = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};
      api.on("reInit", onChange);
      return () => {
        api.off("reInit", onChange);
      };
    },
    [api],
  );
  const effectiveLoop = useSyncExternalStore(
    subscribeReInit,
    () => readEngineLoop(api, loop),
    () => loop,
  );
  // Embla measured the slides before the edge margins existed (loop true -> false) and keeps stale
  // sizes once they go away (false -> true, e.g. 2 -> 4 items): re-init on any change of the
  // effective loop after the first run. A re-init that lands on the same value stops here.
  const lastLoop = useRef<boolean | null>(null);
  useEffect(() => {
    if (!api) return;
    const prev = lastLoop.current;
    lastLoop.current = effectiveLoop;
    if (prev === null ? loop && !effectiveLoop : prev !== effectiveLoop) api.reInit();
  }, [api, loop, effectiveLoop]);
  const canPrev = effectiveLoop || (api ? api.canScrollPrev() : shownIndex > 0);
  const canNext = effectiveLoop || (api ? api.canScrollNext() : shownIndex < total - 1);

  // Captions: each slide has its own height; the viewport follows the active slide's, and the
  // nav buttons / edge fades centre on the media frame (not frame + caption).
  const hasCaptions = useMemo(() => items.some((it) => !!it.caption), [items]);
  const slideEls = useRef<Array<HTMLDivElement | null>>([]);
  const [heights, setHeights] = useState<{ slide: number; frame: number } | null>(null);
  const activeId = items[shownIndex]?.id;
  useLayoutEffect(() => {
    // Drop refs of slides that no longer exist (a detached node would be observed otherwise).
    slideEls.current.length = total;
    if (!hasCaptions) return;
    const slide = slideEls.current[shownIndex];
    if (!slide) return;
    const frameEl = slide.firstElementChild as HTMLElement | null;
    const measure = () => {
      const slideH = slide.offsetHeight;
      if (slideH <= 0) return;
      const frameH = frameEl?.offsetHeight || slideH;
      setHeights((prev) =>
        prev && prev.slide === slideH && prev.frame === frameH ? prev : { slide: slideH, frame: frameH },
      );
    };
    // First paint: read before the browser paints. Without ResizeObserver this one-shot read per
    // shown slide is all there is.
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(slide);
    if (frameEl) ro.observe(frameEl);
    return () => ro.disconnect();
    // activeId: a replaced item at the same index is a new node, which must be observed.
  }, [hasCaptions, shownIndex, activeId, total]);
  const measured = hasCaptions ? heights : null;

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
      // Keys belong to the slide's own controls (a video's seek bar, a button, a form field) —
      // already handled, or from an interactive element inside the region (review R-06).
      if (e.defaultPrevented || isFromInteractiveDescendant(e)) return;
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
      // Lift a video slide's control row above the indicator dots (video-player 0.3 has a full-width seek bar).
      // With captions the dots sit below the slides, not over the video.
      style={showIndicators && !hasCaptions ? DOTS_CLEARANCE : undefined}
    >
      {/* The media area's positioning box: without captions it is the whole carousel. */}
      <div className="relative">
        <div
          className={cn("overflow-hidden", measured && "motion-safe:transition-[height] motion-safe:duration-300")}
          style={measured ? { height: measured.slide } : undefined}
          ref={ref}
        >
          <div className={cn("flex", hasCaptions && "items-start")}>
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
                loop={effectiveLoop}
                variant={variant}
                peekRatio={peekRatio}
                frame={frame}
                locale={locale}
                captionLines={captionLines}
                captionClassName={captionClassName}
                counter={
                  showCounter && index === shownIndex
                    ? labels.counter(shownIndex + 1, total, formatNumber)
                    : undefined
                }
                slideRef={(el) => {
                  slideEls.current[index] = el;
                }}
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
              style={measured ? { height: measured.frame, bottom: "auto" } : undefined}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 end-0 z-5 w-12 bg-linear-to-l rtl:bg-linear-to-r group-data-[dir=ltr]/media-carousel:bg-linear-to-l from-(--media-carousel-fade,var(--background)) to-transparent"
              style={measured ? { height: measured.frame, bottom: "auto" } : undefined}
            />
          </>
        ) : null}

        {navButtonsVisible && (
          <NavButtons
            scrollPrev={scrollPrev}
            scrollNext={scrollNext}
            labels={labels}
            canPrev={canPrev}
            canNext={canNext}
            centerY={measured ? measured.frame / 2 : undefined}
          />
        )}

        {showIndicators && !hasCaptions && (
          <IndicatorDots
            total={total}
            currentIndex={shownIndex}
            scrollTo={scrollTo}
            labels={labels}
          />
        )}
      </div>

      {showIndicators && hasCaptions && (
        <IndicatorDots
          total={total}
          currentIndex={shownIndex}
          scrollTo={scrollTo}
          labels={labels}
          inFlow
        />
      )}
    </div>
  );
}
