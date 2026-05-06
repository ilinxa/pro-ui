# story-viewer-01 — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1 implementation.
>
> See [`story-viewer-01-procomp-description.md`](./story-viewer-01-procomp-description.md) for what & why,
> and [`story-viewer-01-procomp-plan.md`](./story-viewer-01-procomp-plan.md) for the implementation contract.

## 30-second mental model

`<StoryViewer01>` is a **full-screen sequential story viewer** — Radix Dialog modal with kasder-exact chrome (mobile fullscreen / desktop centered portrait `md:w-100 md:h-175`), segmented progress bars, tap zones (left/middle/right thirds), desktop nav arrows for story-level navigation, keyboard nav (← → space escape), pause-preserving accumulator timer, ID-anchored cursor, video-player-01 composed for video items.

**Five rules:**

1. **`stories` prop is mount-only initial state.** Subsequent prop reference changes are IGNORED. Use `ref.current.reset(next)` or `dispatch(action)` to push external updates.
2. **Cursor resets when `(initialStoryIndex, isOpen)` pair changes.** Re-opening with the same `initialStoryIndex` still goes back to item 0. Mid-view nav is preserved.
3. **`onStoryViewed` is forward-only.** Backward navigation does NOT mark stories viewed (matches Instagram).
4. **Click-outside / Escape close via Radix Dialog.** No bespoke modal logic; Radix handles focus trap + portal + escape natively.
5. **v0.1 is CSS-only animations.** framer-motion enters in v0.2 for swipe-to-dismiss (the locked motion-substrate adoption gate).

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/story-viewer-01
```

Auto-pulls `video-player-01` (cross-folder dep), shadcn `dialog` / `avatar` / `button`.

For fixtures (sandbox demos):

```bash
pnpm dlx shadcn@latest add @ilinxa/story-viewer-01-fixtures
```

## Minimal usage

```tsx
import { StoryViewer01 } from "@/registry/components/media/story-viewer-01";

const [open, setOpen] = useState(false);
const [activeIdx, setActiveIdx] = useState(0);

<StoryViewer01
  stories={stories}
  initialStoryIndex={activeIdx}
  isOpen={open}
  onClose={() => setOpen(false)}
/>
```

## Wired with story-rail-01 (canonical)

```tsx
import { useRef, useState } from "react";
import { StoryRail01, type StoryRail01Handle } from "@/registry/components/data/story-rail-01";
import { StoryViewer01 } from "@/registry/components/media/story-viewer-01";

function FeedTop({ stories, viewer }: Props) {
  const railRef = useRef<StoryRail01Handle>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  return (
    <>
      <StoryRail01
        ref={railRef}
        items={stories}
        onItemClick={(_item, index) => setActiveIdx(index)}
      />

      {activeIdx >= 0 ? (
        <StoryViewer01
          stories={stories}
          initialStoryIndex={activeIdx}
          isOpen
          onClose={() => setActiveIdx(-1)}
          onStoryViewed={(id) => railRef.current?.markViewed(id)}
        />
      ) : null}
    </>
  );
}
```

The viewer's `onStoryViewed(storyId)` is what hosts wire back to `railRef.current.markViewed(storyId)` to clear the unread ring. Pure decoupled handoff — viewer doesn't know the rail exists.

## Realtime via subscribe

```tsx
import type {
  Subscribe,
  StoryViewerDelta,
} from "@/registry/components/media/story-viewer-01";

const subscribe = useCallback<Subscribe<StoryViewerDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryViewer01
  stories={stories}
  initialStoryIndex={0}
  isOpen={open}
  onClose={onClose}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-viewer-delta", d)}
/>
```

The contract:

```ts
type StoryViewerDelta =
  | { kind: "story-added";   story: Story; position?: "start" | "end" }
  | { kind: "story-removed"; storyId: string }
  | { kind: "item-added";    storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "item-removed";  storyId: string; itemId: string }
  | { kind: "story-viewed";  storyId: string };  // sets hasUnread=false
```

- **Cursor stability:** internal cursor is tracked by `(currentStoryId, currentItemId)` — NOT by index — so insertions / removals don't desync your position. Default `position` for `story-added` is `"end"`; `"start"` works correctly for hosts wanting Instagram chronology because the ID-anchored cursor anchors through the shift.
- **Mount-scoped lifecycle:** subscription runs from mount to unmount, NOT scoped to `isOpen`. Hosts wanting visibility scoping pass `isOpen ? subscribe : undefined`.
- **Identity-stable convention:** memoize `subscribe` via `useCallback` over a stable channel reference (locked precedent).

## Imperative handle

```ts
interface StoryViewer01Handle {
  goToStory: (index: number) => void;
  goToItem: (index: number) => void;
  setPaused: (paused: boolean) => void;
  getCursor: () => { storyIndex: number; itemIndex: number };
  getCurrentStories: () => Story[];
  reset: (next: Story[]) => void;
  dispatch: (action: StoryViewerLocalAction) => void;
  /** Note: there's no `markViewed` here — hosts fire that on the rail, not the viewer. */
}
```

Common patterns:

- **Push external state:** `ref.current?.reset(updatedStories)`.
- **Surgical update:** `ref.current?.dispatch({ kind: "patch-story", storyId, partial: { username: "newName" } })`.
- **Force-pause from outside:** `ref.current?.setPaused(true)` (e.g., when a confirmation dialog opens over the viewer).
- **Jump to a specific story:** `ref.current?.goToStory(2)` (item index resets to 0; fires `onStoryViewed` on the leaving story IF it's a forward jump).
- **Jump to a specific item within current story:** `ref.current?.goToItem(1)` (does NOT fire `onStoryViewed` — story unchanged).

## Pause / progress timer notes

- **Accumulator-based timer:** the timer tracks `accumulatedMs` across pause/resume cycles, so users can pause for arbitrary durations without losing playback position. Kasder's naive `Date.now() - startTime` re-anchors silently on every pause/resume, which is why kasder's pause "advances" ~50ms per cycle.
- **Item duration resolution:** `currentItem.duration` (explicit) → video metadata (from video-player-01's `onLoadedMetadata`) → `defaultItemDuration` (default 5s) — image fallback. Non-video custom items via `renderItem` MUST set `item.duration` explicitly.
- **Auto-advance source:** progress hits 100% → fires `onItemViewed` then advances. Video items also fire `onEnded` from `<video>` as a parallel completion source (some browsers fire `ended` slightly before progress reaches 100%; the timer's single-fire guard ignores duplicates).

## Custom item rendering

```tsx
<StoryViewer01
  stories={stories}
  initialStoryIndex={0}
  isOpen={open}
  onClose={onClose}
  renderItem={(item, ctx) => {
    if (item.type === "promo") {
      return <PromoPlacement item={item} paused={ctx.isPaused} />;
    }
    // Hosts using renderItem own the full render — including image / video
    // defaults. The slot is a takeover, not a fallback.
    if (item.type === "image") {
      return <img src={item.src} alt="" className="h-full w-full object-cover" />;
    }
    return <CustomVideoElement src={item.src} active={!ctx.isPaused} muted={ctx.isMuted} />;
  }}
/>
```

Use case: themed item types (Lottie animations, polls, sponsored placements, audio waveforms). Hosts wanting to mix custom + default rendering should branch inside their `renderItem` and re-implement the image / video defaults themselves — the slot is a takeover, not a fallback.

## i18n

```tsx
const TR_LABELS: StoryViewer01Labels = {
  viewerLabel: "Hikaye görüntüleyici",
  play: "Oynat",
  pause: "Duraklat",
  mute: "Sessize al",
  unmute: "Sesi aç",
  close: "Kapat",
  prevStory: "Önceki hikaye",
  nextStory: "Sonraki hikaye",
  formatTime: (date) =>
    new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date),
  itemImageAlt: (story, idx, total) =>
    `${story.username}, hikaye görüntüsü ${idx + 1} / ${total}`,
};

<StoryViewer01 labels={TR_LABELS} {...rest} />
```

`DEFAULT_STORY_VIEWER_LABELS` exported for spread + override.

## Accessibility

- Modal is `<Dialog>` (Radix) with `<DialogTitle>` (sr-only) using `labels.viewerLabel`. Free focus trap + portal + Escape + backdrop click.
- Per-segment progress bar has `role="progressbar"` + `aria-valuemin/max/now` so screen readers announce.
- Each control button has `aria-label` from the `labels` prop. Mute toggle adds `aria-pressed={isMuted}`.
- Tap zones are `aria-hidden="true"` with `tabIndex={-1}` (touch affordance only — keyboard users use arrow keys instead).
- Keyboard: ArrowLeft (prev item), ArrowRight (next item), Space (toggle pause; `preventDefault` to stop page scroll), Escape (close — handled by Radix).
- Pause / mute icons swap via state, not just color — color-blind safe.

## Composition example: feed + rail + viewer

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
        <StoryViewer01
          stories={stories}
          initialStoryIndex={activeStoryIdx}
          isOpen
          onClose={() => setActiveStoryIdx(-1)}
          onStoryViewed={(id) => railRef.current?.markViewed(id)}
        />
      ) : null}
    </div>
  );
}
```

This is the canonical Tier-3 wiring for the social-posts-system arc — story-rail-01 + story-viewer-01 in lockstep, post-card-01 below, all 8 components composed once. The `/sandbox/social-feed-page-01` Tier-3 sandbox demonstrates this end-to-end.

## What's NOT in v0.1

- **Swipe-to-dismiss** (drag-y to close) — the framer-motion adoption gate. v0.2.
- **Story reactions / reply input** — kasder doesn't ship it; would compose with `engagement-bar-01` reactions + `comment-thread-01` composer. v0.2 candidate.
- **Heart-burst on double-tap** — kasder's viewer doesn't have like-on-media. Add when reactions land.
- **Polls / quizzes / question stickers** — host-level overlay; not a viewer concern.
- **Story expiration timer** (24h auto-disappear) — host owns expiration; passes filtered stories.
- **Story groups / Highlights** — separate composite. Out of scope.
- **Auto-advance to next user's story past last story** — auto-closes (kasder pattern). Hosts wanting "next: someone else's story?" intercept via `onAutoCloseAtEnd`.
- **Save / download / share buttons** — header has no overflow menu in kasder. v0.2 candidate via header-action slot.
- **Audio-only stories / podcast items** — image + video only.
- **Virtualization** — single item rendered at a time; non-issue.
