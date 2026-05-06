# story-viewer-01 — procomp plan

> Stage 2: how (the implementation contract).
>
> See [`story-viewer-01-procomp-description.md`](./story-viewer-01-procomp-description.md) for what & why. Description signed off — all R-D-1..8 refinements absorbed.
>
> **Eighth (and final) ship** in the social-posts-system arc. Closes the arc; `/sandbox/social-feed-page-01` Tier-3 composition follows.

## Sealed-folder file map (locked)

```
src/registry/components/media/story-viewer-01/
├── story-viewer-01.tsx                  # root: Radix Dialog wrapper + state orchestration + handle
├── parts/
│   ├── viewer-shell.tsx                 # Dialog content surface (CSS in/out animations; v0.2 framer-motion seam)
│   ├── progress-bars.tsx                # segmented progress row
│   ├── viewer-header.tsx                # avatar + name + time + pause / mute / close
│   ├── tap-zones.tsx                    # 3-column 1/3 each (prev / pause / next)
│   ├── nav-arrows.tsx                   # desktop story-level ← →
│   └── item-view.tsx                    # image OR video item renderer (composes video-player-01)
├── hooks/
│   ├── use-story-viewer-state.ts        # reducer + cursor + realtime delta application + Subscribe wiring
│   ├── use-story-progress.ts            # accumulatedMs-based timer (exported standalone)
│   └── use-story-keyboard-nav.ts        # arrow keys + space + escape (exported standalone)
├── lib/
│   └── format-time.ts                   # default `Intl.DateTimeFormat` formatter (no date-fns dep)
├── types.ts                             # all types + DEFAULT_STORY_VIEWER_LABELS
├── dummy-data.ts                        # 3 mock stories with mixed image+video items
├── demo.tsx                             # 6 tabs
├── usage.tsx
├── meta.ts
└── index.ts
```

**Total: 16 files. 11 ship via the registry** (excludes `demo.tsx`, `usage.tsx`, `meta.ts` per locked target convention).

## Dependencies (locked)

| Surface | Source | Notes |
|---|---|---|
| `Dialog`, `DialogContent`, `DialogPortal`, `DialogOverlay` | `@/components/ui/dialog` (already installed) | Radix Dialog wrapper |
| `Avatar`, `AvatarImage`, `AvatarFallback` | `@/components/ui/avatar` (already installed) | Header avatar |
| `Button` | `@/components/ui/button` (already installed) | Header buttons + nav arrows |
| `cn` | `@/lib/utils` | Standard |
| `VideoPlayer01`, `DEFAULT_VIDEO_PLAYER_LABELS` | `@/registry/components/media/video-player-01` | Cross-folder dep — declared via `registryDependencies` in registry.json |
| Lucide icons | `lucide-react` | `X`, `ChevronLeft`, `ChevronRight`, `Pause`, `Play`, `Volume2`, `VolumeX` |

**No new shadcn primitives. No framer-motion peer dep (v0.1).** Full kasder visual parity via Tailwind `data-state` classes on Radix Dialog's animated surface.

## Type system (locked from description)

`types.ts` will export ALL of:

```ts
import type { ReactNode } from "react";

// ─── Data shapes ────────────────────────────────────────────────────────
export interface StoryItem {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number;  // seconds
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  items: StoryItem[];
  hasUnread?: boolean;
  createdAt: string;  // ISO date string
}

// ─── Realtime contract ──────────────────────────────────────────────────
export type Unsubscribe = () => void;
export type Subscribe<TDelta> = (handler: (delta: TDelta) => void) => Unsubscribe;

export type StoryViewerDelta =
  | { kind: "story-added"; story: Story; position?: "start" | "end" }
  | { kind: "story-removed"; storyId: string }
  | { kind: "item-added"; storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "item-removed"; storyId: string; itemId: string }
  | { kind: "story-viewed"; storyId: string };

export type StoryViewerLocalAction =
  | { kind: "add-story"; story: Story; position?: "start" | "end" }
  | { kind: "remove-story"; storyId: string }
  | { kind: "add-item"; storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "remove-item"; storyId: string; itemId: string }
  | { kind: "patch-story"; storyId: string; partial: Partial<Story> };

// ─── Render-prop helpers ────────────────────────────────────────────────
export interface RenderItemContext {
  storyIndex: number;
  itemIndex: number;
  isPaused: boolean;
  isMuted: boolean;
}

// ─── i18n ───────────────────────────────────────────────────────────────
export interface StoryViewer01Labels {
  viewerLabel?: string;
  play?: string;
  pause?: string;
  mute?: string;
  unmute?: string;
  close?: string;
  prevStory?: string;
  nextStory?: string;
  formatTime?: (date: Date) => string;
  itemImageAlt?: (story: Story, itemIndex: number, totalItems: number) => string;
}

export const DEFAULT_STORY_VIEWER_LABELS: Required<StoryViewer01Labels> = {
  viewerLabel: "Story viewer",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  close: "Close",
  prevStory: "Previous story",
  nextStory: "Next story",
  formatTime: (date) =>
    new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date),
  itemImageAlt: (story, idx, total) =>
    `${story.username}, story image ${idx + 1} of ${total}`,
};

// ─── Imperative handle ──────────────────────────────────────────────────
export interface StoryViewer01Handle {
  goToStory: (index: number) => void;
  goToItem: (index: number) => void;
  setPaused: (paused: boolean) => void;
  getCursor: () => { storyIndex: number; itemIndex: number };
  getCurrentStories: () => Story[];
  reset: (next: Story[]) => void;
  dispatch: (action: StoryViewerLocalAction) => void;
}

// ─── Props ──────────────────────────────────────────────────────────────
export interface StoryViewer01Props {
  stories: Story[];
  initialStoryIndex: number;
  isOpen: boolean;
  onClose: () => void;
  ref?: React.Ref<StoryViewer01Handle>;
  // Realtime
  subscribe?: Subscribe<StoryViewerDelta>;
  onSubscribeDelta?: (delta: StoryViewerDelta) => void;
  // Lifecycle
  onStoryViewed?: (storyId: string) => void;
  onItemViewed?: (storyId: string, itemId: string, itemIndex: number) => void;
  onCursorChange?: (storyIndex: number, itemIndex: number) => void;
  onAutoCloseAtEnd?: () => void;
  // Slots
  renderItem?: (item: StoryItem, context: RenderItemContext) => ReactNode;
  // Defaults
  defaultItemDuration?: number;  // default 5
  // i18n
  labels?: StoryViewer01Labels;
  // Style overrides
  className?: string;
  contentClassName?: string;
}
```

## Sealed-folder rule + cross-component import

`story-viewer-01` imports `video-player-01` as a cross-folder registry component. Declared via `registryDependencies: ["https://ilinxa-proui.vercel.app/r/video-player-01.json"]` in registry.json (locked precedent — same pattern as comment-thread-01 importing engagement-bar-01 and post-card-01 importing all 5 priors).

## Behavioral contracts per file

### `story-viewer-01.tsx` (root)

```tsx
"use client";

export function StoryViewer01({
  stories: initialStories,
  initialStoryIndex,
  isOpen,
  onClose,
  ref,
  subscribe,
  onSubscribeDelta,
  onStoryViewed,
  onItemViewed,
  onCursorChange,
  onAutoCloseAtEnd,
  renderItem,
  defaultItemDuration = 5,
  labels: labelsProp,
  className,
  contentClassName,
}: StoryViewer01Props) {
  const labels = useMemo(
    () => ({ ...DEFAULT_STORY_VIEWER_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const {
    stories,
    cursor,
    isPaused,
    isMuted,
    setPaused,
    setMuted,
    goToPrevItem,
    goToNextItem,
    goToPrevStory,
    goToNextStory,
    goToStoryIndex,
    goToItemIndex,
    reset,
    dispatch,
  } = useStoryViewerState({
    initialStories,
    initialStoryIndex,
    isOpen,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed,
    onCursorChange,
    onAutoCloseAtEnd,
    onClose,
  });

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      goToStory: goToStoryIndex,
      goToItem: goToItemIndex,
      setPaused,
      getCursor: () => ({ storyIndex: cursor.storyIndex, itemIndex: cursor.itemIndex }),
      getCurrentStories: () => stories,
      reset,
      dispatch,
    }),
    [cursor, stories, goToStoryIndex, goToItemIndex, setPaused, reset, dispatch],
  );

  // Keyboard nav
  useStoryKeyboardNav({
    isOpen,
    onPrevItem: goToPrevItem,
    onNextItem: goToNextItem,
    onTogglePause: () => setPaused((p) => !p),
    onClose,
  });

  const currentStory = stories[cursor.storyIndex];
  const currentItem = currentStory?.items[cursor.itemIndex];

  if (!isOpen || !currentStory || !currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ViewerShell ariaLabel={labels.viewerLabel} className={cn(contentClassName)}>
        <NavArrows
          canPrev={cursor.storyIndex > 0}
          onPrev={goToPrevStory}
          onNext={goToNextStory}
          labels={labels}
        />
        <ViewerInner
          story={currentStory}
          item={currentItem}
          cursor={cursor}
          isPaused={isPaused}
          isMuted={isMuted}
          setPaused={setPaused}
          setMuted={setMuted}
          onClose={onClose}
          goToPrevItem={goToPrevItem}
          goToNextItem={goToNextItem}
          renderItem={renderItem}
          defaultItemDuration={defaultItemDuration}
          labels={labels}
          className={className}
        />
      </ViewerShell>
    </Dialog>
  );
}
```

Memoized at export: `export default memo(StoryViewer01)` from inside the file? No — root is exported by name (matches story-rail-01 / post-card-01 / comment-thread-01 pattern; consumers wrap externally if needed).

### `parts/viewer-shell.tsx`

The Dialog content surface — owns the modal animation seam. v0.1 ships pure CSS:

```tsx
export function ViewerShell({ children, ariaLabel, className }: ViewerShellProps) {
  return (
    <DialogPortal>
      <DialogOverlay
        className={cn(
          "fixed inset-0 z-50 bg-black/95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          "duration-300",
        )}
      />
      <DialogContent
        aria-label={ariaLabel}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "h-full w-full bg-black",
          "md:h-175 md:w-100 md:rounded-2xl md:overflow-hidden",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "duration-300",
          className,
        )}
      >
        {children}
      </DialogContent>
    </DialogPortal>
  );
}
```

`md:w-100 md:h-175` matches kasder verbatim (400px / 700px in Tailwind v4 canonical scale).

**v0.2 seam** — when swipe-to-dismiss lands, this file becomes `<motion.div drag="y" ...>` wrapping `DialogContent`. Pure CSS classes get swapped for `motion.div` props. Single-file change.

### `parts/progress-bars.tsx`

```tsx
export function ProgressBars({ items, currentItemIndex, progress }: ProgressBarsProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2">
      {items.map((item, idx) => {
        const width =
          idx < currentItemIndex ? 100 :
          idx === currentItemIndex ? progress :
          0;
        return (
          <div
            key={item.id}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(width)}
          >
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${width}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
```

### `parts/viewer-header.tsx`

```tsx
export function ViewerHeader({ story, item, isPaused, isMuted, onTogglePause, onToggleMute, onClose, formatTime, labels }: ViewerHeaderProps) {
  return (
    <div className="absolute left-0 right-0 top-4 z-20 flex items-center justify-between px-4 pt-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage src={story.avatar} alt="" />
          <AvatarFallback>{story.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">{story.username}</p>
          <p className="text-xs text-white/60">{formatTime(new Date(story.createdAt))}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          onClick={onTogglePause}
          aria-label={isPaused ? labels.play : labels.pause}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        {item.type === "video" ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            onClick={onToggleMute}
            aria-label={isMuted ? labels.unmute : labels.mute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          onClick={onClose}
          aria-label={labels.close}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

### `parts/tap-zones.tsx`

```tsx
export function TapZones({ onPrev, onTogglePause, onNext }: TapZonesProps) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="absolute inset-0 z-10 flex" aria-hidden>
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => { stop(e); onPrev(); }}
        tabIndex={-1}
      />
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => { stop(e); onTogglePause(); }}
        tabIndex={-1}
      />
      <button
        type="button"
        className="h-full w-1/3 cursor-pointer"
        onClick={(e) => { stop(e); onNext(); }}
        tabIndex={-1}
      />
    </div>
  );
}
```

`tabIndex={-1}` because tap zones are touch affordances; keyboard users use arrow-key handlers.

### `parts/nav-arrows.tsx`

```tsx
export function NavArrows({ canPrev, onPrev, onNext, labels }: NavArrowsProps) {
  const base = "absolute top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex";
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(base, "left-4")}
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labels.prevStory}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(base, "right-4")}
        onClick={onNext}
        aria-label={labels.nextStory}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
    </>
  );
}
```

### `parts/item-view.tsx`

```tsx
export function ItemView({ item, cursor, isPaused, isMuted, onLoadedMetadata, onEnded, renderItem, labels, story, totalItems }: ItemViewProps) {
  if (renderItem) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {renderItem(item, { storyIndex: cursor.storyIndex, itemIndex: cursor.itemIndex, isPaused, isMuted })}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {item.type === "image" ? (
        <img
          src={item.src}
          alt={labels.itemImageAlt(story, cursor.itemIndex, totalItems)}
          className="h-full w-full object-cover"
        />
      ) : (
        <VideoPlayer01
          src={item.src}
          isActive={!isPaused}
          muted={isMuted}
          loop={false}
          autoPlay
          controls={false}
          objectFit="cover"
          videoClassName="h-full w-full"
          className="absolute inset-0"
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}
```

### `hooks/use-story-viewer-state.ts`

Owns: stories array (mutable copy of initial), cursor `{storyIndex, itemIndex}`, `isPaused`, `isMuted`, navigation (prev/next item, prev/next story, jump-to-index/item), realtime subscription wiring, lifecycle callback firing.

Cursor is **internally tracked by ID** for stability across realtime patches:

```ts
interface InternalCursor {
  storyId: string;
  itemId: string;
  // Derived for output
  storyIndex: number;
  itemIndex: number;
}
```

Re-derived from `stories` whenever stories change (delta arrives or `reset` called).

Reset effect on `(initialStoryIndex, isOpen)`:

```ts
useEffect(() => {
  if (!isOpen) return;
  const story = stories[initialStoryIndex];
  if (!story) return;
  setCursor({
    storyId: story.id,
    itemId: story.items[0]?.id ?? "",
    storyIndex: initialStoryIndex,
    itemIndex: 0,
  });
  setIsPaused(false);
  setProgress(0);
}, [initialStoryIndex, isOpen]);  // Intentionally NOT depending on stories — cursor reset is opening-driven
```

Subscribe wiring (locked Subscribe-pattern from story-rail-01):

```ts
const onSubscribeDeltaRef = useRef(onSubscribeDelta);
useEffect(() => { onSubscribeDeltaRef.current = onSubscribeDelta; }, [onSubscribeDelta]);

useEffect(() => {
  if (!subscribe) return;
  const handler = (delta: StoryViewerDelta) => {
    dispatch(deltaToAction(delta));
    onSubscribeDeltaRef.current?.(delta);
  };
  return subscribe(handler);
}, [subscribe]);
```

Reducer covers `add-story`, `remove-story`, `add-item`, `remove-item`, `patch-story` (kasder didn't have this, but the locked Subscribe pattern requires reducer-driven state).

After every reducer dispatch that mutates `stories`, re-derive cursor indices from cursor IDs (handles index shifts from prepends/removes safely).

Cursor advancement helpers fire:
- `goToNextItem` → if next item exists in story, increment itemIndex; else goToNextStory (which fires onStoryViewed for the leaving story); else if last story, fire `onAutoCloseAtEnd?.()` then `onClose()`.
- `goToPrevItem` → if prev item exists, decrement; else if prev story exists, jump to its last item; else no-op (already at start).
- `goToNextStory` → fires `onStoryViewed(currentStory.id)` (forward), advances. If past last, auto-close.
- `goToPrevStory` → does NOT fire `onStoryViewed` (R-D-3: forward-only). Just rewinds.
- `goToStoryIndex(idx)` (from imperative handle) → fires `onStoryViewed(currentStory.id)` IF `idx > currentStoryIndex`; otherwise just jumps. (Forward-only).
- `goToItemIndex(idx)` (from imperative handle) → just jumps within current story. No `onStoryViewed` fire (story unchanged).
- All cursor changes fire `onCursorChange?.(storyIndex, itemIndex)`.

### `hooks/use-story-progress.ts`

The accumulatedMs-based timer (R-D-4):

```ts
export interface UseStoryProgressOptions {
  isOpen: boolean;
  isPaused: boolean;
  itemKey: string;  // changes ⇒ reset accumulator
  itemDuration: number;  // ms
  onComplete: () => void;
  tickMs?: number;  // default 50
}

export function useStoryProgress({ isOpen, isPaused, itemKey, itemDuration, onComplete, tickMs = 50 }: UseStoryProgressOptions) {
  const [progress, setProgress] = useState(0);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Reset on item change
  useEffect(() => {
    accumulatedRef.current = 0;
    setProgress(0);
  }, [itemKey]);

  // Run timer when open + not paused
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (startTimeRef.current !== null) {
        accumulatedRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const startedAt = startTimeRef.current;
      if (startedAt == null) return;
      const elapsed = (Date.now() - startedAt) + accumulatedRef.current;
      const pct = Math.min((elapsed / itemDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        accumulatedRef.current = 0;
        startTimeRef.current = null;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current?.();
      }
    }, tickMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, isPaused, itemKey, itemDuration, tickMs]);

  return progress;
}
```

Exported standalone — hosts can drive their own custom progress UI.

### `hooks/use-story-keyboard-nav.ts`

```ts
export interface UseStoryKeyboardNavOptions {
  isOpen: boolean;
  onPrevItem: () => void;
  onNextItem: () => void;
  onTogglePause: () => void;
  onClose: () => void;
}

export function useStoryKeyboardNav({ isOpen, onPrevItem, onNextItem, onTogglePause, onClose }: UseStoryKeyboardNavOptions) {
  const refs = useRef({ onPrevItem, onNextItem, onTogglePause, onClose });
  useEffect(() => {
    refs.current = { onPrevItem, onNextItem, onTogglePause, onClose };
  }, [onPrevItem, onNextItem, onTogglePause, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          refs.current.onPrevItem();
          break;
        case "ArrowRight":
          refs.current.onNextItem();
          break;
        case " ":
          e.preventDefault();
          refs.current.onTogglePause();
          break;
        // Escape is handled by Radix Dialog → onOpenChange → onClose
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);
}
```

Refs-mirror pattern keeps the listener stable (only re-attaches on `isOpen` flip).

### `lib/format-time.ts`

```ts
export function defaultFormatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}
```

(Used only for the default labels object; consumers can override via `labels.formatTime`.)

### `dummy-data.ts`

3 mock stories with mixed content:
- Story 1: 3 image items (`https://images.unsplash.com/...` URLs, kasder-aligned)
- Story 2: 2 video items (`https://www.w3schools.com/html/mov_bbb.mp4` + `movie.mp4` — kasder URLs locked previously)
- Story 3: 1 image + 1 video mixed

All stories use ISO date strings via `new Date(now - offsetHours).toISOString()` helpers.

### `demo.tsx` (6 tabs)

1. **Image-only story** — single image story, default config
2. **Video-only story** — video item with auto-pause-on-close
3. **Mixed media** — story with image + video items, demonstrates auto-advance
4. **Multi-story navigation** — 3 stories, keyboard arrows + nav buttons + auto-advance to next story
5. **Realtime fake** — synthetic subscribe firing `item-added` every 8s + `story-added` every 15s
6. **Custom renderItem** — host-provided item renderer for a third item type (e.g., a "promo" placeholder)

Each tab has a "Open viewer" button + the viewer is conditionally rendered when `isOpen=true` (host owns state).

### `usage.tsx`

Documents installation, mental model, mount-only items, click → viewer wiring (with rail integration), realtime pattern, imperative handle. Same structure as story-rail-01 usage.

### `meta.ts`

Standard pro-ui meta: `slug: "story-viewer-01"`, `category: "media"`, `version: "0.1.0"`, status `stable`, dependencies (lists `video-player-01` cross-folder), shadcn primitives (`dialog`, `avatar`, `button`), peer deps (none beyond what video-player-01 declares).

### `index.ts`

```ts
export { StoryViewer01 } from "./story-viewer-01";
export {
  useStoryViewerState,
  type UseStoryViewerStateOptions,
  type UseStoryViewerStateResult,
} from "./hooks/use-story-viewer-state";
export {
  useStoryProgress,
  type UseStoryProgressOptions,
} from "./hooks/use-story-progress";
export {
  useStoryKeyboardNav,
  type UseStoryKeyboardNavOptions,
} from "./hooks/use-story-keyboard-nav";
export type {
  Story,
  StoryItem,
  StoryViewer01Props,
  StoryViewer01Handle,
  StoryViewer01Labels,
  StoryViewerDelta,
  StoryViewerLocalAction,
  RenderItemContext,
  Subscribe,
  Unsubscribe,
} from "./types";
export { DEFAULT_STORY_VIEWER_LABELS } from "./types";
export { meta } from "./meta";
```

## Tailwind v4 translation surface

Pre-flight scan for kasder→pro-ui class renames (per the "Tailwind v3 → v4 translations from kasder" memory):

| Kasder | Pro-ui (Tailwind v4) | Where it appears |
|---|---|---|
| `bg-gradient-to-X` | `bg-linear-to-X` | None in this scope (gradient ring is in story-rail-01) |
| `break-words` | `wrap-break-word` | None |
| `grayscale-[N%]` | `grayscale-N` | None |

Pre-cleared. No translation work expected during impl.

## React Compiler / lint surface

Locked patterns to avoid known footguns:

1. **Refs not written during render** — all ref mutations go inside `useEffect` or `useImperativeHandle` callbacks. Subscribe handler ref + onComplete ref + cursor refs all updated in dedicated effects.
2. **Hooks not in `.map()`** — viewer renders ONE item at a time, so no per-item hook concern.
3. **Exhaustive deps** — `onClose`, `onSubscribeDelta`, `onComplete` mirrored to refs so effect deps stay narrow (Subscribe lifecycle keyed on `[subscribe]` only; keyboard listener keyed on `[isOpen]` only).
4. **`memo` boundary** — root export NOT memoized (consumer-call-site decision per arc convention).

## Manifest + registry.json wiring

`src/registry/manifest.ts` (3-line addition):

```ts
import StoryViewer01Demo from "./components/media/story-viewer-01/demo";
import StoryViewer01Usage from "./components/media/story-viewer-01/usage";
import { meta as storyViewer01Meta } from "./components/media/story-viewer-01/meta";

// ... and entry in REGISTRY array:
{ meta: storyViewer01Meta, Demo: StoryViewer01Demo, Usage: StoryViewer01Usage },
```

`registry.json` (2 items: base + fixtures):

```json
{
  "name": "story-viewer-01",
  "type": "registry:component",
  "registryDependencies": ["https://ilinxa-proui.vercel.app/r/video-player-01.json"],
  "dependencies": [],
  "files": [
    { "path": "src/registry/components/media/story-viewer-01/story-viewer-01.tsx", "type": "registry:component", "target": "components/story-viewer-01/story-viewer-01.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/viewer-shell.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/viewer-shell.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/progress-bars.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/progress-bars.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/viewer-header.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/viewer-header.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/tap-zones.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/tap-zones.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/nav-arrows.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/nav-arrows.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/parts/item-view.tsx", "type": "registry:component", "target": "components/story-viewer-01/parts/item-view.tsx" },
    { "path": "src/registry/components/media/story-viewer-01/hooks/use-story-viewer-state.ts", "type": "registry:component", "target": "components/story-viewer-01/hooks/use-story-viewer-state.ts" },
    { "path": "src/registry/components/media/story-viewer-01/hooks/use-story-progress.ts", "type": "registry:component", "target": "components/story-viewer-01/hooks/use-story-progress.ts" },
    { "path": "src/registry/components/media/story-viewer-01/hooks/use-story-keyboard-nav.ts", "type": "registry:component", "target": "components/story-viewer-01/hooks/use-story-keyboard-nav.ts" },
    { "path": "src/registry/components/media/story-viewer-01/lib/format-time.ts", "type": "registry:component", "target": "components/story-viewer-01/lib/format-time.ts" },
    { "path": "src/registry/components/media/story-viewer-01/types.ts", "type": "registry:component", "target": "components/story-viewer-01/types.ts" },
    { "path": "src/registry/components/media/story-viewer-01/index.ts", "type": "registry:component", "target": "components/story-viewer-01/index.ts" }
  ]
},
{
  "name": "story-viewer-01-fixtures",
  "type": "registry:component",
  "registryDependencies": ["https://ilinxa-proui.vercel.app/r/story-viewer-01.json"],
  "files": [
    { "path": "src/registry/components/media/story-viewer-01/dummy-data.ts", "type": "registry:component", "target": "components/story-viewer-01/dummy-data.ts" }
  ]
}
```

## Validation surface

After implementation:
1. `pnpm tsc --noEmit` clean.
2. `pnpm lint` clean (only pre-existing rich-card warning).
3. `pnpm dev` → `/components/story-viewer-01` HTTP 200, all 6 demo tabs render.
4. `pnpm registry:build` → `public/r/story-viewer-01.json` + `public/r/story-viewer-01-fixtures.json` regenerate.

## Out of scope (locked from description)

Explicit deferrals tracked in description's "Out of scope" — not repeated here.

## Re-validation refinements (already applied in pseudocode above where relevant; collected here for the implementation log)

- **R-Plan-1** Cursor canonical source = `{ storyId, itemId }` (NOT indices); `storyIndex / itemIndex` derived via `useMemo([stories, cursor.storyId, cursor.itemId])`. After delta-driven `stories` mutations the derived indices stay consistent without manual re-sync. `itemId` is scoped within the story (so cross-story id collisions are fine).
- **R-Plan-2** Reset effect uses an `initialStoriesRef` mirror so `[initialStoryIndex, isOpen]` deps stay narrow without `eslint-disable`. Effect reads `stories` from the ref's current snapshot at fire time.
- **R-Plan-3** `onAutoCloseAtEnd` fires **synchronously immediately before** `onClose()`. Single-event close pipeline; hosts wanting to defer (show "all caught up" overlay) keep `isOpen=true` themselves and ignore `onClose` until they're ready — `onAutoCloseAtEnd` is the signal, `onClose` is the canonical close. Documented in usage.
- **R-Plan-4** Item-duration resolution lives in **root** (not in `use-story-progress`). Root tracks `videoMetadataDurationByItemId` map updated via `<VideoPlayer01 onLoadedMetadata>` and computes `itemDurationMs = (currentItem.duration ?? videoMetadata[currentItem.id] ?? defaultItemDuration) * 1000`. `use-story-progress` receives the resolved `itemDurationMs`.
- **R-Plan-5** `useStoryProgress`'s reset key is `itemKey = "${currentStory.id}:${currentItem.id}"` (compound — any change to active item resets accumulator).
- **R-Plan-6** Radix Dialog accessibility — `<DialogContent>` requires a `<DialogTitle>` for Radix v1+ to avoid a console warning. Add `<DialogTitle className="sr-only">{labels.viewerLabel}</DialogTitle>` inside `ViewerShell`. Hosts can override via `labels.viewerLabel`.
- **R-Plan-7** Use `ReturnType<typeof setInterval>` instead of `NodeJS.Timeout` for the timer ref typing — portable across browser + Node typings.

## Recommendation

**PROCEED to implementation.** Two procomp gates passed. All architectural decisions locked from description sign-off + plan re-validation. Per the "no meta-questions when pattern is locked" memory, no Q-Ps surface at this stage. Implementation will be a clean translation of this plan into code.
