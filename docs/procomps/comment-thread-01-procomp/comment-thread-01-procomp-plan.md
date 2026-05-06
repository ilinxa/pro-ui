# comment-thread-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`comment-thread-01-procomp-description.md`](./comment-thread-01-procomp-description.md) for the what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — kasder `PostEngagementPanel.tsx` (468 LOC), `CommentItem` sub-component lines 413–467 as the visual reference.
>
> **Cross-folder dependencies (registry-declared):**
> - [`expandable-text-01`](../expandable-text-01-procomp/) — long comment bodies
> - [`engagement-bar-01`](../engagement-bar-01-procomp/) `variant="compact"` — per-row like action

## Q-P locks (commitments before code)

| # | Question | Locked answer |
|---|---|---|
| Q-P1 | `maxDepth` default? | **2.** Per analysis.md. Past 2, "view N replies" inline-expands (no max ceiling on user-driven expansion). |
| Q-P2 | View-N-replies behaviour past `maxDepth`? | **Inline-expand**, slot-overridable via `renderViewReplies?(parentId, count) => ReactNode`. Hosts wanting navigate-to-detail render a `<Link>` in the slot. |
| Q-P3 | Default kebab "Delete" visibility? | **Own only** (`viewer.id === comment.author.id`). Hosts wanting moderator semantics use `commentActions?(comment, { isOwn })` and ignore `isOwn`. Default is the safe path. |
| Q-P4 | `pageSize` default? | **10.** Per analysis.md (kasder's `PAGE_SIZE`). "Load older comments" button only renders when `comments.length === pageSize` AND `onLoadMore` is provided. |
| Q-P5 | Autosize textarea defaults & where they're configured? | **`minRows = 1`, `maxRows = 6`.** Exposed on the thread root as `composerMinRows` / `composerMaxRows` (forwarded to both the bottom composer and inline reply composers). Standalone `<CommentComposer>` takes them directly as `minRows` / `maxRows`. |
| Q-P6 | `Subscribe` re-subscription behaviour on identity change? | **Clean teardown + re-call** (engagement-bar-01 carry-over). No debouncing. Hosts must memoize `subscribe` via `useCallback`. Hook uses `controlledRef` + `onSubscribeDeltaRef` mirrors so the subscription effect re-runs ONLY on `subscribe` identity change. |
| Q-P7 | Reply composer Cancel semantics? | **Collapse entirely** — hides the inline composer + clears its text. Clicking "Reply" again opens a fresh composer. Escape inside open inline composer = same as Cancel. |
| Q-P8 | Composer avatar slot? | **Combined `currentUser` prop only in v0.1** (id + name + avatar). Separate `composerAvatar?: ReactNode` slot deferred to v0.2 (only meaningful for persona-switching surfaces — no real consumer yet). |
| Q-P9 | `onLikeComment` signature? | **`(commentId, nextLiked: boolean)`.** Symmetric with `engagement-bar-01`'s `onToggle(next)`. Reducer flips local state first; callback fires with the new value. |
| Q-P10 | `onLoadMore` naming? | **Kept as `onLoadMore`** (don't rename to `onLoadOlder`). Common pagination convention. The "older" direction is documented in usage.tsx. |
| Q-P11 | Tree-walk vs. flat lookup map for delta application? | **Tree-walk** in v0.1 — `O(n)` per delta, fine at <1k comments. Flat `Map<commentId, ...>` index would double memory + complicate updates. v0.2 candidate IF a real consumer hits a measurable wall. Pure helpers in `lib/tree.ts`. |
| Q-P12 | Per-row `<EngagementBar01>` mode? | **ALWAYS controlled** by the thread. Per-row bar receives `{ liked: comment.isLiked ?? false, count: comment.likes }` on every render → engagement-bar-01's per-field controlled detection (presence of `liked` prop) activates → bar fires `onToggle(next)` without flipping its own state. Thread reducer owns the actual flip. Avoids the bar's local optimistic state racing the thread reducer + realtime delta routing. |
| Q-P13 | Inline reply composer state ownership? | **Thread root.** Single `replyParentId: string \| null` state on the root component. When non-null, only the matching `<CommentNode>` renders its inline composer. Click "Reply" on another node swaps the parent. Cancel sets back to `null`. Single inline composer in DOM at a time. |
| Q-P14 | Optimistic add temp id format? | **`temp-${crypto.randomUUID()}`.** Web standard, no `nanoid` peer dep. Available in modern browsers + Node 19+. Component imports nothing — uses global `crypto`. |
| Q-P15 | Description's "hybrid controlled/uncontrolled" carry-over from engagement-bar-01 — keep or walk back? | **Walk back.** The description's pre-emptive lock was an over-eager copy from engagement-bar-01. For a recursive stateful tree, "echoes prop on every render = controlled" is brittle (prop identity churn from spread, deep equality cost, hidden re-syncs). **Plan locks: always uncontrolled.** `comments` prop = initial state on mount only; subsequent prop reference changes are IGNORED. Hosts wanting external state sync use the imperative handle's `reset(next: Comment[])` method or `dispatch(action: CommentLocalAction)` directly. Documented loudly in usage.tsx — non-trivial footgun for hosts coming from engagement-bar-01. |
| Q-P16 | Imperative handle surface? | **`focusComposer()`, `openReply(parentId)`, `getCurrentComments()`, `reset(next)`, `dispatch(action)`** — the last two are the controlled-mode escape hatch. `dispatch` is exposed from day-1 per dynamicity primacy. |
| Q-P17 | `comments` prop changes mid-mount — what happens? | **Ignored.** Component derives initial state from `comments` once on mount. Hosts pushing updates use `reset(next)` via the imperative handle. Documented in usage.tsx. (Q-P15 corollary.) |
| Q-P18 | Indent per depth level? | **`indentPx = 24` default.** No kasder reference (kasder has no nesting); 24px matches Twitter / Slack conventions and gives enough visual weight at depth 1 + 2. Configurable via `indentPx?: number` prop on the thread root. |
| Q-P19 | `<ExpandableText01>` `maxLines` per row? | **`maxLines = 4` in `default` variant; `maxLines = 2` in `compact` variant.** Both configurable via `bodyMaxLines?: number` on the thread root. |
| Q-P20 | Standalone `<CommentComposer>` `onSubmit` signature? | **`(content: string) => Promise<void> \| void`.** Standalone composer is fire-and-forget; doesn't track posted comments, no realtime, no `Comment` return swap. Thread internally wraps standalone composer to interface with `onAddComment`'s `Comment \| void` contract. |
| Q-P21 | Autosize hook — `useLayoutEffect` vs `useEffect`? | **`useLayoutEffect`** — avoids layout flicker between measurement and paint. Composer always lives behind `"use client"`; SSR concern is moot. |

## Pre-emptive design locks

- **No new shadcn primitives.** `avatar`, `dropdown-menu`, `textarea`, `button` are all already in [`src/components/ui/`](../../../src/components/ui/). **No `pnpm dlx shadcn add` needed for this ship.**
- **Cross-folder imports declared via `registryDependencies`.** `comment-thread-01.tsx` and `comment-node.tsx` import `<ExpandableText01>` + `<EngagementBar01>` from sibling sealed folders. `registry.json` declares `registryDependencies: ["expandable-text-01", "engagement-bar-01"]` so installs auto-pull siblings. Refines the project sealed-folder rule for the second time after `media-carousel-01 → video-player-01`.
- **No `react-textarea-autosize` peer dep.** Roll our own ~25-LOC `useAutosizeTextarea` hook. Pure DOM mutation in `useLayoutEffect` — no React state for height, no rerender, compiler-clean.
- **No `date-fns` peer dep.** Pure English `defaultRelativeTime` formatter at `lib/format-time.ts`. Hosts wanting locale-specific formatting pass `labels.formatRelativeTime?: (d, now) => string`.
- **No `nanoid` / `uuid` peer dep.** Use `crypto.randomUUID()`.
- **No framer-motion.** CSS `@keyframes`-style fade-in (60ms) on optimistic-add via Tailwind's `animate-in fade-in` utilities (Tailwind v4 ships `tailwindcss-animate`-equivalent utilities natively). Nothing else animated.
- **`<CommentThread01>` is `"use client"`** — owns thread state, imperative handle, subscription effect, replyParentId state.
- **`<CommentComposer>` is `"use client"`** — owns autosize, keyboard handlers, submit lifecycle.
- **`<CommentNode>` is `"use client"`** — owns hover state for kebab visibility (CSS-only via `group-hover` actually — could be RSC, BUT the inline reply composer it renders requires client. Easier to hold the whole node as a client component.).
- **`<CommentNode>` is `React.memo`'d.** Per-row click handlers live INSIDE the node, closing over its own props (no `useCallback`-in-`.map()` violation).
- **Realtime contract identical to `engagement-bar-01`'s.** `Subscribe<TDelta>` shape; `controlledRef` + `onSubscribeDeltaRef` mirror pattern in `useCommentState`. Subscription effect re-runs only on `subscribe` identity change.
- **Refs must not be written during render.** Mirror via passive `useEffect`. (Compiler-aware lint catches it; engagement-bar-01 set the precedent.)
- **`useEffect` deps — extract `subscribe` to local.** `useEffect(() => {...}, [opts.subscribe])` triggers `react-hooks/exhaustive-deps`; use `const subscribe = opts.subscribe; useEffect(() => {...}, [subscribe])`.
- **Tree-walk helpers are pure functions in `lib/tree.ts`.** Importable / testable in isolation when Vitest lands.
- **`commentReducer` exported from day-1**, `useAutosizeTextarea` exported from day-1, `<CommentComposer>` exported standalone from day-1, `<CommentNode>` NOT exported (internal — hosts that want full row takeover use `renderNode` slot).
- **Tailwind v4 translations applied at write-time:** `bg-gradient-to-X` → `bg-linear-to-X`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`. (Per-memory.)
- **Locked target convention** for `registry.json`: every file `type: "registry:component"` (no CSS in v0.1, so no `registry:file` precedent here), `target: "components/comment-thread-01/<sub-path>"`. Never ship `demo.tsx`, `usage.tsx`, `meta.ts`. `dummy-data.ts` ships only via `comment-thread-01-fixtures` sibling item.

## Final API

### Public types

```ts
// src/registry/components/data/comment-thread-01/types.ts

import type { ReactNode } from "react";

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date | string | number;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  /** Server-known total. Used as label hint when `replies.length` undercounts. */
  replyCount?: number;
}

export type CommentDelta =
  | { kind: "added";   comment: Comment; parentId?: string }
  | { kind: "edited";  commentId: string; content: string }
  | { kind: "removed"; commentId: string }
  | { kind: "liked";   commentId: string; liked: boolean; count: number };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface CommentMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export type CommentThread01Variant = "default" | "compact";

export interface CommentThreadCurrentUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface CommentNodeHelpers {
  currentUser?: CommentThreadCurrentUser;
  isOwn: boolean;
  depth: number;
  /** Programmatically toggle like on this comment. */
  onLike: (nextLiked: boolean) => void;
  /** Open inline reply composer for this comment. */
  onReply: () => void;
  /** Optimistically delete this comment. */
  onDelete: () => void;
  /** Fire host's onReportComment. */
  onReport: () => void;
}

export interface CommentComposerState {
  value: string;
  isReply: boolean;
  parentId?: string;
  isSubmitting: boolean;
}

export interface CommentComposerHelpers {
  setValue: (next: string) => void;
  submit: () => Promise<void>;
  cancel: () => void;
}

export interface CommentThreadLabels {
  composerPlaceholder?: string;
  composerSend?: string;
  composerCancel?: string;
  like?: string;
  unlike?: string;
  reply?: string;
  delete?: string;
  report?: string;
  /** Function so consumers can pluralize / localize without our help. Default: count-aware English. */
  viewReplies?: (count: number) => string;
  loadMore?: string;
  emptyState?: string;
  signInPrompt?: string;
  /** Override the default English relative-time formatter. */
  formatRelativeTime?: (date: Date, now: Date) => string;
}

export const DEFAULT_COMMENT_THREAD_LABELS: Required<Omit<CommentThreadLabels, "formatRelativeTime">> = {
  composerPlaceholder: "Write a comment…",
  composerSend: "Send",
  composerCancel: "Cancel",
  like: "Like",
  unlike: "Unlike",
  reply: "Reply",
  delete: "Delete",
  report: "Report",
  viewReplies: (count) => `View ${count} ${count === 1 ? "reply" : "replies"}`,
  loadMore: "Load older comments",
  emptyState: "No comments yet — be the first.",
  signInPrompt: "Sign in to comment",
};

export interface CommentThread01Props {
  /** Initial comments tree. Component owns it from mount; subsequent prop reference changes are IGNORED. Use the imperative handle's reset() to push updates. */
  comments: Comment[];

  /** Visual variant. Default "default". */
  variant?: CommentThread01Variant;

  /** Viewer identity. Drives composer avatar + isOwn check on default kebab. Absent → composer hidden, composerEmptyState rendered. */
  currentUser?: CommentThreadCurrentUser;

  /** Initial render depth cap. Past this, "view N replies" inline-expands. Default 2. */
  maxDepth?: number;

  /** Pixels of indent per depth level. Default 24. */
  indentPx?: number;

  /** Body line clamp via expandable-text-01. Default 4 (default variant) / 2 (compact). */
  bodyMaxLines?: number;

  /** Composer autosize bounds. Defaults: 1 / 6. */
  composerMinRows?: number;
  composerMaxRows?: number;

  /** Default true — Enter submits, Shift+Enter newline. */
  submitOnEnter?: boolean;

  /** First page size (controls when "Load older comments" button appears). Default 10. */
  pageSize?: number;

  /** Realtime delta stream. Identity-stable required. */
  subscribe?: Subscribe<CommentDelta>;
  /** Fires for every delta the subscription emits. */
  onSubscribeDelta?: (delta: CommentDelta) => void;

  /** Fired after optimistic add. If returned a Comment, the temp comment is swapped for the real one. */
  onAddComment?: (content: string, parentId?: string) => Promise<Comment | void>;
  /** Fired after optimistic like flip. */
  onLikeComment?: (commentId: string, nextLiked: boolean) => void;
  /** Fired after optimistic delete. */
  onDeleteComment?: (commentId: string) => void;
  /** Fired on Report kebab click. If omitted, Report item is hidden. */
  onReportComment?: (commentId: string) => void;
  /** Fetch next page of older top-level comments. Component appends results. */
  onLoadMore?: (page: number) => Promise<Comment[]>;

  /** Override the default kebab items. Return [] to hide kebab entirely. */
  commentActions?: (
    comment: Comment,
    helpers: { currentUser?: CommentThreadCurrentUser; isOwn: boolean; depth: number },
  ) => CommentMenuItem[];

  /** Full-takeover for the per-row render. Composer below each row (reply mode) is still owned by the thread. */
  renderNode?: (comment: Comment, depth: number, helpers: CommentNodeHelpers) => ReactNode;

  /** Override the inline-expand "view N replies" link (e.g., navigate to detail page). */
  renderViewReplies?: (parentId: string, count: number) => ReactNode;

  /** Override the composer entirely (mention picker, emoji popover, attachment button). */
  renderComposer?: (state: CommentComposerState, helpers: CommentComposerHelpers) => ReactNode;

  /** Rendered in place of the bottom composer when currentUser is absent. Pass null to suppress entirely. */
  composerEmptyState?: ReactNode;

  /** Rendered when comments.length === 0 and no realtime is wired. */
  emptyState?: ReactNode;

  labels?: CommentThreadLabels;

  className?: string;
  composerClassName?: string;
  nodeClassName?: string;
}

export interface CommentThread01Handle {
  /** Programmatically focus the bottom composer textarea. */
  focusComposer: () => void;
  /** Programmatically open the inline reply composer for a parent comment. */
  openReply: (parentId: string) => void;
  /** Read the current optimistic comments tree. */
  getCurrentComments: () => Comment[];
  /** Replace the entire tree (controlled-mode escape hatch). */
  reset: (next: Comment[]) => void;
  /** Drive the reducer directly (advanced controlled-mode escape hatch). */
  dispatch: (action: CommentLocalAction) => void;
}

export type CommentLocalAction =
  | { kind: "add";            comment: Comment; parentId?: string }
  | { kind: "swap-temp";      tempId: string; real: Comment }
  | { kind: "remove";         commentId: string }
  | { kind: "like-toggle";    commentId: string; nextLiked: boolean }
  | { kind: "patch-content";  commentId: string; content: string }
  | { kind: "subscribe-delta"; delta: CommentDelta }
  | { kind: "append-page";    comments: Comment[] }
  | { kind: "reset";          next: Comment[] };
```

### Reducer signature

```ts
// src/registry/components/data/comment-thread-01/hooks/use-comment-state.ts (PUBLIC EXPORT)

export function commentReducer(state: Comment[], action: CommentLocalAction): Comment[];

/** Internal hook — wraps useReducer + subscription effect. */
export function useCommentState(opts: {
  initialComments: Comment[];
  subscribe?: Subscribe<CommentDelta>;
  onSubscribeDelta?: (delta: CommentDelta) => void;
}): {
  comments: Comment[];
  dispatch: React.Dispatch<CommentLocalAction>;
};
```

### Standalone composer signature

```ts
// src/registry/components/data/comment-thread-01/parts/comment-composer.tsx (PUBLIC EXPORT)

export interface CommentComposerProps {
  currentUser?: CommentThreadCurrentUser;
  /** Defaults to labels.composerPlaceholder. */
  placeholder?: string;
  /** Initial uncontrolled value. */
  initialValue?: string;
  /** Controlled value (omit to use uncontrolled). */
  value?: string;
  onChange?: (next: string) => void;
  /** Required when used standalone. Fire-and-forget. */
  onSubmit: (content: string) => Promise<void> | void;
  /** Optional Cancel button — only renders when provided. */
  onCancel?: () => void;
  /** Force-disable the composer (sign-out / network down). */
  disabled?: boolean;
  /** External busy signal — overrides internal isSubmitting. */
  isSubmitting?: boolean;
  /** Default true. */
  submitOnEnter?: boolean;
  /** Defaults: 1 / 6. */
  minRows?: number;
  maxRows?: number;
  /** Aria. */
  ariaLabel?: string;
  /** Override the avatar visual entirely (e.g. persona switcher). */
  avatarSlot?: ReactNode;
  className?: string;
  labels?: Pick<CommentThreadLabels, "composerPlaceholder" | "composerSend" | "composerCancel">;
}

export const CommentComposer: React.ForwardRefExoticComponent<
  CommentComposerProps & React.RefAttributes<CommentComposerHandle>
>;

export interface CommentComposerHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}
```

### Autosize hook signature

```ts
// src/registry/components/data/comment-thread-01/hooks/use-autosize-textarea.ts (PUBLIC EXPORT)

export interface UseAutosizeTextareaOptions {
  minRows?: number;
  maxRows?: number;
}

/** Returns a ref to attach to a <textarea>. Resizes on value change via useLayoutEffect. */
export function useAutosizeTextarea(
  value: string,
  opts?: UseAutosizeTextareaOptions,
): React.RefObject<HTMLTextAreaElement | null>;
```

### Time-format helper

```ts
// src/registry/components/data/comment-thread-01/lib/format-time.ts

/** Coerces Date | string | number into a Date — same convention as event-card-01. */
export function toDate(value: Date | string | number): Date;

/**
 * Default English relative-time formatter for comments. Tighter granularity
 * than content-card-news-01's day-level formatter:
 *   < 1 min     → "Just now"
 *   < 60 min    → "5m"
 *   < 24 hours  → "2h"
 *   < 7 days    → "3d"
 *   < 30 days   → "2w"
 *   ≥ 30 days   → "March 5"  (or "March 5, 2025" if year differs)
 */
export function defaultRelativeTime(date: Date, now?: Date): string;
```

### Exported names

```ts
// src/registry/components/data/comment-thread-01/index.ts

export { CommentThread01 } from "./comment-thread-01";
export {
  CommentComposer,
  type CommentComposerProps,
  type CommentComposerHandle,
} from "./parts/comment-composer";

export {
  commentReducer,
  useCommentState,
} from "./hooks/use-comment-state";
export {
  useAutosizeTextarea,
  type UseAutosizeTextareaOptions,
} from "./hooks/use-autosize-textarea";

export type {
  Comment,
  CommentThread01Props,
  CommentThread01Handle,
  CommentThread01Variant,
  CommentThreadLabels,
  CommentThreadCurrentUser,
  CommentNodeHelpers,
  CommentComposerState,
  CommentComposerHelpers,
  CommentMenuItem,
  CommentDelta,
  CommentLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_COMMENT_THREAD_LABELS } from "./types";

export { meta } from "./meta";
```

## File-by-file plan

**15 files** (analysis estimated 14; the +1 is `lib/format-time.ts` — tree.ts helpers fold into `use-comment-state.ts` as private helpers). Sealed folder.

```
src/registry/components/data/comment-thread-01/
├── comment-thread-01.tsx                    # 1 — root component
├── parts/
│   ├── comment-node.tsx                     # 2 — recursive node renderer
│   ├── comment-composer.tsx                 # 3 — composer (also publicly exported standalone)
│   ├── view-replies-link.tsx                # 4 — inline-expand link past maxDepth
│   ├── comment-empty-state.tsx              # 5 — default emptyState body
│   └── comment-kebab.tsx                    # 6 — DropdownMenu wrapper rendering CommentMenuItem[]
├── hooks/
│   ├── use-autosize-textarea.ts             # 7 — public sub-export
│   └── use-comment-state.ts                 # 8 — reducer + subscribe wiring + tree-walk helpers (private) + reply-target tracking
├── lib/
│   └── format-time.ts                       # 9 — toDate + defaultRelativeTime (pure)
├── types.ts                                 # 10
├── dummy-data.ts                            # 11 — fixtures (ships in -fixtures sibling)
├── demo.tsx                                 # 12 — docs-only
├── usage.tsx                                # 13 — docs-only
├── meta.ts                                  # 14 — docs-only
└── index.ts                                 # 15
```

(11 files ship via the registry: `comment-thread-01.tsx`, the 5 parts, the 2 hooks, `format-time.ts`, `types.ts`, `index.ts`. `dummy-data.ts` ships only via `comment-thread-01-fixtures`. `demo.tsx` / `usage.tsx` / `meta.ts` are docs-site only.)

### 1. `comment-thread-01.tsx` — root

- `"use client"` directive.
- `React.memo`, `forwardRef<CommentThread01Handle, CommentThread01Props>` at export.
- Resolves defaults: `variant ?? "default"`, `maxDepth ?? 2`, `pageSize ?? 10`, `indentPx ?? 24`, `submitOnEnter ?? true`, `composerMinRows ?? 1`, `composerMaxRows ?? 6`, `bodyMaxLines ?? (variant === "compact" ? 2 : 4)`.
- Calls `useCommentState({ initialComments: comments, subscribe, onSubscribeDelta })` — owns the optimistic tree + subscription effect. **Note: `comments` prop only feeds `initialComments` ON MOUNT; the hook's internal `useReducer` initializer takes the value once (Q-P17).**
- State: `replyParentId: string | null` (Q-P13) — controls which node renders its inline reply composer.
- State: `currentPage: number` (initial 1) — drives "Load older" pagination.
- Derived per-render: `format = labels?.formatRelativeTime ?? defaultRelativeTime`.
- Derived per-render: `mergedLabels = { ...DEFAULT_COMMENT_THREAD_LABELS, ...labels }`.
- Submit handler `submitTopLevel(content)` — dispatches `add` with a temp comment + calls `onAddComment(content)` async; if it returns a Comment, dispatches `swap-temp`.
- Submit handler `submitReply(content, parentId)` — same shape, with `parentId`. Then closes the inline composer (`replyParentId = null`).
- Like handler `handleLike(id, nextLiked)` — dispatches `like-toggle` + fires `onLikeComment(id, nextLiked)`.
- Delete handler `handleDelete(id)` — dispatches `remove` + fires `onDeleteComment(id)`.
- Report handler `handleReport(id)` — fires `onReportComment(id)` only (no local state change).
- Open-reply handler `openReply(parentId)` — sets `replyParentId = parentId`.
- Cancel-reply handler `cancelReply()` — sets `replyParentId = null`.
- Load-more handler `handleLoadMore()` — `setIsLoadingMore(true)`; `await onLoadMore(currentPage + 1)`; `dispatch({ kind: "append-page", comments: result })`; `setCurrentPage(currentPage + 1)`; `setHasMore(result.length === pageSize)`.
- `useImperativeHandle` exposes the 5 handle methods.
- Renders:

  ```tsx
  <div className={cn("flex flex-col gap-3", className)}>
    {comments.length === 0 && !subscribe ? (
      emptyState ?? <CommentEmptyState message={mergedLabels.emptyState} />
    ) : (
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id}>
            <CommentNode
              comment={c}
              depth={0}
              maxDepth={maxDepth}
              indentPx={indentPx}
              variant={variant}
              bodyMaxLines={bodyMaxLines}
              currentUser={currentUser}
              labels={mergedLabels}
              format={format}
              isReplyOpen={replyParentId === c.id}
              onOpenReply={openReply}
              onCancelReply={cancelReply}
              onSubmitReply={submitReply}
              onLike={handleLike}
              onDelete={handleDelete}
              onReport={handleReport}
              commentActions={commentActions}
              renderNode={renderNode}
              renderViewReplies={renderViewReplies}
              renderComposer={renderComposer}
              composerMinRows={composerMinRows}
              composerMaxRows={composerMaxRows}
              submitOnEnter={submitOnEnter}
              composerClassName={composerClassName}
              nodeClassName={nodeClassName}
              linkComponent={linkComponent}
              onReportPresent={!!onReportComment}
            />
          </li>
        ))}
      </ul>
    )}

    {hasMore && onLoadMore ? (
      <button
        type="button"
        onClick={handleLoadMore}
        disabled={isLoadingMore}
        className="self-center text-xs text-muted-foreground hover:text-foreground"
      >
        {isLoadingMore ? `${mergedLabels.loadMore}…` : mergedLabels.loadMore}
      </button>
    ) : null}

    {currentUser ? (
      renderComposer ? (
        renderComposer(/* state */, /* helpers */)
      ) : (
        <CommentComposer
          currentUser={currentUser}
          placeholder={mergedLabels.composerPlaceholder}
          onSubmit={submitTopLevel}
          submitOnEnter={submitOnEnter}
          minRows={composerMinRows}
          maxRows={composerMaxRows}
          className={composerClassName}
          labels={mergedLabels}
        />
      )
    ) : (
      composerEmptyState
    )}
  </div>
  ```

- **Compiler-aware:** `submitTopLevel`, `submitReply`, `handleLike`, etc. are defined at component top-level (closing over current props/state); since they're not passed through `.map()` to memoized children needing stable identity, no `useCallback`. The `<CommentNode>` itself is `React.memo`'d, BUT its handlers come from the parent — props identity churns on every render. We accept this: each render rebuilds the handlers; `React.memo`'s shallow compare detects them as different and re-renders. **For the social-feed scale (≤200 nodes), this is fine.** For future optimization, the canonical fix is per-node handler binding inside `<CommentNode>` itself (it already has the comment id).
- Subscription effect runs only via `useCommentState` (Q-P6 mirror pattern there).

### 2. `parts/comment-node.tsx` — recursive node

- `"use client"` (renders inline reply composer; could be RSC if not for that).
- `React.memo` at export.
- Props: comment, depth, maxDepth, indentPx, variant, bodyMaxLines, currentUser, labels, format, isReplyOpen, onOpenReply, onCancelReply, onSubmitReply, onLike, onDelete, onReport, commentActions, renderNode, renderViewReplies, renderComposer, composerMinRows, composerMaxRows, submitOnEnter, composerClassName, nodeClassName, linkComponent, onReportPresent.
- Computes `isOwn = currentUser?.id === comment.author.id`.
- Computes `helpers: CommentNodeHelpers = { currentUser, isOwn, depth, onLike: (next) => onLike(comment.id, next), onReply: () => onOpenReply(comment.id), onDelete: () => onDelete(comment.id), onReport: () => onReport(comment.id) }`.
- **renderNode escape hatch:** `if (renderNode) return renderNode(comment, depth, helpers);` — full takeover for the row. Inline reply composer below is still owned (we render it after the slot's output for consistency).
- Default render:
  - Outer wrapper `<article role="article" aria-labelledby={authorNameId} className="group flex items-start gap-2"`.
  - Indent: `style={{ paddingLeft: depth * indentPx }}`.
  - **Why inline `style` not Tailwind:** dynamic value, Tailwind's JIT won't generate per-depth classes.
  - Layout matches kasder lines 413–467:
    ```tsx
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarImage src={comment.author.avatar} alt="" />
      <AvatarFallback>{initials(comment.author.name)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="bg-muted/50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1">
          <span id={authorNameId} className="text-sm font-semibold">{comment.author.name}</span>
          {comment.author.username ? (
            <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
          ) : null}
        </div>
        <ExpandableText01
          content={comment.content}
          maxLines={bodyMaxLines}
          className="text-sm mt-0.5"
        />
      </div>
      <div className="flex items-center gap-3 mt-1 px-1">
        <span className="text-xs text-muted-foreground">
          {format(toDate(comment.createdAt), nowRef.current)}
        </span>
        <EngagementBar01
          variant="compact"
          actions={[
            {
              kind: "like",
              count: comment.likes,
              liked: comment.isLiked ?? false,
              onToggle: helpers.onLike,
            },
          ]}
        />
        <button
          type="button"
          onClick={helpers.onReply}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {labels.reply}
        </button>
      </div>

      {/* Recursive replies */}
      {hasVisibleReplies ? (
        <ul className="mt-2 flex flex-col gap-3">
          {visibleReplies.map((r) => (
            <li key={r.id}>
              <CommentNode {...samePropsButForR} comment={r} depth={depth + 1} />
            </li>
          ))}
        </ul>
      ) : null}

      {/* Past maxDepth: view-N-replies link */}
      {hasHiddenRepliesPastDepth ? (
        renderViewReplies ? (
          renderViewReplies(comment.id, hiddenRepliesCount)
        ) : (
          <ViewRepliesLink
            count={hiddenRepliesCount}
            label={labels.viewReplies(hiddenRepliesCount)}
            onExpand={() => /* bumps local expandedToDepth */}
          />
        )
      ) : null}

      {/* Inline reply composer */}
      {isReplyOpen ? (
        <div className="mt-2">
          <CommentComposer
            currentUser={currentUser}
            placeholder={labels.composerPlaceholder}
            onSubmit={(content) => onSubmitReply(content, comment.id)}
            onCancel={() => onCancelReply()}
            submitOnEnter={submitOnEnter}
            minRows={composerMinRows}
            maxRows={composerMaxRows}
            className={composerClassName}
            labels={labels}
            ariaLabel={`Reply to ${comment.author.name}`}
          />
        </div>
      ) : null}
    </div>
    <CommentKebab
      comment={comment}
      currentUser={currentUser}
      isOwn={isOwn}
      depth={depth}
      labels={labels}
      onDelete={helpers.onDelete}
      onReport={helpers.onReport}
      onReportPresent={onReportPresent}
      commentActions={commentActions}
    />
    ```
- **`expandedToDepth` local state** — `useState(0)` per node; bumps on "view N replies" click. Drives recursion past `maxDepth`. **State is per-node** so collapsing one branch doesn't collapse siblings.
- **`hasVisibleReplies` computation:** `comment.replies && comment.replies.length > 0 && (depth + 1 < maxDepth + expandedToDepth)`.
- **`hiddenRepliesCount`:** `(comment.replyCount ?? comment.replies?.length ?? 0) - visibleReplies.length`. Used as the label hint per Q-P11 / R1.
- **Relative-time `now` is fresh per render** (R-Plan-10). Call `format(toDate(comment.createdAt))` and let `defaultRelativeTime`'s default arg `now = new Date()` resolve at call time. NO per-node `useRef(new Date())` — that captures mount time and goes stale across re-renders. Hosts wanting tick-based live updates pass `labels.formatRelativeTime` and own the tick.
- **a11y ids via `useId()`** (R-Plan-12). Each `<CommentNode>` calls `useId()` once and derives `${baseId}-author` (for `aria-labelledby` on the article) and `${baseId}-replies` (for `aria-controls` on the view-replies link).
- **"Reply" button hidden when `currentUser` is absent** (R-Plan-4). Cannot reply without identity; consistent with composer-hidden lock.
- **Inline composer focus restoration** (R-Plan-5). On submit/cancel, return focus to the parent comment's "Reply" button (a11y best practice). Store the trigger element in a ref via `onPointerDown`/`onFocus`; on close, `requestAnimationFrame(() => triggerRef.current?.focus())`.
- **Compiler-aware:** all click handlers are arrow functions inside the JSX — fine inside the body of a memo'd component (they're not passed THROUGH a `.map()` upstream as memoized refs). React Compiler will memoize them automatically per `useMemo`-style reuse if needed.

### 3. `parts/comment-composer.tsx` — composer (also publicly exported standalone)

- `"use client"`.
- `forwardRef<CommentComposerHandle, CommentComposerProps>`.
- State: `internalValue: string` (uncontrolled mode), `isInternalSubmitting: boolean`.
- Resolved value: `value = props.value ?? internalValue`.
- Resolved isSubmitting: `isSubmitting = props.isSubmitting ?? isInternalSubmitting`.
- `useAutosizeTextarea(value, { minRows, maxRows })` returns the textarea ref.
- `useImperativeHandle` exposes `focus()`, `blur()`, `clear()`.
- Submit:
  ```ts
  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting || disabled) return;
    if (props.isSubmitting === undefined) setIsInternalSubmitting(true);
    try {
      const result = await props.onSubmit(trimmed);
      // success: clear unless caller is in controlled-value mode
      if (props.value === undefined) setInternalValue("");
      // standalone signature is Promise<void>; we intentionally don't return result
    } finally {
      if (props.isSubmitting === undefined) setIsInternalSubmitting(false);
    }
  };
  ```
- Keyboard handler:
  ```ts
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (props.submitOnEnter !== false && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
      return;
    }
    if (e.key === "Escape" && props.onCancel) {
      props.onCancel();
    }
  };
  ```
- Render:
  ```tsx
  <div className={cn("flex items-start gap-2", className)}>
    {avatarSlot ?? (
      currentUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          {currentUser.avatar ? <AvatarImage src={currentUser.avatar} alt="" /> : null}
          <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
        </Avatar>
      ) : null
    )}
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          if (props.value === undefined) setInternalValue(e.target.value);
          props.onChange?.(e.target.value);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? labels?.composerPlaceholder}
        rows={minRows ?? 1}
        disabled={disabled || isSubmitting}
        aria-label={ariaLabel ?? labels?.composerPlaceholder}
        aria-busy={isSubmitting}
        className="resize-none pr-10 bg-muted/50 border-0"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={submit}
        disabled={!value.trim() || isSubmitting || disabled}
        aria-label={labels?.composerSend ?? "Send"}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
      >
        <Send className={cn("h-4 w-4", value.trim() && "text-primary")} />
      </Button>
    </div>
    {props.onCancel ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          if (props.value === undefined) setInternalValue("");
          props.onCancel?.();
        }}
        disabled={isSubmitting}
      >
        {labels?.composerCancel ?? "Cancel"}
      </Button>
    ) : null}
  </div>
  ```
- **Note Textarea uses kasder's `border-0 bg-muted/50` styling**, but **swapped from `<Input>` to `<Textarea>`** for autosize. Textarea's default styles need `resize-none` (we own height via the hook) + adequate `pr-10` for the absolute-positioned send button. The send button positioning at `top-1/2` + `-translate-y-1/2` works for single-line textareas; once the textarea grows past 1 row, this centers vertically — desired behavior (send button stays within reach).

### 4. `parts/view-replies-link.tsx`

- Pure RSC (no `"use client"`) — just renders a button.
- Wait: it has `onClick`, so client-component required for the parent. But the link itself is just JSX — the click handler comes from the parent via prop. So it CAN stay RSC if the parent passes a server-action... in v0.1, parent is `<CommentNode>` which is `"use client"`. So this child also lives in a client tree. **It doesn't need its own `"use client"` directive** — the directive bubbles up.
- Props: `count: number`, `label: string`, `onExpand: () => void`, `className?: string`, `linkComponent?: ElementType` (when host overrides via `renderViewReplies` slot — this default doesn't use linkComponent; it's just an inline button).
- Renders:
  ```tsx
  <button
    type="button"
    onClick={onExpand}
    aria-controls={containerId}
    aria-expanded={false}
    className={cn(
      "mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
      className,
    )}
  >
    {label}
  </button>
  ```
- The `aria-expanded` flips to `true` once expanded — but this component itself unmounts when fully expanded, so `aria-expanded={false}` is the only relevant value.

### 5. `parts/comment-empty-state.tsx`

- Plain RSC. Receives `message: string`, optional `className?: string`.
- Renders:
  ```tsx
  <div className={cn("rounded-md border border-dashed border-muted-foreground/30 px-4 py-6 text-center text-sm text-muted-foreground", className)}>
    {message}
  </div>
  ```
- Tiny — but a sealed `parts/` file keeps `comment-thread-01.tsx` clean.

### 6. `parts/comment-kebab.tsx`

- `"use client"` (Radix DropdownMenu requires).
- `React.memo` at export.
- Props: `comment`, `currentUser`, `isOwn`, `depth`, `labels`, `onDelete`, `onReport`, `onReportPresent`, `commentActions`.
- Build the items array:
  ```ts
  const items: CommentMenuItem[] = commentActions
    ? commentActions(comment, { currentUser, isOwn, depth })
    : [
        ...(onReportPresent ? [{ label: labels.report, onClick: onReport }] : []),
        ...(isOwn ? [{ label: labels.delete, destructive: true, onClick: onDelete }] : []),
      ];
  if (items.length === 0) return null; // hide kebab entirely
  ```
- Renders:
  ```tsx
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 transition-opacity"
        aria-label={`Comment actions for ${comment.author.name}`}
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((item, i) => (
        <DropdownMenuItem
          key={`${item.label}-${i}`}
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(item.destructive && "text-destructive focus:text-destructive")}
        >
          {item.icon ? <span className="mr-2">{item.icon}</span> : null}
          {item.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
  ```
- Note `group-focus-within:opacity-100` — keyboard users see the kebab without hover. `pointer-coarse:opacity-100` gives touch users the same (Tailwind v4 modifier; R-Plan-8).

### 7. `hooks/use-autosize-textarea.ts` (PUBLIC EXPORT)

```ts
import { useLayoutEffect, useRef } from "react";

export interface UseAutosizeTextareaOptions {
  minRows?: number;
  maxRows?: number;
}

/**
 * Resizes a <textarea> to fit its content within [minRows, maxRows] line bounds.
 * Pure DOM mutation in useLayoutEffect — no React state, no rerender.
 *
 * Compiler-clean: measurement runs in the effect, not during render.
 */
export function useAutosizeTextarea(
  value: string,
  opts: UseAutosizeTextareaOptions = {},
) {
  const { minRows = 1, maxRows = 6 } = opts;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset to "auto" so scrollHeight reflects natural content height.
    el.style.height = "auto";
    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const paddingY = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
    const min = lineHeight * minRows + paddingY;
    const max = lineHeight * maxRows + paddingY;
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    // If natural height exceeds maxRows, allow internal scroll.
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value, minRows, maxRows]);

  return ref;
}
```

- `useLayoutEffect` instead of `useEffect` — avoids paint flash between measurement and resize.
- Returns the ref for the consumer to attach.

### 8. `hooks/use-comment-state.ts` (PUBLIC EXPORTS: `commentReducer`, `useCommentState`)

```ts
import { useEffect, useReducer, useRef } from "react";
import type {
  Comment,
  CommentDelta,
  CommentLocalAction,
  Subscribe,
} from "../types";

// ─── Pure tree-walk helpers ──────────────────────────────────────────────────

function findAndPatch(
  tree: Comment[],
  predicate: (c: Comment) => boolean,
  patch: (c: Comment) => Comment,
): Comment[] {
  return tree.map((c) => {
    if (predicate(c)) return patch(c);
    if (c.replies?.length) {
      const replies = findAndPatch(c.replies, predicate, patch);
      if (replies !== c.replies) return { ...c, replies };
    }
    return c;
  });
}

function pruneById(tree: Comment[], id: string): Comment[] {
  const next: Comment[] = [];
  for (const c of tree) {
    if (c.id === id) continue;
    if (c.replies?.length) {
      const replies = pruneById(c.replies, id);
      if (replies !== c.replies) {
        next.push({ ...c, replies });
        continue;
      }
    }
    next.push(c);
  }
  return next;
}

function insertReply(tree: Comment[], parentId: string, comment: Comment): Comment[] {
  return findAndPatch(
    tree,
    (c) => c.id === parentId,
    (c) => ({ ...c, replies: [...(c.replies ?? []), comment] }),
  );
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function commentReducer(state: Comment[], action: CommentLocalAction): Comment[] {
  switch (action.kind) {
    case "add":
      if (action.parentId) return insertReply(state, action.parentId, action.comment);
      return [action.comment, ...state]; // head insertion for top-level (Q6 lock)

    case "swap-temp":
      return findAndPatch(
        state,
        (c) => c.id === action.tempId,
        () => action.real,
      );

    case "remove":
      return pruneById(state, action.commentId);

    case "like-toggle":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => {
          if (c.isLiked === action.nextLiked) return c; // idempotent (R-Plan-11)
          return {
            ...c,
            isLiked: action.nextLiked,
            likes: action.nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        },
      );

    case "patch-content":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => ({ ...c, content: action.content }),
      );

    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "added":
          return d.parentId
            ? insertReply(state, d.parentId, d.comment)
            : [d.comment, ...state];
        case "edited":
          return findAndPatch(state, (c) => c.id === d.commentId, (c) => ({ ...c, content: d.content }));
        case "removed":
          return pruneById(state, d.commentId);
        case "liked":
          return findAndPatch(state, (c) => c.id === d.commentId, (c) => ({ ...c, isLiked: d.liked, likes: d.count }));
      }
    }

    case "append-page":
      return [...state, ...action.comments];

    case "reset":
      return action.next;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCommentState(opts: {
  initialComments: Comment[];
  subscribe?: Subscribe<CommentDelta>;
  onSubscribeDelta?: (delta: CommentDelta) => void;
}) {
  const [comments, dispatch] = useReducer(commentReducer, opts.initialComments);

  // Mirror onSubscribeDelta into a ref so the subscription effect re-runs ONLY on subscribe identity.
  const onDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onDeltaRef.current = opts.onSubscribeDelta;
  });

  // Extract subscribe to local for exhaustive-deps cleanliness.
  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  return { comments, dispatch };
}
```

- **Always-uncontrolled (Q-P15):** `opts.initialComments` is read by `useReducer` once on mount; subsequent prop changes are NOT synced. Hosts wanting external state push call `dispatch({ kind: "reset", next })` via the imperative handle.
- **Tree-walk helpers** (`findAndPatch`, `pruneById`, `insertReply`) are private to this file. Pure functions; mutate-free; testable in isolation when Vitest lands.
- **Subscription effect** runs only on `subscribe` identity. `onSubscribeDelta` and tree state are read via refs (`onDeltaRef`) / closure (dispatch is stable) so changes don't trigger re-subscribe. Same shape as engagement-bar-01's `use-engagement-state.ts`.

### 9. `lib/format-time.ts`

```ts
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function defaultRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;

  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w`;

  // Absolute date
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const sameYear = date.getFullYear() === now.getFullYear();
  return sameYear
    ? `${months[date.getMonth()]} ${date.getDate()}`
    : `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
```

- Pure functions; no React deps.
- Tighter granularity than `content-card-news-01`'s formatter (comments need minute / hour / day; news cards only need day-level).

### 10. `types.ts`

All public types as listed in "Final API > Public types" above.

### 11. `dummy-data.ts`

```ts
import type { Comment, CommentThreadCurrentUser, CommentDelta, Subscribe } from "./types";

export const DUMMY_VIEWER: CommentThreadCurrentUser = {
  id: "viewer-1",
  name: "Sina Aytaç",
  avatar: "https://i.pravatar.cc/100?img=68",
};

export const DUMMY_FLAT_COMMENTS: Comment[] = [
  /* 8 flat top-level comments — varied ages (just-now / 5m / 2h / 3d / 2w / abs); some long bodies that trigger expandable-text-01 truncation */
];

export const DUMMY_NESTED_DEPTH_2: Comment[] = [
  /* 5 top-level, each with 1-3 replies; one reply has 2 replies-of-replies (depth 2) */
];

export const DUMMY_NESTED_DEPTH_3: Comment[] = [
  /* same shape but with depth-3 replies past maxDepth=2 — exercises view-N-replies inline-expand */
];

export const DUMMY_LARGE_THREAD: Comment[] = [
  /* exactly 10 top-level (== pageSize) — exercises load-more button */
];

export function createDummySubscribe(): Subscribe<CommentDelta> {
  return (handler) => {
    // Synthetic deltas every 6s — alternating added / liked / removed
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      const variant = tick % 3;
      if (variant === 0) {
        handler({
          kind: "added",
          comment: { /* fresh comment */ },
        });
      } else if (variant === 1) {
        handler({ kind: "liked", commentId: "comment-1", liked: true, count: Math.floor(Math.random() * 50) });
      } else {
        handler({ kind: "edited", commentId: "comment-1", content: "(edited live)" });
      }
    }, 6000);
    return () => clearInterval(id);
  };
}
```

### 12. `demo.tsx` (docs-only)

**6 tabs** (matches analysis.md prediction):

1. **Flat** — `DUMMY_FLAT_COMMENTS` + viewer signed in. Shows expandable-text on long bodies.
2. **Nested depth-2** — `DUMMY_NESTED_DEPTH_2` + `maxDepth={2}` (default). Shows recursive indentation.
3. **Nested depth-3** — `DUMMY_NESTED_DEPTH_3` + `maxDepth={2}` → "view N replies" inline-expand at the boundary. Click expands.
4. **Paginated** — `DUMMY_LARGE_THREAD` + `onLoadMore={(page) => Promise.resolve(generatePage(page))}`. Shows "Load older comments" button + appends more.
5. **Realtime** — `createDummySubscribe()` wired. Viewer sees deltas tick every 6s.
6. **Disabled composer** — `currentUser={undefined}` + `composerEmptyState={<SignInCta />}`. Shows the no-compose state.

### 13. `usage.tsx` (docs-only)

Markdown-ish prose + 6–8 code recipes:
- Minimal usage (read-only)
- With composer + optimistic add
- With realtime subscribe
- Custom `commentActions` (Pin / Block / Report)
- Full `renderNode` takeover (rich rows)
- Standalone `<CommentComposer>` for an article-page hero CTA
- **Controlled-mode escape hatch:** how to use `ref.current.reset(next)` to push external state.
- **Footgun callout (Q-P17):** "`comments` prop is initial state on mount only — subsequent prop changes are ignored. Use the imperative handle's `reset(next)` to push updates."

### 14. `meta.ts` (docs-only)

```ts
import type { ComponentMeta } from "@/registry/types";
import {
  DUMMY_FLAT_COMMENTS,
  DUMMY_NESTED_DEPTH_2,
  /* etc. */
} from "./dummy-data";

export const meta: ComponentMeta = {
  slug: "comment-thread-01",
  name: "Comment Thread 01",
  category: "data",
  status: "alpha",
  version: "0.1.0",
  description:
    "Recursive comment tree with composer + realtime. Composes expandable-text-01 (long bodies) + engagement-bar-01 compact (per-row like).",
  tags: ["social", "comments", "thread", "realtime", "composer", "recursive"],
  added: "2026-05-02",
  dependencies: {
    peer: ["lucide-react"],
    registryDeps: ["expandable-text-01", "engagement-bar-01"],
    shadcnDeps: ["avatar", "button", "dropdown-menu", "textarea"],
  },
  notes:
    "Composer autosize is roll-our-own (no react-textarea-autosize peer dep). Component is always-uncontrolled — `comments` prop is initial state only; use `ref.current.reset(next)` to push external updates.",
};
```

### 15. `index.ts`

As listed in "Final API > Exported names" above.

## Demo / usage / meta layouts

Already covered. Match `engagement-bar-01` and `media-carousel-01` patterns.

## Manifest + registry.json wiring

### Manifest entry

```ts
// src/registry/manifest.ts — add to the data category section

import CommentThread01Demo from "./components/data/comment-thread-01/demo";
import CommentThread01Usage from "./components/data/comment-thread-01/usage";
import { meta as commentThread01Meta } from "./components/data/comment-thread-01/meta";

// ... add to registry array ...
{
  meta: commentThread01Meta,
  Demo: CommentThread01Demo,
  Usage: CommentThread01Usage,
}
```

### registry.json entries

Two items: base (`comment-thread-01`) + fixtures (`comment-thread-01-fixtures`).

```jsonc
{
  "name": "comment-thread-01",
  "type": "registry:component",
  "title": "Comment Thread 01",
  "description": "Recursive comment tree with composer + realtime. Composes expandable-text-01 + engagement-bar-01 (compact).",
  "registryDependencies": [
    "expandable-text-01",
    "engagement-bar-01",
    "https://ui.shadcn.com/r/styles/new-york/avatar.json",
    "https://ui.shadcn.com/r/styles/new-york/button.json",
    "https://ui.shadcn.com/r/styles/new-york/dropdown-menu.json",
    "https://ui.shadcn.com/r/styles/new-york/textarea.json"
  ],
  "files": [
    { "path": "src/registry/components/data/comment-thread-01/comment-thread-01.tsx", "type": "registry:component", "target": "components/comment-thread-01/comment-thread-01.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/parts/comment-node.tsx", "type": "registry:component", "target": "components/comment-thread-01/parts/comment-node.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/parts/comment-composer.tsx", "type": "registry:component", "target": "components/comment-thread-01/parts/comment-composer.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/parts/view-replies-link.tsx", "type": "registry:component", "target": "components/comment-thread-01/parts/view-replies-link.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/parts/comment-empty-state.tsx", "type": "registry:component", "target": "components/comment-thread-01/parts/comment-empty-state.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/parts/comment-kebab.tsx", "type": "registry:component", "target": "components/comment-thread-01/parts/comment-kebab.tsx" },
    { "path": "src/registry/components/data/comment-thread-01/hooks/use-autosize-textarea.ts", "type": "registry:component", "target": "components/comment-thread-01/hooks/use-autosize-textarea.ts" },
    { "path": "src/registry/components/data/comment-thread-01/hooks/use-comment-state.ts", "type": "registry:component", "target": "components/comment-thread-01/hooks/use-comment-state.ts" },
    { "path": "src/registry/components/data/comment-thread-01/lib/format-time.ts", "type": "registry:component", "target": "components/comment-thread-01/lib/format-time.ts" },
    { "path": "src/registry/components/data/comment-thread-01/types.ts", "type": "registry:component", "target": "components/comment-thread-01/types.ts" },
    { "path": "src/registry/components/data/comment-thread-01/index.ts", "type": "registry:component", "target": "components/comment-thread-01/index.ts" }
  ]
}
```

`comment-thread-01-fixtures` ships only `dummy-data.ts`, depends on `comment-thread-01`.

**Verify before ship:** the existing `engagement-bar-01.json` and `expandable-text-01.json` artifacts on Vercel resolve correctly when `pnpm dlx shadcn add @ilinxa/comment-thread-01` is called from a tmp consumer. (Cross-folder dependency precedent already exists from `media-carousel-01 → video-player-01`; this is the second time. Should just work.)

## Test plan

Manual (no test infra in pro-ui yet):

1. **Build verification**
   - `pnpm tsc --noEmit` — clean
   - `pnpm lint` — clean (React Compiler-aware ESLint rules pass: `react-hooks/refs`, `react-hooks/set-state-in-effect`, `react-hooks/exhaustive-deps`, hooks-in-`.map()`)
   - `pnpm build` — clean prerender (route `/components/comment-thread-01` added)
   - `pnpm registry:build` — generates `public/r/comment-thread-01.json` + `public/r/comment-thread-01-fixtures.json`. Spot-check `files[]` count = 11, all `type: "registry:component"`, all `target: "components/comment-thread-01/<sub>"`. Spot-check `registryDependencies` declares both `expandable-text-01` and `engagement-bar-01`.

2. **Demo tab walkthrough**
   - **Flat:** add a comment via composer → appears at top; like a comment → heart fills + count increments; delete own comment → row removes; report → host's onReportComment fires.
   - **Nested depth-2:** indent visibly stacks at 24px per level; reply on a depth-1 comment → inline composer opens below; submit → reply appends to bottom of parent's `replies` (chronological).
   - **Nested depth-3:** at maxDepth=2, "view 2 replies" link visible at the boundary; click → 3rd-depth replies expand inline. Click again on next branch → only that branch expands.
   - **Paginated:** "Load older comments" button appears under 10th comment; click → next 10 append below.
   - **Realtime:** comments tick in every 6s without click; existing comment likes flicker on subscribe; one comment's content changes mid-view ("(edited live)") — no UI tear.
   - **Disabled composer:** no bottom composer; sign-in CTA renders in its place. Replying still tries (but inline composer also requires currentUser → reply button is disabled? **Plan-stage call: yes, "Reply" is hidden when no currentUser.** Add to comment-node logic.)

3. **Controlled-mode escape hatch smoke**
   - Wire a tab to drive comments via external state + `ref.current.reset(externalComments)`. Confirm: prop change is ignored; only `reset()` updates the tree.

4. **a11y smoke**
   - Tab through composer → send button → comments → like → reply → kebab; all focusable.
   - Screen-reader (NVDA): comment is announced as "Article" with author name; like button announces "Like" / "Unlike" based on state.
   - Reduced-motion: optimistic-add fade-in respects `prefers-reduced-motion`.
   - Kebab visible on focus-within (keyboard users see it without hover).

5. **RTL smoke** — confirm indent flips correctly under `dir="rtl"` (Tailwind's logical properties handle it).

6. **Smoke test from a tmp consumer (one-off)** — `pnpm dlx shadcn@latest add http://localhost:3000/r/comment-thread-01.json` from a tmp Next 16 app; verify (a) all 11 files land at correct targets, (b) `expandable-text-01` and `engagement-bar-01` siblings auto-pull, (c) the composed thread renders + a like flips state.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `comments` prop staleness footgun bites a host | High | Medium | Loud callout in usage.tsx + meta.notes. The `reset()` imperative handle is the canonical fix. If 2+ real consumers trip, revisit Q-P15. |
| Recursive `<CommentNode>` renders blow stack at deep trees | Low | Medium | Default `maxDepth=2` keeps initial render shallow. Inline-expand grows depth lazily. React's reconciler handles ~1000 nesting depth before stack overflow; typical consumer thread won't approach. |
| Per-render handler identity churn in `<CommentNode>` props causes excessive re-renders at scale | Medium | Low | `React.memo` shallow-compares; handlers being different on every render means memo bails. Acceptable up to ~200 nodes. v0.2 candidate: per-node handler binding inside `<CommentNode>` so memo holds. |
| Autosize textarea jumps when font hasn't loaded | Medium | Low | `getComputedStyle` reads the current line-height; if Onest hasn't loaded, falls back to 20px default in the hook. After font loads, `useLayoutEffect` re-runs on next value change → corrects. Imperfect but only visible on first composer mount. |
| Inline reply composer focus management — focus jumps to thread-bottom composer on close | Medium | Low | On reply submit, return focus to the parent comment's "Reply" button (a11y best practice). Lock: yes, do this — store the trigger element in a ref and `requestAnimationFrame(() => triggerRef.current?.focus())` post-close. |
| Tree-walk helpers slow at >1k comments | Low | Low | Q-P11 commits to `O(n)` walk for v0.1; flat-map index is v0.2 if real consumer hits a wall. Mitigation already in plan. |
| `crypto.randomUUID()` not in test env (jsdom) when Vitest lands | Low | Low | jsdom 22+ supports it. If Vitest uses older jsdom, add a polyfill in test setup. Not a v0.1 concern. |
| Cross-folder import causes shadcn CLI to fail when installing | Low | High | `media-carousel-01 → video-player-01` already proves the precedent works. Smoke-test step 6 verifies. |
| `<EngagementBar01>` per-row controlled mode + thread reducer drift | Medium | Medium | Q-P12 lock makes per-row bar always-controlled. Click handler in like-action.tsx fires `onToggle` only (no local flip in controlled mode — engagement-bar-01's own plan §3 confirms). Single source of truth: thread reducer. If it drifts, the bug is in engagement-bar-01's controlled-mode short-circuit, not here. |
| Realtime delta arrives for a comment that's been locally deleted | Medium | Low | Tree-walk helpers on a deleted node = no-op (predicate doesn't match). Reducer is idempotent. Safe. |

## Implementation order

1. **Pure substrate** — `types.ts` (all types) + `lib/format-time.ts` + `commentReducer` + tree helpers (in `hooks/use-comment-state.ts`). Pure-functional, testable in isolation. `pnpm tsc --noEmit` clean after this.
2. **Autosize hook** — `hooks/use-autosize-textarea.ts` (publicly exported). Pure DOM. Verify in isolation in a scratch demo.
3. **Composer** — `parts/comment-composer.tsx` (most complex sealed part). Establish autosize + keyboard + submit + cancel + controlled-vs-uncontrolled-value patterns.
4. **Recursive node** — `parts/comment-node.tsx`. Compose `<ExpandableText01>` + `<EngagementBar01>` + `<CommentKebab>` + recursive `<CommentNode>` for replies. Implement `expandedToDepth` local state for view-N-replies inline expand.
5. **Small parts** — `parts/view-replies-link.tsx`, `parts/comment-empty-state.tsx`, `parts/comment-kebab.tsx`.
6. **Hook integration** — `useCommentState` (subscription effect + ref-mirror pattern). `pnpm tsc --noEmit` + `pnpm lint` clean.
7. **Root component** — `comment-thread-01.tsx` + `useImperativeHandle`.
8. **Fixtures + demo + usage** — `dummy-data.ts` + `demo.tsx` (6 tabs) + `usage.tsx`.
9. **Meta + index** — `meta.ts` + `index.ts`.
10. **Wire `manifest.ts`** (3 lines).
11. **Wire `registry.json`** (base + fixtures, with cross-folder `registryDependencies`).
12. **Verify:** `tsc --noEmit`, `lint`, `build`, `registry:build`, demo walkthrough, smoke-test from tmp consumer.
13. **Draft `comment-thread-01-procomp-guide.md`** (Stage 3, alongside this).
14. **Update `.claude/STATUS.md`** — new Components row + Recent decisions entry; trim oldest if needed.
15. **Commit** (paused — user explicitly approves).

---

**Plan signed off 2026-05-02.** R-Plan-1 through R-Plan-12 committed inline above. Implementation begins.
