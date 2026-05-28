# ilinxa-proui — Improvement Request

**From:** social-moduls-python — a Django + Next.js platform consuming `@ilinxa/post-card-01`, `@ilinxa/engagement-bar-01`, `@ilinxa/comment-thread-01`.
**Reviewed version:** v0.2.1 (2026-05-28)
**Audience:** ilinxa-ui-pro maintainers.

## Context

Our backend ships a richer **engagement** model than the components currently surface — specifically, **multi-kind reactions** (Facebook / LinkedIn style: ❤️ 👍 😂 😢 etc., one per user per content item). The components today render a binary heart only, so we have a built-and-tested backend feature that the UI cannot express.

This spec proposes the smallest additions that close that gap. Four asks, ranked. Each is additive — zero v0.2.x consumer churn.

---

## ILX-1 (HIGH) — Native `reaction` action in `engagement-bar-01`

**Problem.** `EngagementAction` has no entry for multi-kind reactions. The only workaround (`kind: "custom"` × N buttons) loses the picker UX and the aggregate count.

**Proposed addition** to the `EngagementAction` union:

```ts
| {
    kind: "reaction";
    /** Per-kind tallies. Keys are reaction codes (e.g. "love", "laugh", "wow"). */
    counts: Record<string, number>;
    /** Sum of all `counts` values. Pre-computed so the bar doesn't re-add per render. */
    totalCount: number;
    /** Viewer's currently-selected reaction (key in `counts`), or null. */
    viewerReaction?: string | null;
    /** Kinds exposed in the picker, in display order. Default: object-key order. */
    availableKinds?: string[];
    /** Fires when the viewer picks a kind, or null to clear. */
    onSelect?: (kind: string | null) => void;
    /** Optional split tap-target for the count (mirrors like.onCountClick).
     *  Opens the reactors panel inline. */
    onCountClick?: () => void;
    align?: EngagementActionAlign;
  }
```

**UX expectations.**

- Default trigger shows the icon of `viewerReaction` (or a neutral face if null) + total count.
- **Tap** with no current reaction → open picker. **Tap** with a reaction set → clear (`onSelect(null)`).
- **Long-press** → open picker regardless of current state. (Exact threshold left to implementation.)
- Picker = horizontal row of `availableKinds` icons.
- `onCountClick` split mirrors the like action's existing behavior.

**Realtime — extend `EngagementDelta`:**

```ts
| { kind: "reaction-changed"; counts: Record<string, number>; totalCount: number; viewerReaction?: string | null }
| { kind: "reactor-added"; user: EngagementLikeUser; reactionKind: string }
| { kind: "reactor-removed"; userId: string; reactionKind: string }
```

**State — extend `EngagementState`:**

```ts
reactionCounts: Record<string, number>;
reactionTotalCount: number;
viewerReaction: string | null;
```

**Reducer — extend `EngagementLocalAction`:**

```ts
| { kind: "reaction-select"; reactionKind: string | null }
```

**Imperative handle — extend `EngagementBar01Handle`** (mirrors the existing `triggerLike` / `triggerBookmark` pattern):

```ts
triggerReaction: (kind: string | null) => void;
```

**Labels — add to `EngagementBarLabels`:**

```ts
react?: string;               // default: "React"
removeReaction?: string;      // default: "Remove reaction"
openReactionsPanel?: string;  // default: "Show reactions"
reactionPickerLabel?: string; // default: "Pick a reaction"
```

---

## ILX-2 (MEDIUM) — `reactionsPreview` slot in `engagement-bar-01`

**Problem.** `likersPreview` is locked to like-only ("X, Y and 42 others **liked** this"). For reactions we need a parallel slot the host can populate with mixed-kind preview rows.

**Proposed addition** to `EngagementBar01Props`:

```ts
/** Slot rendered below the action row when a `reaction` action is present.
 *  Parallel to `likersPreview`. Host owns markup. */
reactionsPreview?: ReactNode;
```

Mirror the current `likersPreview` placement — rendered below the action row in all three variants (`default`, `compact`, `stacked`).

---

## ILX-3 (MEDIUM) — Distinct moderator section in `post-card-01` kebab

**Problem.** Moderator items (take down, issue warning, etc.) currently share the generic `kebabActions(post)` slot with owner items. Cross-account trust-and-safety moderators need a visually distinct subsection — currently we inject separators by hand.

**Proposed additions** to `PostCard01Props`:

```ts
/** Renders as a visually distinct kebab subsection (separator + optional label).
 *  Placement within the kebab is at the component author's discretion.
 *  Empty array hides the subsection. */
moderatorActions?: (post: Post) => CommentMenuItem[];
```

Extend `PostPermissionAction` and `PostPermissions`:

```ts
type PostPermissionAction = …existing… | "moderate";

interface PostPermissions {
  …existing…
  canModerate?: boolean;  // gates the moderator subsection
}
```

---

## ILX-4 (LOW) — `edited?: boolean` on `Comment`

**Problem.** `Comment` has no `edited` field; only a `"edited"` realtime delta. On first paint (no realtime wired) we cannot show "(edited)" without overriding `renderNode`.

**Proposed addition** to `Comment`:

```ts
/** Server-known edited flag. Default node renderer appends a localized "(edited)" suffix. */
edited?: boolean;
```

Suggested label key: `editedSuffix?: string` on `CommentThreadLabels` (mirrors `post-card-01`'s `editedSuffix`).

---

## Priority summary

| ID | Component | Severity | Workaroundable today? |
|---|---|---|---|
| ILX-1 | engagement-bar-01 | **HIGH** | Yes — `custom` kind × N (poor UX) |
| ILX-2 | engagement-bar-01 | MEDIUM | Yes — wrap the bar |
| ILX-3 | post-card-01 | MEDIUM | Yes — overload `kebabActions` |
| ILX-4 | comment-thread-01 | LOW | Yes — `renderNode` slot |

If only one lands, **ILX-1 unblocks the most for us.** It's the only one we can't cleanly work around — every alternative degrades the reaction UX.

---

## What stays on our side (intentionally out of scope)

These gaps exist between our backend and your components, but they belong on **our side** to close:

- **Bookmark / share-count / view-count / realtime transport.** No backend models or WebSocket layer yet.
- **Mentions, polls, reposts, link previews, location.** Backend models pending for posts v0.2.

We'll catch up to your existing surface on those.

---

## Open questions for the ilinxa team

1. Is `reaction` a candidate for v0.3, or a longer track?
2. Any concerns with the proposed API shape (naming, structure, optionality)?
3. Do you prefer the proposed three-delta split (`reaction-changed` + `reactor-added` + `reactor-removed`), or a narrower union — e.g. one `reaction-changed` delta that optionally carries `user` + `reactionKind` for incremental updates? Same coverage either way; preference is structural.
