# engagement-bar — consumer guide

> Stage 3: usage notes for hosts. Updated for v0.5.0 — withheld counts, optimistic handlers, `disabled` / `hidden`, `trailing`, RTL, `locale`. Upgrading from 0.4.x: see [Upgrading to 0.5.0](#upgrading-to-050).
>
> See [description](./engagement-bar-procomp-description.md) for what & why; [plan](./engagement-bar-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/engagement-bar
```

This auto-installs the `button`, `avatar`, `input` and `popover` shadcn primitives. Pulls `lucide-react` as an NPM peer dep.

**No framer-motion.** Heart-burst animation is pure CSS keyframes shipped as a sibling `engagement-heart-burst.css` file (via shadcn `registry:file` — first-of-kind in pro-ui). No consumer-side `globals.css` patching required.

Optional fixtures (sample action sets + synthetic realtime subscribe):

```bash
pnpm dlx shadcn@latest add @ilinxa/engagement-bar-fixtures
```

## When to reach for it

Anywhere a row of like / comment / share / bookmark / view-count / custom actions is needed under content:

- **Post cards** (Instagram-style) — `variant="default"` with the full like/comment/share/bookmark set
- **News card retrofit** — drop `variant="compact"` with `[like, share, bookmark]` into `news-card`'s `actions` slot for an instant social upgrade
- **Event card retrofit** — same pattern for "interested" / "share event" / "save"
- **Per-comment row** in `comment-thread` (later ship) — `variant="compact"` with `[like, custom-reply]`
- **Video overlays** (TikTok/Reels) — `variant="stacked"` for vertical action column over the right edge
- **Story viewer reactions** (later ship) — `variant="stacked"`
- **Product card** — `variant="default"` with `[like, share, custom-add-to-cart]`

## Common recipes

### 1. Minimal post engagement

```tsx
<EngagementBar
  actions={[
    { kind: "like",     count: 142, liked: false, onToggle: (next) => onLike(post.id, next) },
    { kind: "comment",  count: 23,  onClick: () => openComments(post.id) },
    { kind: "share",    onClick: () => share(post.id) },
    { kind: "bookmark", bookmarked: false, onToggle: (next) => onBookmark(post.id, next) },
  ]}
/>
```

`like` / `comment` / `share` sit at the start of the row; `bookmark` sits at the end via the default `align` rule (`"start" | "end" | "auto"`; the old `"left"` / `"right"` still work as aliases and mirror under RTL). Click like → count flips at once (uncontrolled mode, internal state owns it). Each action's accessible name carries its visible count: "Like 142", "Comment 23".

### 1b. Split heart vs count (kasder UX)

Pass `onCountClick` on the `like` action and the bar splits the heart icon and the count number into two separate click targets. Heart fires `onToggle`; count fires `onCountClick`.

```tsx
<EngagementBar
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
  labels={{ openLikersPanel: "Show likers" }}  // count button name: "Show likers 142"
/>
```

Backwards-compatible: omit `onCountClick` and the bar renders the heart + count as one button (the original v0.1 behavior). When split, the count button gets a `hover:underline` affordance and `focus-visible:ring-2` for keyboard reachability. The split mode also visually matches the bundled-button gap (`gap-2`), so a row mixing split-like + bundled-comment + bundled-share looks consistent.

### 2. News-card / event-card retrofit (compact, no FM cost)

```tsx
<NewsCard
  /* ...all the news-card props */
  actions={
    <EngagementBar
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
    <EngagementBar
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
<EngagementBar
  actions={[
    { kind: "like",     count: 0, onToggle: console.log },
    { kind: "bookmark", onToggle: console.log },
  ]}
/>

// Controlled — host owns state, bar reflects props
const [liked, setLiked] = useState(false);
<EngagementBar
  actions={[
    { kind: "like", count: 142, liked, onToggle: setLiked },
  ]}
/>
```

Don't flip a single action between modes across renders — it leaks internal state into the controlled flow. Pick one mode per action and stay there.

**Optimistic handlers.** `onToggle` / `onSelect` may return a promise. The change then shows at once; a rejection rolls it back (to the props when controlled, to the last accepted value when uncontrolled); only the latest request decides, so an older request settling late never overrides a newer one. When the promise resolves but the parent never adopted the value, the props show again. `optimistic={false}` on the bar shows only the props (controlled) or only a settled change (uncontrolled). A synchronous handler behaves exactly as before.

```tsx
const [post, setPost] = useState(initialPost);
<EngagementBar
  actions={[
    {
      kind: "like",
      liked: post.liked,
      count: post.likeCount,
      onToggle: async (next) => {
        const saved = await api.like(post.id, next); // rejects → the heart and count roll back
        setPost((p) => ({ ...p, liked: saved.liked, likeCount: saved.likeCount }));
      },
    },
  ]}
/>
```

### 5. Realtime via `subscribe`

The contract: host provides `subscribe(handler) → Unsubscribe`. Bar invokes it on mount; calls returned `Unsubscribe` on unmount or when `subscribe` identity changes.

```tsx
const subscribe = useCallback(
  (handler) => channel.on("post.delta", handler),
  [channel],
);

<EngagementBar
  actions={[/* ... */]}
  subscribe={subscribe}
  onSubscribeDelta={(delta) =>
    analytics.track("post.delta", { id: post.id, ...delta })
  }
/>
```

**In uncontrolled mode**, deltas patch internal state automatically AND fire `onSubscribeDelta`. **In controlled mode** (`liked`, `bookmarked`, or a reaction's `viewerReaction` passed), deltas only fire `onSubscribeDelta` — host translates them into prop updates on the next render. This split keeps controlled mode's state contract intact.

`comment-count-changed` / `share-count-changed` / `view-count-changed`: those counts always come from the action's `count` prop, so a delta shows **until the prop next changes** — a refetch that changes the prop wins again, an unrelated re-render with the same prop keeps the delta's value.

**Memoize `subscribe` via `useCallback`.** New identity = clean teardown + re-call (deltas in flight are NOT lost; the bar re-runs the effect only when identity actually changes).

### 6. Heart-burst (Instagram-style double-tap-to-like)

The canonical flow: `media-carousel` above → `engagement-bar` below + `<EngagementHeartBurst>` overlay between them.

```tsx
import { MediaCarousel } from "@ilinxa/media-carousel";
import {
  EngagementBar,
  EngagementHeartBurst,
} from "@ilinxa/engagement-bar";

const barRef = useRef<EngagementBarHandle>(null);
const [burstKey, setBurstKey] = useState(0);

<div className="relative">
  <MediaCarousel
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
<EngagementBar ref={barRef} actions={[/* ... */]} />
```

`<EngagementHeartBurst>` is a sibling RSC sub-export — pure declarative, no `"use client"`. The `key={trigger}` pattern remounts the inner div on each counter increment, restarting the keyframe from zero. CSS lives in the sibling `engagement-heart-burst.css` (shipped via `registry:file`).

The host owns the burst counter — the bar's handle does NOT include `triggerHeartBurst()` (that would be misleading; the bar doesn't render the burst node). Host increments `burstKey` alongside calling `triggerLike()`.

### 7. Custom action

```tsx
import { Wand2 } from "lucide-react";

<EngagementBar
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

`kind: "custom"` accepts your own `icon`, `label` (the first part of the accessible name — "Remix 3" with a count; `aria-pressed` reflects `active` when provided), optional `count`, and `onClick`. Use it for "Remix" / "Tip" / "Dispute" / "Report" / anything domain-specific.

### 8. Drive your own state externally with `engagementReducer`

For hosts that want to coordinate state across components (e.g., post-card sharing optimistic state with a popover and the carousel):

```tsx
import {
  engagementReducer,
  deriveStateFromActions,
  type EngagementLocalAction,
} from "@ilinxa/engagement-bar";

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

<EngagementBar actions={actions} />
```

The bar respects controlled mode (no internal toggle); your reducer is the single source of truth.

### 9. Locale, labels and count formatting

```tsx
const TR_LABELS: EngagementBarLabels = {
  like: "Beğen",
  unlike: "Beğenmekten vazgeç",
  comment: "Yorum",
  share: "Paylaş",
  bookmark: "Kaydet",
  unbookmark: "Kaydı kaldır",
  viewCount: "Görüntülenme",
};

<EngagementBar actions={actions} labels={TR_LABELS} locale="tr" />
```

`locale` (default `"en"`) drives the default formatter, `Intl.NumberFormat(locale, { notation: "compact" })`: 1200 reads "1.2K" in English and "1,2 B" in Turkish. An invalid tag (`"en_US"`) falls back to `"en"` rather than throwing. Pass `formatCount` to replace it. `labels.formatCount` still works as a deprecated alias when `formatCount` is not set. A label left `undefined` keeps its English default. Hoist `TR_LABELS` to module scope — defining inline busts the internal `React.memo`.

The server and the browser must format the same way for hydration to match: both use the platform's ICU data, so pin the same `locale` on both sides.

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

<EngagementBar
  actions={[/* ... */]}
  likersPreview={<LikersStrip users={post.recentLikers} totalCount={post.likeCount} />}
/>
```

The slot renders below the action row when provided — wire whatever pattern fits (avatar pile, popover with full list, "+12 others" pill), or use the shipped `<LikersStrip>` (recipe 15).

### 11. FB-style multi-kind reactions (v0.3.0)

`kind: "reaction"` ships the LinkedIn / Facebook pattern: one reaction per viewer per content item, picked from a host-supplied catalog.

```tsx
import { Heart, Laugh, PartyPopper, Frown, Angry } from "lucide-react";
import type { EngagementReactionKind } from "@ilinxa/engagement-bar";

const REACTION_KINDS: EngagementReactionKind[] = [
  { key: "love",  icon: <Heart className="h-5 w-5 fill-current" />, label: "Love",  count: 124, color: "#e0245e" },
  { key: "laugh", icon: <Laugh className="h-5 w-5" />,              label: "Laugh", count: 38,  color: "#f7b928" },
  { key: "wow",   icon: <PartyPopper className="h-5 w-5" />,        label: "Wow",   count: 12,  color: "#9b59b6" },
  { key: "sad",   icon: <Frown className="h-5 w-5" />,              label: "Sad",   count: 5,   color: "#5b9bd5" },
  { key: "angry", icon: <Angry className="h-5 w-5" />,              label: "Angry", count: 2,   color: "#e74c3c" },
];

<EngagementBar
  actions={[
    {
      kind: "reaction",
      kinds: REACTION_KINDS,
      totalCount: 181,
      onSelect: (kind) => updatePostReaction(post.id, kind), // null clears
      onCountClick: () => openReactorsPanel(post.id),
      // viewerReaction: "love",        // optional — sets controlled mode
      // clearOnTap: false,             // FB-Reactions parity (tap opens picker, no clear)
    },
    { kind: "comment", count: 28, onClick: openComments },
    { kind: "share",   count: 11, onClick: openShareSheet },
    { kind: "bookmark", onToggle: toggleBookmark },
  ]}
  reactionsPreview={<ReactorsPreview />}
/>
```

**Interaction model:**

| State | Tap | Long-press (≥350ms) |
|---|---|---|
| `viewerReaction = null` | Open picker | Open picker |
| `viewerReaction = "love"`, `clearOnTap: true` (default) | Clear → `onSelect(null)` | Open picker |
| `viewerReaction = "love"`, `clearOnTap: false` | Open picker | Open picker |

The picker shows all kinds in a horizontal row with full colors + per-kind live counts; a Remove (`×`) button appears on the right when a reaction is set.

**Uncontrolled reaction** (no `viewerReaction` passed). After mount, `state.reactionCounts[k.key]` is the live tally; `kinds[i].count` and `totalCount` are the SEED only. Picks update the mirror, server `reaction-changed` deltas replace it. A new `kinds` array on re-render does NOT re-init counts.

**Controlled reaction** (`viewerReaction` passed, string OR explicit `null`). The host owns the viewer's reaction **and the counts**: `viewerReaction`, every `kinds[i].count` and `totalCount` win on every render (the same pairing as `liked` + `count` on a like). The bar no longer applies `reaction-changed` deltas itself — handle them in `onSubscribeDelta` and re-render. Return a promise from `onSelect` for an optimistic pick with rollback (recipe 4).

**Hybrid with `kind: "like"`** (Q-P3 lock — supported pattern):

```tsx
<EngagementBar
  actions={[
    { kind: "like", count: 67, onToggle: toggleLike },
    {
      kind: "reaction",
      kinds: REACTION_KINDS,
      totalCount: 181,
      onSelect: updatePostReaction,
    },
    { kind: "comment", count: 14, onClick: openComments },
  ]}
/>
```

Library does NOT enforce mutual exclusion — both render in array order, interact independently. Use for products that want classic thumbs-up alongside emoji-reactions.

**Reactors preview slot.** `reactionsPreview?: ReactNode` is parallel to `likersPreview` — rendered below the action row in all 3 variants. When both are passed, `likersPreview` renders first, then `reactionsPreview`. Host owns the markup (avatar pile / "X reacted" pill / popover trigger).

**Imperative handle additions:**

```tsx
const barRef = useRef<EngagementBarHandle>(null);

// Programmatically set the viewer's reaction (validates `kind` is in the catalog or null).
barRef.current?.triggerReaction("laugh");
barRef.current?.triggerReaction(null);    // clear

// Convenience read.
const current = barRef.current?.getCurrentReaction(); // string | null
```

### 12. Withheld counts

```tsx
<EngagementBar
  actions={[
    { kind: "like", count: post.hideLikes ? null : post.likeCount, onToggle },
    { kind: "comment", count: null, onClick },                  // no number
    { kind: "reaction", kinds, totalCount: null, onSelect },    // per-kind count: null too
  ]}
/>
```

`null` (or omitting `count`) renders no number and keeps the count out of every accessible name ("Like", not "Like 0"). `0` still renders "0". A withheld count stays withheld through clicks, deltas and optimistic updates — liking flips the heart, the number stays hidden. A split like (`onCountClick`) with a withheld count renders no count button.

### 13. Gating and host actions

```tsx
<EngagementBar
  actions={[
    { kind: "like", count: 12, disabled: !viewer, onToggle },   // aria-disabled, never calls onToggle
    { kind: "share", hidden: !canShare, onClick },               // renders nothing
    { kind: "bookmark", onToggle },
  ]}
  trailing={<PostReportMenu postId={post.id} />}
/>
```

`disabled` keeps the action focusable with `aria-disabled="true"` and blocks click, keyboard, long-press and the imperative handle (`triggerLike()` on a disabled like is a no-op). It disables the **whole** action, including a split count button (`onCountClick`) — if a viewer who can't like should still open the likers list, put that entry point elsewhere (e.g. `likersPreview`). `view-count` is display-only and takes `hidden`, not `disabled`. `hidden` removes the action; the handle treats it as absent. `trailing` renders inside the row after the end-aligned actions (stacked: after the last action), in focus order.

### 14. Right-to-left

Put the bar under `dir="rtl"` (or pass `dir="rtl"`). The row mirrors through logical utilities; the reaction picker's ← / → follow the direction (→ moves to the previous kind) and Home / End jump to the ends. The picker renders in a portal, so the bar passes its resolved direction to it. The direction is read once after mount — pass `dir` if your app switches direction at runtime without remounting. A swipe that starts on the reaction button scrolls the page; long-press still opens the picker.

### 15. `LikersStrip` and `ShareMenu`

```tsx
<LikersStrip
  totalCount={post.likeCount}            // null → the pill shows a "More" label, no number
  likers={likers}
  onLikersChange={setLikers}             // controlled: load-more calls this with prop + loaded
  onLoadMore={fetchNextLikers}
  labels={{ heading: "Beğenenler", moreAriaLabel: (n, formatted) => formatted + " kişi daha" }}
  locale="tr"
/>
<ShareMenu users={suggestions} onSearch={searchPeople} onShareTo={share} labels={{ searchLabel: "Kişi ara" }} locale="tr" />
```

`LikersStrip`: `likers` + `onLikersChange` is controlled; `likers` alone shows the prop on every render plus the pages the strip loaded itself (de-duplicated by `id`); `defaultLikers` is read once. A rejected `onLoadMore` leaves the list as it was. `heading`, `closeLabel` and `moreAriaLabelTemplate` still work as deprecated aliases of `labels`. `ShareMenu`: async search is latest-request-wins and falls back to the local filter on a rejection; the local filter lower-cases with `locale`.

## Upgrading to 0.5.0

| 0.4.x | 0.5.0 | Why |
|---|---|---|
| `EngagementState` counts are `number` | `number \| null` (`null` = withheld) | consumer contract C6 |
| A controlled `viewerReaction` left counts to the bar, which applied `reaction-changed` | counts + `totalCount` follow the props; apply `reaction-changed` yourself in `onSubscribeDelta` | consumer contract C5: a defined prop wins on every render |
| English counts "1.2k", "10k" (floored) | "1.2K", "11K" (Intl compact, rounded) | locale-aware formatting (C3) |
| Action names "Like" | "Like 142" (the visible count is part of the name) | WCAG 2.5.3 |
| `labels.formatCount` | `formatCount` prop (old key still honoured) | formatter props (C3) |
| `DEFAULT_ENGAGEMENT_BAR_LABELS` | `defaultEngagementBarLabels` (old name kept as an alias) | naming convention |
| `align: "left" \| "right"` | `"start" \| "end"` (old values kept as aliases) | RTL (C4) |
| `triggerReaction(sameKind)` still fired `onSelect` | no-op, like picking the same kind in the picker | one path for both |
| `LikersStrip likers={…}` was read once | follows the prop on every render, plus the pages the strip loaded itself (de-duplicated by `id`) | consumer contract C5 |
| `LikersStrip` "+N" pill and `moreAriaLabelTemplate` got the raw number | a compact-formatted count ("+1.2K more") | locale-aware formatting (C3) |
| `view-count` accepted nothing to disable it | `disabled` is not accepted on `view-count` (display-only); use `hidden` | no inert props |

## Anti-patterns

| Don't | Why |
|---|---|
| Pass inline `actions` array literal in a hot re-render path | Each render constructs a new array → bar re-renders even when nothing changed. Memoize via `useMemo` if the actions don't truly change every render. |
| Pass inline `labels` or `subscribe` props | Busts `React.memo` on the bar AND triggers subscribe re-runs. Hoist `labels` to module scope; memoize `subscribe` with `useCallback`. |
| Use `triggerHeartBurst()` on the bar's ref | Doesn't exist. Burst is host-owned — increment your own `burstKey` counter alongside `triggerLike()`. |
| Render `<EngagementHeartBurst>` inside the bar's children | Burst is a SIBLING — render alongside the bar (or above it, overlaying the media carousel). The burst doesn't position itself; pass `className` for placement. |
| Try to add framer-motion for the burst | Heart-burst is intentionally CSS-keyframe-only. Adding FM would re-introduce ~50KB to retrofit consumers (news-card / event-card) for an animation that doesn't need spring physics. The adoption gate for FM project-wide is `story-viewer`'s swipe-to-dismiss, not this. |
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

The animations needed here (count flip, like scale-bump, heart burst) are 200–600ms scale/fade/color transitions. CSS keyframes match these pixel-perfect. FM's strengths (spring physics, gesture coordination, layout animations) aren't needed for any of these. Adopting it adds ~50KB per consumer that imports the bar's burst — a cost without a return. Project-wide, FM adoption is gated on `story-viewer`'s swipe-to-dismiss gesture; everything before that ships CSS-only.

### Why `registry:file` for the keyframe CSS?

The burst CSS needs to travel with the component. Three options: (A) inline `<style>` tag in the burst component (works, ugly), (B) require consumer to copy keyframes into their own `globals.css` (breaks "drop-in" promise), (C) sibling CSS file shipped via shadcn's `registry:file` (clean separation, registry-native). We picked (C). It's the **first non-`registry:component` entry** in pro-ui's registry — sets the precedent for any future component needing self-contained CSS.

## Limitations / caveats

- **No built-in share menu** (copy-link / share-to-X). `share.onClick` opens the host's menu / native share sheet.
- **No animated count rolling** (digit-by-digit slot machine). Counts flip via instant CSS transform. Not implemented.
- **Long-press is reaction-specific** (350ms on the reaction action opens the picker). Not generalized across other actions.
- **Controlled reaction + realtime:** the bar does not apply `reaction-changed` to a controlled reaction — process the delta in `onSubscribeDelta` and re-render with the new counts / viewer. Uncontrolled hosts are unaffected.
- **No per-action analytics auto-fire.** Wire your own analytics inside `onToggle` / `onClick` / `onSubscribeDelta`.
- **`kind: "view-count"` is display-only.** No `onClick`. View counts aren't user-actionable.
- **First-render of a stacked variant on the server**: layout SSRs correctly; `aria-pressed` reflects the initial `liked` / `bookmarked` props. Subscribe deltas fire only after hydration (client-only).

## Composition siblings

- [`expandable-text`](../expandable-text-procomp/) — first ship; primitive caption / body text with see-more.
- [`video-player`](../video-player-procomp/) — second ship; video item handler.
- [`media-carousel`](../media-carousel-procomp/) — third ship; image+video carousel. The double-tap source for the heart-burst flow.
- [`comment-thread`](../comment-thread-procomp/) (next ship) — recursive comment tree; uses `engagement-bar` per-comment in `compact` variant for like / reply.
- [`post-card`](../post-card-procomp/) (later) — Tier-2 composite combining all five primitives.
- [`news-card`](../news-card-procomp/) — earlier ship; gets `engagement-bar` retrofitted into its `actions` slot for instant social upgrade.
- [`event-card`](../event-card-procomp/) — earlier ship; same retrofit path.

## Candidates (not scheduled)

- Animated count roll (digit-by-digit slot machine)
- `kind: "share"` with built-in share menu (copy-link / native share sheet)
- Per-action analytics hook (`onAnalyticsEvent?: (kind, payload) => void`)
- General long-press detection across all actions (currently reaction-only)
- FB-style picker open animation (bouncy hover-burst); v0.3 ships fade-in only
- `kind: "tip"` (creator monetization — opens a tip sheet)
- Comment reactions (reactions on individual comments — `comment-thread` extension)

**Delivered in v0.3.0** (was on the v0.2 candidates list): reaction emojis (`kind: "reaction"` with multi-kind picker, host-supplied `kinds` catalog, configurable `clearOnTap`, hybrid-with-like coexistence), long-press detection (reaction-specific), `<LikersStrip>` and `<ShareMenu>` were delivered in v0.2.0.

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `engagement-bar`, they import only from `engagement-bar.tsx`.

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly. Anything you want shareable across folder boundaries MUST be re-exported from `<slug>.tsx`.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.
