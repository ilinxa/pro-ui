import type { ReactNode } from "react";

export type MediaCarouselVariant = "gallery" | "linear";

/** The fixed aspect ratios (the 0.2 set). */
export type LinearAspect = "square" | "video" | "portrait" | "auto";

/**
 * Slide frame ratio. `natural-clamped` = the first item's own ratio, clamped to
 * `[minRatio, maxRatio]` (width / height) — e.g. 3:4 → 4:5, 16:9 stays, 3:1 → 1.91:1.
 */
export type MediaCarouselAspect = LinearAspect | "natural-clamped";

export type MediaCarouselDirection = "ltr" | "rtl";

/** Discriminated union — strict shape. */
export type MediaItem =
  | {
      id: string;
      type: "image";
      url: string;
      alt?: string;
      /** Intrinsic size in px — reserves the frame before load and feeds `natural-clamped`. */
      width?: number;
      height?: number;
      /** Forwarded to the built-in `<img>`. */
      srcSet?: string;
      sizes?: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      alt?: string;
      poster?: string;
      /** Intrinsic size in px — feeds `natural-clamped` before the metadata loads. */
      width?: number;
      height?: number;
    };

export interface RenderItemContext {
  /** True when this slide is the currently centered/snapped slide. */
  isActive: boolean;
  /**
   * True while at least half of the carousel is in the viewport (always true on the server
   * and the first render). The built-in video plays only when `isActive && inView` — a custom
   * video renderer should use the same condition.
   */
  inView: boolean;
  /** Index of this slide in the items array. */
  index: number;
}

export interface MediaCarouselLabels {
  /** Default: "Media carousel". aria-label on the carousel region. */
  carouselLabel?: string;
  /** Default: "Previous slide". aria-label on the prev nav button. */
  previousSlide?: string;
  /** Default: "Next slide". aria-label on the next nav button. */
  nextSlide?: string;
  /**
   * Indicator dot name: `(position) => string`, position 1-based. Default `"Go to slide 2"`.
   * A string is the deprecated 0.2 form: a prefix, named `"{prefix} {n}"`.
   */
  goToSlide?: string | ((position: number) => string);
  /**
   * Slide name: `(position, total) => string`, position 1-based. Default `"Slide 2 of 5"`.
   * A string is the deprecated 0.2 template with `{index}` / `{total}` placeholders.
   */
  slideAriaLabel?: string | ((position: number, total: number) => string);
  /**
   * Visible counter chip (`showCounter`). `format` renders a number in `locale`.
   * Default `"2/5"`.
   */
  counter?: (position: number, total: number, format: (n: number) => string) => string;
  /** Default: "carousel". `aria-roledescription` of the region. */
  carouselRoleDescription?: string;
  /** Default: "slide". `aria-roledescription` of each slide. */
  slideRoleDescription?: string;
}

/** Labels after merging over the defaults — every value present, value labels as functions. */
export interface ResolvedMediaCarouselLabels {
  carouselLabel: string;
  previousSlide: string;
  nextSlide: string;
  goToSlide: (position: number) => string;
  slideAriaLabel: (position: number, total: number) => string;
  counter: (position: number, total: number, format: (n: number) => string) => string;
  carouselRoleDescription: string;
  slideRoleDescription: string;
}

export interface MediaCarouselProps {
  /** Items to render. Required. */
  items: MediaItem[];
  /** Variant — `gallery` (peek-scale) or `linear` (snap). Required. */
  variant: MediaCarouselVariant;

  // ─── Per-variant config ──────────────────────────────────────────
  /** Gallery only: peek ratio per side (e.g., 0.075 = 7.5%). Default: 0.075. */
  peekRatio?: number;
  /**
   * Slide frame ratio, for both variants and a single item. Default: "square".
   * In a gallery every slide uses the same frame (the first item's, for `natural-clamped`).
   */
  aspect?: MediaCarouselAspect;
  /** `natural-clamped` lower bound (width / height). Default: 4 / 5. */
  minRatio?: number;
  /** `natural-clamped` upper bound (width / height). Default: 1.91. */
  maxRatio?: number;

  // ─── Carousel behavior ───────────────────────────────────────────
  /** Loop slides. Default: items.length > 1. */
  loop?: boolean;
  /** Show indicator dots. Default: true. Always hidden when items.length <= 1. */
  showIndicators?: boolean;
  /**
   * Side nav buttons. Default: true. `"fine-pointer"` = only under a mouse / trackpad
   * (`(pointer: fine)`, resolved after mount). Always hidden when items.length <= 1.
   */
  showNavButtons?: boolean | "fine-pointer";
  /** Visible "2/5" chip. Default: false. */
  showCounter?: boolean;
  /**
   * Text direction. Default: the element's direction after mount (an ancestor `dir="rtl"`
   * works). Embla, arrow keys, chevrons, nav sides, peek and fades all follow it.
   */
  dir?: MediaCarouselDirection;
  /** @deprecated Use `dir="rtl"`. Ignored when `dir` is set. */
  rtl?: boolean;
  /** BCP 47 locale for the counter numbers. Default: "en"; an invalid tag falls back to "en". */
  locale?: string;

  // ─── Controlled index (opt-in) ───────────────────────────────────
  /**
   * Controlled slide index. When set, the prop wins on every render: a swipe calls
   * `onIndexChange` and settles back unless the parent adopts the new index.
   */
  index?: number;
  /** Fires when the user (or the handle) moves to another slide. */
  onIndexChange?: (index: number) => void;
  /** Starting slide when uncontrolled. Default: 0. */
  defaultIndex?: number;

  // ─── Customization ───────────────────────────────────────────────
  /** Custom per-slide renderer — bypasses both built-in handlers. */
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;

  // ─── Callbacks ───────────────────────────────────────────────────
  /** Fires on Embla `select` event (post-snap; once per slide commit). */
  onSlideChange?: (index: number) => void;
  /** Fires on double-tap of any slide. Unified for image + video items. */
  onDoubleTap?: (item: MediaItem, index: number) => void;
  /**
   * A built-in image or video failed to load (an expired signed URL…). Resolve a new URL to
   * retry once; a second failure for the same item does not call again. A new `url` from the
   * host resets it. A video shows its loading state meanwhile and resumes at the same time.
   */
  onMediaError?: (item: MediaItem) => Promise<string | void> | string | void;

  // ─── i18n ────────────────────────────────────────────────────────
  /** Localized labels. Defaults are English; an `undefined` value keeps the default. */
  labels?: MediaCarouselLabels;

  // ─── Style overrides ─────────────────────────────────────────────
  /**
   * Override classes for the wrapping <div>. CSS variables: `--media-carousel-fade` (edge
   * fade colour, default `var(--background)`), `--media-carousel-inactive-blur` (default `1px`).
   */
  className?: string;
  /** Override classes per slide wrapper. */
  slideClassName?: string;
}

export interface MediaCarouselHandle {
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
export const defaultMediaCarouselLabels: ResolvedMediaCarouselLabels = {
  carouselLabel: "Media carousel",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: (position) => `Go to slide ${position}`,
  slideAriaLabel: (position, total) => `Slide ${position} of ${total}`,
  counter: (position, total, format) => `${format(position)}/${format(total)}`,
  carouselRoleDescription: "carousel",
  slideRoleDescription: "slide",
};

/**
 * @deprecated The 0.2 string labels — use `defaultMediaCarouselLabels`. Still accepted as
 * `labels`.
 */
export const DEFAULT_MEDIA_CAROUSEL_LABELS = {
  carouselLabel: "Media carousel",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: "Go to slide",
  slideAriaLabel: "Slide {index} of {total}",
} as const satisfies MediaCarouselLabels;
