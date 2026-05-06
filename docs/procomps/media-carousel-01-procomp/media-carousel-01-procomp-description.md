# media-carousel-01 — procomp description

> Stage 1: what & why.
>
> ### v0.1.1 patch (2026-05-03)
>
> - **Slide layout now matches kasder's `PostMediaCarousel.tsx` exactly.** Outer wrapper is `mx-1 flex-[0_0_85%]` (4px gutter + 85% slide width); inner wrapper is the visual frame (`rounded-lg overflow-hidden transition-all duration-300`). First/last slides get `marginLeft`/`marginRight: peekRatio*100%` ONLY when `loop=false` — under loop, asymmetric edges break Embla's clone math (the v0.1 layout's universal margins were the cause of the loop-wrap bug).
> - **Inactive slide visual:** `scale-95 opacity-60 blur-[1px]` (kasder's scale + opacity + a 1px softening blur for the focused-bigger / neighbors-smaller-blurred effect).
> - **Edge gradient overlays (gallery only):** `bg-linear-to-r from-background to-transparent` on the left + mirror on the right (12 rem each side). Soft fade past the visible peek; pointer-events-none, aria-hidden.
> - **Embla config simplified.** Dropped defensive `slidesToScroll: 1` + `skipSnaps: false` overrides — they were interfering with loop defaults. `containScroll` only set for linear+no-loop now (loop force-disables it anyway).
> - **No API changes** — visual + config tweaks only.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `PostMediaCarousel.tsx` (142 LOC), the Embla-driven image+video carousel inside post cards.
>
> Third of 8 components in the social-posts-system arc. Composes [`video-player-01`](../video-player-01-procomp/) for video items via the `isActive` contract — the whole reason video-player-01 shipped first. **Adds Embla** as a peer dep (~25KB ESM, no peer deps of its own; approved during analysis sign-off).

## Problem

Every social product surface that lets users post multiple media items needs the same carousel: a horizontal swipeable strip of images + videos with **distinctive Instagram-post peek-scale** (active slide centered + full opacity, neighbors scaled-down + faded) plus **per-slide indicator dots** and **side nav chevrons**, plus the critical **`isActive` propagation** so videos in inactive slides pause cleanly. Built ad-hoc per project: hardcoded layout, no slot for custom slide rendering, no `isActive` contract (videos in carousels keep playing on inactive slides), no double-tap callback (the post double-tap-to-like UX needs it), no single-item shortcut (carousel chrome rendered even for posts with 1 photo).

## In scope

- **Embla-driven carousel** with two variants:
  - `gallery` — kasder Instagram-post style. 85%-width slides with `mx-1`, neighbors at `scale-95 opacity-60`, active at `scale-100 opacity-100`, `transition-all duration-300`. `aspect-square` per slide.
  - `linear` — full-width snap-aligned slides. Square aspect default, `aspect?` prop accepts `"square" | "video" | "portrait" | "auto"`.
- **Single-item shortcut** — when `items.length === 1`, **bypass Embla entirely**. Just render the one item full-width inside an `aspect-square bg-muted` wrapper. No nav buttons, no indicators, no scale. Matches kasder.
- **Built-in image item handler** — for `type: "image"` items, renders `<img loading="lazy" src={url} alt={alt}>` with `object-cover`.
- **Built-in video item handler** — for `type: "video"` items, renders `<VideoPlayer01 src={url} poster={poster} isActive={isCurrentSlide} onDoubleTap={...} />`. **This is a deliberate cross-folder import** from `video-player-01` (sealed-folder rule deviation; see Q-P1 below). Composing the kasder UX without it would force consumers into massive boilerplate.
- **Active-slide tracking** — internal state via `useEmblaCarousel`'s `select` event. Drives `isActive` propagation to video items.
- **Indicator dots** — bottom-center, active dot elongates from `w-1.5` → `w-4`, click-to-jump via `emblaApi.scrollTo(index)`. `bg-primary` active / `bg-primary/40` inactive. Only rendered when `items.length > 1`.
- **Nav buttons** — left/right `ChevronLeft` / `ChevronRight` chevrons, `absolute h-8 w-8 rounded-full opacity-80 hover:opacity-100`. Only rendered when `items.length > 1`. `aria-label`s from `labels`.
- **Loop** — `loop?: boolean` defaults to `items.length > 1` (single items don't loop).
- **Double-tap callback** — `onDoubleTap?: (item, index) => void`. For image items, fires on double-tap of the slide. For video items, the carousel's onDoubleTap is forwarded to the underlying `<VideoPlayer01 onDoubleTap>` so the same gesture works in both contexts.
- **`renderItem` slot** — `renderItem?: (item, ctx: { isActive, index }) => ReactNode` — full per-slide takeover. Bypasses both built-in handlers. Consumers wanting custom video player (HLS, branded controls, reels-style scrubber) wire it here.
- **`onSlideChange` callback** — `(index: number) => void` fires when active slide changes. Hosts use this for analytics / preloading / heart-burst overlay positioning (see post-card-01).
- **Imperative ref handle** — `{ scrollTo(index), scrollPrev(), scrollNext(), getCurrentIndex() }`. React 19 ref-as-prop. Hosts use for programmatic navigation (e.g., "jump to media that has the comment user mentioned").
- **i18n labels** — `labels?: { previousSlide?, nextSlide?, slideIndicator?, goToSlide? }` with English defaults. All nav + indicator buttons get aria-labels.
- **Per-variant config** — `peekRatio?: number` (gallery only, default 0.075 = 7.5% peek per side); `aspect?: "square" | "video" | "portrait" | "auto"` (linear only, default `square`).
- **a11y** — `<div role="region" aria-roledescription="carousel" aria-label={labels.carouselLabel}>`; per-slide `role="group" aria-roledescription="slide" aria-label="N of M"`; nav buttons disabled when `loop=false` and at the end; indicator buttons get `aria-current={isActive ? "true" : undefined}`.
- **RTL support** — Embla's native `direction: "rtl"` flag; chevron icons flip via `rtl:rotate-180`.

## Out of scope (v0.2 candidates)

- **`feature-strip` variant** — the third variant from the analysis was deferred since no concrete consumer exists in the 8-component scope (engagement-bar-01's likers-preview is a slot pattern; story-rail-01 uses raw Embla). Add when a third consumer surfaces.
- **Drag-to-dismiss / swipe-down** — Embla handles horizontal drag natively; vertical swipe-to-dismiss is a story-viewer concern, not carousel.
- **Pinch-to-zoom on images** — image lightbox UX. Add a separate `image-lightbox-01` if needed.
- **Lazy-mount videos beyond N slides away** — kasder mounts all video elements simultaneously (memory cost ~5MB per video, acceptable for typical posts of ≤10 media). v0.2 candidate: `lazyVideoDistance?: number` to unmount videos > N slides from active.
- **Auto-advance / slideshow mode** — `autoPlayMs?: number` for kiosk-style auto-advance. Different UX (story viewer is the "auto-advance" pattern).
- **Thumbnail strip** — separate row of mini-previews for jumping to specific slides. Adds visual complexity; defer.
- **Fullscreen viewer** — clicking a slide opens lightbox. Different pattern; would be a separate `image-viewer-01` / similar.
- **Pinch zoom / pan on touch** — image gesture handling. Defer.
- **Server-side rendering of indicators** — Embla mounts client-only; SSR renders the slide track but indicators show after hydration. Acceptable; matches kasder.

## Target consumers

- **`post-card-01`** (later ship) — primary consumer. Sets `variant="gallery"`, items from `post.media`, forwards `onDoubleTap` to engagement-bar-01's heart-burst overlay.
- Product galleries (e-commerce) — `variant="linear"`, full-width snap, photos only.
- Event photo strips — `variant="linear"`, mixed image+video.
- News article photo sets — `variant="linear"` inline in the article body.
- Real estate listings — `variant="gallery"`, multi-photo with peek-scale.
- Anywhere "swipeable image+video strip" is needed.

## Rough API sketch

```tsx
<MediaCarousel01 items={post.media} variant="gallery" />
```

That's it for the kasder default. Image items + video items both render via built-in handlers; videos get `isActive` propagation automatically.

For double-tap-to-like on the host:

```tsx
<MediaCarousel01
  items={post.media}
  variant="gallery"
  onDoubleTap={(item, index) => triggerLikeBurst(post.id)}
  onSlideChange={(index) => analytics.track("post.slide", { id: post.id, index })}
/>
```

For a product gallery (linear variant, photos only, no peek):

```tsx
<MediaCarousel01
  items={product.photos}
  variant="linear"
  aspect="video"
  loop={false}
/>
```

For full per-slide custom rendering (e.g., 360° viewer, HLS player):

```tsx
<MediaCarousel01
  items={items}
  variant="gallery"
  renderItem={(item, { isActive, index }) =>
    item.type === "panorama" ? (
      <PanoramaViewer src={item.url} active={isActive} />
    ) : item.type === "hls-video" ? (
      <HlsPlayer src={item.url} active={isActive} />
    ) : null
  }
/>
```

For programmatic navigation (e.g., a "View comment in context" link that jumps to media):

```tsx
const carouselRef = useRef<MediaCarousel01Handle>(null);

<MediaCarousel01 ref={carouselRef} items={items} variant="gallery" />
<button onClick={() => carouselRef.current?.scrollTo(2)}>Jump to slide 3</button>
```

## Example usages

**1. Post-card body** (the originating use case):
```tsx
<article className="bg-card rounded-2xl p-4">
  <PostHeader author={post.author} timestamp={post.createdAt} />
  <ExpandableText01 content={post.body} maxLines={3} />
  <MediaCarousel01
    items={post.media}
    variant="gallery"
    onDoubleTap={() => triggerLike(post.id)}
  />
  <EngagementBar01 actions={[/*...*/]} />
</article>
```

**2. Event photo gallery** (post-event detail page):
```tsx
<MediaCarousel01
  items={event.photos.map((url, i) => ({
    id: `photo-${i}`,
    type: "image" as const,
    url,
  }))}
  variant="linear"
  aspect="video"
  loop={false}
  labels={{ carouselLabel: "Event photos" }}
/>
```

**3. Mixed media in a news article body**:
```tsx
<MediaCarousel01
  items={article.embeddedMedia}
  variant="linear"
  aspect="auto"
  onSlideChange={(idx) => analytics.track("article.media", { id: article.id, idx })}
/>
```

## Public exports (from `index.ts`)

```ts
export { MediaCarousel01 } from "./media-carousel-01";
export type {
  MediaCarousel01Props,
  MediaCarousel01Handle,
  MediaCarousel01Labels,
  MediaCarousel01Variant,
  MediaItem,
  RenderItemContext,
} from "./types";
export { DEFAULT_MEDIA_CAROUSEL_LABELS } from "./types";
export { meta } from "./meta";
```

## Open questions for the plan stage

1. **Cross-folder import of `video-player-01` for the built-in video handler — allow or refuse?** This is the **biggest architectural decision** for this ship. Options:
   - **(A) Allow the cross-import.** media-carousel-01's built-in video handler renders `<VideoPlayer01 isActive={...} />`. shadcn `registryDependencies: ["video-player-01"]` handles install-time dependency. **Pros:** kasder UX works out of the box; the `isActive` contract is delivered for free. **Cons:** establishes precedent that cross-folder imports are OK within a "system" (social-posts arc); future audits need to draw the line carefully.
   - **(B) Slot-based only.** Carousel handles image items; video items REQUIRE `renderItem` slot. Consumer wires video-player-01. **Pros:** zero cross-folder imports; sealed-folder discipline preserved. **Cons:** consumer boilerplate for the 99% case (post cards, story rails — every social surface needs videos).
   - **(C) Built-in minimal `<video>`.** Carousel ships its own `<video src muted loop playsInline>` for video items (no controls, no double-tap, no proper `isActive`). Consumers wanting full features override via `renderItem`. **Pros:** zero cross-folder imports; works out of the box. **Cons:** degraded video UX vs the just-shipped video-player-01; double maintenance.
   
   **Recommendation: (A) — allow the cross-import for this arc.** The 8 social-posts components are designed as a coherent system; treating them as 8 isolated primitives forces consumer boilerplate that defeats the purpose of shipping them together. Document explicitly in this description + meta.ts as a deliberate exception. Set the rule going forward: **cross-folder imports allowed within a designed system (declared via shadcn `registryDependencies`); not allowed across unrelated domains.** If the user prefers (B), the carousel ships with image-only built-in handler + clear "wire video-player-01 here" docs.

2. **Default `peekRatio` for gallery variant?** kasder hard-codes 7.5% (`first:ml-[7.5%] last:mr-[7.5%]`). Lock at 0.075. Consumers can override (e.g., `0.1` for more peek, `0.05` for tighter slides).

3. **Default `aspect` for linear variant?** `square` matches Instagram. `video` (16:9) for landscape contexts. **Default: `square`** — most flexible for mixed content.

4. **Indicator dots — always shown when `items.length > 1`, or hideable?** Always show by default; provide `showIndicators?: boolean` (default `true`) for consumers wanting cleaner chrome (e.g., a single hero gallery where they want only nav buttons).

5. **Nav buttons — same question.** `showNavButtons?: boolean` default `true`. Touch-only consumers who never expect mouse navigation can hide them.

6. **`isActive` propagation — what happens for image items?** Image items don't care about `isActive`. The `RenderItemContext` still passes it (consumers might use it for custom renderers); built-in image handler ignores it.

7. **Double-tap on image items vs video items — different handling?** Video items: forward to `VideoPlayer01.onDoubleTap`. Image items: carousel attaches `useDoubleTap(onDoubleTap)` to the slide wrapper. Both fire the same `onDoubleTap(item, index)` callback. **Lock: yes, both fire the same callback.**

8. **Imperative handle — what methods?** `scrollTo(index)`, `scrollPrev()`, `scrollNext()`, `getCurrentIndex()`. v0.2 candidates: `getEmblaApi()` (substrate-leak escape hatch — only if real demand).

9. **`onSlideChange` debouncing?** Embla fires `select` event on every drag delta. The component should debounce or fire only on `select` (post-snap). **Lock: fire only on `select` event** (post-snap, not during drag).

10. **`MediaItem` shape — strict or permissive?** Strict: `id` (required) + `type` (required `"image" | "video"`) + `url` (required) + `alt?` + `poster?` (video-only). No extra fields. Custom renderers operate on `unknown` shape — they pass `MediaItem & TCustom` themselves. **Lock: strict.**

## Pre-emptive locks (from analysis review)

- **No framer-motion** — Embla's transitions + Tailwind opacity transitions are sufficient.
- **Embla peer dep** — `embla-carousel-react@^8.x` (already approved).
- **No virtualization** — kasder posts have ≤10 media; Embla handles 10 slides effortlessly. v0.2 candidate if real consumers hit walls.
- **Touch + mouse via Embla's pointer events** — no custom gesture handling needed.
- **`<MediaCarousel01>` is `"use client"`** — owns Embla state, observers, refs.

---

**Awaiting your sign-off before I draft the plan doc.** The **big call to make** is open question #1 — cross-folder import of `video-player-01` (recommendation A: allow). If you redirect to (B) or (C), the entire built-in video handler design changes. Other questions are smaller and can be resolved in plan-stage Q-P locks.
