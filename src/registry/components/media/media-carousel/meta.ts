import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-carousel",
  name: "Media Carousel",
  category: "media",

  description:
    "Embla image and video carousel — gallery or linear variants, coordinated video pause for inactive slides.",
  context:
    "Use anywhere a swipeable strip of mixed images + videos is needed — Instagram-style post media (gallery), product galleries (linear), event photo strips, news article photo sets, real estate listings. The 'gallery' variant matches kasder's Instagram-post peek-scale-blur aesthetic exactly: focused image at center is full-bleed sharp; neighbors are scaled to 95%, opacity-60, and 1px-blurred. Soft edge gradients (background → transparent, 12 rem each side) further soften peek edges. The 'linear' variant is full-width snap (no peek, no scale). Single-item posts bypass the carousel entirely (no nav, no indicators, no scale). Built-in image + video handlers; renderItem slot for full per-slide takeover. **First cross-folder import in pro-ui's registry** — composes video-player directly for the built-in video handler. shadcn registryDependencies handles install. Migration origin: kasder kas-social-front-v0 PostMediaCarousel.tsx; third ship in the 8-component social-posts-system arc.",
  features: [
    "Two variants — gallery (Instagram peek-scale-blur) + linear (full-width snap)",
    "Slide layout matches kasder verbatim — `mx-1 flex-[0_0_85%]` gutters; first/last `marginLeft/Right: peekRatio*100%` ONLY when loop=false (under loop, asymmetric edges break Embla clone math)",
    "Inactive slide visuals — `scale-95 opacity-60 blur-[1px]` with 300ms transition (matches kasder + adds 1px softening blur)",
    "Edge gradient overlays (gallery only) — `bg-linear-to-r/l from-background to-transparent w-12`, soft fade past the visible peek",
    "Single-item shortcut — bypasses Embla entirely for items.length === 1 (separate component to honor React rules-of-hooks)",
    "Built-in image handler via <img loading='lazy'>",
    "Built-in video handler via <VideoPlayer> with isActive propagation (cross-folder import)",
    "renderItem slot for full per-slide takeover (HLS, 360°, branded players)",
    "Indicator dots — bottom-center, active dot elongates, click-to-jump, aria-current",
    "Side nav chevrons — RTL flip via rtl:rotate-180",
    "Loop default = items.length > 1; Embla configures itself — no defensive option overrides",
    "Per-variant config — peekRatio (gallery, default 0.075), aspect (linear, default 'square')",
    "Imperative ref handle — scrollTo / scrollPrev / scrollNext / getCurrentIndex (stable identity via currentIndexRef)",
    "Unified onDoubleTap(item, index) for both image + video items",
    "onSlideChange fires only on Embla 'select' event (post-snap; mount-sync silent)",
    "Embla options memoized — no re-init on render",
    "RTL via Embla direction + chevron flip",
    "WAI-ARIA APG carousel pattern (region / slide group / aria-current on indicators)",
    "Keyboard nav — region focusable, ArrowLeft/Right scroll prev/next (RTL-aware), Home/End jump to first/last",
    "Inactive slides get HTML5 `inert` — Tab skips inactive content, screen readers ignore it",
    "i18n via 5-key labels object with {index}/{total} placeholders",
  ],
  tags: ["media-carousel", "carousel", "media", "embla", "gallery"],

  version: "0.2.0",
  status: "alpha",
  artifactBudgetKB: 35,
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: {
      "embla-carousel": "^8.6.0",
      "embla-carousel-react": "^8.6.0",
      "lucide-react": "^1.11.0",
    },
    internal: ["video-player"],
  },

  related: ["video-player", "expandable-text", "post-card"],
};
