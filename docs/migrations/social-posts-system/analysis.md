# Social Posts System — migration analysis

> Extraction pass for [`docs/migrations/social-posts-system/`](./). Filled by the assistant after reading `original/` and `source-notes.md`. Reviewed and signed off by you before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md). Locked-in decisions (signed off in source-notes review): Embla peer dep ✓, framer-motion peer dep ✓, comment depth default 2, realtime via subscription contract, combined intake covers all 8 files, chat parked.

## Source artifacts read

**Posts** ([`original/posts/`](./original/posts/), 5 files, ~960 LOC):

- `AdvancedPostCard.tsx` (167) — orchestrator: header (avatar / verified / kebab) + content + media + engagement
- `PostContent.tsx` (55) — measure-and-toggle line-clamp text
- `PostMediaCarousel.tsx` (142) — Embla carousel; single-shortcut + multi-image w/ peek-scale + indicators + double-tap
- `PostVideoPlayer.tsx` (128) — `<video>` wrapper, auto-pause on `isActive=false`, auto-hide controls after 2s
- `PostEngagementPanel.tsx` (468) — three concerns merged: action row + likes panel (Embla horizontal strip) + comments panel (flat list, paginated, with input + sticky composer)

**Stories** ([`original/story/`](./original/story/), 4 files, ~524 LOC):

- `StoriesSection.tsx` (157) — horizontal rail (Embla) + viewer trigger + mock data inline
- `StoryThumbnail.tsx` (65) — single thumbnail, `isAddStory` variant, gradient ring on `hasUnread`
- `StoryViewer.tsx` (302) — full-screen modal sequential viewer w/ segmented progress + tap-zones + framer-motion + keyboard nav
- `types.ts` (16) — `Story` / `StoryItem` types

**Cross-references:** kasder uses `embla-carousel-react`, `framer-motion`, `date-fns` (+ `tr` locale), shadcn `avatar` / `card` / `button` / `dropdown-menu` / `input`. No external API client; all engagement is local state with optional callbacks.

## Design DNA to PRESERVE

Distilled from reading the source. These are the visual / behavioral decisions worth keeping verbatim — what makes this feel like a real social product rather than a generic feed shell.

### Media carousel — `gallery` variant (Instagram-post)

| Decision | Specifics |
|---|---|
| Slide width | `flex-[0_0_85%]` with `mx-1` + `first:ml-[7.5%] last:mr-[7.5%]` — neighbors peek 7.5% each side |
| Active vs inactive | Active: `scale-100 opacity-100`. Inactive: `scale-95 opacity-60`. `transition-all duration-300` |
| Aspect | `aspect-square` per slide, `rounded-lg overflow-hidden` |
| Indicator dots | Centered bottom; active dot elongates `w-1.5` → `w-4`, inactive `bg-primary/40 w-1.5` |
| Nav buttons | `absolute left-2 / right-2 top-1/2 -translate-y-1/2`, `h-8 w-8 rounded-full`, `opacity-80 hover:opacity-100` |
| Single-item shortcut | Carousel chrome bypassed entirely — just `aspect-square bg-muted` with the one item |
| Loop | `loop: media.length > 1` |
| Double-tap | `Date.now() - lastTap < 300` window — fires `onDoubleTap` callback |

### Video player

| Decision | Specifics |
|---|---|
| Defaults | `muted=true` initial, `loop`, `playsInline` |
| `isActive` auto-pause | When `isActive=false`, pause + reset `isPlaying`. **Critical for multi-video posts.** |
| Controls auto-hide | After 2s of `isPlaying`, fade controls to `opacity-0`. Reappear on hover/click. |
| Big play button | Center, `h-14 w-14 rounded-full bg-background/80`, only when paused |
| Mute toggle | Bottom-right, `h-8 w-8 rounded-full bg-background/70` |
| Pause indicator | Bottom-left, only when playing + controls shown (small hint) |

### Engagement bar — action row

| Decision | Specifics |
|---|---|
| Layout | `flex items-center justify-between` — actions left cluster, bookmark right cluster |
| Like button | Heart icon flips `text-destructive` + `fill-current scale-110` when liked. Count inline as `text-sm font-medium` |
| Likers expand button | Only renders when `likeCount > 0 && likeUsers.length > 0`. Label flips `Beğenenler` ↔ `Gizle` |
| Comments button | MessageCircle icon + count inline. Active state = `bg-muted` |
| Heart-burst overlay | On double-tap-to-like: `Heart h-24 w-24 text-destructive fill-current animate-ping` centered, 0.6s `animationDuration`, 800ms timeout |
| Bookmark | Outside the left cluster, separate right group. Fill-current when `bookmarked` |

### Likes panel (expanded view)

| Decision | Specifics |
|---|---|
| Container | Embla, `align: "start"`, `containScroll: "trimSnaps"` |
| Per-user card | `flex-[0_0_auto] flex flex-col items-center gap-1 p-2 min-w-[80px]` — vertical avatar + name + @username |
| Avatar | `h-12 w-12` |
| Truncation | name `max-w-[70px] text-center`, username `max-w-[70px] text-[10px]` |
| "More" terminus | When `likeUsers.length < likeCount`: `Button variant="outline" h-12 w-12 rounded-full` showing `+${remaining}` |

### Comments panel

| Decision | Specifics |
|---|---|
| Container | `flex flex-col h-80` (fixed height) — scroll body + sticky composer |
| Body scroll | `flex-1 overflow-y-auto px-4 space-y-4` |
| "Load more" | `Button variant="ghost"` full-width at bottom of list, hidden when `!hasMoreComments` |
| Comment row | Avatar + bubble (`bg-muted/50 rounded-xl px-3 py-2` containing name + @username + body) + meta row (date + Beğen + Yanıtla) + hover-reveal kebab |
| Composer | Bottom border + `Avatar h-8 w-8 shrink-0` + `Input` + send button (`Send` icon, `text-primary` when there's content) |
| Submit | Enter (no shift) → submit. Disabled when blank or `isSubmitting` |
| Empty state | `text-center text-sm text-muted-foreground` "Henüz yorum yok…" |
| Loading | Centered spinner `h-6 w-6 border-b-2 border-primary` |
| Page size | `PAGE_SIZE = 10` constant; `hasMoreComments = commentCount > PAGE_SIZE` |

### Post card — header

| Decision | Specifics |
|---|---|
| Layout | `flex flex-row items-center justify-between p-4 pb-3` |
| Avatar | `Avatar h-10 w-10` w/ `name.substring(0, 2).toUpperCase()` fallback |
| Name + verified | Inline with checkmark SVG (no icon-font dep) |
| Username + timestamp | `text-xs text-muted-foreground` row, separated by ` · ` |
| Kebab menu | `MoreHorizontal h-4 w-4` button → DropdownMenu w/ Bookmark / Share / Copy link / **Separator** / Report (destructive) |

### Story rail

| Decision | Specifics |
|---|---|
| Container | Embla `align: "start", containScroll: "trimSnaps", dragFree: true` |
| Edge fades | `absolute left-4 / right-4` `w-8 bg-linear-to-r from-card to-transparent z-10 pointer-events-none` |
| Add-story leading slot | `border-2 border-dashed border-muted-foreground/30`, 50% opacity user image, Plus badge bottom-right |
| Thumbnail size | `w-20 h-28` (taller than wide — story aspect) — wrapped in `p-0.5 rounded-2xl` ring |
| Unread ring | `bg-linear-to-br from-accent via-warning to-destructive` (gradient). Read: `bg-muted` |
| Inner image radius | `rounded-[14px]` (sits inside the ring's `rounded-2xl`) |
| Hover scale | `group-hover:scale-105 transition-transform duration-300` |
| Username row | Tiny avatar (`h-5 w-5`) + name truncated to `max-w-14` |

### Story viewer

| Decision | Specifics |
|---|---|
| Modal chrome | Mobile: full-screen black; Desktop: `md:w-100 md:h-175 md:rounded-2xl` centered |
| Backdrop | `bg-black/95`, click-outside closes |
| Progress bars | Top, segmented (one per story item), `h-0.5 bg-white/30 rounded-full`, fill `bg-white transition-all duration-100` |
| Item duration | `currentItem.duration ?? 5` seconds |
| Header | Avatar `h-10 w-10 border-2 border-white` + name + time, plus pause / mute / close buttons |
| Tap zones | 3-column 1/3 each: left=prev item, middle=toggle pause, right=next item |
| Desktop nav arrows | `hidden md:flex`, `bg-white/10 hover:bg-white/20 text-white`, `h-12 w-12` |
| Keyboard | ArrowLeft = prev item, ArrowRight = next item, Space = pause, Escape = close |
| In/out animation | framer-motion `initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}` |

### Truncate-and-expand text

| Decision | Specifics |
|---|---|
| Detection | Compare `element.scrollHeight > lineHeight × maxLines` after mount |
| Default | `maxLines = 3` |
| Expand toggle | `text-sm font-medium text-muted-foreground hover:text-foreground` button below text |
| Style | `text-sm leading-relaxed whitespace-pre-wrap break-words` + `WebkitLineClamp` for the line clamp (Safari + cross-browser) |

## Structural debt to REWRITE

Default action: rewrite to match pro-ui conventions. Deviations called out explicitly.

### Decompose the monolithic `PostEngagementPanel`

The 468-line file collapses three independent concerns. Split into:
- **`engagement-bar-01`** — the action row (like / comment / share / bookmark / view-count / custom) as a discriminated-union `actions[]` array. Variants: `default` (icon + count) / `compact` (icon only) / `stacked` (vertical). Heart-burst animation lives here (or moves to a peer `<HeartBurst>` part if reused elsewhere).
- **`comment-thread-01`** — the comments panel + composer + recursive comment rendering with configurable `maxDepth` (default 2).
- **Likers panel** — moves to a slot pattern. Either `engagement-bar-01` exposes a `likersPreview?: ReactNode` slot OR the post card composes a separate `<LikersStrip>` part. Recommendation: **slot in engagement-bar-01** so it's available to other consumers (news cards, event cards) without re-implementation.

The post card consumes all three via slots (per-section optional / overridable per project mandate).

### Comment threading (new — kasder doesn't have it)

`comment-thread-01` is **recursive**: each `Comment` carries `replies?: Comment[]`. The `<CommentNode>` part renders itself + maps over `replies`. Depth tracked by recursion level + capped at `maxDepth` prop (default 2). Past `maxDepth`, replies render flat under the deepest visible comment with a "view N replies →" link that navigates / expands inline (consumer choice).

### Realtime via subscription contract (new architectural pattern)

Per the locked decision: **registry components must NOT ship websocket clients** (would import env-specific code). Instead, each component with live data exposes:

```ts
type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;
type Unsubscribe = () => void;
```

Specifically:
- `engagement-bar-01` accepts `subscribe?: Subscribe<EngagementDelta>` where `EngagementDelta` is a discriminated union: `{ kind: "like-added" | "like-removed", userId?: string } | { kind: "comment-added" | "comment-removed", commentId: string } | { kind: "share-count", value: number } | { kind: "view-count", value: number }`. Component holds its own optimistic local state; deltas patch it on arrival.
- `comment-thread-01` accepts `subscribe?: Subscribe<CommentDelta>` where `CommentDelta` is `{ kind: "added", comment: Comment, parentId?: string } | { kind: "edited", commentId: string, content: string } | { kind: "removed", commentId: string } | { kind: "liked", commentId: string, liked: boolean, count: number }`.
- `post-card-01` doesn't subscribe directly — it forwards `subscribe` props down to engagement-bar + comment-thread. Hosts can also subscribe at the post level for new posts in the feed (handled by feed layout, not the card itself).

The pattern is **call-once**: component invokes `subscribe(handler)` in a mount effect, retains the returned `Unsubscribe`, calls it on unmount or when `subscribe` prop identity changes. Sandbox demo provides a fake `subscribe` that fires synthetic deltas on a `setInterval` for showcase purposes.

This contract mirrors the force-graph live-source-adapter pattern (per existing STATUS.md decision #22 references). No new architectural ground — just applied to a new domain.

### Motion strategy (framer-motion now permitted)

Per the locked decision: framer-motion is approved as a peer dep but used **sparingly**. Heuristic:

| Use CSS (`reveal-up`, `motion-safe:`, Tailwind utilities) for: | Use framer-motion for: |
|---|---|
| Page-level staggered reveals on mount | Drag gestures (e.g., swipe-down to close story viewer) |
| Hover lifts, scale-on-hover, opacity transitions | Spring-based heart burst (kasder's `animate-ping` reads janky at 60fps; framer-motion spring is silkier) |
| Dialog in/out via Radix data attributes | Story viewer modal in/out + segmented progress fill (interpolated, not stepped) |
| Indicator dot active-state morphs | Anything user-driven where intermediate values matter |

`reveal-up` keyframe still wins for the universal "page reveal cascade" mandate. framer-motion enters when there's a real gesture or interpolation requirement.

### Avatar fallback — reuse `getInitials` from people-grid-01

The kasder source repeats `name.substring(0, 2).toUpperCase()` ~10 times across files. people-grid-01 already exports a more robust [`getInitials(name)` helper](../../../src/registry/components/data/people-grid-01/lib/get-initials.ts) (handles honorifics, single-word names, empty strings).

**But the sealed-folder rule prohibits cross-imports between registry components.** Resolution:
- Each consuming sealed folder duplicates the small `getInitials` function in its own `lib/`. ~15 LOC of duplication, but preserves portability.
- Alternative: **promote `getInitials` to `src/lib/text-utils.ts`** (a shared utilities module like `cn`). Pro-ui currently has only `cn()` there. Adding a second utility is a small precedent; worth it for genuine cross-component primitives.
- **Recommendation:** ship duplicated for v0.1 (sealed-folder rule wins), then revisit if a third consumer surfaces. Three is a real signal; two is not.

### Eliminate hardcoded Turkish strings + locale

Every component gets a `labels?: Partial<TLabels>` object with English defaults. Replace `date-fns` + `tr` locale with native `Intl.RelativeTimeFormat` + `Intl.DateTimeFormat` + a `formatRelativeTime?: (date: Date) => string` callback. No `date-fns` peer dep.

### Embla decoupling

Both `PostMediaCarousel` and `PostEngagementPanel` import Embla directly. After decomposition, Embla is centralized in `media-carousel-01` (the only place that owns it). `engagement-bar-01`'s likers preview either:
- Uses `media-carousel-01` `feature-strip` variant internally (clean but cross-folder import — violates sealed-folder rule),
- OR uses raw flex + native scroll for the likers strip (simpler, no Embla dep at this surface, lose the snap behavior).

**Recommendation: native scroll** for the likers strip — it's a small UX downgrade (no snap-to-user) for a meaningful architectural cleanup. If users complain, add Embla as a local dep in v0.2.

### Slot-based video player controls

`video-player-01` exposes `renderControls?: (state: VideoState) => ReactNode` where `VideoState = { isPlaying, isMuted, isActive, togglePlay, toggleMute, currentTime, duration }`. Default control overlay matches kasder's pattern. Consumers can ship a fully custom overlay (e.g., reels-style scrubber + reactions + caption toggle) without forking.

### Story viewer — replace bespoke modal with Radix Dialog

kasder's StoryViewer manages its own backdrop click + focus. Replace with shadcn `Dialog` (Radix) for:
- Free focus trap
- Free portal mount
- Free Escape-to-close
- Free `aria-modal` semantics

framer-motion still handles the in/out animation (overrides Radix's default `data-state` transitions for the scale-and-fade effect).

### Drop kasder's `currentUser` stub fallback

`PostEngagementPanel` quietly falls back to a hardcoded Unsplash avatar + "Kullanıcı" name. Pro-ui equivalent: when `currentUser` is absent, render the composer in a disabled "Sign in to comment" state with `labels.signInToComment` prompt.

### Drop unused `postId` prop

The `postId` parameter on `PostEngagementPanel` is unused inside the body — only acted on through callback closures supplied by the consumer. Drop entirely; consumers wire post-id at the callback level (closure or `bind`).

### Stories types — string ISO dates, not `Date` objects

Posts use ISO strings, stories use `Date`. Standardize on **ISO string** (matches the pro-ui convention from event-card-01 / content-card-news-01). Components convert internally via `new Date(value)`.

## Dependency audit

### NEW peer deps (locked)

- **`embla-carousel-react`** (~25KB, ESM, no peer deps) — used by `media-carousel-01` (3 variants). Approved 2026-05-02.
- **`framer-motion`** (~50KB tree-shaken) — used by `story-viewer-01` (in/out + drag) and `engagement-bar-01` (heart burst spring). Approved 2026-05-02. Heuristic table above governs use.

Both go into `package.json` as direct deps in pro-ui (so demos work) and as peer deps for consumer-side components when shipped.

### NEW shadcn primitives to install

| Primitive | Used by | Notes |
|---|---|---|
| `avatar` | post-card-01 header, comment-thread-01 nodes, story-rail-01 thumbnail, story-viewer-01 header | Already in shadcn New York preset; `pnpm dlx shadcn@latest add avatar`. Surprisingly NOT in pro-ui yet (people-grid-01 uses raw `<div>` + initials). First install. |
| `dialog` | story-viewer-01 | First install. |
| `dropdown-menu` | post-card-01 header (kebab), comment-thread-01 (per-comment kebab) | First install. |

### Existing pro-ui primitives — already installed

`badge`, `button`, `card`, `tabs`, `progress`, `input`, `popover`, `command`, `tooltip`, `skeleton`, `separator`, `scroll-area`, `select`, `switch`, `toggle`, `toggle-group`, `textarea`, `checkbox`, `calendar`, `input-group`, `table`. No new install needed for these.

### Lucide icons — already installed

All required: `Heart`, `MessageCircle`, `Send`, `Share2`, `Bookmark`, `MoreHorizontal`, `ChevronLeft`, `ChevronRight`, `Play`, `Pause`, `Volume2`, `VolumeX`, `X`, `Plus`, `Eye` (for view-count). No new install.

### Drop `date-fns`

Not needed at the registry level. Replace with `Intl.RelativeTimeFormat` + a `formatRelativeTime?` callback prop. The sandbox demo will use the callback to wire whichever locale.

### NO framer-motion peer dep before this decision

Confirmed by [package.json](../../../package.json) — framer-motion is being added net-new for this scope. Worth flagging in the description doc since it changes the project's dep posture (which previously avoided it per page-hero-news-01 STATUS).

## Dynamism gaps

| Source has | New surface |
|---|---|
| Hardcoded `Link` from `next/link` | Per component: `linkComponent?: ElementType` (default `"a"`) |
| Hardcoded routes / no slot for href | Required `href: string` OR `getHref?: (item) => string` callbacks |
| Hardcoded Turkish strings | `labels?: Partial<TLabels>` per component |
| `tr-TR` formatter via date-fns | `formatRelativeTime?` / `formatTime?` callbacks per consumer |
| Optimistic local state only | + optional `subscribe?: Subscribe<TDelta>` for live updates |
| Single layout per file | Variant prop on post-card-01 (`feed` / `compact` / `list` / `detail`); story rail/viewer remain single-shape |
| No actions slot on engagement bar | `actions: EngagementAction[]` discriminated array — every item optional |
| No render-prop slots for video controls | `renderControls?: (state) => ReactNode` on video-player-01 |
| No render-prop slots for comment node | `renderNode?: (comment, depth) => ReactNode` on comment-thread-01 (escape hatch for full takeover) |
| No `currentUser` shape contract | `currentUser?: { id, name, avatar }` typed; absent → disabled composer state |
| No `now` injection for relative times | `now?: Date` (testability + deterministic SSR) — same pattern as event-card-01 / progress-timeline-01 |
| `isAddStory` boolean flag on thumbnail | Replace with composition: `<StoryRail leading={<AddStoryThumbnail ... />} items={...} />` — leading slot, not flag |
| `mockStories` baked into source | Move to `dummy-data.ts` per sealed-folder convention |
| Comment kebab menu hardcoded items | `commentActions?: (comment) => DropdownMenuItem[]` callback |
| Page-size constant `PAGE_SIZE = 10` | `pageSize?: number` (default 10) prop on comment-thread-01 |

## Optimization gaps

| Concern | Plan |
|---|---|
| Post-card re-render on parent re-render | `React.memo` at export boundary (consumers pass stable refs) |
| Comment-thread re-render across all nodes when one updates | Per-node `React.memo` keyed on comment ID + content hash. ~20 LOC trade-off; matters once threads exceed ~50 nodes. v0.1 ships memo'd; revisit if perf data says otherwise. |
| Likers strip with N=10000 likers | Native scroll + virtualization NOT in v0.1 (window of 100 + "+N more" sentinel matches kasder). v0.2 candidate. |
| Story rail with N=500 users | Same — Embla handles 500+ slides fine; only virtualize if real consumer hits a wall. |
| Video lazy mount | Each video stays mounted in the carousel (kasder's pattern); only `play()/pause()` toggle. Memory cost per video ~5MB; acceptable for typical post (≤10 media). v0.2 candidate: unmount videos `> 2` slides away. |
| Heart-burst animation overhead | Inline `animate-ping` is fine; framer-motion spring upgrade is opt-in via `<HeartBurst variant="spring">` prop |
| Comment input controlled + autosize | Use shadcn `Textarea` with `autosize` behavior via `react-textarea-autosize` peer dep? Decision: roll our own ~20-line autosize hook in `comment-thread-01/hooks/use-autosize-textarea.ts`. No new peer dep. |
| Subscription cleanup leak | `useEffect` cleanup pattern: invoke returned `Unsubscribe`. Linted via React `react-hooks/exhaustive-deps`. |

## Accessibility gaps

| Concern | Plan |
|---|---|
| Like-count live updates | `aria-live="polite"` on the count `<span>` so screen readers announce changes |
| Comment-count live updates | Same — `aria-live="polite"` on the count |
| New comment arrival | When `subscribe` delta arrives, optionally fire a screen-reader announcement: `aria-live="polite"` region with `"New comment from {name}"` |
| Double-tap-to-like | Add `Enter` keyboard shortcut on focused media to fire the same action. Document the shortcut in usage. |
| Heart-burst animation | Wrap in `motion-safe:` — reduced-motion users see no burst, just the count change |
| Video controls | All buttons get `aria-label`s from `labels`. Volume button announces current state ("Mute" vs "Unmute"). |
| Story viewer focus trap | Radix Dialog handles for free |
| Story tap-zones | Visible only on touch (no a11y impact). Keyboard nav via arrow keys works in parallel. |
| Story progress bars | `role="progressbar"` + `aria-valuemin/max/now` on each segment |
| Carousel keyboard nav | Embla handles arrow key nav OOB; we add focus-visible rings |
| Comment composer | `<form>` so Enter submits naturally; submit `aria-disabled` when blank |
| Verified checkmark | `aria-label="Verified account"` on the inline SVG; treated as `<img>` for AT |
| RTL | Carousel flips LTR/RTL via Embla `direction: 'rtl'`. Chevron icons get `rtl:rotate-180` |
| Color-only states | Like state has BOTH icon fill change AND color change — color-blind safe |

## Realtime contract — locked design

This is the new architectural piece worth pinning down before any procomp description.

### Subscription shape

```ts
// shared type — defined in each consuming component's types.ts
// (NOT cross-imported — sealed-folder rule)
export type Subscribe<TDelta> = (handler: (delta: TDelta) => void) => () => void;
```

### Per-component delta types

**`engagement-bar-01`**:
```ts
export type EngagementDelta =
  | { kind: "like-changed"; count: number; userId?: string; liked?: boolean }
  | { kind: "comment-count-changed"; count: number }
  | { kind: "share-count-changed"; count: number }
  | { kind: "view-count-changed"; count: number };
```

**`comment-thread-01`**:
```ts
export type CommentDelta =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "edited"; commentId: string; content: string }
  | { kind: "removed"; commentId: string }
  | { kind: "like-changed"; commentId: string; liked: boolean; count: number };
```

**`story-rail-01`** (live story arrival):
```ts
export type StoryRailDelta =
  | { kind: "story-added"; story: StoryRailItem }
  | { kind: "story-removed"; storyId: string }
  | { kind: "story-viewed"; storyId: string };  // updates hasUnread
```

**`post-card-01`**: forwards `subscribe` props down. Doesn't subscribe directly.

**`media-carousel-01`** / **`video-player-01`** / **`expandable-text-01`**: no live data. No subscription surface.

### Lifecycle contract

Component invokes `subscribe(handler)` in a `useEffect` keyed on `[subscribe]`. Calls `Unsubscribe()` on unmount or `subscribe` identity change. Optimistic local state still applies — when consumer's own `onLike` etc. callbacks fire, component updates local state immediately; subscription reconciles when the server confirms (idempotent merges by ID).

### Sandbox demo

Each demo provides a fake `subscribe` that fires synthetic deltas on a `setInterval` (e.g., increment likes every 3s, drop a fake comment every 10s). Showcases the surface without needing a backend. Real consumers wire WebSocket / SSE / polling at the host layer.

## Motion strategy — locked design

Cross-cutting since it changes the project's dep posture.

| Surface | Lib | Rationale |
|---|---|---|
| Page-level reveal cascade | CSS `reveal-up` keyframe | Pro-ui mandate; works great for posts in feed appearing on scroll |
| Carousel slide transitions | Embla + Tailwind transitions | Embla handles |
| Carousel indicator morph | Tailwind `transition-all duration-300` | Simple width/color transition |
| Video controls fade | Tailwind `transition-opacity duration-300` | Already in kasder |
| Hover scales | `motion-safe:hover:scale-105` | Pro-ui mandate |
| Heart-burst on double-tap | framer-motion spring | Spring physics matter; CSS animation looks robotic |
| Comments panel expand | CSS height transition (or Radix Collapsible) | Static height transition is enough |
| Story viewer modal in/out | framer-motion (scale + opacity) | Spring + drag-to-dismiss in v0.2 |
| Story segmented progress fill | CSS transition (linear) | Discrete stepwise progress; CSS interpolation enough |
| Story drag-to-dismiss (v0.2 candidate) | framer-motion `drag="y"` | Real gesture; framer-motion is the right tool |

## Cross-component type sharing — structural compatibility, no shared module

A real architectural concern for this scope. Several types have natural cross-component overlap:

| Type | Used by | Resolution |
|---|---|---|
| `Author` (id / name / username / avatar / verified) | post-card-01 header, comment-thread-01 nodes, engagement-bar-01 likers, story-rail-01 thumbnail, story-viewer-01 header | Each component defines its OWN minimal `*Author` type with the fields it needs. **TypeScript structural typing makes a single host-level `User` type assignable to all of them — no cross-imports needed, no adapters needed in practice.** |
| `Comment` | comment-thread-01 (owns it), post-card-01 (forwards as data) | `comment-thread-01` exports `Comment` from its `index.ts`; post-card-01 declares its own minimal `PostComment` shape. Structurally compatible if fields align. |
| `LikeUser` | engagement-bar-01 (owns it) | engagement-bar-01 owns + exports its `LikeUser`; consumers pass any shape with matching fields. |
| `MediaItem` (id / type / url / poster) | media-carousel-01 (owns it), post-card-01 (forwards), story-viewer-01 (owns its own variant) | post-card-01 forwards `MediaItem[]` from media-carousel-01 directly (it's a slot prop, not a re-export). story-viewer-01 has its own `StoryItem` shape (adds `duration`). |
| `EngagementAction` discriminated union | engagement-bar-01 owns | Consumers (post-card, news card, event card) build the array per-render |
| `Story` / `StoryRailItem` | story-rail-01, story-viewer-01 | Each owns its own. Structurally compatible at the host. |

**The key insight:** the sealed-folder rule is about **runtime portability** (no cross-folder imports), not about **type identity**. TypeScript's structural typing means a host can define ONE canonical `SocialUser`, ONE canonical `Comment`, etc., and pass them to every component without adapter functions — they just satisfy each component's local minimal interface. No friction in practice; the perceived "duplication" is type-level only and costs zero at runtime.

Mitigations / patterns:

- **Sandbox demo demonstrates the pattern:** `social-feed-page-01` defines `SocialUser` / `SocialPost` / `SocialComment` at the host level once; passes them to all 8 components without mapping. Each `usage.tsx` documents this convention so consumers don't think they need adapter boilerplate.
- **Helper kernels (NOT data shapes) eligible for promotion** — `getInitials`, `formatRelativeTime`, etc. can move to `src/lib/text-utils.ts` once 3+ consumers exist. Currently 0 promotions; revisit at end of this scope when we have data on duplication.
- **`Pick<T, K>` helper exports** — each component's types.ts can export `type LikeUserMinimal = Pick<LikeUser, 'id' | 'name' | 'avatar'>` so consumers eyeballing the API see exactly what's required vs. optional. Cosmetic, but reduces the "do I need to define yet another interface?" friction.

## Proposed procomp scope — 8 components

Each is its own sealed folder, its own procomp gate (description → plan → guide), its own ship.

### 1. `expandable-text-01` (data) — first ship

**Smallest, no deps, broad reuse.** Truncate-and-expand text block.

```
src/registry/components/data/expandable-text-01/
├── expandable-text-01.tsx       # core: measure-and-toggle line-clamp
├── parts/                        # likely empty
├── lib/                          # likely empty
├── hooks/
│   └── use-line-clamp-detect.ts  # useEffect + getComputedStyle for measurement
├── types.ts                      # ExpandableText01Props + ExpandableText01Labels
├── dummy-data.ts                 # short + long text samples
├── demo.tsx                      # 4 sub-tabs: default / custom maxLines / Turkish labels / nested in card
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 9 files.** Key surfaces: `value: string`, `maxLines?: number` (default 3), `labels?: { showMore?, showLess? }` (English defaults), `expanded?: boolean` + `defaultExpanded?: boolean` + `onExpandedChange?` (controlled-or-uncontrolled), `className?`. No deps beyond `cn()` + React.

**Reuse:** post body, comment bodies, event description blocks, news excerpts in feeds, sandbox docs developer-guide bullets that are too long.

### 2. `video-player-01` (data) — second ship

**Narrow primitive, useful even if posts deferred.** `<video>` wrapper with optional slot-based controls.

```
src/registry/components/data/video-player-01/
├── video-player-01.tsx
├── parts/
│   ├── default-controls.tsx       # the kasder play/pause/mute overlay
│   └── video-element.tsx          # the raw <video> + ref + state hooks
├── lib/                            # empty
├── hooks/
│   ├── use-video-state.ts          # isPlaying / isMuted / etc. + handlers
│   └── use-double-tap.ts           # 300ms-window double-tap detection (extracted)
├── types.ts                        # VideoPlayer01Props + VideoState + VideoPlayer01Labels
├── dummy-data.ts
├── demo.tsx                        # 5 tabs: default / custom controls / no controls / poster / isActive auto-pause
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 11 files.** Key surfaces: `src` / `poster?` / `isActive?` (default true) / `loop?` (default true) / `muted?` (default true) / `playsInline?` (default true) / `onDoubleTap?` callback / `renderControls?: (state: VideoState) => ReactNode` slot / `controlsAutoHideMs?` (default 2000) / `labels` (play / pause / mute / unmute aria-labels). Exports `useVideoState` + `useDoubleTap` hooks for advanced consumers.

**Reuse:** post media, story viewer, news article inline videos, event recordings, product video previews.

### 3. `media-carousel-01` (data) — third ship

**Embla-based 2-variant carousel.** Composes `video-player-01` for video items.

```
src/registry/components/data/media-carousel-01/
├── media-carousel-01.tsx
├── parts/
│   ├── gallery-variant.tsx         # 85%-width peek-scale (Instagram post)
│   ├── linear-variant.tsx          # full-width snap (galleries)
│   ├── nav-buttons.tsx             # left/right chevrons
│   └── indicator-dots.tsx          # active-elongate dots
├── lib/                             # empty
├── hooks/
│   └── use-embla-with-state.ts      # wraps useEmblaCarousel + tracks currentIndex
├── types.ts                         # MediaCarousel01Props + MediaItem + variant types
├── dummy-data.ts
├── demo.tsx                         # 5 tabs: gallery (mixed) / linear / single-item shortcut / videos w/ auto-pause / custom renderItem
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 12 files.** Key surfaces: `items: MediaItem[]` / `variant: "gallery" | "linear"` (required) / `loop?` (default `items.length > 1`) / `onSlideChange?(index)` / `renderItem?(item, isActive): ReactNode` slot / `onDoubleTap?` callback (forwarded to video-player) / per-variant config (`gallery`: `peekRatio` default 0.075; `linear`: `aspect` default `square`). Includes built-in Image + Video item handlers (Video uses `video-player-01`).

**Reuse:** post media (gallery), product galleries (linear), event photo sets, news article photo sets.

**v0.2 candidate:** `feature-strip` variant (avatar-row) — deferred from v0.1 because no concrete consumer in this 8-component scope (engagement-bar-01's likers-preview is a slot pattern, story-rail-01 uses raw Embla per sealed-folder rule). Add when a third consumer surfaces.

### 4. `engagement-bar-01` (data) — fourth ship

**The highest-leverage primitive.** Discriminated-union actions with realtime. Heart-burst is a sibling sub-export to keep framer-motion tree-shakable for retrofit consumers.

```
src/registry/components/data/engagement-bar-01/
├── engagement-bar-01.tsx
├── parts/
│   ├── like-action.tsx              # Heart + count (no animation here — burst is sibling)
│   ├── comment-action.tsx           # MessageCircle + count
│   ├── share-action.tsx             # Share2 + optional dropdown
│   ├── bookmark-action.tsx          # Bookmark + toggle state
│   ├── view-count-action.tsx        # Eye + count (read-only)
│   ├── custom-action.tsx            # icon + label + onClick (escape hatch)
│   ├── heart-burst.tsx              # framer-motion spring overlay — IMPORTS framer-motion ONLY here
│   └── action-row.tsx               # the flex container that maps the actions[] array
├── lib/                              # empty
├── hooks/
│   └── use-engagement-state.ts       # local state + subscribe wiring
├── types.ts                          # EngagementBar01Props + EngagementAction discriminated union + EngagementDelta + Subscribe + Labels
├── dummy-data.ts
├── demo.tsx                          # 7 tabs: default 4-action / compact / stacked / with-likers-preview / with-share-dropdown / realtime-fake-subscribe / retrofitted into news/event card
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 16 files.** Key surfaces: `actions: EngagementAction[]` / `variant?: "default" | "compact" | "stacked"` (default `default`) / `subscribe?: Subscribe<EngagementDelta>` / `onAction?(actionKind, payload?)` / `currentUser?` (for the like attribution) / `labels`. Plus `engagementReducer` exportable for hosts that want to drive their own state.

**Heart-burst architecture:** the burst overlay anchors over the **media area**, not the action row — it's spatially separate from the like button itself. Resolution: ship `<EngagementHeartBurst trigger={key} />` as a **standalone sibling export** from `engagement-bar-01/index.ts`. The host (post-card-01) positions it absolutely over media-carousel-01 and triggers it via key change when `media.onDoubleTap` fires. The like-action button's own state (count, fill) updates through normal callbacks. Framer-motion is imported ONLY in `parts/heart-burst.tsx` — ESM tree-shaking ensures retrofit consumers (news-card / event-card adding likes) DON'T pay the ~50KB framer-motion cost unless they import the heart-burst sub-export.

**Reuse:** post-card-01 (full kit), content-card-news-01 (drop into `actions` slot — instant social upgrade for the news card; framer-motion-free), event-card-01 (same), comment-thread-01 (per-comment compact mode; framer-motion-free), story-viewer-01 (reactions), product card, photo viewer.

### 5. `comment-thread-01` (data) — fifth ship

**Recursive tree with composer + realtime.** Depends on expandable-text-01 + engagement-bar-01.

```
src/registry/components/data/comment-thread-01/
├── comment-thread-01.tsx
├── parts/
│   ├── comment-node.tsx              # recursive — renders self + maps over replies (depth-aware indentation)
│   ├── comment-composer.tsx          # avatar + autosize textarea + send button
│   ├── view-replies-link.tsx         # "view N replies →" past maxDepth — DEFAULTS to inline-expand
│   └── empty-state.tsx
├── lib/                               # empty
├── hooks/
│   ├── use-autosize-textarea.ts       # ~20 LOC roll-our-own
│   └── use-comment-state.ts           # local state + subscribe wiring + reply-targeting + expanded-depth tracking
├── types.ts                           # Comment + CommentThread01Props + CommentDelta + Subscribe + Labels
├── dummy-data.ts                      # nested comments fixture
├── demo.tsx                           # 6 tabs: flat / nested-depth-2 / nested-depth-3 / paginated / realtime-fake / disabled-composer (no currentUser)
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 14 files.** Key surfaces: `comments: Comment[]` / `currentUser?: { id, name, avatar }` (absent → disabled composer) / `maxDepth?: number` (default 2) / `pageSize?: number` (default 10) / `subscribe?: Subscribe<CommentDelta>` / `onAddComment?(content, parentId?)` / `onLoadMore?(page)` / `commentActions?(comment): DropdownMenuItem[]` / `renderNode?(comment, depth): ReactNode` slot / `renderViewReplies?(parentId, count): ReactNode` slot / `labels`. Plus standalone `<CommentComposer>` exportable for hosts that want it without the thread.

**`view N replies` semantics:** default behavior past `maxDepth` is **inline expand** — the `maxDepth` cap applies only to initial render; clicking "view N replies" expands the next depth level under that node, repeated as needed (no max ceiling on user-driven expansion). Matches Twitter/Instagram convention. Hosts wanting navigate-to-detail-page semantics override via the `renderViewReplies?(parentId, count): ReactNode` slot. `useCommentState` tracks per-node `expandedToDepth: number` map for the inline-expand mode.

**Reuse:** posts, articles, events, product reviews, document comments.

### 6. `post-card-01` (data) — sixth ship

**Tier-2 composite.** Variants + text-only mode. Depends on all 1-5.

```
src/registry/components/data/post-card-01/
├── post-card-01.tsx                   # variant dispatcher (memoized)
├── parts/
│   ├── feed-variant.tsx               # default Instagram-post shape
│   ├── compact-variant.tsx            # sidebar widget (text + small media thumb)
│   ├── list-variant.tsx               # info-rich row (left media + right content)
│   ├── detail-variant.tsx             # full-page (no nesting limits)
│   ├── post-header.tsx                # avatar + name + verified + timestamp + kebab
│   └── verified-badge.tsx             # the inline-SVG checkmark
├── lib/                                # empty
├── hooks/                              # likely empty
├── types.ts                            # Post + PostCard01Props + PostAuthor + variant + PostCard01Labels + PostCard01Subscribe re-export
├── dummy-data.ts                       # 8 mixed posts: text-only / single-image / multi-image / single-video / multi-video / mixed-media / featured / long-text-truncated
├── demo.tsx                            # 8 tabs: feed / compact / list / detail / text-only / multi-media / realtime-fake / retrofitted-with-news-card-link
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 15 files.** Key surfaces: `post: Post` / `variant: "feed" | "compact" | "list" | "detail"` (required) / `currentUser?` / `subscribe?` (forwarded to children) / `linkComponent?: ElementType` / `getHref?(post): string` / `commentActions?` (forwarded) / `kebabActions?(post): DropdownMenuItem[]` / `labels`. Engagement actions array is built inside the card (default like+comment+share+bookmark) but consumers can override via `engagementActions?(post): EngagementAction[]`.

**Text-only mode:** when `post.media` is empty/undefined, the carousel slot collapses entirely; card renders header + content + engagement only (taller content area).

### 7. `story-rail-01` (data) — seventh ship (story doublet, part 1)

```
src/registry/components/data/story-rail-01/
├── story-rail-01.tsx
├── parts/
│   ├── story-thumbnail.tsx             # gradient-ring wrapper + image + name row
│   └── add-story-thumbnail.tsx         # the "Hikaye Ekle" leading slot variant
├── lib/                                 # empty
├── hooks/                               # empty (uses media-carousel-01 internals indirectly... actually NO, sealed-folder — uses raw Embla here)
├── types.ts                             # StoryRailItem + StoryRail01Props + StoryRail01Labels + StoryRailDelta + Subscribe
├── dummy-data.ts                        # 7 mock users
├── demo.tsx                             # 5 tabs: default / with-add-leading / mixed-read-unread / realtime-fake / custom thumbnail render
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 11 files.** Key surfaces: `items: StoryRailItem[]` / `leading?: ReactNode` (the "add story" slot) / `onItemClick?(item, index)` / `subscribe?: Subscribe<StoryRailDelta>` / `linkComponent?: ElementType` / `getHref?(item): string` / `renderThumbnail?(item, isUnread): ReactNode` / `labels`. Uses Embla directly (cleaner than cross-importing media-carousel-01 — sealed-folder rule).

### 8. `story-viewer-01` (data) — eighth ship (story doublet, part 2)

**Full-screen modal viewer.** Depends on video-player-01.

```
src/registry/components/data/story-viewer-01/
├── story-viewer-01.tsx
├── parts/
│   ├── viewer-shell.tsx                 # Radix Dialog wrapper + framer-motion in/out
│   ├── progress-bar-segment.tsx         # one segment of the top progress row
│   ├── viewer-header.tsx                # avatar + name + time + close/pause/mute
│   ├── tap-zones.tsx                    # 3-column 1/3 each (prev / pause / next)
│   └── nav-arrows.tsx                   # desktop side-arrows
├── lib/                                  # empty
├── hooks/
│   ├── use-story-progress.ts             # the timer + segment-fill logic
│   └── use-story-keyboard-nav.ts         # arrow keys + space + escape
├── types.ts                              # Story + StoryItem + StoryViewer01Props + StoryViewer01Labels
├── dummy-data.ts
├── demo.tsx                              # 5 tabs: image-only / video-only / mixed / multi-story-navigation / custom-duration
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 14 files.** Key surfaces: `stories: Story[]` / `initialStoryIndex: number` / `isOpen: boolean` / `onClose: () => void` / `onStoryViewed?(storyId)` / `onItemViewed?(storyId, itemIndex)` / `defaultItemDuration?: number` (default 5s) / `labels`. Uses `video-player-01` for video items. Radix Dialog handles focus trap + portal + escape.

### Total scope summary

| # | Component | Est. files | Cumulative | Notes |
|---|---|---|---|---|
| 1 | expandable-text-01 | 9 | 9 | Smallest |
| 2 | video-player-01 | 11 | 20 | Slot-based controls |
| 3 | media-carousel-01 | 12 | 32 | Embla added; `feature-strip` deferred to v0.2 |
| 4 | engagement-bar-01 | 16 | 48 | Highest leverage; framer-motion isolated to heart-burst sub-export |
| 5 | comment-thread-01 | 14 | 62 | Recursive; inline-expand past maxDepth |
| 6 | post-card-01 | 15 | 77 | Tier-2 composite |
| 7 | story-rail-01 | 11 | 88 | Story doublet |
| 8 | story-viewer-01 | 14 | 102 | Story doublet |

**~102 files across 8 sealed folders** + 1 Tier-3 sandbox (`/sandbox/social-feed-page-01`). Comparable to force-graph (32 files for v0.1 alone) + the news-domain family (88 files across 6 components).

## Recommendation

**PROCEED to procomp description for `expandable-text-01` (Stage 1, component 1 of 8).**

Rationale:
- Smallest shippable unit, no peer deps, no realtime concerns — gets the cadence going without dragging in Embla / framer-motion / subscribe contract complexity on the first ship
- Shipping it first lets `comment-thread-01` (component 5) compose it cleanly when its turn comes
- Establishes the labels-object + controlled-or-uncontrolled patterns at the smallest possible scale for this scope (precedent for the more complex components)

I'll draft `expandable-text-01-procomp-description.md` next, paused for your sign-off before any plan doc.

The 8-component arc is **a 2-3 week ship at a focused cadence** (1 per 2-3 days for the small primitives, 4-5 days for engagement-bar / comment-thread / post-card). Realistic — same posture as the news-domain family (6 components in ~5 days actual) and the event-detail extraction (5 components in ~3 days).

---

## Open items the descriptions / plans should resolve

These didn't need a decision before analysis but will surface during description / plan authoring. Flagging here so we don't lose them:

1. **`getInitials` promotion** — defer until 3rd consumer. Currently 2 (people-grid-01 + the 5 components in this scope that need avatars). Decision: **duplicate locally for now**; revisit after this scope.
2. **Likers preview surface** — slot in engagement-bar-01 (`likersPreview?: ReactNode`) vs. baked-in horizontal strip. Recommendation: **slot.** Hosts wire their own — defaults to a small avatar-pile via dummy-data in the demo.
3. **Comment composer textarea autosize** — roll-our-own hook (~20 LOC) vs. `react-textarea-autosize` peer dep. Recommendation: **roll-our-own** (consistent with other small primitives this project owns).
4. **Story drag-to-dismiss gesture** — defer to v0.2 of story-viewer-01. v0.1 ships with click-outside + Escape only.
5. **Comment edit support** — kasder doesn't have it. Add as v0.2 candidate; v0.1 ships add + delete (via kebab) + like only.
6. **Comment notifications / @mentions** — out of scope (host-level concern; not a UI primitive).
7. **Post share dropdown content** — share-action's dropdown uses share-bar-01 internally? Cross-component import — **NO.** Instead, share-action's dropdown is an empty slot (`shareActions?: ReactNode`); consumer drops in `<ShareBar01 />` themselves at the host level if they want the full sharing UX.
8. **Bookmark persistence** — local state only (kasder posture). Optional `bookmarked?` prop for controlled mode.
9. **Post detail-page route** — out of scope. Sandbox-only Tier-3 covers the assembled-page demo.
10. **Embla RTL flip** — Embla supports `direction: 'rtl'` natively. Pass-through via prop on media-carousel-01 + story-rail-01.
11. **Video poster-frame strategy** — accept `poster` prop as-is from kasder. No internal poster generation. v0.2 candidate.
12. **Heart-burst color customization** — fixed `text-destructive` for v0.1. v0.2 candidate: `heartBurstColor?` for branded reactions.
