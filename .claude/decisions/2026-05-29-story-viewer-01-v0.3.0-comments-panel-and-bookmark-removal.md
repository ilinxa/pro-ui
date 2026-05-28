---
date: 2026-05-29
session: story-viewer-01-v0.3.0-comments-panel
phase: minor-version-ship
type: minor-version-ship + ux-redesign + breaking-removal
commits: 1 (single ship commit on top of v0.2.2)
components:
  - story-viewer-01
related_decisions:
  - 2026-05-29-story-viewer-01-v0.2.0-engagement-layer-ship
status: shipped
---

# story-viewer-01 v0.3.0 — comments panel + bookmark removal

Two coordinated changes landed in v0.3.0, both surfaced through visual
review of the v0.2.x viewer-mode demo tab:

1. **Bookmark action removed** from the engagement overlay (user-flagged:
   "we don't need to have save in stories — they are not bookmarkable and
   not saveable"). Stories are ephemeral; viewer-side bookmarking is not an
   Instagram-canonical affordance. Owner-side `Save to highlights` in the
   kebab stays — it's a different surface (owner persistence to profile),
   not a viewer bookmark.

2. **Instagram-style comments panel** for the comment-icon flow. The
   previous behavior — comment icon focuses the bottom always-visible
   composer — conflated the DM input with comments. v0.3.0 corrects the
   semantic:
   - The always-visible bottom `<ReplyComposer>` is the **Direct Message**
     channel (Instagram-canonical "Reply to @user…" sends content as a DM
     to the story author).
   - The comment icon now opens a separate **comments panel** as a bottom
     sheet (~62% of viewer height) containing the host-supplied comments
     thread (typically `<CommentThread01 />` via the new
     `renderCommentsPanel` slot).

## Public-API delta

### Removed (breaking)

- `onBookmarkStory?: (storyId, itemId, nextBookmarked) => void` — gone.
  Bookmark UI is no longer mounted; the callback would never fire.
  Consumers of v0.2.x that wired this callback need to remove it (lint
  will surface unused references). No backwards-compat shim is shipped
  because v0.2.x is days old and the engagement layer is still alpha.

### Added (additive)

- `renderCommentsPanel?: (story, item, helpers) => ReactNode` — host
  supplies the panel content. Helpers extend `StoryViewerSlotHelpers`
  with `{ isCommentsOpen: boolean; closeCommentsPanel: () => void }`.
- `disableComments?: boolean` — opts out the panel entirely; comment-icon
  falls back to focusing the DM input (v0.2.x behavior).
- 3 new label keys: `commentsHeading` (default `"Comments"`),
  `commentsCloseLabel` (default `"Close comments"`),
  `commentsDefaultEmptyState` (default `"No comments yet. Be the first to
  reply."`).

### Changed (semantic)

- `onAddReply` JSDoc clarified — it's a DM submit callback, NOT a public
  comment. Name preserved for back-compat; future v0.4 may add an alias
  `onSendDirectMessage`.
- Engagement overlay's comment action `onClick` now opens the comments
  panel (was: focus DM composer). When `disableComments=true` it falls
  back to the v0.2.x behavior.

## UX implementation

- `parts/comments-panel.tsx` — bottom-sheet chrome. Always mounted (DOM
  persistence preserves consumer-side state like CommentThread01's draft
  composer text across open/close cycles). Hidden via `translate-y-full`
  when closed. Slides up on open with `duration-300 ease-out`.
- Visual stack (`ItemView` + `TapZones` + `LinkCta` + `EngagementOverlay`
  + `ReplyComposer` + `OwnerOverlay`) wrapped in a transform layer:
  `scale-[0.55] translate-y-[-18%]` + `pointer-events-none` when panel
  open. Origin set to `origin-top` so the media stays anchored to the
  header.
- Backdrop catcher: transparent `<button>` at z-35 captures clicks on the
  shrunk visual area while panel is open. Closes the panel on tap.
- Story timer auto-pauses when panel open via a `useEffect(commentsOpen)`
  that calls `setPaused(true)` on open and `setPaused(false)` on close —
  prevents the timer racing the user's reading time.
- Panel auto-closes on cursor change (`storyIndex` or `itemIndex` delta)
  to avoid persistent overlay across story navigation.

## Demo

The ViewerModeTab wires `renderCommentsPanel` with a full `CommentThread01`
mount — `DUMMY_FLAT_COMMENTS` + `pageSize=5` + `onLoadMore` simulating a
300ms paginated fetch + `onAddComment` / `onLikeComment` loggers. This
demonstrates the canonical pattern hosts should follow.

## GATE handling

User opted to skip formal GATE 1+2 in iteration mode (user is reviewing
visually + giving rapid feedback). The user's chat messages are the
description; this decision file is the post-ship documentation. GATE 3
spotcheck file authored at
`docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.3.0-spotcheck.md`.

## Verification

- `pnpm tsc --noEmit` clean
- `pnpm validate:meta-deps` clean (49/49)
- `pnpm registry:build` regenerated artifacts
- New file `parts/comments-panel.tsx` added to `registry.json`
- Manual visual review in dev server pending post-ship

## Compatibility

- **v0.2.x consumers using `onBookmarkStory`:** must remove the prop
  (TypeScript will flag at compile-time). Bookmark UI was new in v0.2.0,
  so the surface area of impact is small (engagement layer is days old).
- **v0.2.x consumers using `onAddReply`:** no change — semantic
  preserved (it always was the DM channel; v0.3.0 just clarifies that
  in docs).
- **v0.2.x consumers using the comment icon:** behavior changes from
  "focus DM input" to "open comments panel". Hosts wanting the old
  behavior can set `disableComments={true}`.
