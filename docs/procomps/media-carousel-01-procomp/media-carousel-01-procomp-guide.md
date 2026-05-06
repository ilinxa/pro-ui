# media-carousel-01 — consumer guide

> Stage 3: usage notes for hosts. Updated for v0.1.1 (kasder slide layout + inactive blur + edge gradients + loop-config fix).
>
> See [description](./media-carousel-01-procomp-description.md) for what & why; [plan](./media-carousel-01-procomp-plan.md) for how it's built.

## v0.1.1 visual notes

- **Gallery variant** matches kasder's `PostMediaCarousel.tsx` exactly: focused slide centered + sharp; neighbors `scale-95 opacity-60 blur-[1px]` for the canonical Instagram peek-blur effect; soft `from-background to-transparent` gradients on the left + right edges (`w-12` each, `pointer-events-none`, `aria-hidden`) further soften peek edges.
- **Loop bug fix:** edge padding (`first:ml` / `last:mr` peek) is now applied **only when `loop={false}`**. Under loop, Embla creates clones, and asymmetric padding on the source first/last broke the loop math (you'd hit a stuck state on first→last and last→first wrap). Symmetric-margin slides under loop work correctly across the entire wrap cycle.
- **Embla config simplified.** v0.1's defensive `slidesToScroll: 1` + `skipSnaps: false` overrides were removed — they were interfering with loop defaults. `containScroll: "trimSnaps"` is only set for linear + no-loop now (under loop, Embla force-disables it anyway).
- **No public API changes** — same `MediaCarousel01Props` / handle / labels.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/media-carousel-01
```

This auto-installs `@ilinxa/video-player-01` as a registry dependency (used by the built-in video item handler) — first explicit cross-folder dependency in the pro-ui registry.

Optional fixtures (sample image + video sets):

```bash
pnpm dlx shadcn@latest add @ilinxa/media-carousel-01-fixtures
```

Pulls Embla (`embla-carousel-react` + `embla-carousel`) as NPM peer deps + lucide-react.

## When to reach for it

Anywhere a swipeable horizontal strip of mixed images + videos is needed:

- Post media (Instagram-style cards) — composes inside `post-card-01` (later ship)
- Product galleries (e-commerce)
- Event photo strips
- News article photo sets
- Real estate listings
- Anywhere "swipeable image+video strip" UX is needed

## Sizing the carousel

The component fills its container width naturally. For consistent slide aspect ratios:

```tsx
<div className="max-w-2xl">
  <MediaCarousel01 items={post.media} variant="gallery" />
</div>
```

Gallery variant always renders square slides (`aspect-square`). Linear variant uses `aspect` prop:

```tsx
<MediaCarousel01 items={photos} variant="linear" aspect="video" />
<MediaCarousel01 items={photos} variant="linear" aspect="portrait" />
<MediaCarousel01 items={photos} variant="linear" aspect="auto" />
```

## Common recipes

### 1. Minimal usage (gallery)

```tsx
<MediaCarousel01 items={post.media} variant="gallery" />
```

That's it. Mixed image+video items render via built-in handlers. Videos auto-pause when their slide goes inactive (kasder UX out of the box).

### 2. Linear product gallery

```tsx
<MediaCarousel01
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
<MediaCarousel01
  items={[singleImage]}
  variant="gallery"
  onDoubleTap={() => onLike(post.id)}
/>
```

### 4. Custom `renderItem` slot

Replaces both built-in handlers. Receives `(item, { isActive, index })`. Use for HLS streaming, 360° viewers, branded video controls, anything else:

```tsx
<MediaCarousel01
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
const carouselRef = useRef<MediaCarousel01Handle>(null);

<MediaCarousel01 ref={carouselRef} items={items} variant="gallery" />

<button onClick={() => carouselRef.current?.scrollTo(2)}>Slide 3</button>
<button onClick={() => carouselRef.current?.scrollPrev()}>Prev</button>
<button onClick={() => carouselRef.current?.scrollNext()}>Next</button>

const idx = carouselRef.current?.getCurrentIndex() ?? 0;
```

The handle's identity is **stable across slide changes** (uses an internal `currentIndexRef`), so host code that watches ref identity won't churn.

### 6. Double-tap-to-like with heart-burst

The `onDoubleTap(item, index)` callback fires for both image and video items uniformly. Compose with `engagement-bar-01`'s `EngagementHeartBurst` sub-export for the full Instagram UX:

```tsx
import { MediaCarousel01 } from "@ilinxa/media-carousel-01";
import { EngagementBar01, EngagementHeartBurst } from "@ilinxa/engagement-bar-01";

const [burstKey, setBurstKey] = useState(0);

<div className="relative">
  <MediaCarousel01
    items={post.media}
    variant="gallery"
    onDoubleTap={() => {
      setBurstKey((k) => k + 1);
      onLike(post.id);
    }}
  />
  <EngagementHeartBurst trigger={burstKey} />
</div>
<EngagementBar01 actions={[{ kind: "like", count: post.likes, /* ... */ }]} />
```

### 7. `onSlideChange` for analytics

Fires only on Embla's `select` event (post-snap, not during drag). **Mount-sync does NOT fire** — first-render is silent so you don't track a phantom "slide 0 viewed" on every page load.

```tsx
<MediaCarousel01
  items={post.media}
  variant="gallery"
  onSlideChange={(idx) =>
    analytics.track("post.slide_viewed", { id: post.id, idx })
  }
/>
```

### 8. RTL languages

```tsx
<MediaCarousel01 items={items} variant="gallery" rtl />
```

Embla flips drag direction; chevron icons flip via `rtl:rotate-180`. Indicator dot order reverses naturally.

### 9. Localized labels

```tsx
const TR_LABELS = {
  carouselLabel: "Medya galerisi",
  previousSlide: "Önceki",
  nextSlide: "Sonraki",
  goToSlide: "Slayta git",
  slideAriaLabel: "Slayt {index} / {total}",
} as const;

<MediaCarousel01 items={items} variant="gallery" labels={TR_LABELS} />
```

`{index}` and `{total}` placeholders in `slideAriaLabel` substitute at render time.

**Hoist labels to module scope** — defining inline busts the internal `React.memo`.

## Anti-patterns

| Don't | Why |
|---|---|
| Add custom fields to `MediaItem` | Strict discriminated union — `(image \| video)` only. Custom shapes go via `renderItem` with TS intersection. |
| Expect `feature-strip` variant | Deferred to v0.2 (no concrete consumer in current scope). |
| Expect virtualization | kasder posts ≤10 media; v0.2 candidate (`lazyVideoDistance`) for larger sets. |
| Expect a fullscreen lightbox on slide-click | Different UX (would be `image-lightbox-01`). |
| Pass inline `labels` / `tracks` objects | Busts `React.memo`. Hoist to module scope. |
| Pass inline Embla options | Hook handles memoization; consumers pass typed props directly. |
| Replace the entire video item via `renderItem` and forget `isActive` | Without forwarding `isActive` to your custom video, it won't auto-pause when off-screen. The built-in handler does this for free; custom renderers must wire it. |

## Cross-folder import — the architectural decision

This is the **first explicit cross-folder import** in pro-ui's registry. The built-in video item handler imports `<VideoPlayer01>` directly from `media/video-player-01`.

- **shadcn `registryDependencies: ["video-player-01"]`** ensures both packages install together.
- **The "no cross-imports" rule has been refined**: cross-folder imports allowed within a designed system (declared via `registryDependencies`); not allowed across unrelated domains.
- For NPM extraction (future), `video-player-01` becomes a peer-dep of `media-carousel-01` — same logical dependency, different distribution mechanism.

Sets the precedent for the rest of the social-posts arc: `comment-thread-01` imports `expandable-text-01` + `engagement-bar-01`; `post-card-01` imports `media-carousel-01` + `engagement-bar-01` + `comment-thread-01` + `expandable-text-01`.

## Limitations / caveats

- **No virtualization** in v0.1. Rendering 100+ slides will eagerly mount all video elements (~5MB memory each). v0.2 candidate via `lazyVideoDistance?: number`.
- **No fullscreen lightbox** — that's `image-lightbox-01` territory (not in the social-posts scope).
- **No `feature-strip` variant** — deferred.
- **No auto-advance / slideshow mode** — that's a story-viewer concern.
- **`onSlideChange` mount-sync silent** — `currentIndex` initializes correctly via `useSyncExternalStore`, but the user's callback only fires on real slide changes. Document this if you want to track initial slide views (do it once on mount yourself).
- **Embla-mounted client-only** — SSR renders the slide track DOM but indicators show after hydration. Acceptable; matches kasder.
- **Custom `renderItem` for video items** must wire `isActive` themselves — the auto-pause-on-inactive contract is built into the built-in handler, not free for custom ones.

## Composition siblings

- [`expandable-text-01`](../expandable-text-01-procomp/) — sibling primitive in the social-posts-system arc; first ship.
- [`video-player-01`](../video-player-01-procomp/) — second ship; **direct dependency** for built-in video item handler via cross-folder import.
- [`engagement-bar-01`](../engagement-bar-01-procomp/) (next ship) — composes alongside this in `post-card-01` for the full like/comment/share strip + heart-burst overlay.
- [`post-card-01`](../post-card-01-procomp/) (later) — Tier-2 composite combining all primitives.

## v0.2 candidates

- `feature-strip` variant (avatar-row layout for likers / story rail / chip carousels)
- `lazyVideoDistance?: number` (unmount videos > N slides from active for perf)
- Auto-advance / slideshow mode (`autoPlayMs?: number`)
- Thumbnail strip below the main carousel
- Disabled state for nav buttons at boundaries (when `loop=false`)
- `getEmblaApi()` substrate-leak escape hatch (only if real demand)
- Vertical orientation (`orientation: "horizontal" | "vertical"`)
