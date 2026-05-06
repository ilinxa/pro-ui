# engagement-bar-01 — consumer guide

> Stage 3: usage notes for hosts. Updated for v0.1.1 (split heart-vs-count tap targets via `like.onCountClick`).
>
> See [description](./engagement-bar-01-procomp-description.md) for what & why; [plan](./engagement-bar-01-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/engagement-bar-01
```

This auto-installs the `button` and `avatar` shadcn primitives. Pulls `lucide-react` as an NPM peer dep.

**No framer-motion.** Heart-burst animation is pure CSS keyframes shipped as a sibling `engagement-heart-burst.css` file (via shadcn `registry:file` — first-of-kind in pro-ui). No consumer-side `globals.css` patching required.

Optional fixtures (sample action sets + synthetic realtime subscribe):

```bash
pnpm dlx shadcn@latest add @ilinxa/engagement-bar-01-fixtures
```

## When to reach for it

Anywhere a row of like / comment / share / bookmark / view-count / custom actions is needed under content:

- **Post cards** (Instagram-style) — `variant="default"` with the full like/comment/share/bookmark set
- **News card retrofit** — drop `variant="compact"` with `[like, share, bookmark]` into `content-card-news-01`'s `actions` slot for an instant social upgrade
- **Event card retrofit** — same pattern for "interested" / "share event" / "save"
- **Per-comment row** in `comment-thread-01` (later ship) — `variant="compact"` with `[like, custom-reply]`
- **Video overlays** (TikTok/Reels) — `variant="stacked"` for vertical action column over the right edge
- **Story viewer reactions** (later ship) — `variant="stacked"`
- **Product card** — `variant="default"` with `[like, share, custom-add-to-cart]`

## Common recipes

### 1. Minimal post engagement

```tsx
<EngagementBar01
  actions={[
    { kind: "like",     count: 142, liked: false, onToggle: (next) => onLike(post.id, next) },
    { kind: "comment",  count: 23,  onClick: () => openComments(post.id) },
    { kind: "share",    onClick: () => share(post.id) },
    { kind: "bookmark", bookmarked: false, onToggle: (next) => onBookmark(post.id, next) },
  ]}
/>
```

`like` / `comment` / `share` go left; `bookmark` drifts right via the default `align` rule. Click like → count flips optimistically (uncontrolled mode, internal state owns it).

### 1b. Split heart vs count (kasder UX)

Pass `onCountClick` on the `like` action and the bar splits the heart icon and the count number into two separate click targets. Heart fires `onToggle`; count fires `onCountClick`.

```tsx
<EngagementBar01
  actions={[
    {
      kind: "like",
      count: 142,
      liked: false,
      onToggle: (next) => onLike(post.id, next),
      onCountClick: () => openLikersPanel(post.id),  // separate target
    },
    { kind: "comment", count: 23, onClick: () => openComments(post.id) },
  ]}
  labels={{ openLikersPanel: "Show likers" }}  // aria-label for the count button
/>
```

Backwards-compatible: omit `onCountClick` and the bar renders the heart + count as one button (the original v0.1 behavior). When split, the count button gets a `hover:underline` affordance and `focus-visible:ring-2` for keyboard reachability. The split mode also visually matches the bundled-button gap (`gap-2`), so a row mixing split-like + bundled-comment + bundled-share looks consistent.

### 2. News-card / event-card retrofit (compact, no FM cost)

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

Same component, `compact` variant: tighter padding, smaller icons. Heart-burst not imported → zero CSS-keyframe overhead in the bundle. RSC-friendly because `EngagementHeartBurst` (the only client surface beyond the bar root) isn't pulled in.

### 3. Stacked overlay (TikTok / Reels)

```tsx
<div className="relative">
  <video src={post.videoUrl} className="h-full w-full" />
  <div className="absolute right-3 bottom-6">
    <EngagementBar01
      variant="stacked"
      actions={[
        { kind: "like",       count: post.likes,    liked: post.viewerLiked, onToggle },
        { kind: "comment",    count: post.comments, onClick: openComments },
        { kind: "share",      count: post.shares,   onClick: share },
        { kind: "view-count", count: post.views },
      ]}
      className="text-white"
    />
  </div>
</div>
```

In stacked mode the bar renders as a vertical column. `align` is silently ignored. View-count renders as a non-button `<div role="group">` (display-only).

### 4. Controlled vs uncontrolled (per-action, hybrid)

Per-action: pass `liked` / `bookmarked` → controlled (host owns state). Omit them → uncontrolled (bar flips state internally).

```tsx
// Uncontrolled — bar manages liked/bookmarked internally
<EngagementBar01
  actions={[
    { kind: "like",     count: 0, onToggle: console.log },
    { kind: "bookmark", onToggle: console.log },
  ]}
/>

// Controlled — host owns state, bar reflects props
const [liked, setLiked] = useState(false);
<EngagementBar01
  actions={[
    { kind: "like", count: 142, liked, onToggle: setLiked },
  ]}
/>
```

Don't flip a single action between modes across renders — it leaks internal state into the controlled flow. Pick one mode per action and stay there.

### 5. Realtime via `subscribe`

The contract: host provides `subscribe(handler) → Unsubscribe`. Bar invokes it on mount; calls returned `Unsubscribe` on unmount or when `subscribe` identity changes.

```tsx
const subscribe = useCallback(
  (handler) => channel.on("post.delta", handler),
  [channel],
);

<EngagementBar01
  actions={[/* ... */]}
  subscribe={subscribe}
  onSubscribeDelta={(delta) =>
    analytics.track("post.delta", { id: post.id, ...delta })
  }
/>
```

**In uncontrolled mode**, deltas patch internal state automatically AND fire `onSubscribeDelta`. **In controlled mode**, deltas only fire `onSubscribeDelta` — host translates them into prop updates on the next render. This split keeps controlled mode's state contract intact.

**Memoize `subscribe` via `useCallback`.** New identity = clean teardown + re-call (deltas in flight are NOT lost; the bar re-runs the effect only when identity actually changes).

### 6. Heart-burst (Instagram-style double-tap-to-like)

The canonical flow: `media-carousel-01` above → `engagement-bar-01` below + `<EngagementHeartBurst>` overlay between them.

```tsx
import { MediaCarousel01 } from "@ilinxa/media-carousel-01";
import {
  EngagementBar01,
  EngagementHeartBurst,
} from "@ilinxa/engagement-bar-01";

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
<EngagementBar01 ref={barRef} actions={[/* ... */]} />
```

`<EngagementHeartBurst>` is a sibling RSC sub-export — pure declarative, no `"use client"`. The `key={trigger}` pattern remounts the inner div on each counter increment, restarting the keyframe from zero. CSS lives in the sibling `engagement-heart-burst.css` (shipped via `registry:file`).

The host owns the burst counter — the bar's handle does NOT include `triggerHeartBurst()` (that would be misleading; the bar doesn't render the burst node). Host increments `burstKey` alongside calling `triggerLike()`.

### 7. Custom action

```tsx
import { Wand2 } from "lucide-react";

<EngagementBar01
  actions={[
    { kind: "like",   count: 89, liked: false, onToggle },
    { kind: "comment", count: 12, onClick },
    {
      kind: "custom",
      id: "remix",
      label: "Remix",
      icon: <Wand2 className="h-5 w-5" />,
      count: 3,           // optional
      active: false,      // optional — sets text-primary when true
      onClick: openRemixSheet,
    },
  ]}
/>
```

`kind: "custom"` accepts your own `icon`, `label` (used for `aria-label` and `aria-pressed` semantics if `active` is provided), optional `count`, and `onClick`. Use it for "Remix" / "Tip" / "Dispute" / "Report" / anything domain-specific.

### 8. Drive your own state externally with `engagementReducer`

For hosts that want to coordinate state across components (e.g., post-card-01 sharing optimistic state with a popover and the carousel):

```tsx
import {
  engagementReducer,
  deriveStateFromActions,
  type EngagementLocalAction,
} from "@ilinxa/engagement-bar-01";

const [state, dispatch] = useReducer(
  engagementReducer,
  myActions,
  deriveStateFromActions,
);

// Wire your own onToggle to dispatch:
const actions = useMemo(() => [
  {
    kind: "like" as const,
    count: state.likeCount,
    liked: state.liked,                          // controlled mode
    onToggle: () => dispatch({ kind: "like-toggle" }),
  },
], [state]);

<EngagementBar01 actions={actions} />
```

The bar respects controlled mode (no internal toggle); your reducer is the single source of truth.

### 9. Locale-specific count formatting

```tsx
const TR_LABELS: EngagementBarLabels = {
  like: "Beğen",
  unlike: "Beğenmekten vazgeç",
  comment: "Yorum",
  share: "Paylaş",
  bookmark: "Kaydet",
  unbookmark: "Kaydı kaldır",
  viewCount: "Görüntülenme",
  formatCount: (n) => new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n),
};

<EngagementBar01 actions={actions} labels={TR_LABELS} />
```

`labels.formatCount` overrides the built-in `formatEngagementCount`. Hoist `TR_LABELS` to module scope — defining inline busts the internal `React.memo`.

### 10. Likers preview slot

```tsx
function LikersStrip({ users, totalCount }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {users.slice(0, 4).map((u) => (
          <Avatar key={u.id} className="h-7 w-7 border-2 border-card">
            <AvatarImage src={u.avatar} />
            <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Liked by <strong>{users[0].name}</strong> and {totalCount - 1} others
      </span>
    </div>
  );
}

<EngagementBar01
  actions={[/* ... */]}
  likersPreview={<LikersStrip users={post.recentLikers} totalCount={post.likeCount} />}
/>
```

The slot renders below the action row when provided. The bar doesn't ship a `LikersStrip` of its own — hosts wire whatever pattern fits (avatar pile, popover with full list, "+12 others" pill).

## Anti-patterns

| Don't | Why |
|---|---|
| Pass inline `actions` array literal in a hot re-render path | Each render constructs a new array → bar re-renders even when nothing changed. Memoize via `useMemo` if the actions don't truly change every render. |
| Pass inline `labels` or `subscribe` props | Busts `React.memo` on the bar AND triggers subscribe re-runs. Hoist `labels` to module scope; memoize `subscribe` with `useCallback`. |
| Use `triggerHeartBurst()` on the bar's ref | Doesn't exist. Burst is host-owned — increment your own `burstKey` counter alongside `triggerLike()`. |
| Render `<EngagementHeartBurst>` inside the bar's children | Burst is a SIBLING — render alongside the bar (or above it, overlaying the media carousel). The burst doesn't position itself; pass `className` for placement. |
| Try to add framer-motion for the burst | Heart-burst is intentionally CSS-keyframe-only. Adding FM would re-introduce ~50KB to retrofit consumers (news-card / event-card) for an animation that doesn't need spring physics. The adoption gate for FM project-wide is `story-viewer-01`'s swipe-to-dismiss, not this. |
| Add fields to action discriminated union (`kind: "like"` with extra props) | Strict union — TypeScript rejects extras. Use `kind: "custom"` for domain-specific shapes. |
| Flip a single action between controlled / uncontrolled mode across renders | Mixes internal optimistic state with controlled props mid-flow. Pick a mode per action and stay there for the component's lifetime. |
| Pass a fresh `subscribe` identity on every render | Component re-runs the subscription effect → in-flight deltas can be missed. Use `useCallback` with stable deps. |

## Design decisions (the why)

### Why a slot for `likersPreview`, not a built-in component?

Three different consumers want three different patterns: post cards want a swipeable strip, news cards want "+12 others" pills, comment-thread per-comment rows want nothing at all. Baking in one design constrains everyone. The slot covers all three with no overhead.

### Why is the heart-burst a sibling sub-export?

Coupling the burst to the bar would force every retrofit consumer (news-card, event-card, comment-thread per-item) to render the keyframe even when they don't need double-tap-to-like. Sibling export = consumers pay only when they want it. Plus the burst usually overlays the **media above**, not the bar — host-owned positioning is the right model.

### Why `engagementReducer` public from day-1?

External state coordination is a "plausible consumer override" (per pro-ui's dynamicity rule). Hosts that want to drive optimistic state from a parent component shouldn't have to fork the bar. Public reducer + `deriveStateFromActions` helper lets them.

### Why no framer-motion?

The animations needed here (count flip, like scale-bump, heart burst) are 200–600ms scale/fade/color transitions. CSS keyframes match these pixel-perfect. FM's strengths (spring physics, gesture coordination, layout animations) aren't needed for any of these. Adopting it adds ~50KB per consumer that imports the bar's burst — a cost without a return. Project-wide, FM adoption is gated on `story-viewer-01`'s swipe-to-dismiss gesture; everything before that ships CSS-only.

### Why `registry:file` for the keyframe CSS?

The burst CSS needs to travel with the component. Three options: (A) inline `<style>` tag in the burst component (works, ugly), (B) require consumer to copy keyframes into their own `globals.css` (breaks "drop-in" promise), (C) sibling CSS file shipped via shadcn's `registry:file` (clean separation, registry-native). We picked (C). It's the **first non-`registry:component` entry** in pro-ui's registry — sets the precedent for any future component needing self-contained CSS.

## Limitations / caveats

- **No reaction emojis** (Facebook-style 6-emoji popover on long-press of like). Out of scope for v0.1; would be `kind: "reaction"` if added.
- **No built-in share menu** (copy-link / share-to-X). `share.onClick` opens the host's menu / native share sheet.
- **No animated count rolling** (digit-by-digit slot machine). Counts flip via instant CSS transform. v0.2 candidate if requested.
- **No long-press detection.** Click + double-tap (via host) only.
- **No per-action analytics auto-fire.** Wire your own analytics inside `onToggle` / `onClick` / `onSubscribeDelta`.
- **`kind: "view-count"` is display-only.** No `onClick`. View counts aren't user-actionable.
- **First-render of a stacked variant on the server**: layout SSRs correctly; `aria-pressed` reflects the initial `liked` / `bookmarked` props. Subscribe deltas fire only after hydration (client-only).

## Composition siblings

- [`expandable-text-01`](../expandable-text-01-procomp/) — first ship; primitive caption / body text with see-more.
- [`video-player-01`](../video-player-01-procomp/) — second ship; video item handler.
- [`media-carousel-01`](../media-carousel-01-procomp/) — third ship; image+video carousel. The double-tap source for the heart-burst flow.
- [`comment-thread-01`](../comment-thread-01-procomp/) (next ship) — recursive comment tree; uses `engagement-bar-01` per-comment in `compact` variant for like / reply.
- [`post-card-01`](../post-card-01-procomp/) (later) — Tier-2 composite combining all five primitives.
- [`content-card-news-01`](../content-card-news-01-procomp/) — earlier ship; gets `engagement-bar-01` retrofitted into its `actions` slot for instant social upgrade.
- [`event-card-01`](../event-card-01-procomp/) — earlier ship; same retrofit path.

## v0.2 candidates

- Reaction emojis (`kind: "reaction"` with multi-emoji popover)
- Animated count roll (digit-by-digit slot machine)
- `kind: "share"` with built-in share menu (copy-link / native share sheet)
- Per-action analytics hook (`onAnalyticsEvent?: (kind, payload) => void`)
- Long-press detection for power-user actions
- Sibling `<LikersStrip>` part if 3+ consumers reach for the same Embla pattern
- Optional ARIA `aria-describedby` linking like-count to a visually-hidden "X people liked this" string for richer screen-reader output
- `kind: "tip"` (creator monetization — opens a tip sheet)
