"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STORY_RAIL_LABELS,
  type ResolvedStoryRailLabels,
  type StoryRailHandle,
  type StoryRailProps,
  type StoryRailItem,
} from "./types";
import { useStoryRailState } from "./hooks/use-story-rail-state";
import {
  useFinePointer,
  useReducedMotion,
  useResolvedDirection,
} from "./hooks/use-rail-environment";
import { StoryThumbnail } from "./parts/story-thumbnail";
import { StoryRailLabelsContext } from "./parts/story-rail-context";

interface StoryRailInnerProps extends StoryRailProps {
  ref?: React.Ref<StoryRailHandle>;
}

const EMPTY: StoryRailItem[] = [];

function StoryRailInner(props: StoryRailInnerProps) {
  const {
    items: itemsProp,
    defaultItems,
    onItemsChange,
    leading,
    framed = true,
    subscribe,
    onSubscribeDelta,
    onItemClick,
    onPreviewError,
    arrows = "none",
    dir: dirProp,
    linkComponent,
    getHref,
    renderThumbnail,
    emptyState,
    labels: labelsProp,
    className,
    thumbnailClassName,
    ref,
  } = props;

  // Adapter for internal parts (StoryThumbnail + renderThumbnail slot) that
  // still use a positional (item, index) shape. Maps to the public object-
  // shape `onItemClick({ item, index })`.
  const handlePartItemClick: ((item: StoryRailItem, index: number) => void) | undefined =
    onItemClick
      ? (item, index) => onItemClick({ item, index })
      : undefined;

  // Partial override merged over the defaults. A key passed as `undefined`
  // (e.g. a conditional i18n entry) keeps its default instead of erasing it.
  const labels = useMemo<ResolvedStoryRailLabels>(() => {
    const merged = { ...DEFAULT_STORY_RAIL_LABELS };
    if (labelsProp) {
      for (const key of Object.keys(labelsProp) as (keyof typeof merged)[]) {
        const value = labelsProp[key];
        if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
      }
    }
    return merged;
  }, [labelsProp]);

  const { items, dispatch } = useStoryRailState({
    initialItems: defaultItems ?? itemsProp ?? EMPTY,
    items: itemsProp,
    onItemsChange,
    subscribe,
    onSubscribeDelta,
  });

  // `items` without `onItemsChange` keeps the pre-0.4 read-once behaviour.
  // Disclose it once per mount so live data is never silently frozen.
  const warnedLegacyRef = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || warnedLegacyRef.current) return;
    if (itemsProp !== undefined && onItemsChange === undefined) {
      warnedLegacyRef.current = true;
      console.warn(
        defaultItems !== undefined
          ? "[story-rail] `items` is ignored: `defaultItems` seeds an uncontrolled rail. Remove `items`, or add `onItemsChange` to make `items` controlled."
          : "[story-rail] `items` was passed without `onItemsChange`, so it is read once on mount and later changes are ignored. " +
              "Pass `defaultItems` for an uncontrolled rail, or add `onItemsChange` to make `items` controlled.",
      );
    }
  }, [itemsProp, onItemsChange, defaultItems]);

  const sectionRef = useRef<HTMLElement>(null);
  const direction = useResolvedDirection(sectionRef, dirProp);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();

  const emblaOptions = useMemo(
    () => ({
      align: "start" as const,
      containScroll: "trimSnaps" as const,
      dragFree: true,
      direction,
    }),
    [direction],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  // Scroll affordances. Initial values match what the server renders before
  // Embla exists: at the start, so nothing to go back to; assume more ahead.
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      const overflow = emblaApi.scrollSnapList().length > 1;
      const progress = emblaApi.scrollProgress();
      const prev = overflow && progress > 0.001;
      const next = overflow && progress < 0.999;
      // An arrow that unmounts while focused would drop focus to <body>:
      // hand it to the other arrow, or to the first tile when both go.
      const active = typeof document === "undefined" ? null : document.activeElement;
      const losing =
        (!next && active !== null && active === nextButtonRef.current) ||
        (!prev && active !== null && active === prevButtonRef.current);
      if (losing) {
        const fallback =
          (next ? nextButtonRef.current : null) ??
          (prev ? prevButtonRef.current : null) ??
          emblaApi.slideNodes()[0]?.querySelector<HTMLElement>("button, a[href]");
        fallback?.focus();
      }
      setCanPrev(prev);
      setCanNext(next);
    };
    update();
    emblaApi.on("init", update);
    emblaApi.on("reInit", update);
    emblaApi.on("scroll", update);
    emblaApi.on("select", update);
    emblaApi.on("resize", update);
    return () => {
      emblaApi.off("init", update);
      emblaApi.off("reInit", update);
      emblaApi.off("scroll", update);
      emblaApi.off("select", update);
      emblaApi.off("resize", update);
    };
  }, [emblaApi]);

  // Slide index = item index + 1 when `leading` occupies slide 0. With
  // `containScroll: "trimSnaps"` the trailing slides share the last snap.
  const leadingOffset = leading ? 1 : 0;
  const scrollToSlide = useCallback(
    (slide: number) => {
      if (!emblaApi) return;
      const last = emblaApi.scrollSnapList().length - 1;
      emblaApi.scrollTo(Math.max(0, Math.min(slide, last)), reducedMotion);
    },
    [emblaApi, reducedMotion],
  );

  const scrollByPage = useCallback(
    (step: 1 | -1) => {
      if (!emblaApi) return;
      const inView = emblaApi.slidesInView();
      if (inView.length === 0) {
        if (step > 0) emblaApi.scrollNext(reducedMotion);
        else emblaApi.scrollPrev(reducedMotion);
        return;
      }
      const first = Math.min(...inView);
      const lastInView = Math.max(...inView);
      const span = Math.max(1, lastInView - first);
      // Forward: the last (partly hidden) tile becomes the first one.
      scrollToSlide(step > 0 ? first + span : first - span);
    },
    [emblaApi, reducedMotion, scrollToSlide],
  );

  // Stable ref for the imperative handle.
  const itemsRef = useRef<StoryRailItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (index: number) => scrollToSlide(index + leadingOffset),
      getCurrentItems: () => itemsRef.current,
      reset: (next: StoryRailItem[]) => dispatch({ kind: "reset", next }),
      dispatch,
      markViewed: (itemId: string) =>
        dispatch({ kind: "viewed", itemId }),
    }),
    [scrollToSlide, leadingOffset, dispatch],
  );

  const rootId = useId();
  const showEmpty = items.length === 0 && !subscribe && !leading;
  const showRail = !showEmpty;
  const showArrows =
    arrows === "always" || (arrows === "fine-pointer" && finePointer);

  const fadeFrom = framed ? "from-card" : "from-background";
  const arrowClass =
    "absolute top-(--story-rail-arrow-top,3.875rem) z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm motion-safe:transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <StoryRailLabelsContext.Provider value={labels}>
      <section
        ref={sectionRef}
        role="region"
        aria-label={labels.railLabel}
        dir={dirProp}
        className={cn(
          "relative overflow-hidden",
          framed ? "rounded-xl border border-border/50 bg-card p-4" : "",
          className,
        )}
      >
        {showRail ? (
          <div className="relative">
            {/* Edge fades render only with items (Q-P22) and only on a side
                the rail can scroll toward, so at rest the first tile (and its
                focus ring) is never covered. Width is a CSS variable. */}
            <div
              aria-hidden="true"
              data-slot="story-rail-fade-start"
              data-visible={canPrev ? "true" : "false"}
              className={cn(
                "pointer-events-none absolute inset-y-0 start-0 z-10 w-(--story-rail-fade-width,3rem) bg-linear-to-r to-transparent motion-safe:transition-opacity rtl:bg-linear-to-l",
                fadeFrom,
                canPrev ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              data-slot="story-rail-fade-end"
              data-visible={canNext ? "true" : "false"}
              className={cn(
                "pointer-events-none absolute inset-y-0 end-0 z-10 w-(--story-rail-fade-width,3rem) bg-linear-to-l to-transparent motion-safe:transition-opacity rtl:bg-linear-to-r",
                fadeFrom,
                canNext ? "opacity-100" : "opacity-0",
              )}
            />
            {showArrows && canPrev ? (
              <button
                ref={prevButtonRef}
                type="button"
                aria-label={labels.previousLabel}
                onClick={() => scrollByPage(-1)}
                className={cn(arrowClass, "start-1")}
              >
                <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </button>
            ) : null}
            <div className="overflow-hidden" ref={emblaRef}>
              {/* py-1 keeps the 2px focus ring inside the clipping viewport. */}
              <div className="flex gap-3 px-2 py-1">
                {leading ? <div className="shrink-0">{leading}</div> : null}
                {items.map((item, index) => (
                  <div key={item.id} className="shrink-0">
                    {renderThumbnail
                      ? renderThumbnail(item, !!item.hasUnread, {
                          index,
                          onClick: () => handlePartItemClick?.(item, index),
                          baseId: `${rootId}-${item.id}`,
                          showRing: !!item.hasUnread && !item.muted,
                        })
                      : (
                          <StoryThumbnail
                            item={item}
                            index={index}
                            baseId={`${rootId}-${item.id}`}
                            onItemClick={handlePartItemClick}
                            onPreviewError={onPreviewError}
                            getHref={getHref}
                            linkComponent={linkComponent}
                            labels={labels}
                            className={thumbnailClassName}
                          />
                        )}
                  </div>
                ))}
              </div>
            </div>
            {showArrows && canNext ? (
              <button
                ref={nextButtonRef}
                type="button"
                aria-label={labels.nextLabel}
                onClick={() => scrollByPage(1)}
                className={cn(arrowClass, "end-1")}
              >
                <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </button>
            ) : null}
          </div>
        ) : (
          emptyState ?? (
            <p
              role="status"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              {labels.emptyState}
            </p>
          )
        )}
      </section>
    </StoryRailLabelsContext.Provider>
  );
}

const StoryRail = memo(StoryRailInner);
StoryRail.displayName = "StoryRail";

export { StoryRail };
