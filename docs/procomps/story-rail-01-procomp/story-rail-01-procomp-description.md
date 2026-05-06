# story-rail-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `StoriesSection.tsx` + `StoryThumbnail.tsx` (story rail concern only; story viewer concern → [`story-viewer-01`](../story-viewer-01-procomp/), eighth ship).
>
> **Seventh of 8** in the social-posts-system arc — story doublet, part 1. Decoupled from the viewer: clicking a thumbnail fires `onItemClick(item, index)` and host owns the viewer. Once `story-viewer-01` ships, the canonical wiring (post-feed-page Tier-3 composition) plugs both together.
>
> Embla used directly (sealed-folder rule — story-rail's start-aligned + drag-free + small-rectangle config differs structurally from media-carousel-01's centered + snap + large-square gallery; cross-importing would force adapter layers). NOT a cross-folder import.

## Problem

Every social product needs a horizontal stories rail at the top of the feed — Instagram-style portrait thumbnails with a gradient ring (unread) or muted ring (read), avatar + username below, a "+" affordance for the viewer's own "add story" action, edge-fade gradients on the rail's left/right, free-drag horizontal scroll. Built ad-hoc per consumer, this turns into the kasder pattern repeated everywhere with each instance reinventing:

- Gradient-ring vs muted-ring per `hasUnread` (and the ring colors / gradient direction)
- The "Add story" thumbnail with its inline "+" badge
- Embla's drag-free + start-aligned + trimSnaps config
- Edge-fade gradient overlays
- The thumbnail layout: w-20 h-28 portrait + p-0.5 ring wrapper + h-5 w-5 avatar below
- Realtime contract for new stories arriving / stories being viewed
- Username truncation (max-w-14)
- Hover scale on the preview image (group-hover:scale-105)

`story-rail-01` is the answer: a single sealed component that ships kasder's exact thumbnail aesthetic + the Embla rail + edge gradients + a `Subscribe<StoryRailDelta>` realtime contract + `leading?: ReactNode` slot for the "add story" affordance + `<AddStoryThumbnail>` standalone export as the kasder-exact "+" opt-in.

## In scope

### The rail itself

- **`items: StoryRailItem[]` (required)** — the rail's stories. Rendered left-to-right via Embla.
  ```ts
  export interface StoryRailItem {
    id: string;
    /** Display name shown below the thumbnail. */
    username: string;
    /** Small avatar bubble next to the username (h-5 w-5). */
    avatar?: string;
    /** Rectangular preview shown inside the ring (the "story cover"). */
    previewImage: string;
    /** Drives ring visual: gradient (unread) vs muted (read). Default false. */
    hasUnread?: boolean;
    /** Optional — exposed for downstream story-viewer-01 wiring. */
    userId?: string;
  }
  ```

- **Embla rail config (kasder-exact)**: `align: "start"`, `containScroll: "trimSnaps"`, `dragFree: true`. Drag-free means slides scroll without snap (right behavior for thumbnail strips — users skim without committing to a snap point).

- **Edge fade gradients** on left + right, mode-aware so the gradient color matches its container (R-D-1 lock):
  - `framed: true` (default) → `bg-linear-to-r from-card to-transparent`, positioned `left-4 right-4` (inside the Card's `p-4` padding, matches kasder).
  - `framed: false` → `bg-linear-to-r from-background to-transparent`, positioned `left-0 right-0` (flush with container).
  - Both: `w-12`, `pointer-events-none`, `aria-hidden`.

- **Frame** (`framed: true` default) wraps the rail in `<Card className="p-4 relative overflow-hidden">` matching kasder. `framed: false` for embedded use (no card chrome).

### The thumbnail

Layout (kasder-exact, locked):
- Outer `<button>` with `flex flex-col items-center gap-2 shrink-0 group`.
- Ring wrapper: `p-0.5 rounded-2xl transition-all`, `bg-linear-to-br from-accent via-warning to-destructive` when `hasUnread`, `bg-muted` when read.
- Inner image frame: `w-20 h-28 rounded-[14px] overflow-hidden border-2 border-card bg-card`.
- Image: `w-full h-full object-cover group-hover:scale-105 transition-transform duration-300`.
- Below: row with `<Avatar h-5 w-5>` + truncated username (`max-w-14`).

Locked dimensions: `w-20 h-28` (80×112px portrait rectangle, ~4:5.6 ratio matching Instagram). No size knobs in v0.1 — hosts wanting different dimensions use the `renderThumbnail` slot.

### Add-story thumbnail (standalone sub-export + slot)

- **`<AddStoryThumbnail>`** — exported standalone. Kasder-exact: dashed border placeholder + 50%-opacity user avatar + bottom-right `+` badge in primary color. Use as `leading={<AddStoryThumbnail userAvatar={viewer.avatar} onClick={...} />}`.

- **`leading?: ReactNode`** slot on the rail — renders before the items. Hosts pass `<AddStoryThumbnail>` (kasder UX) or any custom React node (e.g., a "Pinned" callout, a "Live now" indicator, a custom CTA).

- Why slot AND standalone: hosts get full flexibility (slot) AND batteries-included (the standalone). Same pattern as engagement-bar-01's `<EngagementHeartBurst>`.

### Realtime subscription

- **`subscribe?: Subscribe<StoryRailDelta>`** — same contract shape as engagement-bar-01 / comment-thread-01 / post-card-01. Identity-stable per host convention.

  ```ts
  export type StoryRailDelta =
    | { kind: "added";   item: StoryRailItem; position?: "start" | "end" }
    | { kind: "removed"; itemId: string }
    | { kind: "viewed";  itemId: string }   // marks hasUnread = false
    | { kind: "updated"; itemId: string; partial: Partial<StoryRailItem> };
  ```

  `position` default = `"start"` (newest stories appear first, matching Instagram).

- **`onSubscribeDelta?: (delta: StoryRailDelta) => void`** — fires for every delta (analytics / cross-component).

- Same `controlledRef` + `onSubscribeDeltaRef` mirror pattern from comment-thread-01 + post-card-01.

### Click handling

- **`onItemClick?: (item: StoryRailItem, index: number) => void`** — primary callback. Host typically opens its own story-viewer (or `<StoryViewer01>` once shipped).

- **`linkComponent?: ElementType` + `getHref?(item): string`** — polymorphic root for navigation-mode (rare; stories are usually modal-overlay). When both provided, the thumbnail wraps in `<linkComponent href={getHref(item)}>` instead of a `<button>`.

### Slots / render-prop escape hatches

- **`renderThumbnail?: (item, isUnread, helpers) => ReactNode`** — full takeover for the thumbnail visual. `helpers` carries `{ index, onClick }`. Use case: themed rings (gradient color per category), animated previews (autoplay video preview), entirely custom shapes.

- **`leading?: ReactNode`** — slot before items (typically `<AddStoryThumbnail>`).

- **`emptyState?: ReactNode`** — when `items.length === 0` AND no realtime is wired AND no `leading` is provided.

### Imperative ref handle

```ts
export interface StoryRail01Handle {
  /** Programmatically scroll to a specific index. */
  scrollTo: (index: number) => void;
  /** Read the current items list (post + realtime deltas applied). */
  getCurrentItems: () => StoryRailItem[];
  /** Replace the items (controlled-mode escape hatch). */
  reset: (next: StoryRailItem[]) => void;
  /** Drive the reducer directly. */
  dispatch: (action: StoryRailLocalAction) => void;
  /** Programmatically mark a story as viewed (sets hasUnread=false). */
  markViewed: (itemId: string) => void;
}
```

### a11y

- Rail root is `<section role="region" aria-label={labels.railLabel}>` (default `"Stories"`).
- Each thumbnail is a `<button aria-label={labels.thumbnailAriaLabel}>` with the username + unread state announced (`{username}, unread story` / `{username}, viewed`).
- Add-story thumbnail's `+` badge has `aria-hidden`; the button itself has `aria-label={labels.addStoryAriaLabel}`.
- Edge gradients are `aria-hidden`.
- Drag-scroll inherits Embla's keyboard arrow-key support.
- Hover scale wrapped in `motion-safe:` so reduced-motion users see static thumbnails.

### i18n labels

- `labels?: StoryRail01Labels` with English defaults:
  ```ts
  export interface StoryRail01Labels {
    railLabel?: string;             // "Stories"
    addStoryLabel?: string;         // "Add story"
    addStoryAriaLabel?: string;     // "Add a story"
    /** Function so hosts can pluralize / localize unread / viewed strings. */
    thumbnailAriaLabel?: (item: StoryRailItem) => string;
    emptyState?: string;            // "No stories yet."
  }
  ```
- `DEFAULT_STORY_RAIL_LABELS` exported.

## Out of scope (v0.2 candidates)

- **Story viewer** — separate ship (`story-viewer-01`, eighth in arc).
- **Per-thumbnail unread-segment rings** (Instagram's multi-ring showing how many items are unread) — solid ring in v0.1; segment count for v0.2.
- **Story expiration timer** (24h auto-disappear) — host owns the expiration logic; passes filtered items.
- **Drag-to-reorder** (admin / curator surfaces) — out of scope.
- **Pinned stories at the start** — host renders via `leading` slot.
- **Story groups / collections** (Highlights) — separate component.
- **Auto-scroll to next-unread on view** — out of scope; host can call `scrollTo(index)` via the imperative handle.

## Target consumers

- **Social feed pages** — primary. Rail at top of feed, paired with `<PostCard01>` cards below.
- **`/sandbox/social-feed-page-01`** — Tier-3 composition (after 8/8 ship).
- **Profile pages** — show that user's stories (single-user rail, less common).
- **Discovery surfaces** — "Stories you might like" widget.
- **Live-events sections** — pair with a custom `leading` slot ("Live now").

## Rough API sketch

Minimal:

```tsx
<StoryRail01 items={stories} onItemClick={(item, i) => openViewer(i)} />
```

Kasder-exact (with add-story leading + viewed-tracking):

```tsx
import { StoryRail01, AddStoryThumbnail } from "@/registry/components/data/story-rail-01";

<StoryRail01
  items={stories}
  leading={
    <AddStoryThumbnail
      userAvatar={viewer.avatar}
      onClick={() => openStoryComposer()}
    />
  }
  onItemClick={(item, index) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  }}
/>
```

With realtime + custom thumbnail render:

```tsx
const subscribe = useCallback<Subscribe<StoryRailDelta>>(
  (h) => channel.on("stories", h),
  [channel],
);

<StoryRail01
  items={stories}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-rail-delta", d)}
  renderThumbnail={(item, isUnread, { onClick }) => (
    <BrandedStoryThumbnail
      item={item}
      isUnread={isUnread}
      onClick={onClick}
    />
  )}
/>
```

Embedded (no card frame):

```tsx
<StoryRail01 items={stories} framed={false} className="px-4" />
```

## Public exports (from `index.ts`)

```ts
export { StoryRail01 } from "./story-rail-01";
export { AddStoryThumbnail } from "./parts/add-story-thumbnail";
export { storyRailReducer, useStoryRailState } from "./hooks/use-story-rail-state";

export type {
  StoryRailItem,
  StoryRail01Props,
  StoryRail01Handle,
  StoryRail01Labels,
  StoryRailDelta,
  StoryRailLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_STORY_RAIL_LABELS } from "./types";

export { meta } from "./meta";
```

## Genuinely-novel architectural call

Per the locked-pattern memory, only one decision is novel enough to surface — the rest are pattern carry-overs from the prior 6 ships:

1. **`StoryRailItem` shape: minimal preview vs full Story (matching the future `story-viewer-01`)?**
   - **(A) Minimal preview** (locked recommendation) — `id` / `username` / `avatar` / `previewImage` / `hasUnread?` / `userId?`. The rail only needs a thumbnail + identity bits. Story-viewer-01 takes the full Story shape (with `items[]` array of inner content) — different concern, different shape.
   - **(B) Full Story** — share the type with story-viewer-01 (cross-import or shared utils path). Tighter coupling but less re-shaping at the host.
   - **Recommendation: (A) minimal preview.** TypeScript structural typing means hosts can pass a `Story` to story-rail-01 if its fields are a superset (no adapters needed). Cross-importing the full Story type would couple two components that have separate concerns. Story-viewer-01's `Story` is a separate type; rail's `StoryRailItem` is just enough for the preview row.

## Pre-emptive locks (silent — committed per locked-pattern memory)

- **Always-uncontrolled** with `reset(next)` + `dispatch(action)` imperative handle (matches comment-thread-01 R-Plan-15 + post-card-01). `items` prop is mount-only initial state.
- **`<StoryRail01>` is `"use client"`** — owns Embla + state.
- **`<AddStoryThumbnail>` is `"use client"`** — owns onClick handler (could be RSC if click moved out, but client is simpler for v0.1).
- **`React.memo` at export + ref-as-prop** (project standard).
- **Embla used directly** (NOT cross-importing media-carousel-01) — sealed-folder rule. story-rail's config (`align: "start"`, `containScroll: "trimSnaps"`, `dragFree: true`) is structurally different from gallery's centered+snap.
- **Realtime contract identical to comment-thread-01 / engagement-bar-01 / post-card-01** — `Subscribe<TDelta>` shape, `controlledRef` + `onSubscribeDeltaRef` mirror pattern, single subscription effect re-runs only on `subscribe` identity change.
- **Edge fade gradients are mode-aware** — `from-card` + `left-4 right-4` when framed; `from-background` + `left-0 right-0` when bare (R-D-1).
- **Embla used inline, no wrapper hook, no indicator dots** (R-D-2). Story rails are skim-scroll, not snap-carousels — `currentIndex` tracking is unnecessary. Direct `useEmblaCarousel(opts)` + `api?.scrollTo(i)` in the imperative handle. ~10 LOC vs porting `useEmblaWithState` from media-carousel-01 (which would also be a sealed-folder violation).
- **No new shadcn primitives** — `avatar` + `card` already installed.
- **Embla peer dep already installed** (media-carousel-01 brought it in).
- **No framer-motion** — CSS `transition-all` for ring color, `transition-transform duration-300` for hover scale; both gated on `motion-safe:`.
- **Thumbnail dimensions locked** to `w-20 h-28` (kasder-exact). No size knob in v0.1; `renderThumbnail` slot is the escape hatch.
- **Tailwind v4 translations applied at write-time:** `bg-gradient-to-X` → `bg-linear-to-X` (kasder source already correct since their codebase migrated).
- **Locked target convention** for `registry.json`: every file `type: "registry:component"`, `target: "components/story-rail-01/<sub>"`. Never ship demo / usage / meta. Fixtures via `-fixtures` sibling.
- **`onItemClick(item, index)` signature** — both args (matches engagement-bar-01 / media-carousel-01 callback shapes).
- **`useId()` per thumbnail** for accessible-name wiring inside `renderThumbnail` slot (helpers carry id).

---

**Stage 1 signed off 2026-05-03.** Q1 (minimal preview shape) + R-D-1 (mode-aware gradients) + R-D-2 (inline Embla, no indicator dots) committed inline above.
