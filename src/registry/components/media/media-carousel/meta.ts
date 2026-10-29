import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-carousel",
  name: "Media Carousel",
  category: "media",

  description:
    "Embla image and video carousel — gallery or linear variants, coordinated video pause for inactive slides.",
  context:
    "Use anywhere a swipeable strip of mixed images + videos is needed — Instagram-style post media (gallery), product galleries (linear), event photo strips, news article photo sets, real estate listings. The 'gallery' variant matches kasder's Instagram-post peek-scale-blur aesthetic exactly: focused image at center is full-bleed sharp; neighbors are scaled to 95%, opacity-60, and 1px-blurred (the blur is a CSS variable; 0px matches a no-blur prototype). Soft edge gradients (background → transparent, 12 rem each side) further soften peek edges. The 'linear' variant is full-width snap (no peek, no scale). Single-item posts bypass the carousel entirely (no nav, no indicators, no scale). Built-in image + video handlers; renderItem slot for full per-slide takeover. **First cross-folder import in pro-ui's registry** — composes video-player directly for the built-in video handler. shadcn registryDependencies handles install. Migration origin: kasder kas-social-front-v0 PostMediaCarousel.tsx; third ship in the 8-component social-posts-system arc.",
  features: [
    "Two variants — gallery (Instagram peek-scale-blur) + linear (full-width snap)",
    "Gallery layout — slides 1 − 2 × peekRatio wide (85% by default) with the neighbours peeking; first/last edge peek (logical margins) whenever Embla is not looping (also when it drops the loop because the slides can't fill it)",
    "Inactive slide visuals — 95% scale, 60% opacity, `--media-carousel-inactive-blur` (default 1px; set 0px for no blur); transitions gated by motion-safe",
    "Edge fades (gallery) — logical start/end, colour from `--media-carousel-fade` (default the background token)",
    "Aspect — square / video / portrait / auto / natural-clamped (first item's ratio clamped to minRatio 4:5 … maxRatio 1.91:1) / any \"W:H\" such as \"4:5\" or \"1.91:1\", for both variants and a single item",
    "Per-slide caption — under the frame, inside its slide (read once with it), clamped to captionLines (default 2) with a localized Show more; the carousel takes the active slide's height, so an item without a caption takes no space",
    "Item dimensions — width / height reserve the frame; srcSet / sizes / decoding=async on the built-in <img>",
    "onMediaError — an expired image or video URL asks the host once for a replacement and retries",
    "Built-in video slides via <VideoPlayer> — poster before play; only the active slide plays, and it pauses while the carousel is less than half in view (IntersectionObserver); labels.video + locale reach every player, a video item's alt names it",
    "renderItem slot for full per-slide takeover; context carries isActive, inView, index",
    "Controlled index (opt-in) — index + onIndexChange, the prop wins every render (a swipe settles back unless adopted); defaultIndex when uncontrolled",
    "Direction — dir prop or the element's direction after mount; Embla, arrow keys, chevrons, nav sides, peek and fades agree (rtl kept as a deprecated alias)",
    "Click a peeking neighbour to scroll to it; inactive slides stay out of the tab order and the accessibility tree",
    "showNavButtons: true / false / \"fine-pointer\" (mouse and trackpad only)",
    "Counter chip (showCounter) with locale-formatted numbers, inside the active slide's frame",
    "Typed labels — function forms for slide names, dot names and the counter; role descriptions; the 0.2 string templates still accepted",
    "Single-item shortcut — bypasses Embla entirely for items.length === 1",
    "Indicator dots — bottom-center, 16px active pill, click-to-jump, aria-current",
    "Imperative ref handle — scrollTo / scrollPrev / scrollNext / getCurrentIndex (stable identity)",
    "Unified onDoubleTap(item, index) for both image + video items",
    "onSlideChange fires on Embla 'select' (mount-sync silent)",
    "WAI-ARIA APG carousel pattern — region / slide groups / aria-current; ArrowLeft/Right (direction-aware), Home/End",
  ],
  tags: ["media-carousel", "carousel", "media", "embla", "gallery"],

  version: "0.4.0",
  status: "alpha",
  // 0.4.0: captions (slide-caption part, active-slide height measure), effective loop, "W:H",
  // video labels + both fix waves: built 71.5 KB (was 53.3) → 60 → 80.
  artifactBudgetKB: 80,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-29",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: {
      "embla-carousel": "^8.6.0",
      "embla-carousel-react": "^8.6.0",
      "lucide-react": "^1.11.0",
    },
    internal: ["video-player", "expandable-text"],
  },

  related: ["video-player", "expandable-text", "post-card"],
};
