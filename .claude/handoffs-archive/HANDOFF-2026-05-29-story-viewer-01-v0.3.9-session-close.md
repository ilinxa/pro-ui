# HANDOFF — 2026-05-29 — story-viewer-01 v0.3.9 session close

> **Session paused at user request.** All v0.3.x work pushed to `master`; working tree clean. Next session can pick up cold from this file.

---

## Tip + working tree

- **git tip:** `0d9d2cf` (`chore(story-viewer-01): v0.3.9 — review cleanup pass`)
- **Working tree:** clean. All artifacts regenerated and committed.
- **Branch:** `master`, in sync with `origin/master`.

## Session scope summary

This session resumed from the v0.2.0 C6 pause (tip `90af2db`) and closed out the v0.2.0 C7–C10 chain, then iterated rapidly through v0.2.1 → v0.3.9 based on visual review feedback. **18 commits.** Single-day arc; 9 minor/patch versions shipped.

### Version timeline

| Version | Commit | Theme |
|---|---|---|
| v0.2.0 C7 | `4343548` | render slots (4 connective seams) |
| v0.2.0 C8 | `efec315` | 8 disable opt-outs (5 remaining wired) |
| v0.2.0 C9 | `288c868` | long-press pause + LinkCta + linkComponent |
| v0.2.0 C10 | `7ebc574` | ship (handle + demo + meta + guide + spotcheck + STATUS) |
| v0.2.0 backfill | `81274e9` | registry.json transitive deps + missed C9 files |
| v0.2.1 | `145905d` | F-cross-13 viewer-shell `showCloseButton` patch |
| v0.2.1 bump | `18026a1` | meta.ts + STATUS + component-versions + artifacts |
| v0.2.2 | `002cfb1` | `onAuthorClick` + polymorphic `authorComponent` |
| v0.3.0 | `7676e1c` | Instagram comments panel + bookmark removal |
| v0.3.1 | `66e7a91` | share panel + scroll fix + UI polish |
| v0.3.2 | `7acbbbb` | DM composer + engagement overlay collision fix (later reverted) |
| v0.3.3 | `c7762a2` | DM bar full-width + remove Cancel + engagement always visible |
| v0.3.4 | `41d144b` | DM input full-width (drop stale pr-12) |
| v0.3.5 | `06d0378` | kebab to header + heart toggle + bottom-to-top stagger |
| v0.3.6 | `c806ac2` | shrink DM input height to match avatar |
| v0.3.7 | `7ea8d99` | heart toggle inline with DM bar |
| v0.3.8 | `4c7e68b` | link CTA as top-anchored collapsible drawer |
| v0.3.9 | `0d9d2cf` | full-component review cleanup pass |

### Current layout (post-v0.3.9)

**Top:** ProgressBars (z-20) + ViewerHeader (z-20) with right cluster `pause · mute · kebab · close`. LinkCta chip at `top-16 right-3 z-25` — collapsible drawer slides down on tap.

**Middle:** ItemView (no z — natural stacking) + TapZones (z-10) overlay.

**Bottom-right column:** EngagementOverlay (z-30 at `bottom-20 right-3`, COLLAPSED by default — icons hidden, pointer-events-none. Expanded reveals like / reaction / comment / share with bottom-to-top stagger).

**Bottom row:** DM gradient strip (z-31 `bottom-0 left-0 right-0`, full-width, padded `pl-4 pr-16`, contains avatar + textarea + send) and inline heart toggle (z-32 `bottom-3 right-3`) sitting next to the DM input.

**Overlay layers:** backdrop catcher (z-35 with `bg-black/40` dim when any v0.3 panel open) + bottom-sheet panels (z-40 — KebabPanel, CommentsPanel, SharePanel).

### Key architectural decisions made this session

1. **DM bar IS the Direct Message channel** — Instagram-canonical "Reply to @user…" sends to author's chat. `onAddReply` callback name preserved for back-compat but JSDoc clarifies semantic.

2. **Bookmark removed entirely** — stories are ephemeral; viewers don't bookmark. Owner-side `Save to highlights` (in the kebab) stays.

3. **Comments panel separate from DM** — comment icon opens a bottom-sheet (`renderCommentsPanel?: (s,i,helpers) => ReactNode`) typically holding `<CommentThread01 />`. Visual content above shrinks (scale 0.55, translate-y -18%); tap shrunk visual closes.

4. **Share panel parallel to comments** — `renderSharePanel` slot mirrors the comments pattern. Holds host-supplied `<ShareMenu />` from engagement-bar-01. Mutual exclusion with comments (opening one closes the other).

5. **Kebab moved to header** — was the 6th engagement-overlay item; now inside ViewerHeader's right cluster via `onKebabClick` prop.

6. **Engagement column collapsed by default** — only the heart toggle is visible. Tap heart → like / reaction / comment / share fade in with bottom-to-top stagger (delays 0/75/150/200ms, 300ms ease-out). Tap heart again or outside → collapse.

7. **Heart toggle inline with DM bar** — Lives at `right-3 bottom-3 z-32`, vertically aligned with the avatar. The engagement column floats above it.

8. **Link CTA as top-anchored drawer** — collapsible chip at `top-16 right-3` showing host domain. Tap → drawer slides down with host preview + CTA button + X. Instagram-canonical link-sticker UX.

9. **Tailwind v4 bare numeric z values work** — IDE lint actively prefers `z-31` over `z-[31]`. Don't waste a follow-up fixing those.

10. **Generic `BottomSheet` extracted as shared chrome** — `parts/bottom-sheet.tsx` underlies both CommentsPanel and SharePanel. Drag handle + heading row + close + scrollable content with `overscroll-contain`.

### Public-API snapshot

~62 props on `StoryViewer01Props`, grouped:

- **Lifecycle (5):** stories / initialStoryIndex / isOpen / onClose / ref
- **Realtime (4):** subscribe / onSubscribeDelta / engagementSubscribe / onSubscribeEngagementDelta
- **Lifecycle callbacks (4):** onStoryViewed / onItemViewed / onCursorChange / onAutoCloseAtEnd
- **Viewer-mode / permissions (3):** viewerMode / permissions / canPerformAction
- **Engagement (6):** onLikeStory / onReactStory / onShareStory / reactionKinds / reactors / onLoadReactors
- **DM composer (3):** onAddReply / currentUser / composerEmptyState
- **Owner overlay (1):** onLoadViewers
- **Kebab supplier (2):** kebabActions / moderatorActions
- **Kebab item handlers (8):** onSaveToHighlights / onDeleteStory / onShareToFeed / onReport / onBlockAuthor / onMuteAuthor / onCopyLink / isSavedToHighlights
- **Header / author (2):** onAuthorClick / authorComponent
- **Link CTA (2):** linkComponent / onLinkClick
- **Long-press (1):** longPressThresholdMs
- **Slots (10):** renderItem / renderHeader / renderProgress / renderNavArrows / renderTapZones / renderEngagementOverlay / renderReplyComposer / renderOwnerOverlay / renderCommentsPanel / renderSharePanel
- **Disable opt-outs (10):** disableTapZones / disableKeyboardNav / disableNavArrows / disableAutoClose / disableProgressBars / disableEngagement / disableReplyComposer / disableOwnerOverlay / disableComments / disableSharePanel
- **Defaults / i18n / styling (4):** defaultItemDuration / labels / className / contentClassName

`labels` covers 37 keys (all current surfaces; defaults in `DEFAULT_STORY_VIEWER_LABELS`).

### Files inventory (story-viewer-01/)

```
src/registry/components/media/story-viewer-01/
├── demo.tsx              (10 tabs: image/video/mixed/multi/realtime/custom + viewer/owner/slots/link-longpress)
├── dummy-data.ts         (3 stories + sample current user + 3 reaction kinds + 4 viewers)
├── hooks/
│   ├── use-long-press-pause.ts
│   ├── use-story-engagement-state.ts
│   ├── use-story-keyboard-nav.ts (gains `enabled` option in v0.2.0)
│   ├── use-story-progress.ts
│   └── use-story-viewer-state.ts (gains `disableAutoClose` option in v0.2.0)
├── index.ts
├── lib/
│   ├── engagement-actions.ts (no longer adds kebab as 5th)
│   ├── format-time.ts
│   ├── kebab.ts
│   └── permissions.ts (mirrors post-card-01 v0.3.0)
├── meta.ts
├── parts/
│   ├── bottom-sheet.tsx (v0.3.1 — shared chrome)
│   ├── comments-panel.tsx (v0.3.0)
│   ├── engagement-overlay.tsx (v0.3.5/v0.3.7 — collapsible icons-only)
│   ├── item-view.tsx
│   ├── kebab-panel.tsx
│   ├── link-cta.tsx (v0.3.8 — top-anchored drawer)
│   ├── nav-arrows.tsx
│   ├── owner-overlay.tsx
│   ├── progress-bars.tsx
│   ├── reply-composer.tsx (DM input; @deprecated onActiveChange forward-compat)
│   ├── share-panel.tsx (v0.3.1)
│   ├── tap-zones.tsx
│   ├── viewer-header.tsx (v0.2.2 author tap-target + v0.3.5 onKebabClick)
│   └── viewer-shell.tsx (v0.2.1 F-cross-13 CSS-hide close)
├── story-viewer-01.tsx
├── types.ts
└── usage.tsx (NOT updated for v0.3.x — usage examples still reflect v0.2 surface; see "open follow-ups" below)
```

### Decision + spotcheck files authored

- `.claude/decisions/2026-05-29-story-viewer-01-v0.2.0-engagement-layer-ship.md` (v0.2.0 ship)
- `.claude/decisions/2026-05-29-story-viewer-01-v0.3.0-comments-panel-and-bookmark-removal.md` (v0.3.0 ship)
- `.claude/decisions/2026-05-29-story-viewer-01-v0.3.x-arc-comments-share-link-drawer-heart-toggle.md` (this session's full arc — authored at session close)
- `docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.2.0-spotcheck.md`
- `docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.3.0-spotcheck.md`

GATE 3 status: v0.2.0 spotcheck Pass with follow-ups (5 findings); v0.3.0 spotcheck Pass with follow-ups (5 findings). v0.3.1–v0.3.9 ran as patch bumps under the readiness-review rule's patch-bump exemption (no public-API removal/rename/breakage of v0.3.0; GATE 3 verdict carries forward).

---

## Open follow-ups (queued for next sessions)

### High priority (cosmetic + usability)

1. **Smile-icon reaction default looks bolder than the rest** — flagged earlier this session. Requires upstream `defaultReactionIcon?: ReactNode` prop on engagement-bar-01's `kind: "reaction"` action arm. Engagement-bar-01 would bump v0.3.2 → v0.3.3. Then story-viewer can pass a `Sparkles` or `SmilePlus` icon. ~30 min of upstream work.

2. **v0.3 guide section not authored** — `docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-guide.md` last extended for v0.2.2. Need a new section covering:
   - Comments panel (renderCommentsPanel + CommentThread01 pattern + disableComments)
   - Share panel (renderSharePanel + ShareMenu from engagement-bar-01 + disableSharePanel)
   - Heart toggle UX + bottom-to-top stagger
   - Top-anchored LinkCta drawer
   - Kebab moved to header
   - All new label keys
   - v0.2 → v0.3 migration note (bookmark removal, semantic clarification)

3. **`usage.tsx` still reflects v0.2 surface** — examples don't show the new render slots or panels. Update with v0.3 patterns.

### Medium priority

4. **GATE 3 spotcheck for v0.3.5+ surfaces** — the v0.3.0 spotcheck stands for the comments/share panels, but the v0.3.5 heart-toggle UX + v0.3.8 link drawer are substantive enough to deserve their own spotcheck. Run during the v0.4 ship.

5. **Owner-overlay vs kebab-panel z-40 collision** — both at z-40. Mutually exclusive in practice (kebab only opens on tap), but consider explicit ordering for safety (e.g., kebab at z-41).

6. **Custom-slots demo tab is the only one wiring renderCommentsPanel + renderSharePanel** — consider splitting "Comments + share panels" into its own tab to telegraph the v0.3.0/v0.3.1 surfaces. The most important new behavior is currently hidden behind an unfocused tab.

### Low priority / future polish

7. **Optional `useOutsideClick(ref, enabled)` hook extraction** — link-cta.tsx and story-viewer-01.tsx hand-roll the same outside-pointerdown pattern. DRY only; no behavior change.

8. **Heart-toggle extracted to `parts/engagement-toggle.tsx`** — currently inlined directly in story-viewer-01.tsx. Symmetry nit.

9. **`onActiveChange` and the v0.3.3 dead path** — kept as @deprecated forward-compat. Consider removing entirely in v0.4 if no consumer use case materializes.

10. **`triggerReply(content)` is a documented no-op** — `CommentComposerHandle.setValue()` deferred to comment-thread-01 v0.2.2. Either ship that upstream or document the parameter as no-op-content in the guide.

### Verification gaps

11. **Smoke harness run never performed after the v0.3.x patch session** — v0.2.0 smoke ran; v0.3.0–v0.3.9 layered on top without a fresh smoke. Worth running once next session: `cd /e/tmp/ilinxa-smoke-consumer && git checkout -- package.json pnpm-lock.yaml && rm -rf src/components/story-viewer-01 src/components/comment-thread-01 src/components/engagement-bar-01 src/components/expandable-text-01 src/components/media-carousel-01 src/components/video-player-01 src/components/post-card-01 && node scripts/smoke-all.mjs --slug story-viewer-01`. Same-day F-cross-13 patches are the typical outcome.

12. **Lint baseline noise** — v0.3.x still ships with the C3–C6 pre-existing react-hooks/refs warnings (~30 lines on `props.composerRef` etc. in reply-composer.tsx / owner-overlay.tsx / kebab-panel.tsx). Documented in the v0.2.0 spotcheck as v0.3 follow-up.

---

## How to resume in a fresh chat

1. Open new chat in this repo (`e:/2026/ilinxaDOC/ilinxa-ui-pro`).
2. Read this handoff file.
3. Read `MEMORY.md` index entry for story-viewer-01 v0.3.x arc.
4. Pick from the open follow-ups list above. The most impactful next moves:
   - **Smile-icon polish** (item 1) — biggest visual quality win
   - **Guide.md v0.3 section** (item 2) — biggest docs gap
   - **Smoke harness run** (item 11) — verify consumer install still works

Concurrent in-flight unchanged: `cms-panel-01 GATE 1` awaiting sign-off (separate handoff `HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`).

---

## Active handoffs at session close

- **PRIMARY (this file):** `HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md` — story-viewer-01 v0.3.9 closed; follow-ups queued.
- **CONCURRENT:** `HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md` — cms-panel-01 GATE 1 unchanged.

Past handoffs (frozen): `HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md` (superseded by v0.2.0 ship), plus older 2026-05-28 / 2026-05-25 / 2026-05-09 pause files.
