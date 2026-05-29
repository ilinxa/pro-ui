# story-viewer-01 — consumer guide

> Stage 3: how to use it. Originally authored alongside v0.1; refreshed
> across v0.2 (engagement layer) + v0.3 (comments / share panels) + v0.4
> (3D cube + finger-following swipe).
>
> Per-version planning docs are frozen:
> [`description.md`](./story-viewer-01-procomp-description.md) +
> [`plan.md`](./story-viewer-01-procomp-plan.md) (v0.1),
> [`description-v0.2.0.md`](./story-viewer-01-procomp-description-v0.2.0.md) +
> [`plan-v0.2.0.md`](./story-viewer-01-procomp-plan-v0.2.0.md) (v0.2). This
> guide is the only live consumer-facing doc.

## 30-second mental model

`<StoryViewer01>` is a **full-screen sequential story viewer** — Radix Dialog modal with mobile-fullscreen / desktop centered portrait (`md:w-100 md:h-175`), segmented progress bars, tap zones (left/middle/right thirds), desktop nav arrows for story-level navigation, keyboard nav (← → space escape), pause-preserving accumulator timer, ID-anchored cursor, video-player-01 composed for video items. v0.2 added a role-aware engagement layer (composing `engagement-bar-01` + `comment-thread-01`); v0.3 added Instagram-canonical comments + share bottom-sheet panels; v0.4 added a 3D cube transition + finger-driven swipe between stories (pure CSS — no framer-motion).

**Six rules:**

1. **`stories` prop is mount-only initial state.** Subsequent prop reference changes are IGNORED. Use `ref.current.reset(next)` or `dispatch(action)` to push external updates.
2. **Cursor resets when `(initialStoryIndex, isOpen)` pair changes.** Re-opening with the same `initialStoryIndex` still goes back to item 0. Mid-view nav is preserved.
3. **`onStoryViewed` is forward-only.** Backward navigation does NOT mark stories viewed (matches Instagram).
4. **Click-outside / Escape close via Radix Dialog.** No bespoke modal logic; Radix handles focus trap + portal + escape natively.
5. **Engagement / comments / share / cube are opt-in.** v0.1 surfaces stay the default. Engagement + DM + owner overlay activate when `viewerMode` is set; comments + share panels activate when their `renderXxxPanel` slot is wired; cube transitions activate automatically on multi-story navigation (suppress with `disableStoryTransition`).
6. **Everything is pure CSS.** v0.4 ships the 3D cube + pointer-driven swipe without framer-motion — the project's motion-substrate adoption stays deferred. Item-to-item nav inside a story is still a hard cut (matches Instagram).

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

## Still out of scope (as of v0.4)

The following remain intentionally **not** in the component:

- **Swipe-to-dismiss** (drag-Y to close the modal) — distinct from v0.4's
  horizontal swipe between stories. The Y-axis dismiss gesture is still
  deferred (would be the motion-substrate adoption gate if/when adopted;
  framer-motion is NOT a project peer dep yet).
- **Heart-burst on double-tap** — like-on-media micro-animation. v0.4 has
  the like action (via the engagement overlay) but no double-tap shortcut
  or heart burst.
- **Polls / quizzes / question stickers** — host-level overlay; renders via
  `renderItem` if needed.
- **Story expiration timer** (24h auto-disappear) — host owns expiration;
  pass already-filtered stories.
- **Story groups / Highlights** — separate composite.
- **Auto-advance to a different user's story past the last own story** —
  auto-closes by default; hosts wanting "next: someone else's story?"
  intercept via `onAutoCloseAtEnd` and re-open with a new
  `initialStoryIndex`.
- **Audio-only stories / podcast items** — image + video only.
- **Virtualization** — single item rendered at a time; non-issue.
- **Comment thread inline (not in a panel)** — the v0.3.0 comments panel
  is a bottom-sheet, not an inline column. Hosts wanting a different
  layout use `renderCommentsPanel` for full takeover.

Now shipped — was originally listed here as "v0.2 candidate":

- ✅ **Story reactions** — v0.2.0 engagement overlay (`reactionKinds` +
  `onReactStory`).
- ✅ **Reply input** — v0.2.0 DM composer (`currentUser` + `onAddReply`).
- ✅ **Save / share / report kebab** — v0.2.0 kebab (moved to the header
  cluster in v0.3.5).
- ✅ **Horizontal swipe between stories** — v0.4.1 finger-driven cube swipe.

## v0.2.0 — engagement layer (additive)

v0.2.0 stays **fully backwards-compatible** with v0.1 — every v0.2.0 surface
is opt-in (gated on `viewerMode` being set + per-feature disable flags).
Drop-in for an existing v0.1 consumer is zero-change.

### Role-aware mode (`viewerMode`)

Two modes opt the engagement layer in:

```tsx
<StoryViewer01
  viewerMode="viewer"  // or "owner"
  currentUser={{ id, name, avatar }}
  reactionKinds={[/* host-supplied */]}
  // ...
/>
```

Mode is **explicit-only** — the library does NOT auto-derive owner mode from
`currentUser.id === story.userId`. Hosts pick the mode because identity models
vary (mirrors post-card-01 v0.3.0 resolver).

Mode-derived defaults can be overridden two ways:

1. `permissions` matrix — per-field booleans (`canReact`, `canDeleteStory`, …)
2. `canPerformAction(action, story, item)` — universal predicate, wins over both

Resolution order: predicate → matrix → mode defaults. Returning `undefined` from
the predicate falls through.

### Engagement overlay (v0.3 layout)

Mounts in `viewerMode="viewer"` (`disableEngagement` opts out). Composes
`@ilinxa/engagement-bar-01` `variant="stacked"` on the viewer's right edge,
**collapsed by default** in v0.3.5+. Only a heart toggle is visible inline
with the DM bar at `right-3 bottom-3`; tapping it reveals the engagement
icons (like / reaction / comment / share) with a staggered bottom-to-top
animation (delay-0/75/150/200ms). Tapping the heart again or anywhere
else outside the column collapses it.

Items in the order they reveal:

- **like** — toggles via `onLikeStory`
- **reaction** — picker over host-supplied `reactionKinds`; fires `onReactStory`
- **comment** — opens the comments panel (v0.3.0; falls back to focusing the DM input when `disableComments` is set)
- **share** — opens the share panel (v0.3.1; falls back to firing `onShareStory` directly when `disableSharePanel` is set)

Bookmark was **removed in v0.3.0** (stories are ephemeral; owner-side
`Save to highlights` lives in the kebab instead).

The **kebab** moved out of the engagement column to the ViewerHeader's
right cluster in v0.3.5 (between the mute and close buttons). Activation
is the same — `kebabActions` for full takeover, `moderatorActions` to
insert a moderator section with auto-divider, otherwise default
assembly via the permissions matrix.

`renderEngagementOverlay` slot still wins as full takeover.

### Reply composer

Mounts in `viewerMode="viewer"` (`disableReplyComposer` opts out). Composes
`@ilinxa/comment-thread-01`'s `CommentComposer`. Auto-pauses on first character
typed; resumes on submit / cancel / blur. When `currentUser` is absent, the
composer is hidden and `composerEmptyState` (a ReactNode) is rendered in its
place.

### Owner overlay

Mounts in `viewerMode="owner"` (`disableOwnerOverlay` opts out). Hybrid loader:

- `story.viewerCount` (cheap number) → shows immediately as a chip
- `story.viewers?: ViewerListItem[]` → optional eager seed
- `onLoadViewers(storyId)` → lazy fetch on chip tap (LikersStrip is reused)

Tap the chip to expand → fetch fires if no eager seed.

### Render slots (current: 1 → 9)

Each slot receives `StoryViewerSlotHelpers` (cursor / pause / mute / nav /
labels) for full takeover. The comments + share panel slots additionally
receive `isXxxOpen` + `closeXxxPanel` helpers.

| Slot | Since | Replaces |
|---|---|---|
| `renderItem` | v0.1 | the default image / video item branch |
| `renderHeader` | v0.2.0 | avatar + username + time + buttons strip |
| `renderProgress` | v0.2.0 | segmented progress bars |
| `renderNavArrows` | v0.2.0 | desktop ← → arrows |
| `renderTapZones` | v0.2.0 | tap-zone strip |
| `renderEngagementOverlay` | v0.2.0 | stacked engagement bar |
| `renderReplyComposer` | v0.2.0 | DM composer (bottom input) |
| `renderOwnerOverlay` | v0.2.0 | view-count chip + viewers list |
| `renderCommentsPanel` | v0.3.0 | comments bottom-sheet content |
| `renderSharePanel` | v0.3.1 | share bottom-sheet content |

### Disable opt-outs (current: 12 flags)

Each suppresses its surface entirely; flags compose freely:

| Flag | Since | Effect |
|---|---|---|
| `disableTapZones` | v0.2.0 | No tap zones (keyboard + arrows still work) |
| `disableKeyboardNav` | v0.2.0 | Keyboard listener never attaches |
| `disableNavArrows` | v0.2.0 | No desktop ← → arrows |
| `disableAutoClose` | v0.2.0 | `onAutoCloseAtEnd` fires; viewer stays open at last item |
| `disableProgressBars` | v0.2.0 | No segmented bars (timer still runs) |
| `disableEngagement` | v0.2.0 | No overlay; kebab stays in header |
| `disableReplyComposer` | v0.2.0 | No DM composer in viewer mode |
| `disableOwnerOverlay` | v0.2.0 | No view-count chip / viewers panel in owner mode |
| `disableComments` | v0.3.0 | No comments panel; comment-icon focuses DM input instead |
| `disableSharePanel` | v0.3.1 | No share panel; share-icon fires `onShareStory` directly |
| `disableStoryTransition` | v0.4.0 | No 3D cube between stories; hard-cut nav (and no swipe) |
| `storyTransitionDurationMs` | v0.4.0 | Tune cube duration (default `400`) |

### Long-press pause (additive)

Hold anywhere on the viewer past `longPressThresholdMs` (default 200ms — the
Instagram-feel) to pause; release to resume. Short taps continue to flow
through the tap zones unchanged, so v0.1 middle-tap-pause keeps working as the
desktop fallback (Q-V8 lock).

### `StoryItem.link` CTA

Items with `link: { url, cta? }` render a bottom button:

```tsx
{
  id: "promo-1",
  type: "image",
  src: "...",
  link: { url: "https://example.com/shop", cta: "Shop now" },
}
```

`linkComponent` (default `"a"`) is polymorphic — pass Next.js `<Link>` for
client-side nav. `onLinkClick(storyId, itemId, url)` fires before navigation
(host can preventDefault if needed).

### Author tap-target (v0.2.2)

The avatar + username strip in the header is a static `<div>` by default.
Set `onAuthorClick(story)` to make it interactive:

```tsx
<StoryViewer01
  // ...
  onAuthorClick={(story) => router.push(`/u/${story.username}`)}
/>
```

When set, the strip renders as `<button type="button">` with hover-opacity +
focus ring. For href-based nav (Next.js `<Link>`, `<a>`, etc.) pass
`authorComponent` — the polymorphic root receives `onClick` + `className`
and the avatar + name as children; manage `href` inside your wrapper:

```tsx
<StoryViewer01
  // ...
  authorComponent={(props) => (
    <Link href={`/u/${currentUser.username}`} {...props} />
  )}
  onAuthorClick={(story) => analytics.track("author", story.username)}
/>
```

### Imperative handle additions

```ts
handle.setMuted(true)         // parity with setPaused
handle.triggerLike()          // toggles current like state
handle.triggerReaction("love") // selects a reaction kind (or null to clear)
handle.triggerReply("draft")  // focuses composer (setValue stubbed in v0.2.0)
handle.triggerShare()         // fires onShareStory
handle.openKebab()            // opens the kebab bottom-sheet
```

trigger* methods **bypass** the permissions matrix — the matrix gates UI
affordances; the handle is the programmatic escape hatch.

### Realtime — `engagementSubscribe`

Per-item like / reaction / reply / view-count deltas stream through a
**separate** subscription from the v0.1 `subscribe` (which stays scoped to
story-list mutations). Asymmetric naming preserved for zero v0.1 breakage
(Q-V16 lock):

```tsx
<StoryViewer01
  subscribe={storyListStream}              // v0.1 — StoryViewerDelta
  engagementSubscribe={engagementStream}   // v0.2.0 — StoryEngagementDelta
/>
```

## v0.3.0 — comments panel (additive)

The comment icon in the engagement overlay opens a bottom-sheet (~62%
viewer height) holding host-supplied comment content. The visual stack
above scales to ~55% + translates up; a tap on the shrunk visual closes
the panel. Always-mounted so consumer state (e.g., CommentThread01's
draft composer) persists across open/close cycles. The story timer
auto-pauses while the panel is open.

```tsx
import { CommentThread01 } from "@/registry/components/data/comment-thread-01";

<StoryViewer01
  /* ... */
  renderCommentsPanel={(story, item, helpers) => (
    <CommentThread01
      comments={getCommentsFor(story.id, item.id)}
      currentUser={viewer}
      pageSize={5}
      onAddComment={(content) => api.addComment(story.id, item.id, content)}
      onLoadMore={(page) => api.loadOlderComments(story.id, item.id, page)}
      onLikeComment={(id, liked) => api.likeComment(id, liked)}
      className="px-4 py-3"
    />
  )}
/>
```

`helpers.isCommentsOpen` + `helpers.closeCommentsPanel` are available
inside the slot if you need them. Set `disableComments` to fall back to
the v0.2.x behavior (comment-icon focuses the DM input, no panel).

**DM vs comments semantic (clarified in v0.3.0):** the always-visible
bottom `<ReplyComposer>` is the **Direct Message** channel to the story
author (Instagram-canonical "Reply to @user…"); it is NOT public
comments. Public comments live in the panel above. The
`onAddReply(storyId, itemId, content)` callback name is preserved for
back-compat — semantically equivalent to `onSendDirectMessage`.

## v0.3.1 — share panel (additive)

Same mount + dismiss model as comments. Wire `renderSharePanel` to a
share UI — typically `ShareMenu` from `@ilinxa/engagement-bar-01`:

```tsx
import { ShareMenu } from "@/registry/components/data/engagement-bar-01";

<StoryViewer01
  /* ... */
  renderSharePanel={(story, item, helpers) => (
    <ShareMenu
      users={recentRecipients}
      onShareTo={(user) => {
        api.shareStoryTo(story.id, item.id, user.id);
        helpers.closeSharePanel();
      }}
      heading="Send to…"
    />
  )}
/>
```

Comments + share panels are **mutually exclusive** — opening one closes
the other. `disableSharePanel` falls back to firing `onShareStory`
directly (v0.2.x system-share behavior).

## v0.3.8 — link-CTA drawer

`StoryItem.link` was originally a bottom button (v0.2.0); v0.3.8
redesigned it as an Instagram-canonical top-anchored collapsible drawer.
Default state: small rounded chip at `top-16 right-3` showing the host
domain + link icon. Tap → drawer slides down with the host preview + CTA
button + X-close. Tap anywhere outside or the X to collapse. The
`linkComponent` + `onLinkClick` props are unchanged — same polymorphic
semantics, new chrome.

## v0.3.9 — additional label keys

v0.3.9 added four new keys to `StoryViewer01Labels` (all overridable;
defaults shipped):

- `linkCloseLabel` — aria-label on the link-drawer X (default `"Close link"`)
- `engagementShowLabel` — aria-label on the heart toggle when collapsed (default `"Show reactions"`)
- `engagementHideLabel` — aria-label on the heart toggle when expanded (default `"Hide reactions"`)
- `replyAriaLabel(story)` — DM textarea aria-label (default `Reply to ${story.username}`)

Plus three new panel-related keys from v0.3.0–v0.3.1: `commentsHeading`,
`commentsCloseLabel`, `commentsDefaultEmptyState`, `shareHeading`,
`shareCloseLabel`, `shareDefaultEmptyState`. The labels object is now
37 standalone keys + 2 nested-forward namespaces (`engagementLabels` for
engagement-bar-01, `commentLabels` for comment-thread-01).

## v0.4.0 — Instagram-canonical 3D cube transition

Story-to-story navigation (auto-advance + ← → nav arrows + tap-zone
spillover at last item + keyboard arrows + programmatic `goToStory`)
animates a `perspective-distant` cube swinging `rotateY 0 → ∓90°` over
400ms with Apple-spring easing `cubic-bezier(0.32, 0.72, 0, 1)`. The
leaving story renders as a static ghost (progress bars + header + image
or video poster); the incoming story is pre-placed on the side wall and
rotated into view. Detection runs during render (mid-render `setState`
pattern) so the cube engages in the same React commit as the cursor
change — no 1-frame flash. Item-to-item navigation within a single
story stays a hard cut (matches Instagram).

```tsx
<StoryViewer01
  stories={stories}
  initialStoryIndex={0}
  isOpen={open}
  onClose={onClose}
  disableStoryTransition={false}    // default — set true to revert to hard cuts
  storyTransitionDurationMs={400}    // default; tune 200–800 for taste
/>
```

The cube uses Tailwind v4's `perspective-distant` + `@container` +
`transform-3d` + `backface-hidden` + `translateZ(50cqw)` inline — no JS
width measurement needed. **v0.4.2** prefixes the rotator transform with
`translateZ(-50cqw)` so the front face lands at the perspective plane at
idle (scale 1.0×) and scales DOWN as it rotates away (proper cube
perspective), avoiding the visible scale-jump that 50cqw-without-the-shift
would produce.

## v0.4.1 — finger-following swipe

Pointer drag on the viewer body drives the cube angle in real-time
(Δx → angle, 1:1 at half-width = 90°). Drag-left advances to the next
story; drag-right returns to previous. On release:

- distance ≥ 30% width OR velocity ≥ 0.5 px/ms → commit
- otherwise → snap-back to current

During drag, prev + next ghosts are mounted on the left/right walls so
the user can swing either way mid-gesture. Boundary resistance (×0.25)
applies at the first/last story so the cube "stretches" rather than
snapping past nothing.

Conflicts handled automatically:

- **long-press pause** — drag intent (Δx > 10px AND > Δy) cancels the
  long-press timer; the gesture becomes a swipe.
- **tap zones** — a `swipeJustEnded` flag suppresses the click that
  would otherwise fire on `pointerup` after a successful drag.

Suppress the entire system (cube + swipe together) with
`disableStoryTransition`.

## v0.4.1 — mobile-fullscreen sizing fix

shadcn's `DialogContent` ships `sm:max-w-sm` which caps the modal width
at 384px on viewports ≥ 640px — overriding the viewer's `max-w-none` on
that intermediate range. v0.4.2 hardened the override with Tailwind v4's
`!` important suffix:

```css
/* viewer-shell.tsx */
h-dvh!  w-screen!  max-w-none!  rounded-none!
sm:h-dvh!  sm:w-screen!  sm:max-w-none!  sm:rounded-none!
md:h-175!  md:w-100!  md:max-w-100!  md:rounded-2xl!
```

The modal is now truly full-screen across the entire `< md` range and
gains its 400×700 portrait chrome only at desktop. Consumer overrides
via `contentClassName` still compose normally (they apply after these
utilities in the className chain).

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `story-viewer-01`, they import only from `story-viewer-01.tsx`.

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly. Anything you want shareable across folder boundaries MUST be re-exported from `<slug>.tsx`.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.
