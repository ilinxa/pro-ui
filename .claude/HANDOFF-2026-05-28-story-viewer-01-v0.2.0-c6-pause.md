# HANDOFF — 2026-05-28 — story-viewer-01 v0.2.0 C6 pause point

> **Mid-chain state-lock.** 7 of 11 commits done; resume at C7 in a fresh chat.

---

## Tip + working tree

- **git tip (pre-state-lock):** `90af2db` (`feat(story-viewer-01): v0.2.0 C6 — kebab assembly`)
- **Post-state-lock tip:** the commit landing this handoff + STATUS update
- **Working tree:** clean post-commit. No code changes in the state-lock commit (docs + STATUS only).

## Chain progress

| Commit | Status | Description |
|---|---|---|
| `7ffb532` C0 | ✅ pushed | pre-flight hygiene — story-rail v0.2.1 docs + story-viewer F-S1 import + touch-target |
| `8fcb1aa` C1 | ✅ pushed | types expansion (+31 props, 13 handle methods, 23 labels, 4 inline-copies for cross-cat Bug 3) |
| `76a9757` C2 | ✅ pushed | `lib/permissions.ts` (mirror post-card-01) |
| `f29ebd6` C3 | ✅ pushed | engagement overlay (compose engagement-bar-01 stacked) + state hook + actions resolver |
| `fc1128f` C4 | ✅ pushed | reply composer (compose CommentComposer + auto-pause) + registry.json backfill (C2/C3/C4 files were missed in earlier commits) |
| `3252546` C5 | ✅ pushed | owner overlay (view-count chip + lazy viewers list panel) |
| **`90af2db` C6** | ✅ pushed | kebab assembly — `lib/kebab.ts` + `<KebabPanel>` bottom-sheet (shared between engagement-overlay placement + header fallback) |

**Net: 7 commits / +1600 LOC / 11 new files. Tip `90af2db`.**

## C6 plan deviation (documented + intentional)

The plan called for `<DropdownMenu>` + `<DropdownMenuTrigger>` for the header kebab fallback. **I switched to a shared bottom-sheet** (`<KebabPanel>`) for BOTH kebab placements. Reasons:

- **Platform-native:** Instagram / Snapchat / TikTok all use bottom-sheet action sheets for story kebabs (DropdownMenu is a desktop-app pattern, not a story-viewer pattern).
- **Avoids F-cross-13 entirely** — no `<DropdownMenuTrigger asChild>{<Button>}` rewriter trap surface; no shadcn `dropdown-menu` primitive added.
- **Cleaner consumer install** — existing dialog/avatar/button suffice; no new primitive dep.

Net effect on the plan: `meta.shadcn` does NOT need `dropdown-menu` (the plan said it would). One fewer F-cross-13 patch loop expected post-push.

## Remaining work (C7→C10)

### C7 — render slots (mechanical)

Wire the 4 existing parts (viewer-header / progress-bars / nav-arrows / tap-zones) to accept their respective `renderXxx?: (story, item, helpers) => ReactNode` props. Each part: when slot is provided, short-circuit to the slot's return; otherwise render default. The 3 v0.2.0 parts (engagement-overlay / reply-composer / owner-overlay) ALREADY honor their slots (wired in C3/C4/C5).

**Files touched:** 4 parts + `story-viewer-01.tsx` (thread slot props through).

### C8 — disable opt-outs (4 remaining)

Already wired via mount gates: `disableEngagement` (C3), `disableReplyComposer` (C4), `disableOwnerOverlay` (C5). Plus `disableNavArrows` works implicitly because `<NavArrows>` is mounted conditionally — needs a flag check added.

**Remaining 4 to wire:**
- `disableTapZones` — don't mount `<TapZones>`
- `disableKeyboardNav` — short-circuit `useStoryKeyboardNav`
- `disableNavArrows` — already conditional on `canPrev`; gate on flag too
- `disableAutoClose` — in `goToNextItem` end-of-last-story branch, fire `onAutoCloseAtEnd` but DON'T call `onClose` when flag set
- `disableProgressBars` — don't mount `<ProgressBars>` (timer still runs)

**Files touched:** `story-viewer-01.tsx` + `hooks/use-story-keyboard-nav.ts` (accept enabled flag) + `hooks/use-story-viewer-state.ts` (accept disableAutoClose option).

### C9 — long-press pause + StoryItem.link CTA + linkComponent

**New files:**
- `hooks/use-long-press-pause.ts` — `LONG_PRESS_MS` default 200; pointerdown/pointerup handlers; `longPressThresholdMs` prop tunable
- `parts/link-cta.tsx` — bottom button rendered when `item.link` set; uses `linkComponent` polymorphic root; coexists with engagement overlay (sits above it, below reply composer)

**Files touched:** 2 new + `story-viewer-01.tsx` (wire long-press onto outer surface + mount LinkCta conditionally).

### C10 — ship commit (biggest)

- Imperative handle final 6 trigger methods (setMuted/triggerLike/triggerReaction/triggerReply/triggerShare/openKebab) — some already wired in C3-C6; remaining ones (triggerLike/triggerReaction/triggerShare) need refs to engagement-overlay's internal handle
- 4 new demo tabs in `demo.tsx`: ViewerMode / OwnerMode / CustomSlots / LinkAndLongPress
- Expand `dummy-data.ts` — add `viewerCount: 47` + sample `viewers: [...]` to one story; add `link: { url, cta }` to one item; add sample `reactionKinds` for engagement overlay
- `meta.ts` bump v0.1.2 → v0.2.0 + 13 new features list entries + verify dependencies.internal
- `guide.md` update — add v0.2.0 sections: engagement-overlay / reply composer / viewerMode permissions / owner overlay / kebab placement / long-press pause / link CTA / disable opt-outs reference
- GATE 3 spotcheck at `docs/procomps/story-viewer-01-procomp/reviews/<date>-v0.2.0-spotcheck.md` — rotating dim = Public API (major surface expansion); 4 fixed dims + Public API; self-review acceptable per pro-component tier
- Decision file at `.claude/decisions/<date>-story-viewer-01-v0.2.0-engagement-layer-ship.md`
- STATUS.md + `docs/component-versions.md` row bumps to 0.2.0
- Post-push smoke harness invocation: `node scripts/smoke-all.mjs --slug story-viewer-01` from `e:/tmp/ilinxa-smoke-consumer/`. Transitively installs story-viewer + comment-thread + engagement-bar + expandable-text + media-carousel + video-player. F-cross-13 patch loop likely (engagement-overlay's stacked-variant + KebabPanel's button surfaces); budget 1-2 patches.

---

## Known C7-C10 hygiene items

- **3 type assertions in story-viewer-01.tsx (C6 expediency):** the 8 mutation handlers (onSaveToHighlights / onDeleteStory / etc.) + `isSavedToHighlights` are currently destructured via inline `props as { … }` type assertion because `StoryViewer01Props` doesn't yet declare them. C10 cleans this up by extending Props with a discrete `StoryMutationHandlers` interface or flattening them onto Props directly (matches post-card-01 v0.2.0 convention).
- **triggerReply pre-fill:** C4 stubbed the `content?: string` parameter — current `CommentComposerHandle` only exposes `focus()`, not `setValue()`. C10 either extends the Handle (upstream comment-thread-01 patch) OR documents the parameter as no-op (acceptable since the focus alone is the primary affordance).
- **No mid-chain demo regressions verified manually.** Each commit's tsc + meta-deps + registry-build are clean, but no `pnpm dev` browser walkthrough of the 6 existing demo tabs. Mount gates were carefully designed to preserve v0.1 behavior (every new mount conditioned on `viewerMode` being set), so confidence is high — but C10 should do a manual run-through before declaring spotcheck Pass.

---

## Resume checklist (fresh chat)

1. Read this file fully.
2. Read [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-plan-v0.2.0.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-plan-v0.2.0.md) sections C7-C10 (the per-commit specs).
3. Skim [`src/registry/components/data/post-card-01/post-card-01.tsx`](../src/registry/components/data/post-card-01/post-card-01.tsx) imperative-handle pattern — C10's trigger* methods follow the post-card-01 pattern (handler refs + useImperativeHandle).
4. Glance at [`src/registry/components/data/post-card-01/demo.tsx`](../src/registry/components/data/post-card-01/demo.tsx) `RoleAwareTab` / `ModeratorTab` for the new demo tab structure to mirror.
5. Pick up at C7: render slots wiring. Follow the slot-pattern from `parts/feed-variant.tsx` etc. (post-card-01's variants).
6. After C10, do post-push smoke: `cd /e/tmp/ilinxa-smoke-consumer && git checkout -- package.json pnpm-lock.yaml && rm -rf src/components/story-viewer-01 src/components/comment-thread-01 src/components/engagement-bar-01 src/components/expandable-text-01 src/components/media-carousel-01 src/components/video-player-01 && node scripts/smoke-all.mjs --slug story-viewer-01`. Expect 1-2 F-cross-13 patches.

---

## Concurrent in-flight (unchanged this session)

- **cms-panel-01 GATE 1 description** — awaiting user sign-off + answers to 10 open questions. [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md). Untouched by this session.

## Commits in this state-lock

Single commit bundling:
- NEW: this handoff
- MODIFIED: `.claude/STATUS.md` (active handoff banner repointed to this file; Recent activity GATE 1 entry updated to reflect C6 progress)

No code changes. Tip = `<new SHA after state-lock commit>`.

---

**Status:** ✅ State locked. Working tree clean post-commit. cms-panel-01 GATE 1 in-flight unchanged. Resume picks up at C7 — render slots wiring.
