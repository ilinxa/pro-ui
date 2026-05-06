# story-rail-01 — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1 implementation.
>
> See [`story-rail-01-procomp-description.md`](./story-rail-01-procomp-description.md) for what & why,
> and [`story-rail-01-procomp-plan.md`](./story-rail-01-procomp-plan.md) for the implementation contract.

## 30-second mental model

`<StoryRail01>` is a **horizontal stories rail** — kasder-exact thumbnail aesthetic (`w-20 h-28` portrait, gradient ring on unread, muted ring on read, avatar+username row below), Embla used directly for drag-free skim-scroll, mode-aware edge-fade gradients. Decoupled from the viewer: clicking a thumbnail fires `onItemClick(item, index)` and your host owns the viewer.

**Three rules:**

1. **`items` prop is mount-only initial state.** Subsequent prop reference changes are IGNORED. Use `ref.current.reset(next)` to push external updates.
2. **Click does NOT auto-mark-viewed.** Match Instagram — the unread ring stays until the user actually completes the story. Host calls `ref.current.markViewed(itemId)` from their viewer's `onClose`.
3. **Embla is used inline** (no wrapper hook, no cross-import). `align: "start"`, `containScroll: "trimSnaps"`, `dragFree: true` — kasder-exact config.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/story-rail-01
```

Auto-pulls shadcn `avatar`. Embla peer dep is already in the project (shared with media-carousel-01). NO new shadcn primitives required beyond avatar.

For fixtures (sandbox demos):

```bash
pnpm dlx shadcn@latest add @ilinxa/story-rail-01-fixtures
```

## Minimal usage

```tsx
import { StoryRail01 } from "@/registry/components/data/story-rail-01";

<StoryRail01
  items={stories}
  onItemClick={(item, index) => openViewer(index)}
/>
```

That's the whole baseline. Renders 7 thumbnails (or however many you pass), framed in card chrome by default, with edge-fade gradients.

## Kasder UX — with AddStoryThumbnail leading

```tsx
import {
  StoryRail01,
  AddStoryThumbnail,
} from "@/registry/components/data/story-rail-01";

<StoryRail01
  items={stories}
  leading={
    <AddStoryThumbnail
      userAvatar={viewer.avatar}
      onClick={() => openStoryComposer()}
    />
  }
  onItemClick={(item, index) => openViewer(index)}
/>
```

`<AddStoryThumbnail>` is a sealed sub-export — kasder-exact dashed-border placeholder + 50%-opacity user avatar + Plus badge bottom-right. `leading` is a slot, so you can also pass any other React node ("Live now" pill, "Pinned" callout, custom CTA).

## Realtime via subscribe

```tsx
import type {
  Subscribe,
  StoryRailDelta,
} from "@/registry/components/data/story-rail-01";

const subscribe = useCallback<Subscribe<StoryRailDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryRail01
  items={stories}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-rail-delta", d)}
/>
```

The contract:

```ts
type StoryRailDelta =
  | { kind: "added";   item: StoryRailItem; position?: "start" | "end" }
  | { kind: "removed"; itemId: string }
  | { kind: "viewed";  itemId: string }     // sets hasUnread=false
  | { kind: "updated"; itemId: string; partial: Partial<StoryRailItem> };
```

- `position` defaults to `"start"` (newest stories appear first, matching Instagram).
- Hosts must memoize `subscribe` via `useCallback` over a stable channel reference. Identity changes trigger a clean teardown + re-call (same convention as `engagement-bar-01` / `comment-thread-01` / `post-card-01`).
- `onSubscribeDelta` fires for every delta — useful for analytics / cross-component coordination.

## Mark viewed (canonical pattern)

```tsx
const railRef = useRef<StoryRail01Handle>(null);
const [activeIdx, setActiveIdx] = useState(0);
const [open, setOpen] = useState(false);

<StoryRail01
  ref={railRef}
  items={stories}
  onItemClick={(item, index) => {
    setActiveIdx(index);
    setOpen(true);
  }}
/>

<MyStoryViewer
  open={open}
  story={stories[activeIdx]}
  onClose={() => {
    setOpen(false);
    railRef.current?.markViewed(stories[activeIdx].id);
  }}
/>
```

Click does NOT auto-mark-viewed. Host calls `markViewed(itemId)` when their viewer closes. This matches Instagram — the unread ring stays until the user actually completes (or dismisses) the story playback.

## Custom thumbnail render

```tsx
<StoryRail01
  items={stories}
  renderThumbnail={(item, isUnread, { onClick, baseId, index }) => (
    <BrandedStoryThumbnail
      item={item}
      isUnread={isUnread}
      onClick={onClick}
      ariaLabelledBy={baseId}
    />
  )}
/>
```

Use case: themed rings (per-category gradient color), animated previews (autoplay video preview frame), entirely custom shapes. Slot consumers wire their own click handler via `helpers.onClick`.

## Bare (no card frame)

```tsx
<StoryRail01 items={stories} framed={false} className="px-4" />
```

With `framed: false`:
- No card chrome (border + bg-card + rounded-xl + p-4 all dropped).
- Edge gradients use `from-background` + `left-0 right-0` instead of `from-card` + `left-4 right-4` — they blend with whatever container you embed in.
- Use this when the rail sits inside a feed wrapper that already has its own framing.

## Polymorphic linking (rare)

Stories are usually opened in a modal viewer, but if you want a navigation-mode rail (each thumbnail is an `<a>`):

```tsx
import NextLink from "next/link";

<StoryRail01
  items={stories}
  linkComponent={NextLink}
  getHref={(item) => `/stories/${item.id}`}
  onItemClick={(item, index) => analytics.track("story-click", { id: item.id })}
/>
```

When `getHref` is provided, the thumbnail wraps in `<linkComponent href={...}>` instead of `<button>`. `onItemClick` still fires on click (for analytics), and the browser also navigates.

## Imperative handle

```ts
interface StoryRail01Handle {
  scrollTo: (index: number) => void;
  getCurrentItems: () => StoryRailItem[];
  reset: (next: StoryRailItem[]) => void;
  dispatch: (action: StoryRailLocalAction) => void;
  /** Mark a story as viewed (sets hasUnread=false). Call from your viewer's onClose. */
  markViewed: (itemId: string) => void;
}
```

Common patterns:

- **Push external state:** `ref.current?.reset(updatedItems)`.
- **Mark viewed from viewer's onClose:** `ref.current?.markViewed(itemId)`.
- **Surgical update without overwriting the whole list:** `ref.current?.dispatch({ kind: "update", itemId, partial: { username: "newName" } })`.
- **Scroll to a specific index** (e.g., scroll to active story): `ref.current?.scrollTo(index)`.
- **Read current state:** `ref.current?.getCurrentItems()`.

## i18n

```tsx
const TR_LABELS: StoryRail01Labels = {
  railLabel: "Hikayeler",
  addStoryLabel: "Hikaye Ekle",
  addStoryAriaLabel: "Hikaye ekle",
  thumbnailAriaLabel: (item) =>
    `${item.username}, ${item.hasUnread ? "okunmamış hikaye" : "izlendi"}`,
  emptyState: "Henüz hikaye yok.",
};

<StoryRail01 labels={TR_LABELS} {...rest} />
```

`DEFAULT_STORY_RAIL_LABELS` exported for spread + override.

## Accessibility

- Rail root is `<section role="region" aria-label={labels.railLabel}>` (default `"Stories"`).
- Each thumbnail is a `<button aria-label={labels.thumbnailAriaLabel(item)}>` — default returns `"{username}, unread story"` / `"{username}, viewed"`.
- Add-story thumbnail's `+` badge has `aria-hidden`; the button has `aria-label={labels.addStoryAriaLabel}`.
- Edge gradients are `aria-hidden` + `pointer-events-none`.
- Drag-scroll inherits Embla's keyboard arrow-key support.
- Hover scale wrapped in `motion-safe:` so reduced-motion users see static thumbnails.
- `useId()` generates a stable id per thumbnail; passed to `renderThumbnail` slot helpers as `baseId` for hosts wiring their own ARIA.

## What's NOT in v0.1

- **Story viewer** — separate ship (`story-viewer-01`, eighth in arc).
- **Per-thumbnail unread-segment rings** (Instagram's multi-ring showing how many items are unread) — solid ring in v0.1; segment count for v0.2.
- **Story expiration timer** (24h auto-disappear) — host owns the expiration logic; passes filtered items.
- **Drag-to-reorder** (admin / curator surfaces) — out of scope.
- **Pinned stories at the start** — host renders via `leading` slot.
- **Story groups / collections** (Highlights) — separate component.
- **Auto-scroll to next-unread on view** — out of scope; host can call `scrollTo(index)` via the imperative handle.
- **Virtualization** for 500+ stories — out of scope in v0.1; defer until a real consumer hits a wall.
- **Indicator dots** — story rails are skim-scroll, not snap carousels. No "current index" concept.
- **Image error fallback** — `<img>` natively shows alt text on error; v0.2 candidate for a tinted placeholder.

## Composition example: feed top

```tsx
function FeedPage({ stories, posts, viewer }: Props) {
  const railRef = useRef<StoryRail01Handle>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(-1);

  return (
    <div className="flex flex-col gap-4">
      <StoryRail01
        ref={railRef}
        items={stories}
        leading={
          <AddStoryThumbnail
            userAvatar={viewer.avatar}
            onClick={() => openStoryComposer()}
          />
        }
        onItemClick={(_item, index) => setActiveStoryIdx(index)}
      />

      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard01 variant="feed" post={post} currentUser={viewer} />
          </li>
        ))}
      </ul>

      {activeStoryIdx >= 0 ? (
        <MyStoryViewer
          stories={stories}
          initialIndex={activeStoryIdx}
          onClose={() => {
            const id = stories[activeStoryIdx].id;
            setActiveStoryIdx(-1);
            railRef.current?.markViewed(id);
          }}
        />
      ) : null}
    </div>
  );
}
```

When `story-viewer-01` ships (eighth in the arc), the `MyStoryViewer` swap becomes a single import + the `<StoryRailItem>` data feeds into the viewer's `Story` shape via TypeScript's structural typing (rail's preview shape is a strict subset; viewer takes the full Story with `items[]` array of inner content).
