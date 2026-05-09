"use client";

import {
  memo,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STORY_RAIL_LABELS,
  type StoryRail01Handle,
  type StoryRail01Labels,
  type StoryRail01Props,
  type StoryRailItem,
} from "./types";
import { useStoryRailState } from "./hooks/use-story-rail-state";
import { StoryThumbnail } from "./parts/story-thumbnail";

interface StoryRail01InnerProps extends StoryRail01Props {
  ref?: React.Ref<StoryRail01Handle>;
}

function StoryRail01Inner(props: StoryRail01InnerProps) {
  const {
    items: initialItems,
    leading,
    framed = true,
    subscribe,
    onSubscribeDelta,
    onItemClick,
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

  const labels = useMemo<
    Required<Omit<StoryRail01Labels, "thumbnailAriaLabel">> & {
      thumbnailAriaLabel?: (item: StoryRailItem) => string;
    }
  >(
    () => ({
      ...DEFAULT_STORY_RAIL_LABELS,
      ...labelsProp,
    }),
    [labelsProp],
  );

  const { items, dispatch } = useStoryRailState({
    initialItems,
    subscribe,
    onSubscribeDelta,
  });

  const emblaOptions = useMemo(
    () => ({
      align: "start" as const,
      containScroll: "trimSnaps" as const,
      dragFree: true,
    }),
    [],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  // Stable ref for the imperative handle.
  const itemsRef = useRef<StoryRailItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (index: number) => {
        emblaApi?.scrollTo(index);
      },
      getCurrentItems: () => itemsRef.current,
      reset: (next: StoryRailItem[]) => dispatch({ kind: "reset", next }),
      dispatch,
      markViewed: (itemId: string) =>
        dispatch({ kind: "viewed", itemId }),
    }),
    [emblaApi, dispatch],
  );

  const rootId = useId();
  const showEmpty = items.length === 0 && !subscribe && !leading;
  const showRail = !showEmpty;

  return (
    <section
      role="region"
      aria-label={labels.railLabel}
      className={cn(
        "relative overflow-hidden",
        framed ? "rounded-xl border border-border/50 bg-card p-4" : "",
        className,
      )}
    >
      {showRail ? (
        <>
          {/* Edge fade gradients render only when items are present (Q-P22). */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 z-10 w-12 bg-linear-to-r to-transparent",
              framed ? "left-4 from-card" : "left-0 from-background",
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 z-10 w-12 bg-linear-to-l to-transparent",
              framed ? "right-4 from-card" : "right-0 from-background",
            )}
          />
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3 px-2">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              {items.map((item, index) => (
                <div key={item.id} className="shrink-0">
                  {renderThumbnail
                    ? renderThumbnail(item, !!item.hasUnread, {
                        index,
                        onClick: () => handlePartItemClick?.(item, index),
                        baseId: `${rootId}-${item.id}`,
                      })
                    : (
                        <StoryThumbnail
                          item={item}
                          index={index}
                          baseId={`${rootId}-${item.id}`}
                          onItemClick={handlePartItemClick}
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
        </>
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
  );
}

const StoryRail01 = memo(StoryRail01Inner);
StoryRail01.displayName = "StoryRail01";

export { StoryRail01 };
