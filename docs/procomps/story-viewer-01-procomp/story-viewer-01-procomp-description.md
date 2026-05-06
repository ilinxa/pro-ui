# story-viewer-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `StoryViewer.tsx` + `types.ts` (story viewer concern only; story rail concern → [`story-rail-01`](../story-rail-01-procomp/), seventh ship).
>
> **Eighth (and final) ship** in the social-posts-system arc — story doublet, part 2. Closes the arc. After this ships, `/sandbox/social-feed-page-01` Tier-3 composition wires all 8 components into one assembled feed page.
>
> Decoupled from the rail. The rail fires `onItemClick(item, index)`; host opens `<StoryViewer01 isOpen stories={...} initialStoryIndex={index} onClose={...} />`. Viewer's `onStoryViewed(storyId)` is what hosts wire back into `railRef.current.markViewed(storyId)` to clear the unread ring. Viewer doesn't know the rail exists — pure modal primitive.

## Problem

Every social product needs a full-screen story viewer — Instagram-style modal with:
- Segmented progress bars (one per item in the current story, fills left→right at item duration)
- Auto-advance on item completion (image: 5s default; video: actual duration)
- Multi-story navigation (← → arrows on desktop; auto-flow at end of last item)
- Tap zones (left third = prev item, middle = pause, right = next item)
- Keyboard nav (← prev item, → next item, Space = pause toggle, Escape = close)
- Header with avatar + name + relative time + pause / mute / close buttons
- Mobile-fullscreen / desktop-centered-modal with portrait aspect (kasder: `md:w-100 md:h-175 md:rounded-2xl`)
- Backdrop click to close
- Image and video item support (video uses kasder's auto-pause/auto-play coordination)

Built ad-hoc, this is ~300 LOC per consumer with subtle bugs in:
- Progress timer cleanup across story / item / pause changes
- Reset-on-open bug (initialStoryIndex changes mid-mount)
- Video element coordination (current item only — others pause)
- Focus trap / portal / Escape that every modal forgets
- Keyboard handlers leaked to window without proper cleanup
- Per-item duration vs. per-story duration confusion

`story-viewer-01` is the answer: a single sealed component that ships kasder's exact viewer aesthetic + Radix Dialog (focus trap + portal + Escape free) + CSS-only modal animations + a `Subscribe<StoryViewerDelta>` realtime contract for live items being appended mid-view + `video-player-01` composed for video items + `useStoryProgress` + `useStoryKeyboardNav` exportable hooks for advanced consumers.

## In scope

### The viewer modal

- **`stories: Story[]` (required)** — full story list; viewer navigates across them.

  ```ts
  export interface StoryItem {
    id: string;
    type: "image" | "video";
    src: string;
    /** Seconds. Default 5 for image. For video, viewer reads actual duration once loaded. */
    duration?: number;
  }

  export interface Story {
    id: string;
    /** Stable user id — useful for grouping / cross-rail wiring. */
    userId: string;
    username: string;
    avatar?: string;
    items: StoryItem[];
    hasUnread?: boolean;
    /** ISO date string (matches pro-ui convention from event-card-01 / content-card-news-01). */
    createdAt: string;
  }
  ```

  Note: kasder used `Date` objects + `tr-TR` locale formatting inline. Pro-ui standardizes on **ISO string** + a `formatTime?(date: Date) => string` callback (default: `Intl.DateTimeFormat` with `hour`/`minute`).

- **`initialStoryIndex: number` (required)** — which story to open. Item index always starts at 0 within that story.

- **`isOpen: boolean` (required)** — wired into Radix Dialog as `open`. Modal is fully controlled (open state lives on the host — there is no "self-opening" mode). Matches the kasder pattern + the post-card-01 convention for activePanel state on the host.

- **`onClose: () => void` (required)** — wired into Radix Dialog as `onOpenChange={(open) => !open && onClose()}` so Radix's Escape + backdrop-click both funnel through one host callback. Also fires on the close-button click, on auto-close after the last item of the last story completes, and right after `onAutoCloseAtEnd` (R-D-Q3).

### Modal chrome

- **Mobile (default)** — full-screen black backdrop + content inset-0.
- **Desktop (`md:`)** — black backdrop, centered content `md:w-100 md:h-175 md:rounded-2xl overflow-hidden bg-black`. Kasder-exact dimensions (400×700px portrait).
- **Backdrop** — `bg-black/95`, click closes.
- **Content** — `e.stopPropagation()` so clicks inside don't bubble to backdrop.

### Radix Dialog (locked)

Uses shadcn `dialog` primitive (Radix `@radix-ui/react-dialog`). Drops the bespoke modal logic from kasder. Wins:
- Free focus trap (focus stays inside viewer until Escape / close)
- Free portal mount (renders at body level)
- Free `aria-modal` semantics
- Free Escape-to-close (deduplicated with our keyboard nav handler)
- Free backdrop click

We **override** Radix's default `data-state` transitions to use kasder's scale-and-fade in/out — pure CSS via Tailwind (`data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-300`). NO framer-motion in v0.1.

### Motion strategy lock — CSS-only for v0.1

Per the project's locked motion substrate decision, `framer-motion` is NOT a peer dep yet. The adoption gate is **swipe-to-dismiss** (drag-y gesture) — that's a v0.2 candidate per the migration analysis (open item #4). v0.1 ships:
- Modal in/out: Tailwind `data-state` animations on Radix attrs
- Progress bar fill: CSS `transition-[width] duration-100 linear`
- Heart-burst on double-tap: NOT in v0.1 (story viewer doesn't have like-on-media in kasder; the like is a host-level reaction surface deferred to v0.2)
- Reduced-motion: Tailwind handles via `motion-safe:` prefixes; modal in/out fades only when `prefers-reduced-motion: reduce`

When swipe-to-dismiss lands in v0.2, framer-motion enters the project — the `viewer-shell.tsx` part is the seam.

### Segmented progress bars

- One segment per item in the current story.
- Per-segment widths: items before current = `100%`, current = `${progress}%`, after = `0%`.
- Segment chrome: `flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden` with inner `bg-white transition-[width] duration-100 linear`.
- Container: `absolute top-0 left-0 right-0 z-20 flex gap-1 p-2`.
- Progress timer: `setInterval(50ms)` ticks against an `accumulatedMs` accumulator (NOT a naive `startTime` recompute). On pause: snapshot `now - startTime` into `accumulatedMs` and clear the interval. On resume: `startTime = now` and restart; progress reads `(now - startTime + accumulatedMs) / itemDuration`. Lets users pause for arbitrary durations without losing playback position. Kasder's naive `Date.now() - startTime` re-anchors on every effect run, which silently advanced ~50ms per pause/resume cycle.
- For video items, duration resolution priority: `currentItem.duration` (explicit) → `videoMetadataDuration` (from video-player-01's `onLoadedMetadata` callback) → `5s` fallback. Image items: `currentItem.duration ?? 5`. Custom items via `renderItem` slot: hosts MUST set `item.duration` explicitly (no metadata source). Avoids the kasder bug where 30s videos auto-advanced at 5s because the fallback fired before metadata loaded.
- ARIA: `role="progressbar"` + `aria-valuemin="0"` + `aria-valuemax="100"` + `aria-valuenow={progress}` per segment. Screen-readers announce.

### Header

- **Layout**: `absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2`.
- **Left cluster**: `<Avatar h-10 w-10 border-2 border-white>` + `<div>` containing username (`text-white font-semibold text-sm`) + relative time (`text-white/60 text-xs`).
- **Right cluster**:
  - Pause/play toggle (`Pause` ↔ `Play` icon, `h-8 w-8 text-white hover:bg-white/20`).
  - Mute toggle — **conditional** on `currentItem.type === "video"` (don't show for image items). `Volume2` ↔ `VolumeX` icon, same chrome.
  - Close button (`X h-5 w-5`).
- All icon-buttons get `aria-label`s from `labels` prop (English defaults, override-friendly).

### Tap zones (mobile-style, work everywhere)

`absolute inset-0 z-10 flex` with three `w-1/3 h-full cursor-pointer` divs:
- **Left third** → `goToPrevItem` (item-level — wraps to previous story's last item if at item 0).
- **Middle third** → `togglePause`.
- **Right third** → `goToNextItem` (item-level — wraps to next story's first item if at last item).

Tap zones live BELOW the header (`z-10` vs header's `z-20`) so the close button + pause toggle remain clickable. Each handler calls `e.stopPropagation()` to prevent the backdrop click handler from firing.

### Desktop nav arrows (story-level navigation)

Hidden on mobile (`hidden md:flex`); shown desktop. Distinct from tap zones — these jump **whole stories**, not items:
- **Left arrow** → `goToPrevStory` (jumps to previous story, item 0). Disabled when `currentStoryIndex === 0`.
- **Right arrow** → `goToNextStory` (jumps to next story, item 0). Auto-closes when at last story.

Chrome: `absolute left-4 / right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white`.

### Keyboard navigation

Listener attached to `window` while `isOpen`:
- **ArrowLeft** → `goToPrevItem`
- **ArrowRight** → `goToNextItem`
- **Space** → `togglePause` (with `e.preventDefault()` to stop page scroll)
- **Escape** → `onClose` (deduplicated with Radix Dialog's own Escape handling — `event.preventDefault()` to avoid double-fire)

Cleanup on unmount or `isOpen` flip false.

### Item rendering

Viewer renders ONE item at a time (state-driven `currentItem`); no off-screen items mounted. So coordination with video-player-01 reduces to "active item, pause-aware":

- **Image** — `<img src={currentItem.src} alt={...} className="w-full h-full object-cover">`. The `alt` text comes from `labels.itemImageAlt(currentStory, itemIndex, totalItems)` — defaults to `${story.username}, story image ${itemIndex + 1} of ${total}`.
- **Video** — `<VideoPlayer01>` from `media/video-player-01`:
  - `src={currentItem.src}`
  - `isActive={!isPaused}` (single-item-at-a-time render; the active video is the only video; `isPaused` pauses it via video-player-01's `isActive` auto-pause)
  - `muted={isMuted}` (controlled from viewer's mute toggle — kasder pattern)
  - `controls={false}` (viewer chrome owns the controls; video plays bare)
  - `loop={false}` (kasder pattern — single playthrough then auto-advance)
  - `autoPlay` (browsers allow it because `muted` defaults true)
  - `onLoadedMetadata={(duration) => setVideoDuration(duration)}` — feeds the progress timer
  - `onEnded={goToNextItem}` — alternative completion signal (some browsers fire `ended` before progress hits 100%; coalesce via single-fire guard)
  - `objectFit="cover"`

### Realtime subscription (locked arc convention)

- **`subscribe?: Subscribe<StoryViewerDelta>`** — same contract shape as engagement-bar-01 / comment-thread-01 / post-card-01 / story-rail-01. Hosts must memoize `subscribe` via `useCallback` over a stable channel reference; identity changes trigger clean teardown + re-call (locked precedent). Subscription lifecycle is **mount-scoped** (not `isOpen`-scoped) — runs from mount to unmount; hosts wanting to scope to "only while open" pass `isOpen ? subscribe : undefined`.

  ```ts
  export type StoryViewerDelta =
    | { kind: "story-added"; story: Story; position?: "start" | "end" }
    | { kind: "story-removed"; storyId: string }
    | { kind: "item-added"; storyId: string; item: StoryItem; position?: "start" | "end" }
    | { kind: "item-removed"; storyId: string; itemId: string }
    | { kind: "story-viewed"; storyId: string };  // sets hasUnread=false on that story
  ```

  Reasonable use: a friend posts a new story-item while you're already viewing — the segmented progress bar grows by one segment without losing playback position. Live ingestion of new stories at the tail (someone you follow just posted) — viewer doesn't auto-jump but new stories become navigable via right-arrow.

  **Cursor stability:** internal cursor is tracked by `(currentStoryId, currentItemId)` — NOT by index — so `position: "start"` story insertions don't bump the cursor onto a different story. Default `position` is `"end"` (preserves the natural append order; safest for cursor expectation), but `"start"` works correctly for hosts wanting Instagram chronology because the ID-based cursor anchors through the shift.

- **`onSubscribeDelta?: (delta: StoryViewerDelta) => void`** — callback fires for every delta. Hosts can wire analytics / cross-component coordination (e.g., the `story-rail-01` peer also sees the same `story-added` delta and grows its rail in lockstep — accomplished by sharing one `subscribe` upstream).

### Imperative handle (escape hatch)

```ts
export interface StoryViewer01Handle {
  /** Jump to a specific story by index (item resets to 0). */
  goToStory: (index: number) => void;
  /** Jump to a specific item within the current story. */
  goToItem: (index: number) => void;
  /** Force pause/resume from outside (matches the in-component pause state). */
  setPaused: (paused: boolean) => void;
  /** Get current navigation cursor — useful for hosts wanting to sync external state. */
  getCursor: () => { storyIndex: number; itemIndex: number };
  /** Read current items snapshot (post-realtime patches). */
  getCurrentStories: () => Story[];
  /** Re-seed external state push (matches the always-uncontrolled lock from comment-thread-01 / post-card-01 / story-rail-01). */
  reset: (next: Story[]) => void;
  /** Surgical tree edit (analog of story-rail-01's dispatch). */
  dispatch: (action: StoryViewerLocalAction) => void;
}
```

```ts
export type StoryViewerLocalAction =
  | { kind: "add-story"; story: Story; position?: "start" | "end" }
  | { kind: "remove-story"; storyId: string }
  | { kind: "add-item"; storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "remove-item"; storyId: string; itemId: string }
  | { kind: "patch-story"; storyId: string; partial: Partial<Story> };
```

Mirrors the locked always-uncontrolled pattern: `stories` prop is mount-only initial state; subsequent prop reference changes IGNORED. Hosts push updates via `ref.current.reset(next)` or surgical `dispatch(action)`.

### Cursor reset semantics

Cursor (`currentStoryIndex`, `currentItemIndex`) resets to `(initialStoryIndex, 0)` whenever the **`(initialStoryIndex, isOpen)` pair** changes. So:
- Opening with a different `initialStoryIndex` re-seeds.
- Re-opening (`isOpen` false → true) with the same `initialStoryIndex` also re-seeds back to item 0.
- Mid-view, in-component navigation (tap zones, arrows, keyboard) is preserved across renders unless the host changes `initialStoryIndex` or toggles `isOpen`.

Matches kasder's behavior — confirmed against the source.

### Lifecycle callbacks

- **`onStoryViewed?(storyId)`** — fires on **forward completion** only (last item naturally completes OR user advances forward into the next story OR auto-closes at end of list). Does NOT fire on backward navigation (user pressing left arrow into a previous story doesn't mark it viewed — matches Instagram convention; you don't mark something viewed by going back to it). The host wires this to `railRef.current.markViewed(storyId)` to clear the rail's unread ring.
- **`onItemViewed?(storyId, itemId, itemIndex)`** — fires per-item completion. Useful for analytics, view-count incrementing, etc.
- **`onCursorChange?(storyIndex, itemIndex)`** — fires whenever the viewer's cursor moves (manual nav or auto-advance). Matches story-viewer convention from major social platforms.

### Composer hook exports (for advanced consumers)

Export `useStoryProgress` (the timer + cursor logic) and `useStoryKeyboardNav` (the keyboard handlers). Hosts wanting to ship a fully custom viewer shell (e.g., bottom-sheet variant, side-by-side viewer) reuse the logic without forking the visual layer. Same convention as `engagement-bar-01`'s `useEngagementState` + `comment-thread-01`'s `useCommentState` + `story-rail-01`'s `useStoryRailState`.

### `renderItem?` slot (last-mile customization)

```ts
renderItem?: (
  item: StoryItem,
  context: { storyIndex: number; itemIndex: number; isPaused: boolean; isMuted: boolean }
) => ReactNode;
```

Host returns custom JSX for the item content (e.g., a Lottie animation item-type, an interactive poll, a sponsored ad item). Default branches on `item.type` ("image" → `<img>`, "video" → `<VideoPlayer01>`).

### i18n labels

```ts
export interface StoryViewer01Labels {
  /** aria-label for the modal. Default: "Story viewer". */
  viewerLabel?: string;
  /** aria-label for play button (when paused). Default: "Play". */
  play?: string;
  /** aria-label for pause button (when playing). Default: "Pause". */
  pause?: string;
  /** aria-label for mute button. Default: "Mute". */
  mute?: string;
  /** aria-label for unmute button. Default: "Unmute". */
  unmute?: string;
  /** aria-label for close button. Default: "Close". */
  close?: string;
  /** aria-label for previous-story arrow. Default: "Previous story". */
  prevStory?: string;
  /** aria-label for next-story arrow. Default: "Next story". */
  nextStory?: string;
  /** Format the relative time in the header. Default: `Intl.DateTimeFormat` with hour/minute. */
  formatTime?: (date: Date) => string;
  /** Default alt text for image items. */
  itemImageAlt?: (story: Story, itemIndex: number, totalItems: number) => string;
}
```

`DEFAULT_STORY_VIEWER_LABELS` exported for spread + override.

## Out of scope (v0.2 candidates / explicit non-goals)

- **Swipe-to-dismiss** (drag-y to close) — the framer-motion adoption gate. v0.2.
- **Story reactions / reply input** — a viewer surface, but kasder doesn't ship it. v0.2 surface (would compose with `engagement-bar-01` reaction action + `comment-thread-01` composer). Track as v0.2 candidate after the arc closes.
- **Heart-burst on double-tap** — kasder's viewer doesn't have like-on-media. Add when reactions land in v0.2.
- **Polls / quizzes / question stickers** — host-level overlay; not a viewer concern. Out of scope.
- **Story expiration timer** (24h auto-disappear) — host owns expiration; passes filtered stories. Same lock as story-rail-01.
- **Story groups / Highlights** — separate composite. Out of scope.
- **Auto-advance to next user's story past last story** — closes instead (kasder pattern). v0.2 candidate: `onAutoCloseAtEnd?` callback so hosts can choose.
- **Save / download / share buttons** — viewer header has no overflow menu in kasder. v0.2 candidate via header-action slot.
- **Stories pinning / reorder** — admin/curator surfaces. Out of scope.
- **Audio-only stories / podcast items** — out of scope; image + video only.

## Dependencies

- **shadcn primitives**: `dialog` (already installed), `avatar` (already installed), `button` (already installed). NO new shadcn primitives.
- **Cross-folder registry deps** (declared via `registryDependencies` in registry.json): `media/video-player-01` for video items.
- **Lucide icons**: `X`, `ChevronLeft`, `ChevronRight`, `Pause`, `Play`, `Volume2`, `VolumeX`. All already in use elsewhere.
- **NO framer-motion peer dep** — CSS-only animations in v0.1 (per locked motion substrate decision; FM enters when swipe-to-dismiss lands in v0.2).
- **NO Embla** — viewer is single-item-at-a-time, not a carousel.

## Sealed-folder structure (preview — Stage 2 will lock)

```
src/registry/components/media/story-viewer-01/
├── story-viewer-01.tsx                  # root (Radix Dialog wrapper + state orchestration)
├── parts/
│   ├── viewer-shell.tsx                 # Dialog content surface (the modal box; CSS animations live here — v0.2 framer-motion seam)
│   ├── progress-bars.tsx                # segmented progress row
│   ├── viewer-header.tsx                # avatar + name + time + pause / mute / close
│   ├── tap-zones.tsx                    # 3-column 1/3 each (prev / pause / next)
│   ├── nav-arrows.tsx                   # desktop story-level ← →
│   └── item-view.tsx                    # image OR video item renderer (composes video-player-01)
├── hooks/
│   ├── use-story-viewer-state.ts        # reducer + cursor + realtime delta application
│   ├── use-story-progress.ts            # the timer + segment-fill logic (exported standalone)
│   └── use-story-keyboard-nav.ts        # arrow keys + space + escape (exported standalone)
├── lib/
│   └── format-time.ts                   # default `Intl.DateTimeFormat` formatter (no date-fns dep)
├── types.ts                             # Story / StoryItem / StoryViewer01Props / Handle / Delta / LocalAction / Subscribe / Labels / StoryViewerLocalAction
├── dummy-data.ts                        # 3 mock stories with mixed image+video items
├── demo.tsx                             # 6 tabs: image-only / video-only / mixed / multi-story-nav / realtime-fake / custom-renderItem
├── usage.tsx
├── meta.ts
└── index.ts
```

**Estimate: 16 files, 11 ship via the registry.** Excluded from ship: `demo.tsx`, `usage.tsx`, `meta.ts` (docs-site only — locked target convention).

## Open questions for the user

Most calls are covered by locked precedents (always-uncontrolled, Subscribe contract, Pause/Mute split, Radix Dialog adoption). Surfacing only the genuinely-novel calls:

**Q1. v0.1 modal animation strategy — Tailwind `data-state` only, or skip even that?**

Two options:
- **(A)** CSS-only via Tailwind's `data-[state=open]:fade-in-0 zoom-in-95` etc. on Radix's `Dialog.Content` — kasder's scale-and-fade reproduced without framer-motion. Default.
- **(B)** No custom animation; use Radix Dialog's bare data-state defaults (no transition).

**Recommendation: A.** Visually matches kasder; ships zero new dep cost; is the natural seam to swap framer-motion into when swipe-to-dismiss lands in v0.2. (B) is cheaper but loses the polished open/close that defines the surface.

**Q2. `markViewed` semantics — fire on item-completion (per-item) or story-completion (per-story)?**

Kasder fires `onStoryViewed` only when the story completes (last item) OR when the user navigates away. Per-item viewing is exposed separately (analytics).

**Recommendation: keep both.** `onStoryViewed(storyId)` for the rail-clearing semantics + `onItemViewed(storyId, itemId, itemIndex)` for analytics. Different hosts will want different granularities.

**Q3. Auto-close behavior at end of last story — close (kasder) or callback?**

Kasder auto-closes when `goToNextItem` is called and there's no next item AND no next story. Hosts wanting to chain into a "you're all caught up" screen can't easily intercept.

**Recommendation: dual.** Default behavior: auto-close. Add `onAutoCloseAtEnd?: () => void` callback that fires immediately before `onClose`. Hosts that care can intercept (e.g., show a "next: someone else's story?" overlay); hosts that don't get the kasder default. Backward-compatible.

**Q4. Subscribe-delta scope — patch the currently-displayed story only, or the entire stories array?**

Two interpretations:
- **(A)** Deltas patch the entire `stories` snapshot — new stories appear in the navigation queue immediately; new items grow the current story's progress bar count.
- **(B)** Deltas only patch the currently-displayed story — new stories are deferred to next mount.

**Recommendation: A** (full patch). Matches the Subscribe-contract precedent (story-rail-01 patches its full `items[]`). Story-added without auto-jumping is the right behavior — viewer doesn't surprise-jump but the new content becomes navigable. Same idiomatic "live patches local state, callbacks fire for analytics" lock.

---

## Re-validation refinements (already applied above)

- **R-D-1** Clarified `isOpen + onClose` map onto Radix Dialog's `open + onOpenChange` so Radix Escape + backdrop click funnel through one host callback. (No double-fire with our keyboard nav.)
- **R-D-2** Spelled out the locked Subscribe identity convention (host memoizes via `useCallback` over a stable channel reference) + confirmed lifecycle is **mount-scoped, not `isOpen`-scoped** (hosts wanting visibility scoping pass `isOpen ? subscribe : undefined`).
- **R-D-3** `onStoryViewed` fires on **forward completion only** (last item OR forward navigation OR auto-close at end), NOT on backward navigation — matches Instagram convention.
- **R-D-4** Pause-preserving progress timer using an `accumulatedMs` accumulator instead of kasder's naive `Date.now() - startTime` recompute (which silently advanced ~50ms per pause/resume cycle).
- **R-D-5** Video duration resolution priority cleaned up: `currentItem.duration` (explicit) → `videoMetadataDuration` → `5s` fallback.
- **R-D-6** Single-item-at-a-time render — `<VideoPlayer01 isActive={!isPaused}>` only (no `idx` coordination needed because off-screen items don't mount).
- **R-D-7** Cursor reset semantics locked: resets when **`(initialStoryIndex, isOpen)` pair** changes; in-component nav preserved otherwise. Matches kasder.
- **R-D-8** `subscribe` `position` default for `story-added` is `"end"` (cursor-stable). Internal cursor is tracked by `(currentStoryId, currentItemId)`, NOT by index, so `"start"` insertions still work correctly.

Awaiting your sign-off on the recommendations + refinements (or push-back on any). Once confirmed, I'll write Stage 2 (the plan).
