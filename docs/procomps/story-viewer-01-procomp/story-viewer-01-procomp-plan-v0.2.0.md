# story-viewer-01 v0.2.0 — procomp plan

> **Stage 2: how.** Addendum to the v0.1.0 [plan](story-viewer-01-procomp-plan.md). v0.1 plan remains authoritative for the cursor / progress timer / tap-zone / keyboard nav architecture; v0.2 layers engagement on top without retouching the viewer core.
>
> **Prerequisite:** [GATE 1 description v0.2.0](story-viewer-01-procomp-description-v0.2.0.md) signed off (7 Q-Ps locked + 10 pre-locked from precedent).
>
> **A+ template:** mirror [`post-card-01-procomp-plan.md`](../post-card-01-procomp/post-card-01-procomp-plan.md) where post-card-01 v0.2.0 established the role-aware-permissions + slot/disable + engagement-layer pattern.

---

## Implementation commit chain (C0–C10)

11 commits total. Each commit is verifiable in isolation; the chain telescopes to a single v0.2.0 ship.

### C0 — pre-flight hygiene (no version bump; rolls into v0.2.0)

**Files touched:** 4 (no new files)

- [`src/registry/components/media/story-viewer-01/parts/item-view.tsx:1`](../../src/registry/components/media/story-viewer-01/parts/item-view.tsx#L1) — `import { VideoPlayer01 } from "../../video-player-01"` → `"../../video-player-01/video-player-01"` (F-S1 specific-file). Same surgical fix as media-carousel-01 v0.1.3 did to `slide-renderer.tsx`.
- [`src/registry/components/media/story-viewer-01/parts/viewer-header.tsx`](../../src/registry/components/media/story-viewer-01/parts/viewer-header.tsx) — pause / mute / close buttons `h-8 w-8` (32×32) → `h-11 w-11` (44×44). Optional `md:h-9 md:w-9` (36×36) for desktop-tighter (acceptable since desktop has mouse precision).
- [`src/registry/components/data/story-rail-01/usage.tsx`](../../src/registry/components/data/story-rail-01/usage.tsx) lines 32, 53, 91 — positional `onItemClick={(item, index) => …}` → object-shape `onItemClick={({ item, index }) => …}`. Plus the prose mention at line 10. This is the bundled story-rail-01 v0.2.1 ship; bump `src/registry/components/data/story-rail-01/meta.ts` v0.2.0 → v0.2.1 + features list entry.
- `meta.ts` (story-rail-01) — version bump + features entry.

**Verification:**
- `pnpm tsc --noEmit` clean
- `pnpm validate:meta-deps` 49/49 clean (will be 50/50 after C10 lands? no — same component count, just bumped versions)
- `pnpm registry:build` regenerates rail + viewer artifacts cleanly
- Manual: existing 6 story-viewer demo tabs still render

**Commit message:** `fix(story-rail-01): v0.2.1 + chore(story-viewer-01): F-S1 + touch-target (rolls into v0.2.0)` — story-rail-01 is bumped to v0.2.1 in this commit (its own ship); story-viewer-01 hygiene patches stage for v0.2.0 (no separate version bump here)

### C1 — types expansion (story-viewer-01)

**Files touched:** 1 (types.ts massive expansion)

Add to [`src/registry/components/media/story-viewer-01/types.ts`](../../src/registry/components/media/story-viewer-01/types.ts):

```ts
// ─── v0.2.0 schema expansion ─────────────────────────────────────────

/** Optional eager seed for the owner-mode viewers list. Lazy fetch via onLoadViewers. */
export interface ViewerListItem {
  id: string;
  name: string;
  avatar?: string;
  /** ISO date of when they viewed. Optional. */
  viewedAt?: string;
}

/** Optional link CTA on a story item. Surfaces as bottom button (per Q-V9 lock). */
export interface StoryItemLink {
  url: string;
  /** Custom CTA label. Defaults to labels.openLink ("Open link"). */
  cta?: string;
}

// Extend StoryItem
export interface StoryItem {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number;
  /** v0.2.0 — optional link CTA rendered as bottom button. */
  link?: StoryItemLink;
}

// Extend Story
export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  items: StoryItem[];
  hasUnread?: boolean;
  createdAt: string;
  /** v0.2.0 — eager view count for owner overlay. Lazy users list via onLoadViewers. */
  viewerCount?: number;
  /** v0.2.0 — optional eager viewers seed (hybrid Q-V5 lock). */
  viewers?: ViewerListItem[];
}

// ─── v0.2.0 permissions ──────────────────────────────────────────────

export type StoryPermissionAction =
  // owner-side
  | "saveToHighlights"
  | "deleteStory"
  | "shareToFeed"
  | "seeViewers"
  // viewer-side
  | "react"
  | "reply"
  | "share"
  | "dm"
  | "report"
  | "blockAuthor"
  | "muteAuthor"
  // orthogonal
  | "moderate";

export interface StoryViewerPermissions {
  // owner-side
  canSaveToHighlights?: boolean;
  canDeleteStory?: boolean;
  canShareToFeed?: boolean;
  canSeeViewers?: boolean;
  // viewer-side
  canReact?: boolean;
  canReply?: boolean;
  canShare?: boolean;
  canDM?: boolean;
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
  // orthogonal (default false in BOTH modes — explicit-only, never auto-derived)
  canModerate?: boolean;
}

export type StoryViewerMode = "owner" | "viewer";

// ─── v0.2.0 engagement realtime (SEPARATE stream from existing StoryViewerDelta) ──

export type StoryEngagementDelta =
  | { kind: "like-changed"; storyId: string; itemId: string; count: number; liked?: boolean }
  | { kind: "reaction-changed"; storyId: string; itemId: string; kind?: string | null; count: number }
  | { kind: "reply-added"; storyId: string; itemId: string; replyId: string }
  | { kind: "viewer-added"; storyId: string; viewer: ViewerListItem }
  | { kind: "view-count-changed"; storyId: string; count: number };

export type StoryEngagementLocalAction =
  | { kind: "like-toggle"; storyId: string; itemId: string; nextLiked: boolean }
  | { kind: "reaction-select"; storyId: string; itemId: string; reactionKind: string | null }
  | { kind: "subscribe-delta"; delta: StoryEngagementDelta }
  | { kind: "reset"; storyId: string; itemId: string };

// ─── v0.2.0 reactor list (parallel to viewers list; for stacked reactionsPreview slot) ──

// Inherits EngagementLikerProfile shape from engagement-bar-01 via inline-copy
// (cross-category type — Bug 3 F-S1 fix required).
export interface StoryReactorProfile {
  id: string;
  name?: string;
  avatar?: string;
  reactionKind?: string;
}

// ─── v0.2.0 imperative handle expansion ──────────────────────────────

export interface StoryViewer01Handle {
  // v0.1 (unchanged):
  goToStory: (index: number) => void;
  goToItem: (index: number) => void;
  setPaused: (paused: boolean) => void;
  getCursor: () => { storyIndex: number; itemIndex: number };
  getCurrentStories: () => Story[];
  reset: (next: Story[]) => void;
  dispatch: (action: StoryViewerLocalAction) => void;
  // v0.2.0 additions (6 new):
  setMuted: (muted: boolean) => void;
  triggerLike: () => void;
  triggerReaction: (kind?: string) => void;
  triggerReply: (content?: string) => void;
  triggerShare: () => void;
  openKebab: () => void;
}

// ─── v0.2.0 labels expansion (12 new keys) ───────────────────────────

export interface StoryViewer01Labels {
  // v0.1 (unchanged):
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
  // v0.2.0 additions:
  reactionPickerLabel?: string;
  replyComposerPlaceholder?: (story: Story) => string; // function for `Reply to {username}…`
  replyComposerSend?: string;
  replyComposerCancel?: string;
  viewerCountLabel?: (count: number, time: string) => string;
  viewersHeading?: string;
  viewersMoreLabel?: (count: number) => string;
  saveToHighlights?: string;
  unsaveFromHighlights?: string;
  deleteStory?: string;
  shareToFeed?: string;
  report?: string;
  blockAuthor?: string;
  muteAuthor?: string;
  copyLink?: string;
  openLink?: string; // default StoryItem.link CTA when item.link.cta absent
  /** Nested forward to engagement-bar-01 labels (per Q-V14 — inherit). */
  engagementLabels?: EngagementBarLabels;
  /** Nested forward to comment-thread-01 labels (composer keys only matter). */
  commentLabels?: CommentThreadLabels;
}

// Updated DEFAULT_STORY_VIEWER_LABELS (~20 keys total)
```

**Public-API delta:**
- 5 new optional fields on Story / StoryItem / their helpers (`viewerCount`, `viewers`, `link`)
- 1 new mode toggle: `viewerMode`
- 11-arm permissions matrix
- 12-arm `StoryPermissionAction` union
- 5-arm engagement delta union + 4-arm engagement local action union
- 1 new ViewerListItem interface + 1 StoryReactorProfile (inline-copy)
- 6 new imperative handle methods (handle goes 7 → 13)
- ~12 new label keys (+nested forwards) — labels go 10 → ~22
- StoryViewer01Props gains **~30 new optional props** broken down: 7 render slots + 8 disable opt-outs + 3 permissions inputs (viewerMode + permissions + canPerformAction) + 1 currentUser + 1 moderatorActions + 1 kebabActions + 2 engagement realtime (engagementSubscribe + onSubscribeEngagementDelta) + 1 onAddReply + 1 onLoadViewers + 1 linkComponent + 1 onLinkClick + 1 longPressThresholdMs + 4 engagement handlers (onLikeStory / onReactStory / onShareStory / onBookmarkStory) = **31 new optional props**

**Verification:** `pnpm tsc --noEmit` clean (types-only commit — no runtime changes; v0.1 consumers' code still compiles).

**Commit message:** `feat(story-viewer-01): v0.2.0 C1 — types expansion (permissions, engagement, owner overlay shapes)`

### C2 — `lib/permissions.ts` (mirrors post-card-01 verbatim)

**Files touched:** 1 NEW (`lib/permissions.ts`)

Copy [`src/registry/components/data/post-card-01/lib/permissions.ts`](../../src/registry/components/data/post-card-01/lib/permissions.ts) verbatim. Then adapt:

- Rename `PostPermissions` → `StoryViewerPermissions`
- Rename `PostPermissionAction` → `StoryPermissionAction`
- Rename `PostViewerMode` → `StoryViewerMode`
- Update `PERMISSION_DEFAULTS_BY_MODE`:

```ts
export const PERMISSION_DEFAULTS_BY_MODE: Record<
  StoryViewerMode,
  Required<StoryViewerPermissions>
> = {
  owner: {
    canSaveToHighlights: true,
    canDeleteStory: true,
    canShareToFeed: true,
    canSeeViewers: true,
    // viewer-side off for owners (they don't react to their own story)
    canReact: false,
    canReply: false,
    canShare: true,
    canDM: false,
    canReport: false,
    canBlockAuthor: false,
    canMuteAuthor: false,
    canModerate: false,
  },
  viewer: {
    canSaveToHighlights: false,
    canDeleteStory: false,
    canShareToFeed: false,
    canSeeViewers: false,
    canReact: true,
    canReply: true,
    canShare: true,
    canDM: true,
    canReport: true,
    canBlockAuthor: true,
    canMuteAuthor: true,
    canModerate: false,
  },
};
```

`actionToPermissionKey` works unchanged (`can${cap(action)}` pattern). Two action keys diverge from the default casing — `canDM` and `canModerate`: `dm` → `canDm` BUT we want `canDM` (capital DM). Add a special-case map:

```ts
const SPECIAL_KEYS: Record<string, keyof StoryViewerPermissions> = {
  dm: "canDM",
};
function actionToPermissionKey(action: StoryPermissionAction): keyof StoryViewerPermissions {
  if (action in SPECIAL_KEYS) return SPECIAL_KEYS[action];
  return `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof StoryViewerPermissions;
}
```

(Avoids forcing the public key to be `canDm` which reads worse than `canDM`.)

Export `resolveStoryPermissions` + `canPerformStoryActionInternal` with identical signatures to post-card-01's helpers.

**Verification:** tsc + lint clean.

**Commit message:** `feat(story-viewer-01): v0.2.0 C2 — lib/permissions.ts (resolver mirroring post-card-01)`

### C3 — engagement overlay (compose engagement-bar-01 v0.3.x)

**Files touched:** 2 NEW (`parts/engagement-overlay.tsx` + `hooks/use-story-engagement-state.ts`); 1 modified (`story-viewer-01.tsx`)

**Cross-category type imports — Bug 3 inline-copies required:**

`engagement-bar-01` is in `data/` category; `story-viewer-01` is in `media/`. So **cross-category** for all engagement-bar / comment-thread composition. Per F-S1 Bug 3 lock:

- **COMPONENT imports** use absolute-with-suffix `@/registry/components/data/engagement-bar-01/engagement-bar-01` (works through the rewriter)
- **TYPE imports** must be **inline-copied** locally — `@/registry/components/data/engagement-bar-01/types` does NOT survive the rewriter (mangles to wrong slug or invalid `<cat>/` prefix)

Inline-copies needed in `types.ts` (add to C1):

```ts
// Inlined from @ilinxa/engagement-bar-01's EngagementAction discriminator.
// MUST be kept structurally identical. If engagement-bar-01 adds a new arm,
// this copy must follow. JSDoc sync-warning required.
export type StoryEngagementAction =
  | { kind: "like"; count?: number; liked?: boolean; onToggle?: (next: boolean) => void; onCountClick?: () => void; align?: "left" | "right" | "auto" }
  | { kind: "comment"; count?: number; onClick?: () => void; align?: "left" | "right" | "auto" }
  | { kind: "share"; count?: number; onClick?: () => void; align?: "left" | "right" | "auto" }
  | { kind: "bookmark"; bookmarked?: boolean; onToggle?: (next: boolean) => void; align?: "left" | "right" | "auto" }
  | { kind: "custom"; id: string; label: string; icon?: ReactNode; active?: boolean; onClick?: () => void; align?: "left" | "right" | "auto" }
  | { kind: "reaction"; kinds: StoryEngagementReactionKind[]; selectedKind?: string | null; onSelect?: (kind: string | null) => void; align?: "left" | "right" | "auto" };

// Inline-copy EngagementReactionKind shape:
export interface StoryEngagementReactionKind {
  id: string;
  label: string;
  icon: ReactNode;
  color?: string;
}

// Inline-copy the engagement-bar's full Labels shape (~15 keys) — do NOT alias
// (`type Foo = EngagementBarLabels` still requires the cross-cat type import).
export interface StoryEngagementBarLabels {
  like?: string;
  unlike?: string;
  /* ...full 15-key shape verbatim from engagement-bar-01/types.ts EngagementBarLabels... */
}
```

Same pattern for CommentComposer types in C4: inline-copy `CommentComposerProps` shape and any `CommentThreadCurrentUser` shape (or just use a local `{ id: string; name: string; avatar?: string }` since the contract is small).

Document all inline-copies in JSDoc with a sync-warning: *"if engagement-bar-01 changes the upstream type, this copy MUST be updated manually."*

**New part: `parts/engagement-overlay.tsx`**

```tsx
"use client";
import { memo } from "react";
import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01/engagement-bar-01";
import type { StoryEngagementAction, Story, StoryItem, StoryViewer01Labels } from "../types";
import { useStoryEngagementState } from "../hooks/use-story-engagement-state";

export interface EngagementOverlayProps {
  story: Story;
  item: StoryItem;
  actions: StoryEngagementAction[]; // resolved from permissions + handlers + reactionKinds
  labels: Required<StoryViewer01Labels>;
  className?: string;
}

function EngagementOverlayInner(props: EngagementOverlayProps) {
  return (
    <div className="absolute right-2 bottom-20 z-30 flex flex-col items-center gap-3">
      <EngagementBar01
        variant="stacked"
        actions={props.actions as any}  // structural-equivalence cast; ignore TS variance
        labels={props.labels.engagementLabels as any}
      />
    </div>
  );
}
export const EngagementOverlay = memo(EngagementOverlayInner);
```

**Engagement actions resolver (`lib/engagement-actions.ts`):**

Mirror post-card-01's `defaultPostEngagementActions`. Build the action list from:

- `like` (gated by — well, owners can't react to their own story; viewers can per `canReact`)
- `reaction` if `canReact` + `reactionKinds` provided (no defaults — host supplies; Q-V4 lock)
- `comment` (clicks → focuses reply composer)
- `share` (gated by `canShare`)
- `bookmark` (always available)
- `custom` (kebab — see C6)

**New hook: `hooks/use-story-engagement-state.ts`**

Per-item engagement state (likes / reactions / viewerLiked / viewerReaction). Mirror engagement-bar-01's `useEngagementState` shape but scoped per-(storyId, itemId). Subscribe wiring fires deltas; reset on cursor change.

**Wire into story-viewer-01.tsx** — render `<EngagementOverlay>` inside the ViewerShell when `viewerMode === "viewer"` AND `!disableEngagement`.

**Verification:**
- tsc clean
- Manual: existing v0.1 demos (no viewerMode) render unchanged (engagement overlay only mounts when viewerMode set)
- New: render a viewer-mode story and confirm stacked engagement bar appears on right edge

**Commit message:** `feat(story-viewer-01): v0.2.0 C3 — engagement overlay (compose engagement-bar-01 stacked)`

### C4 — reply composer (compose comment-thread-01 CommentComposer)

**Files touched:** 1 NEW (`parts/reply-composer.tsx`); 1 modified (`story-viewer-01.tsx`)

**New part: `parts/reply-composer.tsx`**

```tsx
"use client";
import { memo, useCallback, useRef } from "react";
import { CommentComposer } from "@/registry/components/data/comment-thread-01/parts/comment-composer";
import type { CommentComposerHandle } from "@/registry/components/data/comment-thread-01/parts/comment-composer";
// Inline-copy CommentThreadCurrentUser (cross-cat type — Bug 3 fix)
import type { Story, StoryItem, StoryViewer01Labels } from "../types";

export interface ReplyComposerProps {
  story: Story;
  item: StoryItem;
  currentUser?: { id: string; name: string; avatar?: string };
  onAddReply?: (storyId: string, itemId: string, content: string) => Promise<void> | void;
  onSetPaused: (paused: boolean) => void;
  labels: Required<StoryViewer01Labels>;
  className?: string;
}

function ReplyComposerInner(props: ReplyComposerProps) {
  const ref = useRef<CommentComposerHandle | null>(null);
  const handleChange = useCallback((value: string) => {
    if (value.length > 0) props.onSetPaused(true);
  }, [props.onSetPaused]);
  const handleSubmit = useCallback(async (content: string) => {
    try {
      await props.onAddReply?.(props.story.id, props.item.id, content);
    } finally {
      props.onSetPaused(false);
    }
  }, [props.onAddReply, props.story.id, props.item.id, props.onSetPaused]);
  const handleCancel = useCallback(() => props.onSetPaused(false), [props.onSetPaused]);

  if (!props.currentUser) return null;

  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 bg-linear-to-t from-black/60 to-transparent px-4 pb-4 pt-8">
      <CommentComposer
        ref={ref}
        currentUser={props.currentUser as any}
        placeholder={props.labels.replyComposerPlaceholder(props.story)}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitOnEnter
        minRows={1}
        maxRows={3}
        labels={props.labels.commentLabels as any}
        ariaLabel={`Reply to ${props.story.username}`}
      />
    </div>
  );
}
export const ReplyComposer = memo(ReplyComposerInner);
```

**Wire into story-viewer-01.tsx** — render `<ReplyComposer>` when `viewerMode === "viewer"` AND `!disableReplyComposer` AND `canPerformAction("reply", story, item) !== false`.

**Verification:**
- tsc clean
- Manual: viewer mode shows composer at bottom; typing pauses story; submit resumes; cancel resumes; unauth (no currentUser) shows nothing (or `composerEmptyState` if wired)

**Commit message:** `feat(story-viewer-01): v0.2.0 C4 — reply composer (compose CommentComposer + auto-pause)`

### C5 — owner overlay (view-count + lazy viewers list)

**Files touched:** 1 NEW (`parts/owner-overlay.tsx`); 1 modified (`story-viewer-01.tsx`)

**New part: `parts/owner-overlay.tsx`**

```tsx
"use client";
import { memo, useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikersStrip } from "@/registry/components/data/engagement-bar-01/parts/likers-strip";
import type { Story, StoryItem, StoryViewer01Labels, ViewerListItem } from "../types";

export interface OwnerOverlayProps {
  story: Story;
  item: StoryItem;
  onLoadViewers?: (storyId: string) => Promise<ViewerListItem[]>;
  labels: Required<StoryViewer01Labels>;
  className?: string;
}

function OwnerOverlayInner(props: OwnerOverlayProps) {
  const count = props.story.viewerCount ?? props.story.viewers?.length ?? 0;
  const [open, setOpen] = useState(false);
  const [viewers, setViewers] = useState<ViewerListItem[]>(props.story.viewers ?? []);
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (viewers.length === 0 && props.onLoadViewers && !loading) {
      setLoading(true);
      try {
        const list = await props.onLoadViewers(props.story.id);
        setViewers(list);
      } finally {
        setLoading(false);
      }
    }
  }, [open, viewers.length, loading, props.onLoadViewers, props.story.id]);

  return (
    <>
      <div className="absolute left-0 right-0 bottom-0 z-30 flex items-center bg-linear-to-t from-black/60 to-transparent px-4 pb-4 pt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          className="text-white"
          aria-label={props.labels.viewerCountLabel(count, props.labels.formatTime(new Date(props.story.createdAt)))}
        >
          <Eye className="h-4 w-4" />
          <span className="ml-1">{count}</span>
        </Button>
      </div>
      {open ? (
        <div className="absolute inset-x-0 bottom-16 z-40 max-h-1/2 overflow-y-auto bg-card p-4 text-foreground">
          <LikersStrip
            totalCount={count}
            likers={viewers as any}
            heading={props.labels.viewersHeading}
            moreAriaLabelTemplate={props.labels.viewersMoreLabel(0).replace("0", "{count}")}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
    </>
  );
}
export const OwnerOverlay = memo(OwnerOverlayInner);
```

**Wire into story-viewer-01.tsx** — render `<OwnerOverlay>` when `viewerMode === "owner"` AND `!disableOwnerOverlay`.

**Verification:** tsc clean; manual: owner-mode story shows view-count chip; tap → expands viewers list (eager-render seed + lazy fetch).

**Commit message:** `feat(story-viewer-01): v0.2.0 C5 — owner overlay (view-count + lazy viewers list)`

### C6 — kebab assembly (`lib/kebab.ts` + integration in engagement overlay + header fallback)

**Files touched:** 1 NEW (`lib/kebab.ts`); 1 NEW (`parts/header-kebab-fallback.tsx`); 2 modified (engagement-overlay.tsx + viewer-header.tsx)

**New helper: `lib/kebab.ts`**

Mirror [`src/registry/components/data/post-card-01/lib/defaults.tsx`](../../src/registry/components/data/post-card-01/lib/defaults.tsx) `defaultPostKebabActions` exactly. Dual-mode: legacy when all 3 role-aware inputs undefined; role-aware when any set. Owner-side items (Save/Unsave/Delete/Share-to-feed), common items (Copy link), viewer-side items (Mute/Block/Report), moderator section gated by `canDo("moderate") && moderatorActions(story, item)` with `separatorBefore: true` on the first moderator item.

**Engagement-overlay integration:** when engagement is enabled, kebab is added to the action list as `kind: "custom"`, `id: "kebab"`, `icon: <MoreVertical />`, `onClick: () => openKebab()` — appears as the 6th item in the stacked column.

**Fallback: `parts/header-kebab-fallback.tsx`** — mounts when `disableEngagement: true`. Same kebab items, rendered as a `<DropdownMenu>` button in the header right cluster (leftmost of the cluster, per Instagram-style header convention).

**F-cross-13 alert:** Both render sites use `<DropdownMenuTrigger>` — apply the `buttonVariants(…)` pattern (no `asChild + Button` wrapping). Same fix as post-card-01 v0.3.1 + comment-thread-01 v0.2.1. Required pattern:

```tsx
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

<DropdownMenu open={kebabOpen} onOpenChange={setKebabOpen}>
  <DropdownMenuTrigger
    className={cn(
      buttonVariants({ variant: "ghost", size: "icon" }),
      "h-11 w-11 text-white", // ≥44×44 mobile target
    )}
    aria-label={labels.kebabAriaLabel}
  >
    <MoreVertical className="h-5 w-5" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">{/* items */}</DropdownMenuContent>
</DropdownMenu>
```

❌ NEVER: `<DropdownMenuTrigger asChild>{<Button …>}</DropdownMenuTrigger>` — the shadcn CLI rewrites this to `render={<Button />}` at install-time which breaks consumers on Radix.

**Imperative handle `openKebab`** — programmatically opens whichever kebab is mounted (engagement-overlay or header fallback).

**Verification:** tsc clean; manual: owner mode shows kebab in engagement overlay; toggle `disableEngagement` → kebab moves to header.

**Commit message:** `feat(story-viewer-01): v0.2.0 C6 — kebab assembly (engagement-overlay + header fallback)`

### C7 — render slots (renderHeader / renderProgress / renderNavArrows / renderTapZones)

**Files touched:** 4 (one per existing part — header, progress-bars, nav-arrows, tap-zones)

For each part, accept an optional `renderXxx?: (...) => ReactNode` prop. When provided, replace the part's internal render with the slot's return; otherwise render the default. The slot receives `helpers` (cursor, story, item, pause/mute setters, labels) — sufficient for full takeover.

Pattern (same as post-card-01's variant parts):

```tsx
function ViewerHeaderInner(props) {
  if (props.renderHeader) {
    return <>{props.renderHeader(props.story, props.item, helpers)}</>;
  }
  return /* default render */;
}
```

`renderEngagementOverlay` + `renderReplyComposer` + `renderOwnerOverlay` slots were stubbed in C3/C4/C5; wire them as full-takeover variants of those parts' default render.

**Verification:** tsc clean; manual: provide `renderHeader={…}` slot to a demo and confirm custom header renders.

**Commit message:** `feat(story-viewer-01): v0.2.0 C7 — render slots (7 connective seams)`

### C8 — disable opt-outs (8 flags)

**Files touched:** 1 (story-viewer-01.tsx + dispatch table)

8 flags: `disableTapZones`, `disableKeyboardNav`, `disableNavArrows`, `disableAutoClose`, `disableProgressBars`, `disableEngagement`, `disableReplyComposer`, `disableOwnerOverlay`.

Each flag short-circuits the corresponding part render OR hook activation:

- `disableTapZones` → don't mount `<TapZones>`
- `disableKeyboardNav` → don't call `useStoryKeyboardNav`
- `disableNavArrows` → don't mount `<NavArrows>`
- `disableAutoClose` → in `goToNextItem` (end of last story), DON'T call `onClose()` — fire `onAutoCloseAtEnd` and stay open
- `disableProgressBars` → don't mount `<ProgressBars>` (still run the timer for auto-advance)
- `disableEngagement` → don't mount `<EngagementOverlay>`; kebab falls back to header
- `disableReplyComposer` → don't mount `<ReplyComposer>`
- `disableOwnerOverlay` → don't mount `<OwnerOverlay>` (owner mode shows nothing at bottom)

**Verification:** tsc clean; manual: each flag tested in isolation in the demo's Custom slots tab.

**Commit message:** `feat(story-viewer-01): v0.2.0 C8 — 8 disable opt-outs`

### C9 — long-press pause + StoryItem.link CTA + linkComponent

**Files touched:** 1 NEW (`hooks/use-long-press-pause.ts`); 1 NEW (`parts/link-cta.tsx`); 1 modified (`story-viewer-01.tsx`)

**New hook: `hooks/use-long-press-pause.ts`**

```ts
import { useCallback, useEffect, useRef } from "react";

export interface UseLongPressPauseOptions {
  isOpen: boolean;
  longPressThresholdMs?: number;
  onPause: () => void;
  onResume: () => void;
}

export function useLongPressPause(opts: UseLongPressPauseOptions) {
  const { isOpen, longPressThresholdMs = 200, onPause, onResume } = opts;
  const timerRef = useRef<number | null>(null);
  const isPressingRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(() => {
      isPressingRef.current = true;
      onPause();
    }, longPressThresholdMs);
  }, [longPressThresholdMs, onPause]);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPressingRef.current) {
      isPressingRef.current = false;
      onResume();
    }
  }, [onResume]);

  useEffect(() => () => { if (timerRef.current != null) clearTimeout(timerRef.current); }, []);

  return { handlePointerDown, handlePointerUp, handlePointerCancel: handlePointerUp };
}
```

Wire into the viewer's outer surface (the `<div>` wrapping ProgressBars/Header/Item/TapZones). Coexists with existing middle-tap-pause (which still toggles via TapZones).

**New part: `parts/link-cta.tsx`**

Renders the bottom button when `item.link` is set. Uses `linkComponent` polymorphic root (default `"a"`). Coexists with engagement overlay (sits above it, below the reply composer).

```tsx
export function LinkCta({ item, labels, linkComponent: LinkComponent = "a", onLinkClick }) {
  if (!item.link) return null;
  const handleClick = onLinkClick ? () => onLinkClick(/* storyId, itemId, url */) : undefined;
  return (
    <div className="absolute left-0 right-0 bottom-32 z-25 px-4">
      <LinkComponent
        href={item.link.url}
        target={LinkComponent === "a" ? "_blank" : undefined}
        rel={LinkComponent === "a" ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className={cn(buttonVariants({ variant: "default", size: "default" }), "w-full text-center")}
      >
        {item.link.cta ?? labels.openLink}
      </LinkComponent>
    </div>
  );
}
```

**F-cross-13 alert:** `LinkComponent` is polymorphic — when consumer passes a custom component (Next.js `<Link>` etc.), the rewriter doesn't touch it. Safe.

**Verification:** tsc clean; manual: long-press anywhere = pause; release = resume; story with `link: { url, cta }` shows bottom button.

**Commit message:** `feat(story-viewer-01): v0.2.0 C9 — long-press pause + StoryItem.link CTA + linkComponent`

### C10 — handle expansion + demo refresh + meta bump + guide + spotcheck + STATUS

**Files touched:** ~10 (handle wiring, demo.tsx, meta.ts, guide.md, dummy-data.ts, spotcheck file, decision file, STATUS.md, component-versions.md)

**Imperative handle additions** (final 6 methods) wired through to the relevant state setters:

```ts
useImperativeHandle(ref, () => ({
  // v0.1 (preserved)
  goToStory: goToStoryIndex, goToItem: goToItemIndex, setPaused, getCursor, getCurrentStories, reset, dispatch,
  // v0.2.0 additions
  setMuted: (muted: boolean) => setMuted(muted),
  triggerLike: () => engagementRef.current?.triggerLike(),
  triggerReaction: (kind?: string) => engagementRef.current?.triggerReaction(kind),
  triggerReply: (content?: string) => {
    composerRef.current?.focus();
    if (content) composerRef.current?.setValue(content);
  },
  triggerShare: () => engagementRef.current?.triggerShare(),
  openKebab: () => setKebabOpen(true),
}), [...]);
```

**Demo refresh** — add 4 new tabs to `demo.tsx`:

- `ViewerModeTab` — viewerMode="viewer", currentUser wired, reactions array, onAddReply logger, viewer-side kebab
- `OwnerModeTab` — viewerMode="owner", viewers array seeded, onLoadViewers async logger, owner kebab w/ Save/Delete/Share-to-feed
- `CustomSlotsTab` — replaces renderHeader + renderEngagementOverlay + renderReplyComposer (demonstrates full takeover)
- `LinkAndLongPressTab` — story with item.link set + instructional overlay describing long-press pause

**Dummy data expansion:**

- Add `viewerCount: 47` + sample `viewers: [...]` to one story
- Add `link: { url: "...", cta: "Shop now" }` to one item
- Add a sample `reactionKinds` array for the engagement overlay (reuse engagement-bar-01's reaction kinds shape)

**meta.ts bump:**

```ts
version: "0.2.0",
updatedAt: "2026-MM-DD",
features: [
  ...existing,
  "v0.2.0 — Engagement overlay composing engagement-bar-01 v0.3.x (variant=stacked) — like + reaction (host-supplied kinds) + comment + share + bookmark + kebab as 6th item",
  "v0.2.0 — Reply composer composing comment-thread-01 v0.2.1 CommentComposer with auto-pause-on-type + currentUser-gated visibility",
  "v0.2.0 — Role-aware mode (viewerMode='owner'|'viewer') + StoryViewerPermissions matrix + canPerformAction predicate (mirrors post-card-01 v0.3.0 resolver)",
  "v0.2.0 — Owner overlay: view-count chip (eager from story.viewerCount) + lazy viewers list panel (onLoadViewers slot; reuses LikersStrip)",
  "v0.2.0 — Kebab in engagement-overlay as 6th item (Instagram-2024); fallback to header right cluster when disableEngagement",
  "v0.2.0 — Render slots: 1→7 (renderHeader/renderProgress/renderNavArrows/renderTapZones/renderEngagementOverlay/renderReplyComposer/renderOwnerOverlay)",
  "v0.2.0 — Disable opt-outs: 8 flags (disableTapZones/disableKeyboardNav/disableNavArrows/disableAutoClose/disableProgressBars/disableEngagement/disableReplyComposer/disableOwnerOverlay)",
  "v0.2.0 — Imperative handle: 7→13 methods (added setMuted/triggerLike/triggerReaction/triggerReply/triggerShare/openKebab)",
  "v0.2.0 — Polymorphic linkComponent + StoryItem.link CTA (bottom button; Q-V9 lock — sticker pattern deferred to v0.3 when story-sticker primitive lands)",
  "v0.2.0 — Long-press pause additive (Instagram-canonical mobile gesture; preserves v0.1 middle-tap-pause as desktop fallback; longPressThresholdMs prop tunable)",
  "v0.2.0 — F-S1 hygiene: VideoPlayer01 import switched to specific-file path",
  "v0.2.0 — Touch-target patch: header buttons 32×32 → 44×44 (WCAG 2.5.5 compliant)",
],
dependencies: {
  shadcn: ["dialog", "avatar", "button", "dropdown-menu"], // dropdown-menu NEW for kebab fallback
  npm: { "lucide-react": "^1.11.0" },
  internal: ["video-player-01", "engagement-bar-01", "comment-thread-01"], // expanded
},
```

**guide.md update** — add v0.2.0 sections: engagement-overlay wiring, reply composer, viewerMode permissions, owner overlay, kebab placement (engagement-overlay + header fallback), long-press pause, link CTA, disable opt-outs reference.

**Spotcheck file:** `docs/procomps/story-viewer-01-procomp/reviews/2026-MM-DD-v0.2.0-spotcheck.md`. Per readiness-review rule: public-API-touching minor bump → spotcheck required; rotating dim = Public API (major surface expansion); 4 fixed dims + Public API. Self-review acceptable per pro-component tier.

**Decision file:** `.claude/decisions/2026-MM-DD-story-viewer-01-v0.2.0-engagement-layer-ship.md`.

**STATUS.md + component-versions.md** bumps for story-viewer-01 0.1.2 → 0.2.0 + story-rail-01 0.2.0 → 0.2.1 (bundled).

**Verification gates:** tsc + validate:meta-deps + lint + registry:build + manual demo run-through.

**Commit message:** `feat(story-viewer-01): v0.2.0 C10 — handle + demo + meta + guide + spotcheck + STATUS`

---

## Composition wiring summary

```
story-viewer-01 v0.2.0 (media/)
├── compose engagement-bar-01 v0.3.x (data/) — variant=stacked
│   ├── EngagementBar01 (component) — absolute-with-suffix import
│   ├── LikersStrip (component) — for owner viewers list — absolute-with-suffix
│   ├── EngagementAction (type) — INLINE-COPY per Bug 3
│   ├── EngagementBarLabels (type) — INLINE-COPY per Bug 3
│   └── EngagementReactionKind (type) — INLINE-COPY per Bug 3
├── compose comment-thread-01 v0.2.1 (data/) — CommentComposer
│   ├── CommentComposer (component) — absolute-with-suffix
│   ├── CommentComposerHandle (type) — INLINE-COPY per Bug 3
│   ├── CommentComposerProps (type) — INLINE-COPY per Bug 3
│   └── CommentThreadCurrentUser (type) — INLINE-COPY per Bug 3
│       (or use local `{ id, name, avatar? }` shape — structural compat)
├── compose video-player-01 v0.1.x (media/) — VideoPlayer01 + useDoubleTap
│   └── Same-cat relative + specific-file (existing C0 hygiene fix)
└── self
    ├── lib/permissions.ts NEW (mirror post-card-01)
    ├── lib/kebab.ts NEW
    ├── parts/engagement-overlay.tsx NEW
    ├── parts/reply-composer.tsx NEW
    ├── parts/owner-overlay.tsx NEW
    ├── parts/header-kebab-fallback.tsx NEW
    ├── parts/link-cta.tsx NEW
    ├── hooks/use-story-engagement-state.ts NEW
    ├── hooks/use-long-press-pause.ts NEW
    └── (existing parts/hooks unchanged for v0.2.0; renderXxx slots added to props pass-through)
```

---

## Smoke expectations

**F-cross-13 carriers introduced in v0.2.0:**

- New `<DropdownMenu>` + `<DropdownMenuTrigger>` in `parts/header-kebab-fallback.tsx` — MUST use `buttonVariants(…)` pattern, never `<DropdownMenuTrigger asChild>{<Button>}` (CLI rewrites to broken `render={<Button />}`)
- New `<Popover>` usage? — engagement-bar-01's ReactionPicker uses Popover internally; we don't directly mount Popover here, so we inherit engagement-bar's defensive wiring (post-v0.3.2 Popover 3-facet fix). No additional surface from story-viewer.
- New `<Select>` / `<Tooltip>` / `<Checkbox>` — none introduced

**Expected same-day patch loop:** ~1 patch likely needed (kebab fallback's DropdownMenuTrigger surface OR some cross-cat type import I missed). Defensive: pre-apply `buttonVariants(…)` pattern in C6.

**Smoke harness:** post-push, run `node scripts/smoke-all.mjs --slug story-viewer-01` from `e:/tmp/ilinxa-smoke-consumer`. Will transitively install story-viewer-01 + comment-thread-01 + engagement-bar-01 + expandable-text-01 + media-carousel-01 + video-player-01. Consumer-tsc must pass for all 6.

**Pre-existing `ui/dialog.tsx` `icon-sm` error** — not from this ship; will continue to show as pre-existing noise in the smoke (already noted as out-of-scope).

---

## Re-validation pass (before declaring plan complete)

| Concern | Check | Status |
|---|---|---|
| Cross-cat type imports | Every cross-cat type (engagement-bar EngagementAction/Labels/ReactionKind, comment-thread CommentComposerProps/Handle/CurrentUser) is **inline-copied** per Bug 3 — never imported via `@/registry/components/<other-cat>/<slug>/types` | ✅ Plan §C1 + §C3/C4 explicitly inline-copies |
| asChild + Button traps (F-cross-13) | Every `<XxxTrigger>` in new parts uses `buttonVariants({variant, size})` className, NOT `asChild`+`<Button>` wrapping | ✅ Plan §C6 + §C9 specify the pattern |
| Same-cat cross-procomp imports | video-player-01 (same media/ category) uses relative + specific-file (`../../video-player-01/video-player-01`); engagement-bar / comment-thread (cross data/) use absolute-with-suffix | ✅ Plan §C0 fixes existing relative-barrel; §C3/C4 use absolute-with-suffix for cross-cat components |
| Zero-breakage for 6 existing demo tabs | All v0.1 props (stories/initialStoryIndex/isOpen/onClose/subscribe/onStoryViewed/onItemViewed/onCursorChange/onAutoCloseAtEnd/renderItem/defaultItemDuration/labels/className/contentClassName) preserved + behavior identical when no v0.2.0 props set | ✅ Plan §C1-C10 every addition is opt-in (gated on viewerMode / engagementSubscribe presence / disable flags / new slot props) |
| Permissions resolver auto-derivation | viewerMode does NOT auto-derive from currentUser.id === story.userId; host opts in explicitly (Q-V11 lock) | ✅ Plan §C2 mirrors post-card-01 pattern verbatim — explicit-only |
| Reply composer auto-pause | First character → pause; submit/cancel/blur → resume | ✅ Plan §C4 handleChange/handleSubmit/handleCancel |
| Owner overlay viewers list hybrid | Eager count + optional eager viewers seed + lazy onLoadViewers on tap (Q-V5 lock) | ✅ Plan §C5 OwnerOverlayInner state machine |
| Kebab placement (Q-V17 revised) | Engagement-overlay default placement (6th item via kind="custom"); fallback to header right cluster when disableEngagement | ✅ Plan §C6 dual-placement |
| Long-press pause additive (Q-V8) | Long-press primary mobile gesture (200ms default); middle-tap-pause preserved as desktop fallback | ✅ Plan §C9 useLongPressPause hook coexists with v0.1 TapZones middle-zone-pause |
| Link CTA bottom button (Q-V9) | StoryItem.link → bottom button using linkComponent polymorphic root | ✅ Plan §C9 LinkCta part |
| subscribe asymmetry (Q-V16) | Existing `subscribe: Subscribe<StoryViewerDelta>` preserved + new `engagementSubscribe: Subscribe<StoryEngagementDelta>` added | ✅ Plan §C1 types + §C3 wiring |
| Touch targets ≥44×44 | All buttons in v0.2.0 parts use `h-11 w-11` minimum on mobile; sm:h-9 sm:w-9 desktop OK | ✅ Plan §C0 patches v0.1 buttons; new buttons spec the same |
| meta.ts dependencies.internal | Updated from `["video-player-01"]` to `["video-player-01", "engagement-bar-01", "comment-thread-01"]` | ✅ Plan §C10 |
| Demo zero-breakage | Existing 6 tabs (image / video / mixed / multi / realtime / custom) work unchanged after v0.2.0 lands | ✅ Plan §C10 only ADDS tabs; doesn't modify existing |
| story-rail-01 v0.2.1 docs bundled | 3 stale onItemClick snippets + prose mention fixed | ✅ Plan §C0 bundles |

---

## Acceptance criteria (for v0.2.0 "ready to ship" verdict)

Per the [GATE 1 description acceptance §](story-viewer-01-procomp-description-v0.2.0.md#acceptance-criteria). All 12 items met. Quick re-list:

1. All 14 description scope items implemented ✅ (per C1-C10 above)
2. Zero v0.1.x consumer breakage ✅ (per re-validation §)
3. `meta.ts` v0.1.2 → 0.2.0; features list extended; dependencies.internal updated ✅ (C10)
4. tsc + validate:meta-deps + lint + build clean ✅ (per-commit verification gates)
5. F-S1 import patch landed ✅ (C0)
6. Touch target patch landed ✅ (C0)
7. Procomp doc trio updated: description signed off + plan signed off + guide updated ✅ (description done; plan = this doc; guide in C10)
8. GATE 3 spotcheck file authored with verdict ≥ Pass with follow-ups ✅ (C10)
9. Decision file authored ✅ (C10)
10. STATUS.md + component-versions.md bumped ✅ (C10)
11. Post-push smoke run within 10 min of push ✅ (per smoke § above)
12. Bundled story-rail-01 v0.2.1 docs patch ✅ (C0)

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| F-cross-13 patch loop (DropdownMenuTrigger or Popover surface) | **High** (every recent procomp using these primitives hit a patch loop) | Pre-apply `buttonVariants(…)` pattern in C6; expect 1-2 post-push patches; budget ~30 min |
| Cross-cat type import bug surfaces despite inline-copy plan | Medium | Audit every `import type {` from a cross-cat path BEFORE pushing C1; smoke catches missed cases |
| EngagementBar01 `variant="stacked"` layout doesn't fit the modal's right edge cleanly | Medium | Manual visual test in C3; may need `className` overrides on the stacked bar; engagement-bar's stacked variant is designed for this |
| Reply composer auto-pause timing race (typing pauses + auto-advance fires) | Low | useEffect cleanup + ref-tracking of typing state; if surfaces, document edge case |
| Owner overlay viewers panel + reply composer mutual exclusion | Low | Explicit viewerMode-gated render — owner sees OwnerOverlay only, viewer sees ReplyComposer only |
| LikersStrip's `EngagementLikerProfile` shape diverges from ViewerListItem | Low | Structural cast at the boundary (`viewers as any`); document in JSDoc |
| dropdown-menu primitive missing in consumer (new shadcn dep) | Low | Listed in meta.ts dependencies.shadcn so installer auto-pulls; smoke catches if missing |

---

## Sign-off needed

User: please confirm this plan is ready to execute, or flag any commit-scope adjustments. Once you say go, I start C0 and chain through to C10. Each commit is independently verifiable; I'll pause + report after C3 (engagement overlay) and C6 (kebab assembly) as natural inspection points if you want them.

If anything in the re-validation table looks off or the commit chain ordering should change (e.g., land C0 as a separate v0.1.3 ship before starting v0.2.0), call it out before I start.

**Estimated wall-clock:** ~1-2 working days. Each commit is ~30-90 min including verification. Same pace as post-card-01 v0.2.0 (13 commits, single working day).
