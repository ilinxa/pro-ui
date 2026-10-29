# media-carousel — consumer guide

> Stage 3: usage notes for hosts. Updated for v0.4.0 (per-slide captions, any `"W:H"` aspect, video labels + locale, the two-item counter / loop fix). v0.3.0: consumer-contract hardening (aspect modes, labels, locale, direction, controlled index, media errors, in-view video pause).
>
> See [description](./media-carousel-procomp-description.md) for what & why; [plan](./media-carousel-procomp-plan.md) for how it's built.

## Visual notes (v0.1.1)

- **Gallery variant** matches kasder's `PostMediaCarousel.tsx` exactly: focused slide centered + sharp; neighbors `scale-95 opacity-60 blur-[1px]` for the canonical Instagram peek-blur effect; soft `from-background to-transparent` gradients on the left + right edges (`w-12` each, `pointer-events-none`, `aria-hidden`) further soften peek edges.
- **Loop bug fix:** edge padding (`first:ml` / `last:mr` peek) is now applied **only when Embla is not looping** (`loop={false}`, or — since 0.4.0 — when Embla drops the loop itself because the slides can't fill it). Under loop, Embla creates clones, and asymmetric padding on the source first/last broke the loop math (you'd hit a stuck state on first→last and last→first wrap). Symmetric-margin slides under loop work correctly across the entire wrap cycle.
- **Embla config simplified.** v0.1's defensive `slidesToScroll: 1` + `skipSnaps: false` overrides were removed — they were interfering with loop defaults. `containScroll: "trimSnaps"` is only set for linear + no-loop now (under loop, Embla force-disables it anyway).
- **No public API changes** — same `MediaCarouselProps` / handle / labels.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/media-carousel
```

This auto-installs `@ilinxa/video-player` (the built-in video item handler) and, since 0.4.0, `@ilinxa/expandable-text` (captions) as registry dependencies — first explicit cross-folder dependency in the pro-ui registry.

**CLI 3.x re-adds:** shadcn CLI 3.8.5 asks to overwrite `parts/slide-caption.tsx` (a file with a rewritten
cross-category import) on every later add that brings media-carousel again — even when it is identical; without a TTY
that question stops the whole add. Re-add with `--overwrite`, or use CLI 4.x (which does not ask).

Optional fixtures (sample image + video sets):

```bash
pnpm dlx shadcn@latest add @ilinxa/media-carousel-fixtures
```

Pulls Embla (`embla-carousel-react` + `embla-carousel`) as NPM peer deps + lucide-react.

## When to reach for it

Anywhere a swipeable horizontal strip of mixed images + videos is needed:

- Post media (Instagram-style cards) — composes inside `post-card` (later ship)
- Product galleries (e-commerce)
- Event photo strips
- News article photo sets
- Real estate listings
- Anywhere "swipeable image+video strip" UX is needed

## Sizing the carousel

The component fills its container width. The slide frame comes from `aspect` (default `"square"`), for both
variants and the single-item shortcut:

```tsx
<div className="max-w-2xl">
  <MediaCarousel items={post.media} variant="gallery" />            {/* square */}
</div>
<MediaCarousel items={photos} variant="linear" aspect="video" />     {/* 16:9 */}
<MediaCarousel items={photos} variant="linear" aspect="portrait" />  {/* 3:4 */}
<MediaCarousel items={photos} variant="linear" aspect="auto" />      {/* the media's own height */}
<MediaCarousel items={post.media} variant="gallery" aspect="4:5" />  {/* any "W:H" (0.4.0): "4:5", "1.91:1" */}
```

A `"W:H"` aspect takes finite positive numbers (the same strings media-editor and carousel-composer use); an invalid
one falls back to square with one development warning.

`aspect="natural-clamped"` uses the first item's own ratio, clamped to `[minRatio, maxRatio]` (width / height;
defaults 4/5 and 1.91 — the usual feed limits): 3:4 → 4:5, 16:9 stays, 3:1 → 1.91:1. Every slide of a gallery uses
that one frame. Give items `width` / `height` so the frame is right on the first paint; without them it is square
until the first image (or video metadata) loads, then changes once.

```tsx
const items = [
  { id: "a", type: "image", url: "/p/a.jpg", width: 1080, height: 1350, srcSet: "/p/a-540.jpg 540w, /p/a.jpg 1080w", sizes: "(min-width: 640px) 600px, 100vw" },
  { id: "b", type: "video", url: "/p/b.mp4", poster: "/p/b.jpg", width: 1920, height: 1080 },
] satisfies MediaItem[];

<MediaCarousel items={items} variant="gallery" aspect="natural-clamped" />
```

## Common recipes

### 1. Minimal usage (gallery)

```tsx
<MediaCarousel items={post.media} variant="gallery" />
```

That's it. Mixed image+video items render via built-in handlers. Videos auto-pause when their slide goes inactive (kasder UX out of the box).

### 2. Linear product gallery

```tsx
<MediaCarousel
  items={product.photos}
  variant="linear"
  aspect="video"
  loop={false}
/>
```

Full-width snap, no peek, no loop. Native pattern for product carousels.

### 3. Single-item shortcut

When `items.length === 1`, the component bypasses Embla entirely — no nav buttons, no indicators, no scale. Just a single slide in an `aspect-square` wrapper. Double-tap still works:

```tsx
<MediaCarousel
  items={[singleImage]}
  variant="gallery"
  onDoubleTap={() => onLike(post.id)}
/>
```

### 4. Custom `renderItem` slot

Replaces both built-in handlers. Receives `(item, { isActive, index })`. Use for HLS streaming, 360° viewers, branded video controls, anything else:

```tsx
<MediaCarousel
  items={items}
  variant="gallery"
  renderItem={(item, { isActive, index }) =>
    item.type === "panorama" ? (
      <PanoramaViewer src={item.url} active={isActive} />
    ) : item.type === "hls-video" ? (
      <HlsPlayer src={item.url} active={isActive} muted />
    ) : null
  }
/>
```

### 5. Imperative ref handle

For programmatic navigation — "jump to media that has the comment user mentioned", "scroll to the photo with the most likes", etc.

```tsx
const carouselRef = useRef<MediaCarouselHandle>(null);

<MediaCarousel ref={carouselRef} items={items} variant="gallery" />

<button onClick={() => carouselRef.current?.scrollTo(2)}>Slide 3</button>
<button onClick={() => carouselRef.current?.scrollPrev()}>Prev</button>
<button onClick={() => carouselRef.current?.scrollNext()}>Next</button>

const idx = carouselRef.current?.getCurrentIndex() ?? 0;
```

The handle's identity is **stable across slide changes** (uses an internal `currentIndexRef`), so host code that watches ref identity won't churn.

### 6. Double-tap-to-like with heart-burst

The `onDoubleTap(item, index)` callback fires for both image and video items uniformly. Compose with `engagement-bar`'s `EngagementHeartBurst` sub-export for the full Instagram UX:

```tsx
import { MediaCarousel } from "@ilinxa/media-carousel";
import { EngagementBar, EngagementHeartBurst } from "@ilinxa/engagement-bar";

const [burstKey, setBurstKey] = useState(0);

<div className="relative">
  <MediaCarousel
    items={post.media}
    variant="gallery"
    onDoubleTap={() => {
      setBurstKey((k) => k + 1);
      onLike(post.id);
    }}
  />
  <EngagementHeartBurst trigger={burstKey} />
</div>
<EngagementBar actions={[{ kind: "like", count: post.likes, /* ... */ }]} />
```

### 7. `onSlideChange` for analytics

Fires only on Embla's `select` event (post-snap, not during drag). **Mount-sync does NOT fire** — first-render is silent so you don't track a phantom "slide 0 viewed" on every page load.

```tsx
<MediaCarousel
  items={post.media}
  variant="gallery"
  onSlideChange={(idx) =>
    analytics.track("post.slide_viewed", { id: post.id, idx })
  }
/>
```

### 8. RTL languages

```tsx
<div dir="rtl" lang="ar">
  <MediaCarousel items={items} variant="gallery" />   {/* direction read from the element after mount */}
</div>

<MediaCarousel items={items} variant="gallery" dir="rtl" />  {/* explicit; also writes dir="rtl" on the region */}
```

One resolved direction drives Embla, the arrow keys (← = next in RTL), the chevrons, the nav-button sides, the edge
peek and the fades. Keys pressed inside a slide's own controls (a video's seek bar, a button, a field) never move the
carousel (since 0.3.1). `rtl` still works as a deprecated alias (`rtl={false}` forces LTR, as in 0.2). The ancestor
direction is read once after mount — pass `dir` if your app switches direction without remounting. An LTR
carousel inside an RTL page needs `dir="ltr"` on the carousel itself: Tailwind's `rtl:` variant matches any
descendant of a `[dir="rtl"]` element, so a `dir="ltr"` wrapper alone still flips the chevrons and fades.

### 9. Localized labels + locale

```tsx
const TR_LABELS = {
  carouselLabel: "Medya galerisi",
  previousSlide: "Önceki",
  nextSlide: "Sonraki",
  goToSlide: (n: number) => `${n}. slayta git`,
  slideAriaLabel: (n: number, total: number) => `Slayt ${n} / ${total}`,
  counter: (n: number, total: number, format: (x: number) => string) => `${format(n)}/${format(total)}`,
  carouselRoleDescription: "galeri",
  slideRoleDescription: "slayt",
} satisfies MediaCarouselLabels;

<MediaCarousel items={items} variant="gallery" labels={TR_LABELS} locale="tr" showCounter />
```

Positions passed to label functions are 1-based. `format` renders a number in `locale` (an invalid tag such as
`"en_US"` falls back to `"en"`). An `undefined` value keeps the default. The 0.2 string forms still work:
`goToSlide: "Slayta git"` (a prefix → "Slayta git 3") and `slideAriaLabel: "Slayt {index} / {total}"`.

**Hoist labels to module scope** — defining inline busts the internal `React.memo`.

### 10. Controlled index

```tsx
const [index, setIndex] = useState(0);

<MediaCarousel items={items} variant="gallery" index={index} onIndexChange={setIndex} />
<Button onClick={() => setIndex((i) => Math.min(i + 1, items.length - 1))}>Next</Button>
```

With `index` set, the prop wins on every render. A swipe, a dot or the handle calls `onIndexChange`; if the
parent does not adopt the new index, the carousel settles back once the swipe ends. `index` without
`onIndexChange` is read-only. Uncontrolled hosts can start elsewhere with `defaultIndex`. `onSlideChange` keeps
firing on every Embla select, as before.

### 11. Expired media URLs

```tsx
<MediaCarousel
  items={post.media}
  variant="gallery"
  onMediaError={async (item) => (await api.refreshMediaUrl(item.id)) ?? undefined}
/>
```

A built-in image or video that fails to load calls `onMediaError(item)` once. A resolved string replaces the URL
and the element retries; if that fails too, it does not ask again. A new `url` for the item resets it. A video
shows its loading state while you refresh, then resumes at the same time and play state (since 0.3.1, with
video-player 0.3.0; it went back to 0 before).

### 12. Video slides

Built-in video slides render `<VideoPlayer>`: the `poster` shows before play, there is no autoplay, only the active
slide can play, and the playing video pauses while less than half of the carousel is in the viewport. A custom
`renderItem` video should play only when `ctx.isActive && ctx.inView`.

Since 0.3.1 (with video-player 0.3.0) a video slide has a seek bar: while indicator dots show, the carousel sets
`--video-player-controls-bottom: 1.75rem` so the player's control row sits above them; dragging the seek bar or
pressing ← / → in it never moves the carousel, and a single tap on a video waits out the double-tap window when
`onDoubleTap` is set.

### 12b. Captions (0.4.0)

```tsx
const items = [
  { id: "a", type: "image", url: "/p/a.jpg", alt: "A harbour at dusk", caption: "Kadıköy, first evening" },
  { id: "b", type: "image", url: "/p/b.jpg", alt: "Two cups of tea" },             // no caption: no space taken
] satisfies MediaItem[];

<MediaCarousel
  items={items}
  variant="gallery"
  captionLines={2}                                   // default 2, then a Show more toggle
  labels={{ captionShowMore: "Devamı", captionShowLess: "Daha az" }}
/>
```

- The caption renders under the media frame, **inside its slide** (outside the aspect box), clamped with
  expandable-text, `dir="auto"`, `captionClassName` on its text. Single-item carousels and `renderItem` slides
  show it too.
- **Screen readers read it once**, with its slide (inactive slides stay hidden and inert). It is not the image's
  `alt` — give `alt` for that; an image without `alt` is decorative (`alt=""`).
- **Height:** the carousel takes the active slide's height (measured), so swiping to an item without a caption
  shrinks it; with any caption in the set, the indicator dots sit below the slides instead of over the media, and
  the nav buttons stay centred on the media frame.

### 12c. Video labels and locale (0.4.0)

`labels.video` (video-player's `VideoPlayerLabels`: play, pause, mute, seek, time text…) and `locale` reach every
built-in video player; a video item's `alt` names its `<video>` (otherwise `labels.video.videoLabel`, default
"Video"). Hoist `labels` to module scope or memoise it — a new `labels.video` object each render re-renders every
player.

### 13. Nav buttons on mouse only, counter, look

```tsx
<MediaCarousel
  items={items}
  variant="gallery"
  showNavButtons="fine-pointer"   // only under (pointer: fine); resolved after mount
  showCounter                     // "2/5" chip inside the active slide's frame, aria-hidden (slides are already named)
  className="[--media-carousel-inactive-blur:0px]"   // the no-blur prototype look
/>
```

Set the CSS variables through `className` or on any wrapper (they inherit):
`--media-carousel-fade` (edge fade colour, default `var(--background)` — set it to `var(--card)` inside a card) and
`--media-carousel-inactive-blur` (default `1px`). Transitions run only under `prefers-reduced-motion: no-preference`.

### 14. Click a neighbour

In the gallery, clicking or tapping a peeking neighbour scrolls to it. Inactive slides stay out of the tab order and
the accessibility tree; a click that ends a drag does not count.

## Upgrading to 0.4.0

Additive except these visible changes:

| 0.3 | 0.4 |
|---|---|
| counter chip positioned on the carousel (over the peeking neighbour with two items) | inside the active slide's frame, moves with it |
| edge peek only when `loop={false}` | whenever Embla is not looping — Embla drops the loop itself when the slides can't fill it (two items in a gallery), and the carousel now follows that |
| Prev / Next clickable at the ends without a loop (did nothing) | `aria-disabled` at the ends (still focusable) |
| slides always 85 % wide in a gallery (`peekRatio` only set the edge peek) | `1 − 2 × peekRatio` (85 % for the default 0.075; clamped to 0–0.45, a non-finite value → 0.075, one development warning) — slide width is an inline `flex-basis` now |
| — | an inner wrapper holds the track, fades, buttons and dots: a `className` that sizes the root (`h-full`) no longer centres the buttons against it |
| every video named "Video" in English | `alt` / `labels.video`, `locale` |

Install `@ilinxa/media-carousel` again (it now also brings `@ilinxa/expandable-text`).

## Upgrading to 0.3.0

| 0.2 | 0.3 |
|---|---|
| `rtl` | `dir="rtl"`, or nothing under an RTL ancestor — `rtl` still works (deprecated) |
| `slideAriaLabel: "Slide {index} of {total}"` | `(n, total) => …` — the string still works (deprecated) |
| `goToSlide: "Go to slide"` (prefix) | `(n) => …` — the string still works (deprecated) |
| `DEFAULT_MEDIA_CAROUSEL_LABELS` | `defaultMediaCarouselLabels` (function forms) — the old export stays |
| `aspect` ignored for `variant="gallery"` and the single item | **applies everywhere** — a gallery passing `aspect` changes its frame; no `aspect` = square, as before |
| single item in a linear carousel was always square | follows `aspect` |
| custom video `renderItem` checked `isActive` | also check `inView` to pause off-screen |
| inactive slides: `inert` on the slide | `inert` on its content, `aria-hidden` on the slide (the slide takes the neighbour click) |

## Anti-patterns

| Don't | Why |
|---|---|
| Add custom fields to `MediaItem` | Strict discriminated union — `(image \| video)` only. Custom shapes go via `renderItem` with TS intersection. |
| Expect `feature-strip` variant | Not implemented (no concrete consumer in current scope). |
| Expect virtualization | kasder posts ≤10 media; `lazyVideoDistance` is not implemented (possible future addition) for larger sets. |
| Expect a fullscreen lightbox on slide-click | Different UX (would be `image-lightbox-01`). |
| Pass inline `labels` / `tracks` objects | Busts `React.memo`. Hoist to module scope. |
| Pass inline Embla options | Hook handles memoization; consumers pass typed props directly. |
| Replace the entire video item via `renderItem` and forget `isActive && inView` | Your custom video will not pause when its slide goes inactive or the post scrolls away. The built-in handler does this for free; custom renderers must wire it. |

## Cross-folder import — the architectural decision

This is the **first explicit cross-folder import** in pro-ui's registry. The built-in video item handler imports `<VideoPlayer>` directly from `media/video-player`.

- **shadcn `registryDependencies: ["video-player"]`** ensures both packages install together.
- **The "no cross-imports" rule has been refined**: cross-folder imports allowed within a designed system (declared via `registryDependencies`); not allowed across unrelated domains.
- For NPM extraction (future), `video-player` becomes a peer-dep of `media-carousel` — same logical dependency, different distribution mechanism.

Sets the precedent for the rest of the social-posts arc: `comment-thread` imports `expandable-text` + `engagement-bar`; `post-card` imports `media-carousel` + `engagement-bar` + `comment-thread` + `expandable-text`.

## Limitations / caveats

- **No virtualization** Rendering 100+ slides will eagerly mount all video elements (~5MB memory each). Possible future addition via `lazyVideoDistance?: number`.
- **No fullscreen lightbox** — that's `image-lightbox-01` territory (not in the social-posts scope).
- **No `feature-strip` variant** — deferred.
- **No auto-advance / slideshow mode** — that's a story-viewer concern.
- **`onSlideChange` mount-sync silent** — `currentIndex` initializes correctly via `useSyncExternalStore`, but the user's callback only fires on real slide changes. Document this if you want to track initial slide views (do it once on mount yourself).
- **Embla-mounted client-only** — SSR renders the slide track DOM but indicators show after hydration. Acceptable; matches kasder.
- **Custom `renderItem` for video items** must wire `isActive && inView` themselves — the pause contract is built into the built-in handler, not free for custom ones.
- **Two items in a gallery with `loop`** — Embla drops the loop after its first measure, so the slides shift once
  (≈ 7.5 %) right after mount.
- **`natural-clamped` without dimensions** changes the frame once, when the first item loads. A custom `renderItem` cannot report a natural size — give items `width` / `height`.

## Composition siblings

- [`expandable-text`](../expandable-text-procomp/) — sibling primitive in the social-posts-system arc; first ship.
- [`video-player`](../video-player-procomp/) — second ship; **direct dependency** for built-in video item handler via cross-folder import.
- [`engagement-bar`](../engagement-bar-procomp/) (next ship) — composes alongside this in `post-card` for the full like/comment/share strip + heart-burst overlay.
- [`post-card`](../post-card-procomp/) (later) — Tier-2 composite combining all primitives.

## Candidates (not scheduled)

- `feature-strip` variant (avatar-row layout for likers / story rail / chip carousels)
- `lazyVideoDistance?: number` (unmount videos > N slides from active for perf)
- Auto-advance / slideshow mode (`autoPlayMs?: number`)
- Thumbnail strip below the main carousel
- `getEmblaApi()` substrate-leak escape hatch (only if real demand)
- Vertical orientation (`orientation: "horizontal" | "vertical"`)
