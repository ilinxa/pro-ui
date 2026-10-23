# story-rail — consumer guide

> Stage 3: how to use it. Current for **v0.4.0** (2026-10-23).
>
> See [`story-rail-procomp-description.md`](./story-rail-procomp-description.md) for what & why,
> and [`story-rail-procomp-plan.md`](./story-rail-procomp-plan.md) for the implementation contract.

## 30-second mental model

`<StoryRail>` is a **horizontal stories rail**: 80×112 portrait tiles, a gradient ring on unread stories and a grey ring on read or muted ones, and an avatar + username row below. Embla handles the drag-free skim scroll. It is decoupled from the viewer: clicking a tile fires `onItemClick({ item, index })`, and your host owns the viewer.

**Three rules:**

1. **Choose a data mode.** `defaultItems` gives you an uncontrolled rail. `items` + `onItemsChange` makes it controlled: the prop wins every render. `items` on its own is the pre-0.4 read-once path, which still works but warns in development.
2. **Click does NOT auto-mark-viewed.** This matches Instagram: the ring stays until the story is actually watched. Call `ref.current.markViewed(itemId)` from your viewer's `onClose` / `onStoryViewed`.
3. **Theme via tokens.** The ring reads `--story-ring-from` / `--story-ring-to`, and the fade width reads `--story-rail-fade-width`. Your values always win.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/story-rail
```

This pulls in shadcn `avatar`, plus `embla-carousel-react@^8.6.0` and `lucide-react@^1.11.0`. It also adds two `@theme` mappings, but only if they are absent; it never overwrites yours:

```css
--color-story-ring-from: var(--story-ring-from, var(--warning, oklch(0.78 0.16 75)));
--color-story-ring-to: var(--story-ring-to, var(--destructive));
```

Fixtures for sandbox demos: `pnpm dlx shadcn@latest add @ilinxa/story-rail-fixtures`.

## Minimal usage

```tsx
import { StoryRail } from "@/components/story-rail";

<StoryRail
  defaultItems={stories}
  onItemClick={({ item, index }) => openViewer(index)}
/>
```

## With the Add tile

```tsx
import { StoryRail, AddStoryThumbnail } from "@/components/story-rail";

<StoryRail
  defaultItems={stories}
  labels={labels}                       // the Add tile reads these too
  leading={
    <AddStoryThumbnail
      userAvatar={viewer.avatar}
      onClick={() => openStoryComposer()}
    />
  }
  onItemClick={({ index }) => openViewer(index)}
/>
```

`AddStoryThumbnail` is a dashed-border placeholder with the user's avatar at 50% opacity and a plus badge in the bottom inline-end corner. Inside a rail, it takes its visible text and `aria-label` from the rail's `labels.addStoryLabel` / `labels.addStoryAriaLabel` through context. Its own `label` / `ariaLabel` props still win when you pass them. Standalone (outside a rail) it falls back to the English defaults. `leading` is a slot, so any node works there.

## Data modes

### Uncontrolled — `defaultItems`

Read once on mount. `markViewed`, `dispatch`, `reset` and realtime deltas update the rail's own state.

### Controlled — `items` + `onItemsChange`

```tsx
const [stories, setStories] = useState<StoryRailItem[]>(initial);

<StoryRail
  ref={railRef}
  items={stories}
  onItemsChange={setStories}
/>
```

- The `items` prop wins on **every** render, so refetches and live data update the DOM without a remount.
- Every mutation (`markViewed`, `dispatch`, `reset`, realtime deltas from `subscribe`) computes the next list from the latest one and calls `onItemsChange(next)`. The DOM changes only when you pass the new list back.
- Several mutations before your next render build on each other, so a burst of deltas loses nothing.
- To discard a reported change, re-render with a **fresh array** (even one equal to your old list). Until the `items` identity changes, the rail keeps building on the last list it reported.
- Don't switch between controlled and uncontrolled after mount.
- Optimistic rollback does not apply: the rail has no async callbacks of its own.

### Notified uncontrolled — `defaultItems` + `onItemsChange`

The rail keeps its own state and also reports every next list. Use it for persistence or analytics without owning the state.

### Legacy — `items` alone

This is the pre-0.4 behaviour: read once, with later prop changes ignored. It still works, but it logs one development warning per mount. Switch to `defaultItems`, or add `onItemsChange`. (`items` together with `defaultItems` and no `onItemsChange` ignores `items` and warns as well.)

## Previews, fallbacks and expired URLs

```tsx
<StoryRail
  defaultItems={stories}
  onPreviewError={async (item) => {
    const fresh = await api.refreshPreviewUrl(item.id); // signed URL expired
    return fresh ?? undefined;                           // nothing → avatar card
  }}
/>
```

- `previewImage` is **optional**. With no preview (for example, a video before its poster exists), the tile renders an **avatar card**: the author's avatar (initials fallback) centred on `bg-muted` in the same 80×112 tile. No `<img>` with an empty `src` is ever rendered.
- When a preview fails to load, `onPreviewError(item)` is called once. If it resolves a URL, the rail retries with it as a plain `src` (without `previewSrcSet`, which holds the same expired URLs). If it resolves nothing, rejects, or the retry fails too, the tile shows the avatar card. The avatar card also covers the wait.
- You may also write the refreshed URL back onto the item. A URL that `onPreviewError` already returned gets one attempt and no further refresh, so a backend that keeps minting dead URLs cannot cause a loop.
- Any other new `previewImage` value starts over with a fresh retry.
- An item with `previewSrcSet` but no `previewImage` renders the avatar card: `previewImage` is the switch.
- The preview `<img>` gets `loading="lazy"`, `decoding="async"`, `width={80}` and `height={112}`. Set `previewSrcSet` / `previewSizes` on the item for responsive sources. `sizes` defaults to `"80px"` when a srcSet is given.

## Muted authors

```ts
{ id: "s4", username: "noisy", previewImage: "…", hasUnread: true, muted: true }
```

A muted item shows the grey ring even when it is unread, and its tile and name render at reduced opacity. Ordering stays yours. The default accessible name is "{username}, muted"; your `labels.thumbnailAriaLabel(item)` receives the whole item, `muted` included.

## Arrows (desktop)

```tsx
<StoryRail defaultItems={stories} arrows="fine-pointer" />
```

| `arrows` | Renders |
|---|---|
| `"none"` (default) | no arrows. Pointer drag (mouse included) and Tab focus scroll the rail. **There is no mouse-wheel or trackpad-swipe scrolling**, so desktop consumers usually want `"fine-pointer"`. |
| `"fine-pointer"` | only under `(pointer: fine)` (mouse / trackpad), resolved after mount |
| `"always"` | on every pointer type |

- The arrows scroll a page at a time. Each one hides when the rail cannot scroll in its direction.
- Their accessible names come from `labels.previousLabel` / `labels.nextLabel`, and they mirror in RTL.
- Under `prefers-reduced-motion`, they jump instead of animating.
- If a focused arrow disappears (you reached the end), focus moves to the other arrow, or to the first tile when both disappear.
- Tab order: previous arrow, tiles, next arrow.
- They sit centred on the default 112px tile. With a custom `renderThumbnail` or `thumbnailClassName`, set `--story-rail-arrow-top`.

## Right-to-left

```tsx
<div dir="rtl">
  <StoryRail defaultItems={stories} labels={arLabels} />
</div>
// or: <StoryRail dir="rtl" … />
```

The direction comes from the `dir` prop, or else from the nearest `[dir]` ancestor, read after mount. It drives Embla's `direction`: the first tile sits at the right edge, and dragging follows RTL. Fades, arrows and the Add-tile badge use logical positions. If your app switches direction at runtime without remounting, pass `dir`, because ancestor changes are not observed.

## Theming

```css
:root {
  --story-ring-from: oklch(0.80 0.20 132);
  --story-ring-to:   oklch(0.65 0.22 25);
  --story-rail-fade-width: 2rem;   /* default 3rem; the social prototype uses 2rem */
  --story-rail-arrow-top: 3.875rem; /* default: centre of the 112px tile */
}
```

- The unread ring is `bg-linear-to-br from-story-ring-from to-story-ring-to`. Read and muted tiles use `bg-muted`.
- The edge fades use `from-card` when `framed`, and `from-background` when bare.
- The fades are **scroll-aware**: a fade shows only on a side the rail can scroll toward. At rest there is no start fade, so the first tile and its focus ring are never covered.
- Before Embla initialises (the server render, or with JS off), the end fade shows by assumption, so a short rail that doesn't overflow shows it until hydration.

## Realtime via subscribe

```tsx
const subscribe = useCallback<Subscribe<StoryRailDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryRail defaultItems={stories} subscribe={subscribe} onSubscribeDelta={track} />
```

```ts
type StoryRailDelta =
  | { kind: "added";   item: StoryRailItem; position?: "start" | "end" }  // default "start"
  | { kind: "removed"; itemId: string }
  | { kind: "viewed";  itemId: string }                                   // hasUnread=false
  | { kind: "updated"; itemId: string; partial: Partial<StoryRailItem> };
```

`subscribe` must be identity-stable (`useCallback`). A new identity tears down the old subscription and calls the new one. In controlled mode, deltas are reported through `onItemsChange`.

## Mark viewed (canonical pattern)

```tsx
const railRef = useRef<StoryRailHandle>(null);

<StoryRail ref={railRef} defaultItems={stories} onItemClick={({ index }) => open(index)} />

<StoryViewer
  stories={stories}
  initialStoryIndex={active}
  isOpen={active >= 0}
  onClose={() => setActive(-1)}
  onStoryViewed={(id) => railRef.current?.markViewed(id)}
/>
```

## Custom thumbnail render

```tsx
<StoryRail
  defaultItems={stories}
  renderThumbnail={(item, isUnread, { onClick, baseId }) => (
    <BrandedTile item={item} unread={isUnread && !item.muted} onClick={onClick} id={baseId} />
  )}
/>
```

This slot is a full takeover, so it doesn't get the default preview fallback or muted styling: `item.previewImage` may be `undefined`, and you handle it. `isUnread` is the raw `hasUnread`; `helpers.showRing` (`hasUnread && !muted`) tells you whether the default tile would show the gradient ring.

## Bare (no card frame)

```tsx
<StoryRail defaultItems={stories} framed={false} className="px-4" />
```

This drops the card chrome (border, `bg-card`, `rounded-xl`, `p-4`), and the fades blend from `background`.

## Polymorphic linking

```tsx
import NextLink from "next/link";

<StoryRail
  defaultItems={stories}
  linkComponent={NextLink}
  getHref={(item) => `/stories/${item.id}`}
  onItemClick={({ item }) => analytics.track("story-click", { id: item.id })}
/>
```

## Imperative handle

```ts
interface StoryRailHandle {
  scrollTo: (index: number) => void;        // index into items — `leading` is not counted
  getCurrentItems: () => StoryRailItem[];   // controlled: the current prop
  reset: (next: StoryRailItem[]) => void;   // controlled: reported via onItemsChange
  dispatch: (action: StoryRailLocalAction) => void;
  markViewed: (itemId: string) => void;
}
```

## i18n

```tsx
const TR_LABELS: StoryRailLabels = {
  railLabel: "Hikayeler",
  addStoryLabel: "Hikaye ekle",
  addStoryAriaLabel: "Hikaye ekle",
  previousLabel: "Önceki hikayeler",
  nextLabel: "Sonraki hikayeler",
  thumbnailAriaLabel: (item) =>
    item.muted
      ? `${item.username}, sessize alındı`
      : `${item.username}, ${item.hasUnread ? "okunmamış hikaye" : "izlendi"}`,
  emptyState: "Henüz hikaye yok.",
};

<StoryRail labels={TR_LABELS} {...rest} />
```

Partial overrides merge over `DEFAULT_STORY_RAIL_LABELS`, which holds every default, including the thumbnail aria-label function. The rail renders no user-facing string that isn't in `labels`.

## Accessibility

- The root is `<section role="region" aria-label={labels.railLabel}>`.
- Each tile is a `<button>` (or your link component) with `aria-label={labels.thumbnailAriaLabel(item)}` and a `focus-visible` ring. The track has vertical padding, so the ring is never clipped.
- The Add tile is a `<button>` with its own focus ring. The plus badge is `aria-hidden`.
- The preview and avatar images are decorative (`alt=""`). The button's label names the story.
- **Keyboard:** Tab moves through the tiles, and Embla scrolls a focused tile into view (`watchFocus`). Embla itself binds no arrow keys. The optional arrows are ordinary buttons.
- Fades are `aria-hidden` and `pointer-events-none`. Every transition (hover scale, ring, fades, arrows, Add tile) is `motion-safe:`, and arrow scrolling jumps under reduced motion.
- The Add tile's default accessible name ("Add story") contains its visible text (WCAG 2.5.3).
- The server render and the first client render are identical. Pointer type and ancestor direction are read after mount.

## Upgrading from 0.3

| 0.3 | 0.4 |
|---|---|
| `items={x}` (read once) | `defaultItems={x}`, or `items` + `onItemsChange` for controlled. `items` alone still works and warns in development. |
| `previewImage: string` | `previewImage?: string`. `renderThumbnail` readers now get `string \| undefined`. |
| Ring `from-accent via-warning to-destructive` | `from-story-ring-from to-story-ring-to`; set `--story-ring-from` / `--story-ring-to` |
| Fades always on, `w-12` | scroll-aware, `--story-rail-fade-width` (default `3rem`) |
| `ref.scrollTo(i)` landed on item `i-1` with `leading` | targets item `i` |
| `addStoryLabel` / `addStoryAriaLabel` had no effect | wired to the Add tile through context; default aria-label is now "Add story" (was "Add a story") |
| `items` required | optional (`defaultItems` / `items`) |
| `DEFAULT_STORY_RAIL_LABELS` typed `Required<Omit<…, "thumbnailAriaLabel">>` | `ResolvedStoryRailLabels` (= `Required<StoryRailLabels>`) incl. `thumbnailAriaLabel`, `previousLabel`, `nextLabel`. Code that builds a complete labels object must add the two arrow labels. |
| `ThumbnailRenderHelpers` | + `showRing` |
| track without vertical padding | `py-1`: the rail is 8px taller (focus ring no longer clipped) |
| ring `transition-all` | `motion-safe:transition-colors` |

## Not implemented

- Per-tile unread-segment rings (multi-segment Instagram rings).
- Story expiry timers: filter `items` yourself.
- Drag-to-reorder, highlights/collections, auto-scroll to the next unread story (use `scrollTo`), and virtualization for very long rails.
- Indicator dots: a story rail is skim-scroll, not a snap carousel.
