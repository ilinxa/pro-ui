# story-rail-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`story-rail-01-procomp-description.md`](./story-rail-01-procomp-description.md) for the what & why.
>
> **Migration origin:** kasder `StoriesSection.tsx` + `StoryThumbnail.tsx` (story-rail concern only).
>
> **Embla used directly — NOT cross-importing media-carousel-01 (sealed-folder rule).**

## Q-P locks (most carry from precedents — only novel ones re-stated)

| # | Lock | Source |
|---|---|---|
| Q-P1 | `StoryRailItem` shape: minimal preview (`id` / `username` / `avatar?` / `previewImage` / `hasUnread?` / `userId?`). Story-viewer-01 will define its own full `Story` type. | Stage-1 Q1 |
| Q-P2 | Edge fade gradients adapt to `framed` mode — `from-card` + `left-4 right-4` when framed; `from-background` + `left-0 right-0` when bare. | Stage-1 R-D-1 |
| Q-P3 | Embla used inline, no wrapper hook, no indicator dots. Just `useEmblaCarousel(opts)` + `api?.scrollTo(i)`. | Stage-1 R-D-2 |
| Q-P4 | Always-uncontrolled — `items` prop is mount-only initial state. `reset(next)` + `dispatch(action)` imperative escape hatches. | comment-thread-01 R-Plan-15 + post-card-01 |
| Q-P5 | Realtime via `Subscribe<StoryRailDelta>` + `onSubscribeDelta` callback. Identity-stable (`useCallback` host-side). Same `controlledRef` + `onSubscribeDeltaRef` mirror pattern. | engagement-bar-01 + comment-thread-01 carry-over |
| Q-P6 | Embla config kasder-exact: `align: "start"`, `containScroll: "trimSnaps"`, `dragFree: true`. | kasder source |
| Q-P7 | Thumbnail dimensions locked: `w-20 h-28` outer (80×112px portrait); `rounded-2xl` outer ring; `rounded-[14px]` inner image; `border-2 border-card`. | kasder source |
| Q-P8 | Unread ring: `bg-linear-to-br from-accent via-warning to-destructive`. Read ring: `bg-muted`. Both `p-0.5 rounded-2xl transition-all`. | kasder source |
| Q-P9 | Avatar bubble below: `h-5 w-5 border border-card`. Username: `text-xs font-medium max-w-14 truncate`. | kasder source |
| Q-P10 | Hover scale on preview image: `motion-safe:group-hover:scale-105 transition-transform duration-300`. | kasder source + project motion-safe convention |
| Q-P11 | Default `framed: true` (matches kasder Card wrapper). `framed: false` for embedded use. | description spec |
| Q-P12 | `<AddStoryThumbnail>` is a sealed sub-export AND `leading?: ReactNode` is a slot. Both available — kasder UX comes batteries-included via the standalone; full custom via the slot. | description spec |
| Q-P13 | `<StoryRail01>` is `"use client"` (Embla state + handle); `<AddStoryThumbnail>` is `"use client"` (button click). | inherited |
| Q-P14 | `React.memo` at export + ref-as-prop. | project standard |
| Q-P15 | `commentReducer`-style `storyRailReducer` exported from day-1 (per dynamicity primacy). `useStoryRailState` hook also public. | post-card-01 carry-over |
| Q-P16 | `onItemClick(item, index)` signature — both args. `linkComponent` + `getHref` co-exist (both can fire on click). | engagement-bar-01 / media-carousel-01 callback shape |
| Q-P17 | `useId()` per thumbnail wired into `renderThumbnail` slot helpers — for hosts attaching ARIA via the slot. | comment-thread-01 R-Plan-12 carry-over |
| Q-P18 | No new shadcn primitives — `avatar` already installed. NOT using the shadcn `card` primitive (R-Plan-1: render `<section>` with conditional card-style classes). Embla peer dep already installed (media-carousel-01). | R-Plan-1 |
| Q-P22 | Edge gradients render only when items are present (not over empty state). | R-Plan-2 |
| Q-P23 | Click DOESN'T auto-mark-viewed. Host calls `ref.current.markViewed(itemId)` from their viewer's onClose. Same pattern as Instagram. | R-Plan-3 |
| Q-P19 | No framer-motion. CSS transitions for ring color + hover scale. | project lock |
| Q-P20 | Tailwind v4-clean. | project lock |
| Q-P21 | Locked target convention for `registry.json`: `registry:component` + `target: "components/story-rail-01/<sub>"`. Never ship demo / usage / meta. Fixtures via `-fixtures` sibling. | project lock |

## Final API

### Public types

```ts
// types.ts
import type { ElementType, ReactNode } from "react";

export interface StoryRailItem {
  id: string;
  username: string;
  avatar?: string;
  previewImage: string;
  hasUnread?: boolean;
  userId?: string;
}

export type StoryRailDelta =
  | { kind: "added"; item: StoryRailItem; position?: "start" | "end" }
  | { kind: "removed"; itemId: string }
  | { kind: "viewed"; itemId: string }
  | { kind: "updated"; itemId: string; partial: Partial<StoryRailItem> };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface StoryRail01Labels {
  /** Default "Stories". aria-label on the rail's <section role="region">. */
  railLabel?: string;
  /** Default "Add story". Visible label below the AddStoryThumbnail. */
  addStoryLabel?: string;
  /** Default "Add a story". aria-label for the AddStoryThumbnail button. */
  addStoryAriaLabel?: string;
  /** Function so hosts can pluralize / localize. Default returns "{username}, unread story" / "{username}, viewed". */
  thumbnailAriaLabel?: (item: StoryRailItem) => string;
  /** Default "No stories yet." Renders when items.length === 0 AND no leading AND no realtime. */
  emptyState?: string;
}

export const DEFAULT_STORY_RAIL_LABELS: Required<
  Omit<StoryRail01Labels, "thumbnailAriaLabel">
> = {
  railLabel: "Stories",
  addStoryLabel: "Add story",
  addStoryAriaLabel: "Add a story",
  emptyState: "No stories yet.",
};

export type StoryRailLocalAction =
  | { kind: "add"; item: StoryRailItem; position?: "start" | "end" }
  | { kind: "remove"; itemId: string }
  | { kind: "viewed"; itemId: string }
  | { kind: "update"; itemId: string; partial: Partial<StoryRailItem> }
  | { kind: "subscribe-delta"; delta: StoryRailDelta }
  | { kind: "reset"; next: StoryRailItem[] };

export interface ThumbnailRenderHelpers {
  index: number;
  onClick: () => void;
  /** Stable id for ARIA wiring. */
  baseId: string;
}

export interface StoryRail01Props {
  /** Items rendered in the rail. Mount-only initial state — use ref.current.reset() to push updates. */
  items: StoryRailItem[];

  /** Optional content rendered before items (typically <AddStoryThumbnail>). */
  leading?: ReactNode;

  /** Wrap in <Card className="p-4 relative overflow-hidden">. Default true. */
  framed?: boolean;

  /** Realtime delta stream. Identity-stable required (useCallback host-side). */
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;

  /** Click handler. Host typically opens a story viewer. */
  onItemClick?: (item: StoryRailItem, index: number) => void;

  /** Polymorphic root for thumbnail (when getHref provided). Default "button" (or "a" via getHref). */
  linkComponent?: ElementType;
  /** When provided, thumbnail renders as <linkComponent href={getHref(item)}> instead of <button>. */
  getHref?: (item: StoryRailItem) => string;

  /** Full takeover for the thumbnail visual. */
  renderThumbnail?: (
    item: StoryRailItem,
    isUnread: boolean,
    helpers: ThumbnailRenderHelpers,
  ) => ReactNode;

  /** Empty-state slot. Wins over labels.emptyState fallback. */
  emptyState?: ReactNode;

  labels?: StoryRail01Labels;

  className?: string;
  thumbnailClassName?: string;

  ref?: React.Ref<StoryRail01Handle>;
}

export interface StoryRail01Handle {
  scrollTo: (index: number) => void;
  getCurrentItems: () => StoryRailItem[];
  reset: (next: StoryRailItem[]) => void;
  dispatch: (action: StoryRailLocalAction) => void;
  /** Mark a story as viewed (sets hasUnread=false). */
  markViewed: (itemId: string) => void;
}
```

### `<AddStoryThumbnail>` props

```ts
// parts/add-story-thumbnail.tsx
export interface AddStoryThumbnailProps {
  /** Avatar shown at 50% opacity inside the dashed-border placeholder. */
  userAvatar?: string;
  onClick?: () => void;
  /** Visible label below. Default "Add story" (resolve via labels.addStoryLabel). */
  label?: string;
  /** aria-label on the button. Default "Add a story". */
  ariaLabel?: string;
  className?: string;
}
```

### Reducer signature

```ts
// hooks/use-story-rail-state.ts (PUBLIC EXPORT)

export function storyRailReducer(
  state: StoryRailItem[],
  action: StoryRailLocalAction,
): StoryRailItem[];

export function useStoryRailState(opts: {
  initialItems: StoryRailItem[];
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;
}): {
  items: StoryRailItem[];
  dispatch: React.Dispatch<StoryRailLocalAction>;
};
```

### Exported names

```ts
// index.ts
export { StoryRail01 } from "./story-rail-01";
export { AddStoryThumbnail } from "./parts/add-story-thumbnail";
export {
  storyRailReducer,
  useStoryRailState,
  type UseStoryRailStateOptions,
  type UseStoryRailStateResult,
} from "./hooks/use-story-rail-state";

export type {
  StoryRailItem,
  StoryRail01Props,
  StoryRail01Handle,
  StoryRail01Labels,
  StoryRailDelta,
  StoryRailLocalAction,
  ThumbnailRenderHelpers,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_STORY_RAIL_LABELS } from "./types";

export { meta } from "./meta";
```

## File-by-file plan

**11 files** matching analysis estimate. Sealed folder.

```
src/registry/components/data/story-rail-01/
├── story-rail-01.tsx                # 1 — root component (Embla inline, no wrapper)
├── parts/
│   ├── story-thumbnail.tsx          # 2 — internal thumbnail (default render)
│   └── add-story-thumbnail.tsx      # 3 — public sub-export
├── hooks/
│   └── use-story-rail-state.ts      # 4 — reducer + subscription effect (public)
├── types.ts                         # 5
├── dummy-data.ts                    # 6 — 7 mock users matching kasder
├── demo.tsx                         # 7 — 5 tabs (docs-only)
├── usage.tsx                        # 8 — docs-only
├── meta.ts                          # 9 — docs-only
└── index.ts                         # 10
```

(11 unique files — 7 ship via the registry; demo/usage/meta are docs-only; dummy-data ships via `-fixtures`.)

### 1. `story-rail-01.tsx` — root

- `"use client"`, `React.memo`, `forwardRef<StoryRail01Handle, StoryRail01Props>`.
- Resolves defaults: `framed ?? true`.
- Builds merged `labels`.
- Calls `useStoryRailState({ initialItems: items, subscribe, onSubscribeDelta })` → `{ items: statefulItems, dispatch }`.
- Inline Embla:
  ```tsx
  const emblaOptions = useMemo(
    () => ({ align: "start" as const, containScroll: "trimSnaps" as const, dragFree: true as const }),
    [],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  ```
- Stable refs for handle:
  ```tsx
  const itemsRef = useRef<StoryRailItem[]>(statefulItems);
  useEffect(() => { itemsRef.current = statefulItems; });
  ```
- `useImperativeHandle`:
  ```tsx
  useImperativeHandle(ref, () => ({
    scrollTo: (index: number) => { emblaApi?.scrollTo(index); },
    getCurrentItems: () => itemsRef.current,
    reset: (next: StoryRailItem[]) => dispatch({ kind: "reset", next }),
    dispatch,
    markViewed: (itemId: string) => dispatch({ kind: "viewed", itemId }),
  }), [emblaApi, dispatch]);
  ```
- Render:
  ```tsx
  const Root = framed ? Card : "div";
  const showEmpty = statefulItems.length === 0 && !subscribe && !leading;

  return (
    <Root
      role="region"
      aria-label={labels.railLabel}
      className={cn(
        "relative overflow-hidden",
        framed ? "p-4" : "",
        className,
      )}
    >
      {/* Edge gradients */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 z-10 w-12 bg-linear-to-r to-transparent",
          framed ? "left-4 from-card" : "left-0 from-background",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 z-10 w-12 bg-linear-to-l to-transparent",
          framed ? "right-4 from-card" : "right-0 from-background",
        )}
      />

      {showEmpty ? (
        emptyState ?? (
          <p role="status" className="py-6 text-center text-sm text-muted-foreground">
            {labels.emptyState}
          </p>
        )
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 px-2">
            {leading ? <div className="shrink-0">{leading}</div> : null}
            {statefulItems.map((item, index) => (
              <div key={item.id} className="shrink-0">
                {renderThumbnail
                  ? renderThumbnail(item, !!item.hasUnread, {
                      index,
                      onClick: () => onItemClick?.(item, index),
                      baseId: `${rootId}-${item.id}`,
                    })
                  : (
                      <StoryThumbnail
                        item={item}
                        index={index}
                        baseId={`${rootId}-${item.id}`}
                        onItemClick={onItemClick}
                        getHref={getHref}
                        linkComponent={linkComponent}
                        labels={labels}
                        className={thumbnailClassName}
                      />
                    )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Root>
  );
  ```
- `rootId` via `useId()`.

### 2. `parts/story-thumbnail.tsx` — default render

- `"use client"`, `memo`.
- Props: `item`, `index`, `baseId`, `onItemClick?`, `getHref?`, `linkComponent?`, `labels`, `className?`.
- Computes `isUnread = !!item.hasUnread`.
- Computes `ariaLabel` via `labels.thumbnailAriaLabel?.(item)` or default `${username}, ${isUnread ? "unread story" : "viewed"}`.
- Determines wrapper element:
  - If `getHref` provided: `<LinkComponent href={getHref(item)} aria-label={ariaLabel} className="...">` + `onClick={...}`.
  - Else: `<button onClick={...} aria-label={ariaLabel} className="...">`.
- Visual structure (kasder-exact):
  ```tsx
  <div className="flex flex-col items-center gap-2 shrink-0 group">
    <div className={cn(
      "p-0.5 rounded-2xl transition-all",
      isUnread
        ? "bg-linear-to-br from-accent via-warning to-destructive"
        : "bg-muted",
    )}>
      <div className="w-20 h-28 rounded-[14px] overflow-hidden border-2 border-card bg-card">
        <img
          src={item.previewImage}
          alt=""
          className="w-full h-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <Avatar className="h-5 w-5 border border-card">
        {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
        <AvatarFallback className="text-[8px]">{initials(item.username)}</AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium text-center max-w-14 truncate">{item.username}</span>
    </div>
  </div>
  ```
- `initials(username)` helper: same shape as comment-thread-01's.

### 3. `parts/add-story-thumbnail.tsx` — public sub-export

```tsx
"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddStoryThumbnailProps {
  userAvatar?: string;
  onClick?: () => void;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

function AddStoryThumbnailInner({
  userAvatar,
  onClick,
  label = "Add story",
  ariaLabel = "Add a story",
  className,
}: AddStoryThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn("flex flex-col items-center gap-2 shrink-0 group", className)}
    >
      <div className="relative">
        <div className="w-20 h-28 rounded-2xl border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted/50 transition-colors group-hover:border-primary/50">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-full h-full bg-muted" aria-hidden="true" />
          )}
        </div>
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground border-2 border-card shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </div>
      <span className="text-xs font-medium text-center w-20 truncate text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

export const AddStoryThumbnail = memo(AddStoryThumbnailInner);
AddStoryThumbnail.displayName = "AddStoryThumbnail";
```

### 4. `hooks/use-story-rail-state.ts`

```ts
"use client";

import { useEffect, useReducer, useRef } from "react";
import type { StoryRailDelta, StoryRailItem, StoryRailLocalAction, Subscribe } from "../types";

// Pure tree operations
function insertAtPosition(state: StoryRailItem[], item: StoryRailItem, position: "start" | "end" | undefined): StoryRailItem[] {
  if (position === "end") return [...state, item];
  return [item, ...state];  // default "start"
}

function removeById(state: StoryRailItem[], id: string): StoryRailItem[] {
  const next = state.filter((i) => i.id !== id);
  return next.length === state.length ? state : next;
}

function patchById(state: StoryRailItem[], id: string, patch: Partial<StoryRailItem>): StoryRailItem[] {
  let mutated = false;
  const next = state.map((i) => {
    if (i.id !== id) return i;
    mutated = true;
    return { ...i, ...patch };
  });
  return mutated ? next : state;
}

export function storyRailReducer(state: StoryRailItem[], action: StoryRailLocalAction): StoryRailItem[] {
  switch (action.kind) {
    case "add":
      return insertAtPosition(state, action.item, action.position);
    case "remove":
      return removeById(state, action.itemId);
    case "viewed":
      return patchById(state, action.itemId, { hasUnread: false });
    case "update":
      return patchById(state, action.itemId, action.partial);
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "added":   return insertAtPosition(state, d.item, d.position);
        case "removed": return removeById(state, d.itemId);
        case "viewed":  return patchById(state, d.itemId, { hasUnread: false });
        case "updated": return patchById(state, d.itemId, d.partial);
      }
      return state;
    }
    case "reset":
      return action.next;
  }
}

export interface UseStoryRailStateOptions {
  initialItems: StoryRailItem[];
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;
}

export interface UseStoryRailStateResult {
  items: StoryRailItem[];
  dispatch: React.Dispatch<StoryRailLocalAction>;
}

export function useStoryRailState(opts: UseStoryRailStateOptions): UseStoryRailStateResult {
  const [items, dispatch] = useReducer(storyRailReducer, opts.initialItems);

  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  return { items, dispatch };
}
```

Same shape as `useCommentState` from comment-thread-01.

### 5. `types.ts`

All public types as listed in "Final API > Public types" above.

### 6. `dummy-data.ts`

7 mock users matching kasder's `mockStories` array exactly:
- mehmet / ayse / ali / fatma / mustafa / zeynep / emre
- Mix of unread + read
- Real Unsplash preview URLs from kasder source (verbatim)

Plus `createDummyStoryRailSubscribe()` factory firing synthetic `added` / `viewed` deltas every 5s.

### 7. `demo.tsx` — 5 tabs (docs-only)

1. **Default** — kasder-exact: 7 stories, no leading.
2. **With Add** — `<AddStoryThumbnail userAvatar={viewerAvatar} onClick={...}>` as `leading`.
3. **Mixed read/unread** — same data, varied `hasUnread` values.
4. **Realtime** — `createDummyStoryRailSubscribe()` wired.
5. **Custom render** — `renderThumbnail` slot replacing the default with a square chip variant.

### 8. `usage.tsx` (docs-only)

Markdown-ish prose + 5–6 code recipes:
- Minimal usage
- With `<AddStoryThumbnail>` leading
- Realtime via subscribe
- Custom `renderThumbnail` slot
- Imperative `markViewed`
- Footgun callout: `items` prop is mount-only

### 9. `meta.ts` (docs-only)

Standard `ComponentMeta`. Notable:
- `category: "data"`
- `dependencies: { shadcn: ["avatar", "card"], npm: { "embla-carousel-react": "^8.x", "lucide-react": "^0.x" }, internal: [] }`
- `notes`: "Stories rail at the top of a feed. Pairs with story-viewer-01 (next ship)."

### 10. `index.ts`

As listed in "Final API > Exported names".

## Manifest + registry.json wiring

### Manifest entry

3 lines into `src/registry/manifest.ts` (after post-card-01 imports):

```ts
import StoryRail01Demo from "./components/data/story-rail-01/demo";
import StoryRail01Usage from "./components/data/story-rail-01/usage";
import { meta as storyRail01Meta } from "./components/data/story-rail-01/meta";

// ... add to REGISTRY array ...
{ meta: storyRail01Meta, Demo: StoryRail01Demo, Usage: StoryRail01Usage }
```

### registry.json entries

Two items: base + fixtures.

```jsonc
{
  "name": "story-rail-01",
  "type": "registry:block",
  "title": "Story Rail 01",
  "description": "Horizontal stories rail (kasder-exact thumbnails) — gradient ring on unread, muted ring on read; AddStoryThumbnail standalone export + leading slot for custom; Embla used directly with drag-free skim-scroll; mode-aware edge-fade gradients (framed vs bare); realtime via Subscribe<StoryRailDelta>. Always-uncontrolled with reset() + dispatch() imperative escape hatches. No new shadcn primitives; Embla peer dep already shared with media-carousel-01. Seventh ship in the social-posts-system arc.",
  "registryDependencies": [
    "https://ui.shadcn.com/r/styles/new-york/avatar.json",
    "https://ui.shadcn.com/r/styles/new-york/card.json"
  ],
  "dependencies": ["lucide-react", "embla-carousel-react"],
  "files": [
    /* 7 entries: story-rail-01.tsx + 2 parts + 1 hook + types + index */
  ]
}
```

Plus `story-rail-01-fixtures` sibling carrying only `dummy-data.ts`.

## Test plan

Manual:

1. `pnpm tsc --noEmit` — clean
2. `pnpm lint` — clean (1 pre-existing rich-card warning OK)
3. `pnpm registry:build` — generates `story-rail-01.json` + `story-rail-01-fixtures.json`; spot-check `files[]` count = 7 + fixtures dummy-data.
4. **Demo walkthrough** — all 5 tabs render; AddStoryThumbnail click logs; realtime tab ticks every 5s; custom render swaps shape.
5. **Imperative handle** — `ref.current.markViewed(id)` flips ring; `ref.current.scrollTo(5)` scrolls to position 5.
6. **Visual** — gradient ring on unread thumbnails; muted ring on read; hover scale; edge gradients fade smoothly inside framed Card.
7. **Component docs route** at `/components/story-rail-01` returns HTTP 200.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Embla `dragFree: true` + `scrollTo(index)` doesn't snap precisely to the item | Medium | Low | Drag-free is intentionally non-snap; `scrollTo` will scroll to the natural offset which is "good enough" for a stories rail. Document. |
| `useEmblaCarousel` not memoized properly causes re-init on every render | Low | Medium | Options memoized via `useMemo([], [])` — empty deps since the config is constant for story-rail-01 (no variant prop). |
| `from-card` gradient color doesn't match Card bg in dark mode | Low | Low | Tailwind's `bg-card` and `from-card` resolve to the same OKLCH variable. Confirmed by spot-check. |
| `previewImage` failing to load shows broken image | Medium | Low | `<img>` natively shows alt text; for v0.1 acceptable. v0.2 candidate: `<img onError>` fallback to a tinted placeholder. |
| Many items (500+) all mount as `<img>` — performance | Low | Medium | v0.2 candidate: virtualization. Document as out-of-scope in v0.1. |
| Touch swipe + click conflict (Embla drag absorbs click) | Low | Medium | Embla handles this natively via its `clickAllowed` logic. Tested in media-carousel-01. |
| `subscribe` identity churn from non-memoized host callback | Medium | Medium | Document `useCallback` requirement loudly in usage.tsx (same convention as engagement-bar-01 / comment-thread-01 / post-card-01). |

## Implementation order

1. **Pure substrate** — `types.ts` + `storyRailReducer` + tree helpers + `useStoryRailState` hook.
2. **`<AddStoryThumbnail>`** — small, sealed sub-export.
3. **`<StoryThumbnail>`** — internal default render with kasder-exact visual.
4. **`<StoryRail01>` root** — Embla wiring + handle + edge gradients + framed/bare branch.
5. **Fixtures** — kasder's 7 mock users verbatim.
6. **`demo.tsx`** (5 tabs) + **`usage.tsx`** + **`meta.ts`** + **`index.ts`**.
7. **Wire `manifest.ts`** (3 lines).
8. **Wire `registry.json`** (base + fixtures).
9. **Verify** — tsc / lint / registry:build / docs route HTTP 200.
10. **Stage 3 guide** alongside.
11. **Update STATUS.md** + trim oldest.
12. **Commit** (paused per convention).

---

**Plan signed off 2026-05-03.** R-Plan-1/2/3 (no Card dep, conditional gradients, no auto-mark-viewed) committed inline as Q-P18/22/23. Implementation begins.
