# engagement-bar-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`engagement-bar-01-procomp-description.md`](./engagement-bar-01-procomp-description.md) for the what & why.
>
> Migration origin: [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `PostEngagementPanel.tsx` (468 LOC). We extract only the action-row concern; comments → `comment-thread-01` (next ship), likers carousel → `likersPreview` slot.

## Q-P locks (commitments before code)

| # | Question (from description) | Locked answer |
|---|---|---|
| Q-P1 | `actions[]` order — preserve as written, or auto-sort? | **Preserve as written.** Hosts choose order. Default `align` rules apply: `bookmark` + `view-count` get `align: "right"` if not specified; everything else `align: "left"`. Per-action `align?: "left" \| "right" \| "auto"` overrides. |
| Q-P2 | Optimistic state — single internal mode, or controlled / uncontrolled split? | **Hybrid (option A).** Same prop; if host passes `liked` / `count` / `bookmarked`, those win on every render. If omitted, component owns. Matches React `<input value>` convention. Mode is determined per-action, per-render. |
| Q-P3 | `engagementReducer` — public from day-1? | **Public from day-1.** Exported from `index.ts`. |
| Q-P4 | Heart-burst sub-export path? | **`./parts/engagement-heart-burst.tsx` re-exported from `index.ts`.** Sibling CSS file `engagement-heart-burst.css` shipped as a `registry:file` peer; component imports the CSS sibling. Optional deep-import path: `@ilinxa/engagement-bar-01/parts/engagement-heart-burst` if Next's barrel-file analyzer ever trips for retrofit consumers. |
| Q-P5 | `view-count` toggleable? | **No.** Display-only. `kind: "view-count"` has no `onClick` in the union. |
| Q-P6 | Counts ≤ 0 — render or hide? | **Render as `0`.** Predictable layout > clean empty state. Hosts omit the action entirely if they want hide-when-zero. |
| Q-P7 | `like` action with no `liked` prop — default? | **`false`.** Heart starts unfilled; first click fills it (uncontrolled mode owns from there). |
| Q-P8 | `onToggle` invocation timing relative to optimistic state update? | **Local state flips first, then `onToggle(next)` fires.** Standard optimistic UI. |
| Q-P9 | `subscribe` re-subscription on prop change — debounce? | **No.** Subscribe is identity-stable per host convention. Identity change → clean teardown + re-call. |
| Q-P10 | Heart-burst placement — host or built-in? | **Host-owned.** Bar handle does NOT include `triggerHeartBurst()`. Host increments `burstKey` counter alongside calling `barRef.current?.triggerLike()`. |
| Q-P11 | `view-count` icon? | **`Eye` from lucide, locked.** Consumers wanting different icon use `kind: "custom"` with `icon` slot. |
| Q-P12 | Deep-link payload on `comment.onClick`? | **No payload.** Pure callback; host has `post.id` in scope when wiring. |

## Pre-emptive design locks

- **No new peer deps.** Lucide is already a dep. Embla is NOT used here (the kasder likers Embla strip moves to the `likersPreview` slot, host-owned).
- **No framer-motion.** Heart-burst is CSS keyframes; action transitions are Tailwind utilities (`transition-transform duration-200`, `transition-colors`).
- **`<EngagementBar01>` is `"use client"`** — owns optimistic state + ref handle + subscription effect.
- **`<EngagementHeartBurst>` is RSC-compatible** — pure declarative; uses `key={trigger}` remount to re-fire the keyframe. No hooks. NO `"use client"` directive.
- **`engagement-heart-burst.css` is a sibling file** — shipped via shadcn `registry:file`. Imported by `engagement-heart-burst.tsx` via `import "./engagement-heart-burst.css"`. Self-contained; consumer's globals.css untouched.
- **`React.memo` at export** for the bar.
- **Discriminated `actions[]` strict** — no extra fields; custom shapes go through `kind: "custom"`.
- **a11y**: each action `<button>`; `aria-pressed` for `like` / `bookmark` (current state); count `aria-live="polite"` debounced 300ms; burst `aria-hidden="true"`.
- **Subscribe contract** identical shape to the one comment-thread-01 will use (`Subscribe<T>` / `Unsubscribe`) — `Subscribe` type lives in this folder for now; if comment-thread-01 ends up needing it, we promote to a shared utils path then. Until then: local.

## Final API

### Public types

```ts
// src/registry/components/data/engagement-bar-01/types.ts

import type { ReactNode } from "react";

export type EngagementBar01Variant = "default" | "compact" | "stacked";

export type EngagementActionAlign = "left" | "right" | "auto";

/** Discriminated union — strict shape. */
export type EngagementAction =
  | {
      kind: "like";
      count: number;
      liked?: boolean;
      onToggle?: (next: boolean) => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "comment";
      count: number;
      onClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "share";
      count?: number;
      onClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "bookmark";
      bookmarked?: boolean;
      onToggle?: (next: boolean) => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "view-count";
      count: number;
      align?: EngagementActionAlign;
    }
  | {
      kind: "custom";
      id: string;
      label: string;
      icon: ReactNode;
      count?: number;
      active?: boolean;
      onClick?: () => void;
      align?: EngagementActionAlign;
    };

/** Realtime delta union. */
export type EngagementDelta =
  | { kind: "like-changed"; count: number; liked?: boolean; userId?: string }
  | { kind: "comment-count-changed"; count: number }
  | { kind: "share-count-changed"; count: number }
  | { kind: "view-count-changed"; count: number }
  | { kind: "bookmark-changed"; bookmarked: boolean }
  | { kind: "liker-added"; user: EngagementLikeUser }
  | { kind: "liker-removed"; userId: string };

export interface EngagementLikeUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface EngagementBarLabels {
  /** Default: "Like". aria-label when not liked. */
  like?: string;
  /** Default: "Unlike". aria-label when liked. */
  unlike?: string;
  /** Default: "Comment". aria-label on comment action. */
  comment?: string;
  /** Default: "Share". aria-label on share action. */
  share?: string;
  /** Default: "Bookmark". aria-label when not bookmarked. */
  bookmark?: string;
  /** Default: "Remove bookmark". aria-label when bookmarked. */
  unbookmark?: string;
  /** Default: "Views". aria-label on view-count display. */
  viewCount?: string;
  /** Optional locale-aware count formatter. Defaults to formatEngagementCount. */
  formatCount?: (n: number) => string;
}

export interface EngagementBar01Props {
  /** The actions to render. Required. Order = render order. */
  actions: EngagementAction[];
  /** Variant. Default: "default". */
  variant?: EngagementBar01Variant;
  /** Realtime subscription. Optional. */
  subscribe?: Subscribe<EngagementDelta>;
  /** Fires for every delta the subscription emits, regardless of mode. */
  onSubscribeDelta?: (delta: EngagementDelta) => void;
  /** Slot rendered below the action row. Hosts use for likers preview / "X liked this" / etc. */
  likersPreview?: ReactNode;
  /** Localized labels. Defaults are English. */
  labels?: EngagementBarLabels;
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for each action button. */
  actionClassName?: string;
}

export interface EngagementBar01Handle {
  /** Programmatically toggle the like action (flips state + fires onToggle). */
  triggerLike: () => void;
  /** Programmatically toggle the bookmark action. */
  triggerBookmark: () => void;
  /** Read the current optimistic state of all toggleable actions. */
  getCurrentState: () => EngagementState;
  /** Reset internal optimistic state to props' values (no-op for fully-controlled mode). */
  reset: () => void;
}

/** Internal optimistic state shape. Public-readable via getCurrentState() / engagementReducer. */
export interface EngagementState {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number | null;   // null when no share action present
  viewCount: number | null;
  bookmarked: boolean;
}

export const DEFAULT_ENGAGEMENT_BAR_LABELS: Required<Omit<EngagementBarLabels, "formatCount">> = {
  like: "Like",
  unlike: "Unlike",
  comment: "Comment",
  share: "Share",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  viewCount: "Views",
};
```

### Reducer signature

```ts
// hooks/use-engagement-state.ts (PUBLIC EXPORT — re-exported from index.ts)

export type EngagementLocalAction =
  | { kind: "like-toggle" }
  | { kind: "bookmark-toggle" }
  | { kind: "subscribe-delta"; delta: EngagementDelta }
  | { kind: "reset"; next: EngagementState };

export function engagementReducer(
  state: EngagementState,
  action: EngagementLocalAction,
): EngagementState;

/** Internal hook — wraps useReducer + sync to controlled props + subscription effect. */
export function useEngagementState(opts: {
  actions: EngagementAction[];
  subscribe?: Subscribe<EngagementDelta>;
  onSubscribeDelta?: (delta: EngagementDelta) => void;
}): {
  state: EngagementState;
  dispatch: React.Dispatch<EngagementLocalAction>;
  /** True per-action when host passes the controlled prop (liked / bookmarked / count). */
  controlled: { liked: boolean; bookmarked: boolean; likeCount: boolean; /* ... */ };
};
```

### Helper

```ts
// utils/format-count.ts (PUBLIC EXPORT — re-exported from index.ts)

/**
 * Humanizes engagement counts:
 *  -    0 →     "0"
 *  -  999 →   "999"
 *  - 1000 →   "1k"
 *  - 1234 →   "1.2k"
 *  - 12_345 → "12.3k"
 *  - 1_234_567 → "1.2m"
 *  - 1_234_567_890 → "1.2b"
 *
 * Locale-agnostic; uses '.' decimal separator. Hosts wanting locale-specific
 * formatting pass `labels.formatCount` to override entirely.
 */
export function formatEngagementCount(n: number): string;
```

### Exported names

```ts
// index.ts
export { EngagementBar01 } from "./engagement-bar-01";
export { EngagementHeartBurst } from "./parts/engagement-heart-burst";
export {
  engagementReducer,
  useEngagementState,
} from "./hooks/use-engagement-state";
export { formatEngagementCount } from "./utils/format-count";

export type {
  EngagementBar01Props,
  EngagementBar01Handle,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementAction,
  EngagementActionAlign,
  EngagementDelta,
  EngagementLikeUser,
  EngagementState,
  EngagementLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";

export { meta } from "./meta";
```

## File-by-file plan

**16 files.** Sealed-folder.

```
src/registry/components/data/engagement-bar-01/
├── engagement-bar-01.tsx                # 1 — root component
├── parts/
│   ├── action-button.tsx                # 2 — single action <button> renderer (handles all kinds via switch)
│   ├── like-action.tsx                  # 3 — Heart + count; CSS scale on liked toggle
│   ├── comment-action.tsx               # 4 — MessageCircle + count
│   ├── share-action.tsx                 # 5 — Share2 + optional count
│   ├── bookmark-action.tsx              # 6 — Bookmark + active fill
│   ├── view-count-action.tsx            # 7 — Eye + count (display-only)
│   ├── custom-action.tsx                # 8 — host-provided icon + label + count
│   ├── engagement-heart-burst.tsx       # 9 — RSC sub-export; key-driven keyframe
│   └── engagement-heart-burst.css       # 10 — keyframe definition (sibling CSS file)
├── hooks/
│   └── use-engagement-state.ts          # 11 — useReducer + controlled prop sync + subscription effect
├── utils/
│   └── format-count.ts                  # 12
├── types.ts                             # 13
├── dummy-data.ts                        # 14
├── demo.tsx                             # 15
├── usage.tsx                            # 16
├── meta.ts                              # 17
└── index.ts                             # 18
```

(Counted as "16 component files" + 2 docs-only — 18 total in the sealed folder; 14 ship via registry. `demo.tsx`, `usage.tsx`, `meta.ts`, `dummy-data.ts` skip the registry per locked convention; `dummy-data.ts` ships in the `-fixtures` sibling item.)

### 1. `engagement-bar-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults: `variant ?? "default"`.
- Calls `useEngagementState({ actions, subscribe, onSubscribeDelta })` — owns optimistic state + subscription effect.
- Computes `actionsWithAlign`: maps each action to `{ ...action, resolvedAlign: action.align ?? defaultAlignFor(action.kind) }` where `defaultAlignFor` returns `"right"` for `bookmark` + `view-count`, else `"left"`.
- Splits into `leftActions` + `rightActions` arrays via `resolvedAlign`.
- Renders:

  ```tsx
  <div className={cn(rootClassName, className)}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {leftActions.map(action => <ActionButton ... />)}
      </div>
      {rightActions.length > 0 && (
        <div className="flex items-center gap-1">
          {rightActions.map(action => <ActionButton ... />)}
        </div>
      )}
    </div>
    {likersPreview ? <div className="mt-2">{likersPreview}</div> : null}
  </div>
  ```

- `useImperativeHandle` exposes `triggerLike` / `triggerBookmark` / `getCurrentState` / `reset`.
  - `triggerLike()` → `dispatch({ kind: "like-toggle" })`; finds `like` action's `onToggle` and fires it post-flip.
  - `getCurrentState()` returns the current `state` snapshot via a `currentStateRef` (stable identity pattern matching media-carousel-01).
  - `reset()` → `dispatch({ kind: "reset", next: deriveStateFromActions(actions) })`.
- Variant-driven layout:
  - `default` → outer wrapper `flex flex-col gap-2`; inner row `flex items-center justify-between` (left + right action groups split via `align`).
  - `compact` → outer wrapper `flex flex-col gap-1`; inner row identical to default.
  - `stacked` → outer wrapper `flex flex-col items-center gap-3` (TikTok/Reels overlay style — actions stack **vertically along the right edge** of the host's content). **No left/right split** — `align` is silently ignored in stacked mode. Each action's per-action layout is also vertical (`flex flex-col items-center gap-0.5`).
- **`format` helper resolution (locked):** at the root, compute `const format = labels.formatCount ?? formatEngagementCount` once per render and pass `format` down to every action part. Action parts never call `formatEngagementCount` directly — they call `format(count)`. This keeps locale overrides truthful across the whole bar without per-action plumbing.

### 2. `parts/action-button.tsx` — dispatcher

- Switches on `action.kind` and renders the matching specialized button:
  - `like` → `<LikeAction ... />`
  - `comment` → `<CommentAction ... />`
  - `share` → `<ShareAction ... />`
  - `bookmark` → `<BookmarkAction ... />`
  - `view-count` → `<ViewCountAction ... />`
  - `custom` → `<CustomAction ... />`
- Passes `variant`, `state`, `dispatch`, `controlled`, `format`, `labels`, `actionClassName` down to each.
- **Click handlers live INSIDE each action part**, closing over its own props (`state`, `dispatch`, `controlled`, `action.onToggle` / `action.onClick`). The bar root just passes raw props down — no `useCallback` upstream, no per-action handler memoization (would be a hooks-rules violation inside `.map()` anyway). `React.memo` on each action part keeps re-renders cheap when props are stable.

### 3. `parts/like-action.tsx`

- Uses `state.liked` + `state.likeCount` from props (sync'd from reducer).
- Click handler: if controlled (host passed `liked`), fires `action.onToggle?.(!state.liked)` only — does NOT dispatch local toggle (host owns). If uncontrolled, dispatches `{ kind: "like-toggle" }` THEN fires `onToggle(next)`.
- Renders `<Button variant="ghost" size="sm" aria-pressed={liked} aria-label={liked ? labels.unlike : labels.like}>`:
  - default: `<Heart className={cn("h-5 w-5 transition-transform", liked && "fill-current scale-110")} />` + count span.
  - compact: same icon (smaller `h-4 w-4`); count rendered as superscript only when > 0.
  - stacked: icon above count, `flex flex-col items-center gap-0.5`.
- Liked color: `text-destructive` per kasder convention.

### 4. `parts/comment-action.tsx`

- Renders `<Button variant="ghost" size="sm" aria-label={labels.comment}>` with `<MessageCircle />` + count.
- `onClick={action.onClick}` — pure callback; no internal state.

### 5. `parts/share-action.tsx`

- Same pattern as comment. Icon: `<Share2 />`. Count optional — render only if `action.count !== undefined`.

### 6. `parts/bookmark-action.tsx`

- Same controlled/uncontrolled pattern as like-action.
- Icon: `<Bookmark className={cn(bookmarked && "fill-current")} />`.
- aria-label: `bookmarked ? labels.unbookmark : labels.bookmark`.

### 7. `parts/view-count-action.tsx`

- Renders as `<div role="group" aria-label={labels.viewCount}>` containing `<Eye />` icon + formatted count (NOT a button — display-only per Q-P5; group role makes the icon+count relationship explicit to screen readers).
- Icon: `<Eye />` (Q-P11).
- Count span gets `aria-live="polite"` so screen readers announce updates without spam.

### 8. `parts/custom-action.tsx`

- Renders `<Button variant="ghost" size="sm" aria-label={action.label} aria-pressed={action.active ? "true" : undefined}>` with `{action.icon}` and optional count.
- Click handler is just `action.onClick`.

### 9. `parts/engagement-heart-burst.tsx` — RSC sub-export

```tsx
import "./engagement-heart-burst.css";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EngagementHeartBurstProps {
  /** Increment to trigger the burst animation. */
  trigger: number;
  /** Override classes for the burst container. */
  className?: string;
}

export function EngagementHeartBurst({ trigger, className }: EngagementHeartBurstProps) {
  // trigger=0 means "never burst" — don't render at all on first mount.
  if (trigger === 0) return null;

  return (
    <div
      key={trigger}
      aria-hidden="true"
      className={cn("pointer-events-none flex items-center justify-center", className)}
    >
      <Heart className="engagement-heart-burst-icon h-24 w-24 text-destructive fill-current" />
    </div>
  );
}
```

- **No `"use client"` directive** — this is an RSC component. Pure declarative; the `key={trigger}` pattern forces the `<div>` to remount each time `trigger` changes, restarting the keyframe.
- Optional `aria-hidden="true"` on the wrapper since this is decorative.
- The `engagement-heart-burst-icon` class drives the keyframe (defined in the sibling `.css` file).

### 10. `parts/engagement-heart-burst.css`

```css
@keyframes engagement-heart-burst {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  35% {
    transform: scale(1.4);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.engagement-heart-burst-icon {
  animation: engagement-heart-burst 600ms cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .engagement-heart-burst-icon {
    animation: engagement-heart-burst 200ms linear forwards;
  }
}
```

- Self-contained — no Tailwind dependency.
- `forwards` keeps the final state (opacity 0) so the heart stays invisible after the burst.
- `prefers-reduced-motion` shortens the animation but keeps the visual cue.
- Component file imports it via `import "./engagement-heart-burst.css"` — Next.js handles the bundling.

### 11. `hooks/use-engagement-state.ts`

```ts
export function useEngagementState(opts: {
  actions: EngagementAction[];
  subscribe?: Subscribe<EngagementDelta>;
  onSubscribeDelta?: (delta: EngagementDelta) => void;
}): { state, dispatch, controlled } {
  // 1. Derive initial state from actions[]
  const initial = useMemo(() => deriveStateFromActions(opts.actions), [opts.actions]);
  const [internalState, dispatch] = useReducer(engagementReducer, initial);

  // 2. Compute controlled flags per render
  const controlled = useMemo(() => {
    const like = opts.actions.find(a => a.kind === "like");
    const bookmark = opts.actions.find(a => a.kind === "bookmark");
    return {
      liked: like?.kind === "like" && like.liked !== undefined,
      bookmarked: bookmark?.kind === "bookmark" && bookmark.bookmarked !== undefined,
      // ...
    };
  }, [opts.actions]);

  // 3. Resolve effective state: controlled props win
  const state = useMemo<EngagementState>(() => ({
    liked: controlled.liked
      ? (opts.actions.find(a => a.kind === "like") as { liked: boolean }).liked
      : internalState.liked,
    likeCount: /* same pattern */,
    // ...
  }), [internalState, opts.actions, controlled]);

  // 4. Subscription effect
  // controlled is recomputed every render from actions; mirror it into a ref so the
  // effect dep array stays stable on (subscribe, onSubscribeDelta) only — re-subscribing
  // every time actions identity changes would drop deltas in flight between cleanup + re-call.
  const controlledRef = useRef(controlled);
  useEffect(() => {
    controlledRef.current = controlled;
  });
  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  useEffect(() => {
    if (!opts.subscribe) return;
    const unsub = opts.subscribe((delta) => {
      // Always fire host callback
      onSubscribeDeltaRef.current?.(delta);
      // Patch internal state ONLY for uncontrolled fields
      // (controlled fields ignore deltas; host translates via onSubscribeDelta)
      if (!isControlledForDelta(delta, controlledRef.current)) {
        dispatch({ kind: "subscribe-delta", delta });
      }
    });
    return unsub;
  }, [opts.subscribe]);

  return { state, dispatch, controlled };
}
```

- **`engagementReducer`** is pure; exported from this file.
- Initial-state derivation from `actions[]` is pure-functional (`deriveStateFromActions`).
- Controlled-vs-uncontrolled is **per-field, per-render** — host can control `liked` while leaving `bookmarked` uncontrolled.
- **Subscription effect re-runs ONLY when `subscribe` identity changes** — `controlled` and `onSubscribeDelta` are accessed via refs so changes don't trigger re-subscribe (which would drop in-flight deltas between cleanup + re-call).
- `isControlledForDelta` matches the delta `kind` to the relevant controlled flags (`like-changed` → check `controlled.liked`, etc.).

### 12. `utils/format-count.ts`

```ts
export function formatEngagementCount(n: number): string {
  if (n < 0) return "0"; // defensive
  if (n < 1_000) return String(n);
  if (n < 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.floor(n / 1_000) + "k";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
}
```

- Pure function; no React deps.
- Replace-trailing-`.0` keeps `1k` (not `1.0k`) for whole values.
- `< 10_000` uses one decimal; `< 1_000_000` truncates to whole `k`s (so `12345 → 12k`, not `12.3k`). Matches Twitter / Instagram convention.

### 13. `types.ts`

All public types as listed in "Final API > Public types" above. Plus internal `EngagementLocalAction` for the reducer.

### 14. `dummy-data.ts`

Three named samples:

```ts
export const DUMMY_POST_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 142, liked: false, onToggle: () => {} },
  { kind: "comment", count: 23, onClick: () => {} },
  { kind: "share", count: 8, onClick: () => {} },
  { kind: "bookmark", bookmarked: false, onToggle: () => {} },
];

export const DUMMY_NEWS_CARD_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 56, liked: false, onToggle: () => {} },
  { kind: "share", onClick: () => {} },
  { kind: "bookmark", bookmarked: true, onToggle: () => {} },
];

export const DUMMY_VIDEO_ENGAGEMENT_STACKED: EngagementAction[] = [
  { kind: "like", count: 1234, liked: true, onToggle: () => {} },
  { kind: "comment", count: 87, onClick: () => {} },
  { kind: "share", count: 12, onClick: () => {} },
  { kind: "view-count", count: 12_345 },
];

export const DUMMY_LIKE_USERS: EngagementLikeUser[] = [
  /* 6 sample users for likersPreview demo */
];

/** Sandbox-only fake subscribe — synthetic deltas every 4s for showcase. */
export function createDummySubscribe(): Subscribe<EngagementDelta> {
  return (handler) => {
    const id = setInterval(() => {
      handler({
        kind: "like-changed",
        count: 142 + Math.floor(Math.random() * 10),
      });
    }, 4000);
    return () => clearInterval(id);
  };
}
```

### 15. `demo.tsx`

Five tabs (matches media-carousel-01 demo style):
1. **Default (post)** — `DUMMY_POST_ENGAGEMENT` + likersPreview slot wired to a small avatar pile.
2. **Compact (news-card retrofit preview)** — `DUMMY_NEWS_CARD_ENGAGEMENT` with `variant="compact"`.
3. **Stacked (video overlay)** — `DUMMY_VIDEO_ENGAGEMENT_STACKED` with `variant="stacked"`.
4. **Realtime (subscribe demo)** — wires `createDummySubscribe()` so the viewer sees the count tick every 4s.
5. **Heart-burst** — composes `<MediaCarousel01>` (any variant) + `<EngagementHeartBurst trigger={burstKey} />` + `<EngagementBar01 ref={barRef}>`. Double-tap the carousel → burst overlays + like flips. The canonical Instagram flow.

### 16. `usage.tsx`

Same shape as expandable-text-01's `usage.tsx`: short markdown-ish prose + 4–6 code recipes. Cover:
- Minimal usage (post)
- Controlled vs uncontrolled (`liked` prop vs no `liked` prop)
- Realtime subscribe + `onSubscribeDelta`
- Custom action via `kind: "custom"`
- Heart-burst recipe (the carousel-bar composition)
- News-card retrofit example

### 17. `meta.ts`

Standard `ComponentMeta` fields. Notable:
- `category: "data"`
- `dependencies: { peer: ["lucide-react"], registryDeps: [] }` (no shadcn-registry cross-deps; `Button` is already shadcn-installed)
- `tags: ["social", "engagement", "like", "comment", "share", "bookmark", "realtime"]`
- `notes`: "Heart-burst lives as a sibling sub-export `<EngagementHeartBurst>` — RSC-compatible, CSS-keyframe-based. No framer-motion."

### 18. `index.ts`

As listed above.

## Demo / usage / meta layouts

Already covered file-by-file. Match patterns established by `media-carousel-01` and `video-player-01`:
- Demo: `<Tabs>` per major prop / mode
- Usage: prose + ~6 code blocks
- Meta: standard `ComponentMeta` shape

## Manifest + registry.json wiring

### Manifest entry

```ts
// src/registry/manifest.ts — add to the data category section

import EngagementBar01Demo from "./components/data/engagement-bar-01/demo";
import EngagementBar01Usage from "./components/data/engagement-bar-01/usage";
import { meta as engagementBar01Meta } from "./components/data/engagement-bar-01/meta";

// ... add to registry array ...
{
  meta: engagementBar01Meta,
  Demo: EngagementBar01Demo,
  Usage: EngagementBar01Usage,
}
```

### registry.json entries

Two items: base (`engagement-bar-01`) + fixtures (`engagement-bar-01-fixtures`).

```jsonc
{
  "name": "engagement-bar-01",
  "type": "registry:component",
  "title": "Engagement Bar 01",
  "description": "Discriminated-union action row (like / comment / share / bookmark / view-count / custom) with realtime subscribe contract, CSS heart-burst sibling export, and slot-based likers preview.",
  "registryDependencies": ["button"],
  "files": [
    { "path": "src/registry/components/data/engagement-bar-01/engagement-bar-01.tsx", "type": "registry:component", "target": "components/engagement-bar-01/engagement-bar-01.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/action-button.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/action-button.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/like-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/like-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/comment-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/comment-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/share-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/share-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/bookmark-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/bookmark-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/view-count-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/view-count-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/custom-action.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/custom-action.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/engagement-heart-burst.tsx", "type": "registry:component", "target": "components/engagement-bar-01/parts/engagement-heart-burst.tsx" },
    { "path": "src/registry/components/data/engagement-bar-01/parts/engagement-heart-burst.css", "type": "registry:file", "target": "components/engagement-bar-01/parts/engagement-heart-burst.css" },
    { "path": "src/registry/components/data/engagement-bar-01/hooks/use-engagement-state.ts", "type": "registry:component", "target": "components/engagement-bar-01/hooks/use-engagement-state.ts" },
    { "path": "src/registry/components/data/engagement-bar-01/utils/format-count.ts", "type": "registry:component", "target": "components/engagement-bar-01/utils/format-count.ts" },
    { "path": "src/registry/components/data/engagement-bar-01/types.ts", "type": "registry:component", "target": "components/engagement-bar-01/types.ts" },
    { "path": "src/registry/components/data/engagement-bar-01/index.ts", "type": "registry:component", "target": "components/engagement-bar-01/index.ts" }
  ]
}
```

`engagement-bar-01-fixtures` is a tiny sibling: just `dummy-data.ts`, `registryDependencies: ["engagement-bar-01"]`, locked target convention.

**The `registry:file` entry for `engagement-heart-burst.css` is the first non-`registry:component` file in pro-ui's registry** — locks the precedent for any future component shipping a sibling stylesheet (keyframes, CSS modules with non-Tailwind tricks, etc.).

## Test plan

Manual (no test infra in pro-ui yet):

1. **Build verification**
   - `pnpm tsc --noEmit` — clean
   - `pnpm lint` — clean
   - `pnpm build` — clean prerender (route count `/components/engagement-bar-01` added)
   - `pnpm registry:build` — generates `public/r/engagement-bar-01.json` + `public/r/engagement-bar-01-fixtures.json`; spot-check heart-burst CSS file shows up in the JSON's `files[]` entry with `type: "registry:file"`.

2. **Demo tab walkthrough**
   - Default tab: like flips on click (uncontrolled), count increments; share + bookmark click; likersPreview renders below.
   - Compact tab: tighter row; counts as superscript.
   - Stacked tab: vertical icons; view-count renders as span (not button).
   - Realtime tab: like-count visibly ticks every 4s without click.
   - Heart-burst tab: double-tap carousel → heart bursts in center + bar's like flips. After burst, the heart fades out cleanly. Double-tap again → re-fires.

3. **Controlled vs. uncontrolled smoke**
   - In the realtime tab, manually wire one variant where `liked` is controlled by parent state — confirm clicks DON'T flip locally; consumer must update prop.
   - Confirm `onSubscribeDelta` fires regardless of mode.

4. **a11y smoke**
   - Tab through actions; each button focusable; `aria-pressed` correct for like / bookmark in current state.
   - Screen-reader (NVDA / VoiceOver) announces count changes politely.
   - Reduced-motion: heart-burst animation shortens to 200ms linear.

5. **RTL smoke** — in a temporary RTL wrapper, confirm right-aligned actions still hug the trailing edge.

6. **Smoke test from a tmp consumer (one-off)** — `pnpm dlx shadcn@latest add http://localhost:3000/r/engagement-bar-01.json` from a tmp Next 16 app; verify the CSS file lands at the expected target path AND the burst animates.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `registry:file` for CSS doesn't install correctly via shadcn CLI | Medium | High | Smoke-test from tmp consumer before declaring ship. shadcn CLI v4 supports `registry:file`; if it trips, fallback is inline `<style>` tag in burst component (~30 LOC, ugly but works). |
| Hybrid controlled/uncontrolled gets confusing for hosts | Medium | Medium | Document explicitly in usage.tsx. Demo includes a tab showing both modes side-by-side. |
| Subscribe identity churn in real consumer apps causes thrash re-subscribes | Medium | Medium | Document the `useCallback` requirement loudly in the guide. Consider adding a `ref`-stable subscribe pattern (`subscribeRef.current`) if real consumers complain. |
| Heart-burst keyframe doesn't restart on rapid double-taps (browser key-collision) | Low | Low | `key={trigger}` remount is the canonical fix; if rapid-fire still trips, fallback is force-reflow (`void el.offsetHeight`). Unlikely needed. |
| `formatEngagementCount` doesn't match Turkish locale conventions kasder uses | Medium | Low | `labels.formatCount` escape hatch covers it. Document the override in usage.tsx for kasder's TR setup. |
| Reducer + controlled-prop sync logic gets subtly wrong (controlled wins on each render but internal state still mutated by clicks) | High | Medium | Click handlers branch on `controlled.liked` early — controlled mode does NOT dispatch local toggle. Covered in unit-mental-model walkthrough during implementation. |

## Implementation order

1. `types.ts` (all types) + `utils/format-count.ts` + the reducer in `hooks/use-engagement-state.ts` — pure, testable in isolation.
2. `parts/engagement-heart-burst.tsx` + `engagement-heart-burst.css` — RSC sub-export; verify keyframe in isolation in a scratch demo.
3. `parts/like-action.tsx` (most complex per-action) — establish the controlled/uncontrolled pattern; copy to other action parts.
4. Other action parts (`comment-action`, `share-action`, `bookmark-action`, `view-count-action`, `custom-action`).
5. `parts/action-button.tsx` dispatcher.
6. `engagement-bar-01.tsx` root + `useImperativeHandle`.
7. `dummy-data.ts` + `demo.tsx` (5 tabs) + `usage.tsx`.
8. `meta.ts` + `index.ts`.
9. Wire `manifest.ts` (3 lines).
10. Wire `registry.json` (base + fixtures).
11. Verify: `tsc --noEmit`, `lint`, `build`, `registry:build`, demo walkthrough, smoke-test from tmp consumer for the CSS file.
12. Draft `engagement-bar-01-procomp-guide.md` (Stage 3, alongside this).
13. Update STATUS.md (new Components row + Recent decisions entry; trim oldest if needed to maintain ~10).
14. Commit + push.

---

**Plan re-validated and signed off (2026-05-02).** Refinements baked in:
- Stacked variant: vertical root layout (`flex flex-col items-center gap-3`); `align` ignored in stacked mode.
- Click handlers live inside each action part (no upstream `useCallback`-in-`.map()` violation); `React.memo` per part.
- Subscription effect uses `controlledRef` + `onSubscribeDeltaRef` mirrors so it re-runs only on `subscribe` identity change (no in-flight delta drops).
- `view-count-action` renders as `<div role="group" aria-label>` (cleaner than `<span aria-label>`).
- `format = labels.formatCount ?? formatEngagementCount` resolved at root, passed down to every action part.
- `registry:file` for `engagement-heart-burst.css` approved as the first non-`registry:component` precedent in pro-ui (smoke-test from tmp consumer is a ship gate).
