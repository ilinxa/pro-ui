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
  /** Default: "Slide {index} of {total}". {index} and {total} are placeholders. */
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
