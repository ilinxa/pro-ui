# engagement-bar-01 — procomp description

> Stage 1: what & why.
>
> ### v0.1.1 patch (2026-05-03)
>
> - **`like.onCountClick?: () => void`** added to the discriminated `EngagementAction` union. When provided, the heart icon and the count number become two separate click targets — heart fires `onToggle`, count fires `onCountClick`. Backwards-compatible: omit it for the original bundled-button behavior.
> - **New label:** `openLikersPanel?: string` (default `"Show likers"`) — aria-label for the count button when split.
> - Visual: split mode uses `gap-2` between heart and count to match the bundled-button gap, so a row mixing split + bundled actions stays visually consistent.
> - Used by `post-card-01` v0.1.1 to wire "tap heart to like, tap count to open likers panel" (kasder UX).
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `PostEngagementPanel.tsx` (468 LOC); we keep only the action-row concern, decomposing comments into [`comment-thread-01`](../comment-thread-01-procomp/) (next ship) and likes-strip into a `likersPreview` slot.
>
> Fourth of 8 in the social-posts-system arc and the **highest-leverage primitive** in the family. Built to retrofit cleanly into `content-card-news-01` and `event-card-01` `actions` slots once shipped — turning every card surface in the app into a like/comment/share-capable post-like surface without a rewrite.
>
> **Motion lock (re-decided 2026-05-02):** `engagement-bar-01` ships **CSS-only**. No framer-motion. Heart-burst is a sibling sub-export `<EngagementHeartBurst>` driven by `@keyframes`. The earlier "framer-motion approved project-wide" decision was narrowed: FM adoption is now gated on `story-viewer-01`'s swipe-to-dismiss gesture, where rolling our own pointer-event handler is the actually-tedious thing. See [memory: project_motion_substrate.md](../../../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_motion_substrate.md).

## Problem

Every social product surface needs the same row of buttons under the content: **Like (heart + count) · Comment (icon + count) · Share · Bookmark · View-count** — with the same micro-interactions: scale-bump on like, optimistic count flip, a heart-burst overlay on double-tap from the carousel above, realtime updates as other users react, and a `Beğenenler` ("X others liked this") preview strip. Built ad-hoc per consumer:

- Hardcoded action set — no slot for `share` or `bookmark`, no per-action visibility
- No realtime contract — every consumer reinvents websocket-to-state plumbing
- Heart-burst tightly coupled to the post body — can't reuse on news/event cards
- No shared reducer for optimistic state — every consumer rolls their own toggle / count math
- Counts not truncated humanely (`1.2k` / `12k` / `1.2m`) — every consumer rolls a `formatCount` helper
- Hardcoded labels — Turkish / English mixed at the file level
- Likers preview (avatar strip) baked into the panel — can't omit, can't customize, can't lazy-load

`engagement-bar-01` is the answer: a single, fully-dynamic action row with discriminated-union `actions[]`, a built-in optimistic reducer hosts can opt into or replace, a realtime `subscribe` contract, a `likersPreview` slot, and a sibling CSS heart-burst component — all framer-motion-free so retrofitted card consumers pay zero animation-library cost.

## In scope

### The action row itself

- **Discriminated `actions: EngagementAction[]` array** — the **only** required prop. Each item is one of:

  ```ts
  type EngagementAction =
    | { kind: "like";       count: number; liked?: boolean; onToggle?: (next: boolean) => void; }
    | { kind: "comment";    count: number; onClick?: () => void; }
    | { kind: "share";      count?: number; onClick?: () => void; }
    | { kind: "bookmark";   bookmarked?: boolean; onToggle?: (next: boolean) => void; }
    | { kind: "view-count"; count: number; }
    | { kind: "custom";     id: string; label: string; icon: ReactNode; count?: number; active?: boolean; onClick?: () => void; }
  ```

  Order in the array = render order. Hosts include only what they need — every action is opt-in. No "show/hide" booleans on the component itself.

- **Three variants** (analysis-locked):
  - `default` — icon + count side-by-side, comfortable padding (kasder post default)
  - `compact` — icon-only with count as superscript / tooltip; for tight cards (news-card actions slot, comment per-item)
  - `stacked` — icon above count vertically; for video-overlay / story-viewer use

- **Per-action active state** — `like.liked = true` → heart fills + scale-110 + `text-destructive`; `bookmark.bookmarked = true` → bookmark fills; `custom.active = true` → consumer-defined visual on the icon. CSS-only transitions (`transition-transform`, `duration-200`).

- **Humanized count formatting** — `formatEngagementCount(n)` exported helper: `< 1000` → as-is, `< 10_000` → `1.2k`, `< 1_000_000` → `12.3k`, `< 1_000_000_000` → `1.2m`. Pluralization concerns punt to the host (we don't render `"likes"` text strings — only counts).

- **Right-aligned section** — bookmark + view-count drift right by default (kasder convention); like / comment / share stay left. `align?: "left" | "right" | "auto"` on each action overrides.

### Heart-burst (sibling sub-export)

- **`<EngagementHeartBurst>`** — separate component exported from `engagement-bar-01/index.ts`. Pure CSS keyframe (~30 lines) — scale `0 → 1.4 → 1.0`, opacity `0 → 1 → 0`, fixed `~600ms`. Re-triggered by host incrementing a `trigger: number` counter prop; component uses `key={trigger}` to remount the keyframed div, restarting the animation. **No `"use client"`** — pure declarative; ships as an RSC-compatible component so retrofitted card consumers don't pay a client-component boundary. Host owns burst placement (positioning is `className`-driven), so news-card / event-card retrofits that don't want a burst simply don't import it.

- **CSS portability via sibling registry file** — the keyframe definition lives in `engagement-heart-burst.css` shipped as a `registry:file` peer of the burst component. Component imports the CSS sibling. Consumers don't need to patch their `globals.css`; the keyframe travels with the component automatically via `pnpm dlx shadcn add @ilinxa/engagement-bar-01`. (This is a first-of-kind file in pro-ui's registry — a sibling CSS file installed alongside the TSX. Locks a precedent for any future component that needs a self-contained keyframe.)

- **Why a sibling**, not a built-in: the action row itself doesn't fire a burst — bursts come from the **media carousel above** (via `media-carousel-01`'s `onDoubleTap`). Coupling the burst to the action row would force every consumer (news-card retrofit, comment-thread per-item) to render the burst keyframe even when they don't double-tap-to-like. Sibling export = consumers pay only when they want it.

- **Why CSS**, not framer-motion: the visual is a 600ms enter-scale-fade. CSS keyframes match it pixel-perfect. Adopting FM here adds 50KB to every retrofit consumer — for an animation that doesn't need spring physics or gesture coordination.

### Realtime subscription

- **`subscribe?: Subscribe<EngagementDelta>`** — optional. If provided, component invokes it once on mount with a delta handler; uses returned `Unsubscribe` on cleanup. Deltas patch local optimistic state.

  ```ts
  type EngagementDelta =
    | { kind: "like-changed"; count: number; liked?: boolean; userId?: string }
    | { kind: "comment-count-changed"; count: number }
    | { kind: "share-count-changed"; count: number }
    | { kind: "view-count-changed"; count: number }
    | { kind: "bookmark-changed"; bookmarked: boolean }
    | { kind: "liker-added"; user: EngagementLikeUser }   // for likersPreview slot consumers
    | { kind: "liker-removed"; userId: string };

  type Subscribe<T> = (handler: (delta: T) => void) => () => void;
  ```

  When `subscribe` prop **identity** changes, the component re-subscribes (cleanup + re-call). Hosts must memoize `subscribe` (typically `useCallback` over a stable channel reference).

- The component does NOT manage the websocket / SSE / channel itself — the host owns transport. We just consume a stream contract.

- **`onSubscribeDelta?: (delta: EngagementDelta) => void`** — fires for every delta the subscription emits, regardless of mode. In **uncontrolled mode**, deltas patch internal optimistic state automatically AND fire this callback (host can use it for analytics / cross-component coordination). In **controlled mode**, deltas do NOT mutate internal state (controlled-mode contract held); they only fire `onSubscribeDelta`, leaving the host responsible for translating the delta into an updated `liked` / `count` prop on the next render. This split is the contract that keeps controlled mode and realtime composable without hidden state divergence.

### Optimistic state + reducer

- **Built-in optimistic state** — when the host doesn't pass `liked` / `count` props for an action, the component owns them (initialized from initial render). When the user clicks like, the count flips immediately; `onToggle` fires; if the host passes back updated props on a future render, those win. Fully-controlled mode is the same — host owns and updates.

- **`engagementReducer` exported** — for hosts that want to drive their own state machine externally. Accepts `(state, action)` where `action` is a `LocalAction` discriminated union (`{ kind: "like-toggle" } | { kind: "bookmark-toggle" } | { kind: "subscribe-delta"; delta: EngagementDelta }` etc.). Hosts can plug it into a `useReducer` at the post level if they want to coordinate with a comment composer or burst overlay.

### Likers preview slot

- **`likersPreview?: ReactNode`** — slot below the action row, only rendered if provided. Hosts put whatever they want in there (avatar strip, "X, Y, and 12 others liked this", a `<Popover>` with a list, etc.). Default demo wires a small avatar pile.

- **Why a slot, not a built-in component**: the kasder version baked in an Embla likers carousel. Decomposing pushes the choice to the host — small consumers want a 3-avatar pile, post cards want a swipeable strip, news cards want a "+12 others" pill. A slot covers all three without us writing three subcomponents.

### Imperative ref handle

- `{ triggerLike(), getCurrentState(), reset() }` — for programmatic interaction. The bar handles its OWN like state; the host is responsible for the burst. Typical post-card wiring: `onDoubleTap={() => { barRef.current?.triggerLike(); setBurstKey(k => k + 1); }}` — the bar flips like state + fires `onToggle`; the host bumps its burst counter to remount the heart-burst sub-export.

  No `triggerHeartBurst()` — the bar doesn't render the burst node, so a handle method on the bar to trigger an effect on a sibling component would be a misleading API. Host-owned counter pattern is the canonical way.

### a11y

- Each action is a `<button>` with `aria-pressed` for toggleable kinds (`like`, `bookmark`), `aria-label` from `labels` (`labels.like`, `labels.unlike`, etc., dynamic on state).
- Counts get `aria-live="polite"` so screen readers announce changes (without spamming on rapid increments — debounce 300ms internally).
- Heart-burst has `aria-hidden="true"` (decorative).
- Full keyboard nav inherited from native `<button>`s.

### i18n labels

- `labels?: EngagementBarLabels` with English defaults: `like`, `unlike`, `comment`, `share`, `bookmark`, `unbookmark`, `viewCount`, `liked` (past-tense for screen readers), `formatCount?: (n: number) => string` (escape hatch for locale-specific formatting — defaults to `formatEngagementCount`).
- `DEFAULT_ENGAGEMENT_BAR_LABELS` exported for hosts to spread + override.

## Out of scope (v0.2 candidates)

- **Built-in likers carousel** — slot pattern handles it; no concrete need to bake one in. v0.2 candidate: ship a sibling `<LikersStrip>` part if 3+ consumers reach for the same Embla pattern.
- **Reaction emojis** (Facebook-style 6-emoji popover on long-press of like) — explicit out-of-scope; if needed later, add as `kind: "reaction"` action variant.
- **Built-in share menu** (copy link / share-to-X / etc.) — `share.onClick` opens the host's menu / native share sheet. We don't ship a popover.
- **Comments composer** — that lives in `comment-thread-01` (next ship).
- **Comments panel** — also `comment-thread-01`. The `comment.onClick` here just opens / scrolls-to / focuses the host's comment thread.
- **Animated count rolling** (digit-by-digit slot machine) — count flip is an instant CSS transform, not animated digit-roll. v0.2 candidate if requested.
- **Per-action analytics hook** (auto-firing on every click) — host wires this in `onToggle` / `onClick`. We don't introduce a separate `onAnalyticsEvent` prop.
- **Long-press detection for power-user actions** — pure click + double-tap interactions only.

## Target consumers

- **`post-card-01`** (later ship) — primary consumer. Actions: like / comment / share / bookmark. Forwards media-carousel double-tap into `triggerLike()` + `triggerHeartBurst()`.
- **`comment-thread-01`** (next ship after this) — per-comment uses `variant="compact"` with just `[like, custom-reply]` actions.
- **`content-card-news-01` retrofit** — news cards already have an `actions?` slot; drop `<EngagementBar01 actions={[like, share, bookmark]} variant="compact" />` in. Instant social upgrade. Zero JS animation cost (CSS heart-fill only — no burst rendered).
- **`event-card-01` retrofit** — same pattern. `[like, share, bookmark]` for "interested" / "share event" / "save".
- **`story-viewer-01`** (later) — `variant="stacked"` over the story for reactions.
- **Any future product card** — `[like, share, custom-cart-add]`.
- **Photo viewer** — `[like, share, download-as-custom]`.

## Rough API sketch

Minimal:

```tsx
<EngagementBar01
  actions={[
    { kind: "like",    count: 142, liked: false, onToggle: (next) => onLike(post.id, next) },
    { kind: "comment", count: 23,  onClick: () => openComments(post.id) },
    { kind: "share",   onClick: () => share(post.id) },
    { kind: "bookmark", bookmarked: false, onToggle: (next) => onBookmark(post.id, next) },
  ]}
/>
```

With realtime + likers preview (full post-card mode):

```tsx
<EngagementBar01
  actions={[
    { kind: "like",       count: post.likeCount,   liked: post.viewerLiked,  onToggle },
    { kind: "comment",    count: post.commentCount, onClick },
    { kind: "share",      count: post.shareCount,  onClick: openShareMenu },
    { kind: "bookmark",   bookmarked: post.viewerBookmarked, onToggle: onBookmark },
    { kind: "view-count", count: post.viewCount },
  ]}
  subscribe={subscribeToPost(post.id)}
  likersPreview={<LikersStrip users={post.recentLikers} totalCount={post.likeCount} />}
  labels={TR_LABELS}
/>
```

With heart-burst (post-card composing media-carousel → engagement-bar — the canonical Instagram-style flow):

```tsx
const barRef = useRef<EngagementBar01Handle>(null);
const [burstKey, setBurstKey] = useState(0);

<div className="relative">
  <MediaCarousel01
    items={post.media}
    variant="gallery"
    onDoubleTap={() => {
      barRef.current?.triggerLike();   // flips like state + fires onToggle
      setBurstKey((k) => k + 1);       // remounts the burst → animation re-runs
    }}
  />
  <EngagementHeartBurst
    trigger={burstKey}
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
  />
</div>
<EngagementBar01 ref={barRef} actions={[...]} />
```

Custom action (e.g., a "remix" button on a video post):

```tsx
<EngagementBar01
  actions={[
    { kind: "like",   count: 142, liked: false, onToggle },
    { kind: "comment", count: 23, onClick },
    { kind: "custom", id: "remix", label: "Remix", icon: <Wand2 className="h-4 w-4" />, onClick: openRemixSheet },
  ]}
/>
```

Compact news-card retrofit (no comments, no burst, no FM cost):

```tsx
<ContentCardNews01
  /* ...all the news-card props */
  actions={
    <EngagementBar01
      variant="compact"
      actions={[
        { kind: "like",     count: article.likes, liked: article.viewerLiked, onToggle },
        { kind: "share",    onClick: () => share(article) },
        { kind: "bookmark", bookmarked: article.saved, onToggle },
      ]}
    />
  }
/>
```

## Public exports (from `index.ts`)

```ts
export { EngagementBar01 } from "./engagement-bar-01";
export { EngagementHeartBurst } from "./parts/engagement-heart-burst";
export { engagementReducer } from "./hooks/use-engagement-state";
export { formatEngagementCount } from "./utils/format-count";
export type {
  EngagementBar01Props,
  EngagementBar01Handle,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementAction,
  EngagementDelta,
  EngagementLikeUser,
  EngagementState,
  Subscribe,
  Unsubscribe,
} from "./types";
export { DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";
export { meta } from "./meta";
```

## Open questions for the plan stage

1. **`actions[]` order — preserve as written, or auto-sort?** Hosts may want full control (custom slot in the middle); auto-sorting would force-arrange `[like, comment, share, bookmark, view-count]` regardless of input order. **Recommendation: preserve as written** — hosts choose order; we apply `align: "right"` defaults only for `bookmark` + `view-count` and let `align?: "left" | "right" | "auto"` per-action override.

2. **Optimistic state — single internal mode, or "controlled vs. uncontrolled" split?** Two paths:
   - **(A) Hybrid:** if host passes `liked` / `count`, those win; otherwise component owns. Same prop, dual mode.
   - **(B) Explicit split:** `controlled: boolean` prop forces one mode or the other; or two separate components.
   
   **Recommendation: (A) hybrid** — matches React's input convention (`value` controlled, no `value` uncontrolled). Less ceremony for the 80% case.

3. **`engagementReducer` — public from day-1, or internal-only until a real consumer needs it?** Public from day-1: external state coordination is exactly the kind of "add it later = breaking change" trap the dynamicity rule warns against. **Recommendation: public.**

4. **Heart-burst sub-export — separate file path or barrel re-export?** `./parts/engagement-heart-burst.tsx` re-exported from `index.ts` is sufficient. NPM tree-shaking + Vite/Next bundling will eliminate the heart-burst file from consumers that don't import it. **Recommendation: re-export from index.ts; consumers can also deep-import via `@ilinxa/engagement-bar-01/burst` if Next's barrel-file analyzer trips later.**

5. **`view-count` action — toggleable or display-only?** Display-only. View counts aren't user-actionable. (`kind: "view-count"` has no `onClick` in the union.)

6. **Counts ≤ 0 — render "0" or hide?** Render as-is (`0`). Hiding makes the row jump width when the first like arrives; predictable layout > clean empty state. Hosts can omit the action entirely if they want to hide-when-zero.

7. **`like` action with no `liked` prop — default to `false`?** Yes. If `liked` is omitted, the heart starts unfilled; first click fills it (uncontrolled mode owns the state from there).

8. **`onToggle` invocation timing — before or after optimistic state update?** **After.** Component flips local state first (instant feedback), then fires `onToggle(next)`. If the host's mutation fails, the host calls back via the `controlled` props or via `triggerLike()` to revert. Standard optimistic UI.

9. **`subscribe` re-subscription behavior on prop change — debounce?** No. Subscribe is identity-stable per host convention (`useCallback`). If the host does pass a new identity, we cleanly tear down + re-call — no debouncing.

10. **`<EngagementHeartBurst>` placement — host-owned wrapper, or built-in `relative` container in `engagement-bar-01`?** **Host-owned (locked).** The burst usually overlays the *media above*, not the engagement bar itself. Forcing the bar to be the positioning context limits placement. The sub-export accepts `className` so hosts position it where they want. **Bar handle does NOT include `triggerHeartBurst()`** (would be misleading — the bar doesn't render the burst node). Host increments its own `burstKey` counter alongside calling `barRef.current?.triggerLike()`.

11. **`view-count` icon — Eye, or numeric-only with no icon?** Eye icon by default; consumers can override per-action via passing `icon` on `kind: "custom"` if they want different (but `view-count` itself has no `icon` slot — it's a fixed kind). **Recommendation: Eye icon, locked. If consumers want a different icon, they use `kind: "custom"`.**

12. **Deep-link to comment thread — does `comment.onClick` get a payload?** No payload. The component only knows the action was clicked; the host already has `post.id` in scope when wiring `onClick`. Pure callback.

## Pre-emptive locks (from analysis review + just-decided motion)

- **No framer-motion.** Heart-burst is CSS-keyframe-only. CSS transitions for hover / scale / fill on actions.
- **No new shadcn primitives required.** Uses `Button` (already a dep) only — no Avatar / Popover / Tooltip mandatory in v0.1 (`likersPreview` is a slot; if hosts need Tooltip on counts, they wrap it themselves).
- **Tree-shake-friendly heart-burst** — separate file, separate export, sibling CSS file imported only by the burst component; consumers that don't import `EngagementHeartBurst` literally do not load the keyframe CSS.
- **Discriminated `actions[]` strict** — extra fields rejected at the type level. Custom actions go through `kind: "custom"` with `id` / `label` / `icon`.
- **`<EngagementBar01>` is `"use client"`** — owns optimistic state, ref handle, subscription.
- **`<EngagementHeartBurst>` is RSC-compatible (no `"use client"`)** — pure declarative, uses `key={trigger}` remount to re-fire the keyframe. Retrofitted news-card / event-card surfaces don't pay a client-component boundary just to render a burst.
- **Realtime contract is the same `Subscribe<T>` shape** the analysis already locked for `comment-thread-01` — single mental model across the family.

---

**Awaiting your sign-off before I draft the plan doc.**

The big calls to make:
- Q1 (preserve actions order)
- Q2 (hybrid controlled/uncontrolled)
- Q3 (`engagementReducer` public from day-1)
- Q10 (heart-burst placement = host-owned)

If you redirect on any of those, the implementation shape changes meaningfully. Smaller questions (Q5–Q9, Q11–Q12) can resolve in plan-stage Q-P locks.
