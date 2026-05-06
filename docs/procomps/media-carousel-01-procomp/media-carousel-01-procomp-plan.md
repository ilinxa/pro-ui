# media-carousel-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`media-carousel-01-procomp-description.md`](./media-carousel-01-procomp-description.md) for the what & why.
>
> Migration origin: [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `PostMediaCarousel.tsx` (142 LOC).

## Q-P locks (commitments before code)

| # | Question (from description) | Locked answer |
|---|---|---|
| Q-P1 | Cross-folder import of `video-player-01`? | **Allow (option A).** Built-in video handler imports `<VideoPlayer01>` directly. shadcn `registryDependencies: ["video-player-01"]` handles install dependency. Establishes refined sealed-folder rule for the project: **cross-folder imports allowed within a designed system, declared via `registryDependencies`; not allowed across unrelated domains.** Documented in meta.ts + memory. |
| Q-P2 | Default `peekRatio` for gallery variant? | **0.075** (matches kasder `7.5%`). Configurable via prop. |
| Q-P3 | Default `aspect` for linear variant? | **`square`** — most flexible for mixed content. |
| Q-P4 | `showIndicators` hideable? | **Yes.** `showIndicators?: boolean` (default `true`). Hidden when `items.length <= 1` regardless. |
| Q-P5 | `showNavButtons` hideable? | **Yes.** `showNavButtons?: boolean` (default `true`). Hidden when `items.length <= 1` regardless. |
| Q-P6 | `isActive` for image items? | Passed in `RenderItemContext` (consumers might use for custom renderers). Built-in image handler ignores it. |
| Q-P7 | Double-tap unified across image + video items? | **Yes.** Single `onDoubleTap(item, index)` callback on the carousel root. Image items: carousel attaches `useDoubleTap(...)` to the slide wrapper. Video items: carousel forwards to `<VideoPlayer01 onDoubleTap>`. Both trigger the same callback. |
| Q-P8 | Imperative handle methods? | **`scrollTo(index)` / `scrollPrev()` / `scrollNext()` / `getCurrentIndex()`** — minimal surface. v0.2 candidate: `getEmblaApi()` substrate-leak escape hatch (only if real demand). |
| Q-P9 | `onSlideChange` debouncing? | **Fire only on Embla `select` event** (post-snap, not during drag). Embla's `select` is the right hook — fires once per slide commit. |
| Q-P10 | `MediaItem` shape strict or permissive? | **Strict discriminated union.** `{ type: "image", url, alt? }` \| `{ type: "video", url, alt?, poster? }` — type-safe narrowing in built-in handlers. Custom renderers passing extra fields use `MediaItem & TCustom` themselves. |

## Pre-emptive design locks

- **Embla peer dep** — `embla-carousel-react@^8.x` (approved during analysis sign-off). First Embla user in pro-ui.
- **No framer-motion** — Embla's transitions + Tailwind opacity transitions are sufficient.
- **No virtualization** — kasder posts have ≤10 media; Embla handles 10 slides effortlessly. v0.2 candidate.
- **`<MediaCarousel01>` is `"use client"`** — owns Embla state, observers, refs.
- **`React.memo` at export.**
- **Cross-folder import** — `import { VideoPlayer01 } from "@/registry/components/media/video-player-01"` for the built-in video handler. **First explicit cross-import in pro-ui's registry.** Documented as the locked refinement of the sealed-folder rule.
- **WAI-ARIA APG carousel pattern** — `role="region" aria-roledescription="carousel"` on root + `role="group" aria-roledescription="slide" aria-label="N of M"` per slide.

## Final API

### Public types

```ts
// src/registry/components/media/media-carousel-01/types.ts

import type { ReactNode } from "react";

export type MediaCarousel01Variant = "gallery" | "linear";

export type LinearAspect = "square" | "video" | "portrait" | "auto";

/** Discriminated union — strict shape. */
export type MediaItem =
  | {
      id: string;
      type: "image";
      url: string;
      alt?: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      alt?: string;
      poster?: string;
    };

export interface RenderItemContext {
  /** True when this slide is the currently centered/snapped slide. */
  isActive: boolean;
  /** Index of this slide in the items array. */
  index: number;
}

export interface MediaCarousel01Labels {
  /** Default: "Media carousel". aria-label on the carousel region. */
  carouselLabel?: string;
  /** Default: "Previous slide". aria-label on the prev nav button. */
  previousSlide?: string;
  /** Default: "Next slide". aria-label on the next nav button. */
  nextSlide?: string;
  /** Default: "Go to slide". aria-label prefix on indicator dots; full label = "{prefix} {n}". */
  goToSlide?: string;
  /** Default: "Slide {index} of {total}". aria-label on each slide's group. {index} and {total} are placeholders. */
  slideAriaLabel?: string;
}

export interface MediaCarousel01Props {
  /** Items to render. Required. */
  items: MediaItem[];
  /** Variant — `gallery` (peek-scale) or `linear` (snap). Required. */
  variant: MediaCarousel01Variant;

  // ─── Per-variant config ──────────────────────────────────────────
  /** Gallery only: peek ratio per side (e.g., 0.075 = 7.5%). Default: 0.075. */
  peekRatio?: number;
  /** Linear only: aspect ratio. Default: "square". */
  aspect?: LinearAspect;

  // ─── Carousel behavior ───────────────────────────────────────────
  /** Loop slides. Default: items.length > 1. */
  loop?: boolean;
  /** Show indicator dots. Default: true. Always hidden when items.length <= 1. */
  showIndicators?: boolean;
  /** Show side nav buttons. Default: true. Always hidden when items.length <= 1. */
  showNavButtons?: boolean;
  /** RTL direction. Default: false. */
  rtl?: boolean;

  // ─── Customization ───────────────────────────────────────────────
  /** Custom per-slide renderer — bypasses both built-in handlers. */
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;

  // ─── Callbacks ───────────────────────────────────────────────────
  /** Fires on Embla `select` event (post-snap; once per slide commit). */
  onSlideChange?: (index: number) => void;
  /** Fires on double-tap of any slide. Unified for image + video items. */
  onDoubleTap?: (item: MediaItem, index: number) => void;

  // ─── i18n ────────────────────────────────────────────────────────
  /** Localized labels. Defaults are English. */
  labels?: MediaCarousel01Labels;

  // ─── Style overrides ─────────────────────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes per slide wrapper. */
  slideClassName?: string;
}

export interface MediaCarousel01Handle {
  /** Scroll to a specific slide (0-indexed). */
  scrollTo: (index: number) => void;
  /** Scroll to previous slide. */
  scrollPrev: () => void;
  /** Scroll to next slide. */
  scrollNext: () => void;
  /** Get the currently active slide index. */
  getCurrentIndex: () => number;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_MEDIA_CAROUSEL_LABELS: Required<MediaCarousel01Labels> = {
  carouselLabel: "Media carousel",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: "Go to slide",
  slideAriaLabel: "Slide {index} of {total}",
};
```

### Hook signature

```ts
// hooks/use-embla-with-state.ts (INTERNAL — not exported from index.ts)

import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";

export interface UseEmblaWithStateOptions extends EmblaOptionsType {
  /** Fires on Embla `select` event (post-snap). */
  onSelect?: (index: number) => void;
}

export interface UseEmblaWithStateResult {
  /** Pass to the Embla viewport <div ref={ref}>. */
  ref: (node: HTMLElement | null) => void;
  /** Live API instance (null until Embla initializes). */
  api: EmblaCarouselType | null;
  /** Currently selected slide index (0). */
  currentIndex: number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
}

export function useEmblaWithState(
  opts: UseEmblaWithStateOptions,
): UseEmblaWithStateResult;
```

### Exported names

```ts
// index.ts
export { default as MediaCarousel01 } from "./media-carousel-01";

export type {
  MediaCarousel01Props,
  MediaCarousel01Handle,
  MediaCarousel01Labels,
  MediaCarousel01Variant,
  MediaItem,
  RenderItemContext,
  LinearAspect,
} from "./types";

export { DEFAULT_MEDIA_CAROUSEL_LABELS } from "./types";

export { meta } from "./meta";
```

### Generics

None. `MediaItem` is a strict discriminated union. Custom renderers pass extra fields via TS intersection.

## File-by-file plan

13 files. Sealed-folder.

```
src/registry/components/media/media-carousel-01/
├── media-carousel-01.tsx                # 1 — root (single-item vs carousel dispatch)
├── parts/
│   ├── single-item.tsx                  # 2 — bypass-Embla shortcut for items.length === 1
│   ├── carousel-track.tsx               # 3 — Embla-driven track (gallery + linear via className branch)
│   ├── slide-renderer.tsx               # 4 — built-in image + video handlers + renderItem dispatch
│   ├── nav-buttons.tsx                  # 5 — left/right chevrons
│   └── indicator-dots.tsx               # 6 — bottom-center elongating dots
├── hooks/
│   └── use-embla-with-state.ts          # 7 — wraps useEmblaCarousel + tracks currentIndex
├── types.ts                              # 8
├── dummy-data.ts                         # 9
├── demo.tsx                              # 10
├── usage.tsx                             # 11
├── meta.ts                               # 12
└── index.ts                              # 13
```

### 1. `media-carousel-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults: `loop ?? items.length > 1`, `showIndicators ?? true`, `showNavButtons ?? true`, `rtl ?? false`, `peekRatio ?? 0.075`, `aspect ?? "square"`.
- **Single-item dispatch:** when `items.length === 1`, render `<SingleItem>` (separate component — different hook-call count from `<CarouselTrack>`, so React rules-of-hooks honored). Otherwise render `<CarouselTrack>`.
- Forwards imperative ref to whichever child renders.
- **Critical:** the dispatch is just a component switch — `media-carousel-01.tsx` itself calls **no hooks beyond `useMemo` for labels** (which fires unconditionally). Each child component owns its own hooks.

```tsx
"use client";

import { memo, useMemo } from "react";
import {
  DEFAULT_MEDIA_CAROUSEL_LABELS,
  type MediaCarousel01Handle,
  type MediaCarousel01Labels,
  type MediaCarousel01Props,
} from "./types";
import { CarouselTrack } from "./parts/carousel-track";
import { SingleItem } from "./parts/single-item";

interface MediaCarousel01InnerProps extends MediaCarousel01Props {
  ref?: React.Ref<MediaCarousel01Handle>;
}

function MediaCarousel01Inner({
  items,
  variant,
  peekRatio = 0.075,
  aspect = "square",
  loop,
  showIndicators = true,
  showNavButtons = true,
  rtl = false,
  renderItem,
  onSlideChange,
  onDoubleTap,
  labels: labelsProp,
  className,
  slideClassName,
  ref,
}: MediaCarousel01InnerProps) {
  const labels = useMemo<Required<MediaCarousel01Labels>>(
    () => ({ ...DEFAULT_MEDIA_CAROUSEL_LABELS, ...labelsProp }),
    [labelsProp],
  );

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <SingleItem
        item={items[0]}
        renderItem={renderItem}
        onDoubleTap={onDoubleTap}
        labels={labels}
        className={className}
        slideClassName={slideClassName}
        variant={variant}
        aspect={aspect}
      />
    );
  }

  return (
    <CarouselTrack
      ref={ref}
      items={items}
      variant={variant}
      peekRatio={peekRatio}
      aspect={aspect}
      loop={loop ?? true}
      showIndicators={showIndicators}
      showNavButtons={showNavButtons}
      rtl={rtl}
      renderItem={renderItem}
      onSlideChange={onSlideChange}
      onDoubleTap={onDoubleTap}
      labels={labels}
      className={className}
      slideClassName={slideClassName}
    />
  );
}

const MediaCarousel01 = memo(MediaCarousel01Inner);
MediaCarousel01.displayName = "MediaCarousel01";

export { MediaCarousel01 };
export default MediaCarousel01;
```

### 2. `parts/single-item.tsx` — bypass-Embla shortcut

Separate component so `useDoubleTap` is called unconditionally within it (own hook count, distinct from `<CarouselTrack>`).

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useDoubleTap } from "@/registry/components/media/video-player-01";
import { SlideRenderer } from "./slide-renderer";
import type {
  LinearAspect,
  MediaCarousel01Labels,
  MediaCarousel01Variant,
  MediaItem,
} from "../types";

interface SingleItemProps {
  item: MediaItem;
  renderItem?: Parameters<typeof SlideRenderer>[0]["renderItem"];
  onDoubleTap?: (item: MediaItem, index: number) => void;
  labels: Required<MediaCarousel01Labels>;
  variant: MediaCarousel01Variant;
  aspect: LinearAspect;
  className?: string;
  slideClassName?: string;
}

export function SingleItem({
  item,
  renderItem,
  onDoubleTap,
  labels,
  variant,
  aspect,
  className,
  slideClassName,
}: SingleItemProps) {
  const handleDoubleTap = useDoubleTap(
    onDoubleTap ? () => onDoubleTap(item, 0) : undefined,
  );

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        className,
      )}
      onClick={handleDoubleTap}
      aria-label={labels.carouselLabel}
    >
      <SlideRenderer
        item={item}
        ctx={{ isActive: true, index: 0 }}
        renderItem={renderItem}
        onDoubleTap={undefined /* already handled at wrapper level */}
        variant={variant}
        aspect={aspect}
        slideClassName={slideClassName}
        isSingleItem
      />
    </div>
  );
}
```

### 3. `parts/carousel-track.tsx` — Embla-driven track

The carousel orchestrator. Owns Embla via `useEmblaWithState`, renders nav buttons + indicator dots + the slide track. Variant differences (gallery vs linear) collapse to className branches on the slide wrapper.

- Uses `useEmblaWithState` with variant-specific options:
  - Gallery: `align: "center", containScroll: false, loop`
  - Linear: `align: "start", containScroll: "trimSnaps", loop`
- Renders `<NavButtons>` if `showNavButtons` and `items.length > 1`.
- Renders `<IndicatorDots>` if `showIndicators` and `items.length > 1`.
- Forwards `onSlideChange` to `useEmblaWithState`'s `onSelect`.
- Per-slide wrapper has variant-specific classes:
  - Gallery: `flex-[0_0_85%] min-w-0 mx-1 first:ml-[7.5%] last:mr-[7.5%]` + active-state `scale-100 opacity-100` / inactive `scale-95 opacity-60` + `transition-all duration-300`.
  - Linear: `flex-[0_0_100%] min-w-0` + aspect class.
- Each slide wraps `<SlideRenderer>` + carousel-level `useDoubleTap` if `onDoubleTap` provided AND item type is image (video items get the double-tap forwarded via VideoPlayer01).
- Forwards imperative handle via `useImperativeHandle`.

```tsx
// (Pseudocode; full impl in actual file)

// Memoize Embla options so identity is stable across renders.
// `useEmblaCarousel` re-initializes Embla on options-object identity change —
// passing inline objects causes constant re-init.
const emblaOptions = useMemo(
  () => ({
    align: variant === "gallery" ? ("center" as const) : ("start" as const),
    containScroll: variant === "gallery" ? (false as const) : ("trimSnaps" as const),
    loop,
    direction: rtl ? ("rtl" as const) : ("ltr" as const),
  }),
  [variant, loop, rtl],
);

const { ref, currentIndex, scrollTo, scrollPrev, scrollNext } =
  useEmblaWithState({ ...emblaOptions, onSelect: onSlideChange });

// Stable ref-mirror for currentIndex — keeps imperative handle identity stable
// across slide changes (host's ref.current doesn't churn on every snap).
// Ref write inside passive useEffect — outside render — React Compiler-safe.
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

return (
  <div
    role="region"
    aria-roledescription="carousel"
    aria-label={labels.carouselLabel}
    className={cn("relative", className)}
  >
    <div className="overflow-hidden" ref={ref}>
      <div className="flex">
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <Slide
              key={item.id}
              item={item}
              index={index}
              isActive={isActive}
              total={items.length}
              variant={variant}
              aspect={aspect}
              renderItem={renderItem}
              onDoubleTap={onDoubleTap}
              labels={labels}
              slideClassName={slideClassName}
            />
          );
        })}
      </div>
    </div>
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
```

(`<Slide>` is a small inner component in this file that does the wrapper className branch + per-slide `useDoubleTap` for image items.)

### 4. `parts/slide-renderer.tsx` — built-in handlers + renderItem dispatch

Renders the slide content. Three paths:
1. `renderItem` provided → call it with `(item, ctx)`.
2. `item.type === "image"` → built-in image handler.
3. `item.type === "video"` → built-in video handler (imports `VideoPlayer01`).

```tsx
"use client";

import { cn } from "@/lib/utils";
import { VideoPlayer01 } from "@/registry/components/media/video-player-01";
import type {
  MediaItem,
  RenderItemContext,
  MediaCarousel01Variant,
  LinearAspect,
} from "../types";

interface SlideRendererProps {
  item: MediaItem;
  ctx: RenderItemContext;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => React.ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  variant: MediaCarousel01Variant;
  aspect: LinearAspect;
  slideClassName?: string;
  /** True when this is the single-item shortcut. */
  isSingleItem?: boolean;
}

const ASPECT_CLASS: Record<LinearAspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

export function SlideRenderer({
  item,
  ctx,
  renderItem,
  onDoubleTap,
  variant,
  aspect,
  slideClassName,
  isSingleItem = false,
}: SlideRendererProps) {
  // Aspect ratio class — gallery is always square; linear uses prop.
  const aspectClass =
    variant === "gallery" || isSingleItem
      ? "aspect-square"
      : ASPECT_CLASS[aspect];

  // Custom renderer takes everything.
  if (renderItem) {
    return (
      <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
        {renderItem(item, ctx)}
      </div>
    );
  }

  // Built-in image handler.
  if (item.type === "image") {
    return (
      <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
        <img
          src={item.url}
          alt={item.alt ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Built-in video handler — imports VideoPlayer01 (cross-folder, locked Q-P1).
  return (
    <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
      <VideoPlayer01
        src={item.url}
        poster={item.poster}
        isActive={ctx.isActive}
        onDoubleTap={
          onDoubleTap ? () => onDoubleTap(item, ctx.index) : undefined
        }
      />
    </div>
  );
}
```

### 5. `parts/nav-buttons.tsx` — left/right chevrons

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavButtonsProps {
  scrollPrev: () => void;
  scrollNext: () => void;
  labels: { previousSlide: string; nextSlide: string };
}

// (Note: removed the spurious `import type { Required }` — Required is a TS built-in.)

export function NavButtons({ scrollPrev, scrollNext, labels }: NavButtonsProps) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180"
        onClick={scrollPrev}
        aria-label={labels.previousSlide}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180"
        onClick={scrollNext}
        aria-label={labels.nextSlide}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  );
}
```

### 6. `parts/indicator-dots.tsx` — bottom-center elongating dots

```tsx
"use client";

import { cn } from "@/lib/utils";

interface IndicatorDotsProps {
  total: number;
  currentIndex: number;
  scrollTo: (index: number) => void;
  labels: { goToSlide: string };
}

export function IndicatorDots({
  total,
  currentIndex,
  scrollTo,
  labels,
}: IndicatorDotsProps) {
  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`${labels.goToSlide} ${i + 1}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "w-4 bg-primary"
                : "w-1.5 bg-primary/40 hover:bg-primary/60",
            )}
          />
        );
      })}
    </div>
  );
}
```

### 7. `hooks/use-embla-with-state.ts` — Embla wrapper

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";

export interface UseEmblaWithStateOptions extends EmblaOptionsType {
  onSelect?: (index: number) => void;
}

export interface UseEmblaWithStateResult {
  ref: (node: HTMLElement | null) => void;
  api: EmblaCarouselType | null;
  currentIndex: number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
}

export function useEmblaWithState({
  onSelect,
  ...emblaOptions
}: UseEmblaWithStateOptions): UseEmblaWithStateResult {
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stable ref for onSelect callback — avoid effect cascade on identity change.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Subscribe to Embla `select` event.
  useEffect(() => {
    if (!emblaApi) return;
    // Mount-sync: set initial state ONLY (no callback fire — avoids
    // spurious onSlideChange(0) on every mount).
    setCurrentIndex(emblaApi.selectedScrollSnap());

    const handleSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setCurrentIndex(idx);
      onSelectRef.current?.(idx); // fires only on real select events
    };
    emblaApi.on("select", handleSelect);
    return () => {
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return {
    ref: emblaRef,
    api: emblaApi ?? null,
    currentIndex,
    scrollTo,
    scrollPrev,
    scrollNext,
  };
}
```

### 8. `types.ts`

All public types as shown in **Final API**.

### 9. `dummy-data.ts`

Real Pexels image URLs + 1 video for the kasder gallery demo. Plus a separate "all images" set for the linear demo.

```ts
import type { MediaItem } from "./types";

export const DUMMY_MIXED_MEDIA: MediaItem[] = [
  { id: "1", type: "image", url: "https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?w=1280", alt: "Mountain at sunrise" },
  { id: "2", type: "image", url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?w=1280", alt: "Forest path" },
  { id: "3", type: "video", url: "https://videos.pexels.com/video-files/856005/856005-hd_1280_720_30fps.mp4", poster: "https://images.pexels.com/videos/856005/free-video-856005.jpg?w=1280" },
  { id: "4", type: "image", url: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?w=1280", alt: "City skyline" },
  { id: "5", type: "image", url: "https://images.pexels.com/photos/1366913/pexels-photo-1366913.jpeg?w=1280", alt: "Evening lights" },
];

export const DUMMY_PRODUCT_PHOTOS: MediaItem[] = [
  { id: "p1", type: "image", url: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?w=1280", alt: "Sneaker side view" },
  { id: "p2", type: "image", url: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?w=1280", alt: "Sneaker top view" },
  { id: "p3", type: "image", url: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?w=1280", alt: "Sneaker detail" },
];

export const DUMMY_SINGLE_IMAGE: MediaItem[] = [
  { id: "s1", type: "image", url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?w=1280", alt: "Forest path" },
];

export const DUMMY_SINGLE_VIDEO: MediaItem[] = [
  { id: "sv1", type: "video", url: "https://videos.pexels.com/video-files/856005/856005-hd_1280_720_30fps.mp4", poster: "https://images.pexels.com/videos/856005/free-video-856005.jpg?w=1280" },
];
```

### 10. `demo.tsx`

5-tab demo with shadcn `Tabs`.

1. **Gallery (mixed)** — `DUMMY_MIXED_MEDIA` with `variant="gallery"`. Demonstrates peek-scale + indicators + nav + the single video at index 2 auto-pausing when you swipe to other slides.
2. **Linear (photos)** — `DUMMY_PRODUCT_PHOTOS` with `variant="linear" aspect="video" loop={false}`. Product gallery feel.
3. **Single item shortcut** — `DUMMY_SINGLE_IMAGE` AND `DUMMY_SINGLE_VIDEO` rendered side-by-side. Proves no carousel chrome on single items.
4. **Custom renderItem** — same `DUMMY_MIXED_MEDIA` but with custom `renderItem` that draws an overlay caption with the slide number.
5. **isActive demo** — Same as gallery but with a button row: "Active slide: 1 [Prev] [Next]"; shows imperative ref handle in action.

### 11. `usage.tsx`

Code-block walkthrough:
- Minimal usage (gallery)
- Linear product gallery
- Custom renderItem (HLS player example)
- Imperative ref handle for programmatic navigation
- onSlideChange for analytics
- onDoubleTap for like-burst integration
- Localized labels
- Anti-patterns (no extra fields on MediaItem; no virtualization in v0.1; no fullscreen lightbox)
- Accessibility notes

### 12. `meta.ts`

```ts
import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-carousel-01",
  name: "Media Carousel 01",
  category: "media",

  description:
    "Embla-driven image+video carousel with two variants (gallery peek-scale / linear snap). Composes video-player-01 for video items via the isActive contract — videos in inactive slides pause cleanly.",
  context:
    "Use anywhere a swipeable strip of mixed images + videos is needed — Instagram-style post media (gallery), product galleries (linear), event photo strips, news article photo sets, real estate listings. The 'gallery' variant matches kasder's Instagram-post peek-scale aesthetic; the 'linear' variant is full-width snap for product/photo carousels. Single-item posts bypass the carousel entirely (no nav, no indicators, no scale). Built-in image + video handlers; renderItem slot for full per-slide takeover. **First cross-folder import in pro-ui's registry** — composes video-player-01 directly for the built-in video handler. shadcn registryDependencies handles install. Migration origin: kasder kas-social-front-v0 PostMediaCarousel.tsx; third ship in the 8-component social-posts-system arc.",
  features: [
    "Two variants — gallery (Instagram peek-scale) + linear (full-width snap)",
    "Single-item shortcut — bypasses Embla entirely for items.length === 1",
    "Built-in image handler via <img loading='lazy'>",
    "Built-in video handler via <VideoPlayer01> with isActive propagation (cross-folder import)",
    "renderItem slot for full per-slide takeover (HLS, 360°, branded players)",
    "Indicator dots — bottom-center, active dot elongates, click-to-jump",
    "Side nav chevrons — hidden on single-item",
    "Loop default = items.length > 1",
    "Per-variant config — peekRatio (gallery, default 0.075), aspect (linear, default 'square')",
    "Imperative ref handle — scrollTo / scrollPrev / scrollNext / getCurrentIndex",
    "Unified onDoubleTap(item, index) for both image + video items",
    "onSlideChange fires only on Embla 'select' event (post-snap)",
    "RTL via Embla direction + chevron flip",
    "WAI-ARIA APG carousel pattern (region / slide group / aria-current on indicators)",
    "i18n via 5-key labels object",
  ],
  tags: ["media-carousel-01", "carousel", "media", "embla", "gallery"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "tabs"],
    npm: { "embla-carousel-react": "^8.x", "lucide-react": "^0.x" },
    internal: ["video-player-01"],
  },

  related: ["video-player-01", "expandable-text-01", "post-card-01"],
};
```

### 13. `index.ts`

Public exports as shown in **Final API**.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()`
- `@/components/ui/button` — `Button` for nav buttons
- **`@/registry/components/media/video-player-01`** — `VideoPlayer01` + `useDoubleTap` (cross-folder import per Q-P1)

### NPM

- `react` (already installed)
- **`embla-carousel-react@^8.x`** — NEW peer dep (approved during analysis sign-off)
- `lucide-react` — ChevronLeft / ChevronRight (already installed)
- shadcn `tabs` for the demo (already installed)

### Forbidden

- `next/*`
- `framer-motion`
- HLS / DASH / streaming libraries (consumers wire via `renderItem`)

## Composition pattern

**Variant-dispatching root + Embla-wrapping track + slot-aware slide renderer.** Single-item case bypasses Embla entirely.

## Edge cases

| Case | Behavior |
|---|---|
| `items` empty array | Render nothing (component returns `null` from root). |
| `items.length === 1` | Single-item shortcut: bare `aspect-square` wrapper, no Embla, no nav, no indicators. Double-tap still works via wrapper-level `useDoubleTap`. |
| `items.length === 1` + custom `aspect` (linear) | Single-item shortcut still uses `aspect-square` (variant doesn't apply when there's no carousel). Documented limitation. |
| Item `type` not in `"image" \| "video"` | TS prevents at type level. Runtime: built-in handlers don't render; consumer should provide `renderItem`. |
| `renderItem` provided + item.type matches built-in | Custom renderer takes priority. Bypasses both built-in handlers. |
| Video item without `poster` | Browser shows blank/black background until first frame loads. Acceptable — `poster` is optional. |
| `loop=false` + at last slide | Embla disables `scrollNext` internally. Our nav button still renders (Embla's API no-ops). v0.2 candidate: dim/disable button visually. |
| `rtl=true` | Embla's `direction: "rtl"` flips drag direction. Chevrons flip via `rtl:rotate-180`. Indicator dot order reverses naturally (visual). |
| Container resizes | Embla auto-recalculates snap points on resize via internal `ResizeObserver`. Active slide stays correct. |
| `items` array changes at runtime | React reconciles via `key={item.id}`. Embla re-initializes if items.length changes (Embla handles internally). |
| `onSlideChange` fires during initial mount | `useEmblaWithState`'s effect calls `handleSelect()` once on mount to sync — fires `onSlideChange(0)`. Documented; consumers can guard with `index !== 0` if they want to skip mount. |
| Component unmounts during Embla load | useEffect cleanup calls `emblaApi.off("select", handleSelect)`. No leak. |
| Double-tap on a custom-rendered slide | `useDoubleTap` is at the slide-wrapper level — fires regardless of what `renderItem` returns. Consumer is responsible for stopping propagation if they want different behavior. |
| Touch device | Embla handles touch drag natively. Indicators stay visible (mobile-typical). |
| Prefers-reduced-motion | Embla's slide transitions are CSS-driven; respects `prefers-reduced-motion` automatically via the existing `motion-safe:` Tailwind utilities (no custom JS animation in this component). |
| SSR | Embla mounts client-only; SSR renders the slide track DOM but indicators show `currentIndex={0}`. After hydration, Embla initializes and `select` fires → indicators correct. Acceptable; matches kasder. |

## Accessibility

- Root: `role="region" aria-roledescription="carousel" aria-label={labels.carouselLabel}`. Per WAI-ARIA APG carousel pattern.
- Per slide: `role="group" aria-roledescription="slide" aria-label="Slide N of M"` (label resolved from `labels.slideAriaLabel` template).
- Nav buttons: `aria-label={labels.previousSlide}` / `aria-label={labels.nextSlide}`. Real `<button type="button">` — keyboard activation free.
- Indicator dots: real `<button type="button">` with `aria-label="Go to slide N"` + `aria-current={isActive ? "true" : undefined}`.
- Embla provides arrow-key keyboard nav natively when the carousel viewport has focus.
- `focus-visible:ring-2 focus-visible:ring-ring` on indicator dots for visible focus.
- Built-in image: `alt={item.alt ?? ""}` — empty alt for decorative; consumer-supplied for meaningful images.
- Built-in video: inherits VideoPlayer01's accessibility (aria-label, mute aria-pressed, etc.).
- Single-item shortcut: same a11y as a single image/video — no carousel role applied.
- Reduced motion: Embla transitions are CSS; honor browser settings.

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK)
- [ ] `pnpm build` clean — `/components/media-carousel-01` prerendered (37th route)
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry under the `media` category section (joining video-player-01)
- [ ] Visual sanity:
  - Gallery tab: peek-scale active vs inactive slides, indicators elongating, nav chevrons working, video at index 2 auto-pauses when off-screen
  - Linear tab: full-width snap, no peek
  - Single-item tab: no carousel chrome (no nav, no indicators, no scale)
  - Custom renderItem tab: caption overlay renders
  - isActive imperative tab: clicking "Next" / "Prev" / "Jump to 3" navigates correctly
- [ ] Embla peer dep installed (`embla-carousel-react` in package.json)
- [ ] Cross-folder import works at build time (`VideoPlayer01` resolves)
- [ ] Browser sanity (deferred but flagged in STATUS):
  - Touch drag on mobile
  - Keyboard arrow nav when carousel focused
  - RTL flips drag direction + chevron icons
  - Double-tap on image AND video items both fire onDoubleTap

## Risks & alternatives

### Risk 1: First cross-folder import in pro-ui

This is the architectural inflection point. Risk: if the cross-import goes wrong (e.g., `VideoPlayer01` evolves a breaking API, our peer-dep declaration is wrong), media-carousel-01 ships broken.

**Mitigation:** explicit `registryDependencies: ["video-player-01"]` in `registry.json` ensures install-time dependency. internal: ["video-player-01"] in meta.dependencies for visibility. Document in usage.tsx + meta.ts. Future audit: when video-player-01 ships v0.2, verify media-carousel-01 still works at the boundary.

### Risk 2: Embla's `useEmblaCarousel` returns a tuple, not stable

`useEmblaCarousel(opts)` — the `opts` object identity affects whether Embla re-initializes. If we pass an inline object every render, Embla re-inits constantly.

**Mitigation:** memoize opts via `useMemo([variant, peekRatio, loop, rtl])`. Or pass the options object directly via the hook's signature (which already destructures known fields).

### Risk 3: `onSlideChange(0)` fires on mount

When Embla initializes, our `handleSelect()` fires once to sync `currentIndex`. This calls `onSlideChange(0)` even though no user action occurred. Consumers wanting "user-driven only" need to track first-call themselves.

**Mitigation:** documented in usage. Consumers can compare against initial index or use a `firstRunRef`.

### Risk 4: SSR `currentIndex=0` mismatch on hydration

SSR renders with `currentIndex=0`; Embla initializes client-side and may dispatch a different `select` if `loop=true` or initial scroll position differs. Possible flash of wrong indicator.

**Mitigation:** Embla's defaults always start at index 0 (no auto-scroll on init). No mismatch in practice.

### Risk 5: Embla's `loop` requires odd setup with single items

Embla rejects `loop: true` when `items.length <= 1` with a console warning. Our default `loop ?? items.length > 1` already guards.

### Risk 6: Cross-folder import breaks NPM extraction story

If pro-ui ever extracts to NPM packages, media-carousel-01 would need video-player-01 as a peer dep (or runtime dep). Different distribution mechanism but same logical dependency.

**Mitigation:** the `registryDependencies` declaration maps cleanly to `peerDependencies` at NPM extraction time. Document the rule for future extraction work.

### Alternatives considered

1. **Headless carousel with no built-in renderers** — rejected. Forces consumer boilerplate for the 99% case (image+video posts).
2. **Built-in minimal `<video>` instead of cross-importing VideoPlayer01** — rejected. Degraded UX vs the just-shipped video-player-01; ships duplicate code.
3. **Three variants (gallery + linear + feature-strip)** — rejected. feature-strip has no concrete consumer in the 8-component scope; deferred to v0.2.
4. **Generic `<MediaCarousel<T>>` with custom item type** — rejected. Strict `MediaItem` discriminated union covers 99% of cases; consumers wanting custom shapes use `renderItem` slot.
5. **Shared variant component with prop-driven differences** — chose this internally (via `parts/carousel-track.tsx` className branches). Two separate part files would duplicate Embla wiring needlessly.
6. **No imperative handle (slot-only)** — rejected. Programmatic navigation (e.g., "Jump to media that has the comment") is a real consumer need; ref handle is the cleanest API.

## Implementation phases

### Phase A — types + hook + scaffolding (Day 1, ~1 hour)

- `pnpm dlx shadcn@latest add embla-carousel-react` — wait, that's not a shadcn primitive. **Correct command: `pnpm add embla-carousel-react`** (NPM dep).
- `pnpm new:component media/media-carousel-01` — scaffolds the sealed folder.
- Create `parts/` and `hooks/` subdirectories.
- Author `types.ts` with all public types (discriminated union for MediaItem).
- Author `hooks/use-embla-with-state.ts`.
- `pnpm tsc --noEmit` should pass on the bare scaffolding.

### Phase B — root + parts + cross-import (Day 1, ~1.5 hours)

- Author `parts/slide-renderer.tsx` (built-in handlers + cross-import of VideoPlayer01).
- Author `parts/nav-buttons.tsx`.
- Author `parts/indicator-dots.tsx`.
- Author `parts/carousel-track.tsx` (Embla orchestrator).
- Author `media-carousel-01.tsx` root (single-item dispatch + variant dispatch + ref forwarding).
- Smoke-test directly inside `demo.tsx` while authoring.

### Phase C — demo + docs + ship (Day 1, ~1.5 hours)

- Author `dummy-data.ts` (Pexels image URLs + 1 video).
- Author `demo.tsx` (5 tabs).
- Author `usage.tsx`.
- Author `meta.ts`.
- Add 3 lines to `src/registry/manifest.ts`.
- Run `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` — all clean.
- Add to `registry.json` (base + fixtures items, with `registryDependencies: ["video-player-01"]` on the base).
- Run `pnpm registry:build`.
- Update `.claude/STATUS.md` (note the cross-folder import precedent).
- Author `media-carousel-01-procomp-guide.md`.

### Estimated total: ~4 hours focused work

Slightly less than video-player-01 (~4.5h) because the state machine is simpler (Embla owns most of it). Establishes the cross-folder import precedent for the rest of the social-posts arc.

## Open follow-ups (post v0.1)

- v0.2: `feature-strip` variant (avatar-row layout for likers / story rail / chip carousels)
- v0.2: `lazyVideoDistance?: number` to unmount videos > N slides from active (perf for posts with many videos)
- v0.2: Auto-advance / slideshow mode (`autoPlayMs?: number`)
- v0.2: Thumbnail strip below the main carousel
- v0.2: Pinch-to-zoom on images (or a separate `image-lightbox-01`)
- v0.2: Disabled state for nav buttons at boundaries (when `loop=false`)
- v0.2: `getEmblaApi()` substrate-leak escape hatch (only if real demand)
- v0.3: Vertical orientation (`orientation: "horizontal" | "vertical"`)
