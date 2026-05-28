---
date: 2026-05-29
session: story-viewer-01-v0.2.0-engagement-layer-ship
phase: minor-version-ship
type: minor-version-ship + composition + permissions
commits: 4 (C7 / C8 / C9 / C10) on top of the pre-pause C0-C6 chain
components:
  - story-viewer-01
  - story-rail-01
related_decisions:
  - 2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment
  - 2026-05-28-engagement-bar-01-v0.3.0-reactions-multi-kind-ship
status: shipped
---

# story-viewer-01 v0.2.0 — engagement layer ship

The 11-commit C0→C10 chain that landed the v0.2.0 engagement expansion
closed today. Pre-pause work (C0–C6) was already pushed by 2026-05-28; this
file documents the C7–C10 resume + GATE 3 closure.

## Scope landed

Per the GATE 1 description ([`story-viewer-01-procomp-description-v0.2.0.md`](../../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md)) and the GATE 2 plan ([`story-viewer-01-procomp-plan-v0.2.0.md`](../../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-plan-v0.2.0.md)) — all 14 scope items shipped:

1. **Engagement overlay** composing engagement-bar-01 v0.3.x `variant="stacked"`
2. **Reply composer** composing comment-thread-01 v0.2.1 `CommentComposer`
3. **Role-aware viewerMode** + `StoryViewerPermissions` matrix + `canPerformAction` predicate (mirrors post-card-01 v0.3.0 resolver)
4. **Owner overlay** — eager `story.viewerCount` chip + lazy viewers list via `onLoadViewers` (LikersStrip reuse)
5. **Kebab placement** — 6th item of engagement overlay (Instagram-2024) with header right-cluster fallback under `disableEngagement`
6. **7 render slots** (`renderHeader / renderProgress / renderNavArrows / renderTapZones / renderEngagementOverlay / renderReplyComposer / renderOwnerOverlay`)
7. **8 disable opt-outs** (full matrix in C8 commit)
8. **Imperative handle 7 → 13 methods** (`setMuted`, `triggerLike`, `triggerReaction`, `triggerReply`, `triggerShare`, `openKebab`)
9. **Polymorphic `linkComponent` + `StoryItem.link` CTA**
10. **Long-press pause additive** (Instagram-canonical, 200ms default, additive on v0.1 middle-tap pause)
11. **i18n expansion** — labels broadened to cover all v0.2.0 surfaces (23 keys), nested forwards for engagement-bar + comment-composer
12. **F-S1 import hygiene** patch landed in C0 (bundled)
13. **Touch-target patch** — 32×32 → 44×44 (WCAG 2.5.5) bundled in C0
14. **4 new demo tabs** (`ViewerMode / OwnerMode / CustomSlots / LinkAndLongPress`)

## C7–C10 specifics (the resume-arc)

**C7 — render slots.** Wired the 4 default-part slots at the outer level in
`story-viewer-01.tsx` — consistent with the C3/C4/C5 slot pattern. The plan
specified "4 files: 1 per part" — documented deviation; the outer approach
is simpler, no behavior change, no part-level prop expansion. Slots receive
`StoryViewerSlotHelpers`.

**C8 — 5 remaining disable opt-outs.** Three were already wired via mount
gates (engagement / replyComposer / ownerOverlay). C8 added: `disableTapZones`,
`disableKeyboardNav` (`useStoryKeyboardNav` gained an `enabled` opt),
`disableNavArrows`, `disableAutoClose` (`useStoryViewerState` gained the opt
with refs-mirrored gating at both close call sites — end-of-last-story
auto-advance + `goToNextStory` end-of-list), `disableProgressBars` (timer
still runs, drives auto-advance).

**C9 — long-press + LinkCta + linkComponent.** New `useLongPressPause` hook
wired onto the inner wrapping `<div>` via `pointerdown / up / cancel`. 200ms
default, tunable via `longPressThresholdMs`. New `parts/link-cta.tsx`
polymorphic-root CTA — `buttonVariants(...)` pattern (F-cross-13 safe),
default-anchor mode adds `target=_blank` + `rel="noopener noreferrer"`;
custom components manage their own nav. `onLinkClick` overrides default
nav without unhooking the href.

**C10 — ship commit.**

- Hoisted the 8 kebab mutation handlers + `isSavedToHighlights` onto
  `StoryViewer01Props` (post-card-01 v0.2.0 convention), retired the 3
  `props as { ... }` type-assertion blocks introduced in C6 expediency.
- Wired the 5 v0.2.0 imperative-handle methods (`triggerLike` / `triggerReaction`
  / `triggerShare` / `triggerReply` / `setMuted` / `openKebab`) via refs so
  the handle identity stays stable while reading current cursor + engagement
  state. `triggerReply(content)` documented as no-op-content for v0.2.0 —
  `CommentComposerHandle.setValue()` deferred to comment-thread-01 v0.2.2.
- Expanded `dummy-data.ts`: `viewerCount: 47` on story-1, eager `viewers`
  array, `link: { url, cta }` on story-1-item-1, 3 sample reaction kinds.
- Added 4 demo tabs (ViewerMode / OwnerMode / CustomSlots / LinkAndLongPress).
- Bumped `meta.ts` 0.1.2 → 0.2.0; `updatedAt: 2026-05-29`; 13 new feature
  bullets; `dependencies.shadcn` unchanged (kebab DropdownMenu dependency
  was avoided per C6 bottom-sheet deviation, so `dropdown-menu` did NOT
  need to be added to meta deps — net: 0 new shadcn primitives).
- Extended `story-viewer-01-procomp-guide.md` with a v0.2.0 section covering
  every surface.
- Authored GATE 3 spotcheck file at `docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.2.0-spotcheck.md`.

## C6 plan deviation — preserved

C6 chose bottom-sheet over `<DropdownMenu>` for both kebab placements
(engagement-overlay 6th item + header fallback). Reasons documented in the
C6 commit message + handoff. Net effect on v0.2.0 deps: `dropdown-menu` was
NOT added to `meta.shadcn`, sparing consumers one primitive install and
removing the largest expected F-cross-13 patch-loop surface from the smoke.

## GATE 3 verdict

**Pass with follow-ups.** Spotcheck file: [`docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.2.0-spotcheck.md`](../../docs/procomps/story-viewer-01-procomp/reviews/2026-05-29-v0.2.0-spotcheck.md).

5 findings, all sub-blocker, none affecting consumer upgrade:

| # | Severity | Topic | Bump |
|---|---|---|---|
| F-01 | 🔹 Low | `triggerReply(content)` is stubbed (`CommentComposerHandle.setValue` not in comment-thread-01 v0.2.1) | v0.2.1 docs + v0.2.2 substrate |
| F-02 | 🔹 Low | `LikersStrip` boundary `as any` cast (structural-equivalent inline-copy types) | v0.3.0 helper-type |
| F-03 | 🔸 Medium | engagement-overlay `bottom-24` may overlap composer on very short viewports | v0.2.1 visual |
| F-04 | 🔹 Low | long-press vs tap-pause race documented incompletely | v0.2.1 docs |
| F-05 | 🔹 Low | `disableEngagement` + no kebab wiring → no kebab affordance — intended but undocumented | v0.2.1 docs |

## Bundled

- **story-rail-01 v0.2.1** docs patch already landed in C0 (`7ffb532`) —
  3 stale positional `onItemClick` snippets corrected. No further work.

## Verification

- `pnpm tsc --noEmit` clean at every commit C0–C10
- `pnpm validate:meta-deps` — 49/49 clean post-bump
- `pnpm lint` clean
- `pnpm registry:build` regenerated `public/r/story-viewer-01.json` +
  `story-viewer-01-fixtures.json` artifacts
- Post-push smoke harness run is the immediate follow-up (transitively
  installs story-viewer-01 + comment-thread-01 + engagement-bar-01 +
  expandable-text-01 + media-carousel-01 + video-player-01). Same-day
  F-cross-13 patch loop is the project's standard expectation for any
  procomp using Select/Checkbox/Tooltip/Popover primitives — v0.2.0
  inherits engagement-bar-01's defensive Popover wiring, doesn't introduce
  its own primitive surface; budget 0–1 patches.

## Zero-breakage verified

Every v0.2.0 surface is opt-in (gated on `viewerMode` being set + per-feature
disable flags). The 6 existing v0.1 demo tabs (`image / video / mixed / multi
/ realtime / custom`) are untouched. v0.1 prop names + semantics preserved.
v0.1 imperative handle methods preserved.

## Tip

Final ship commit lands on top of `288c868` (the C9 commit). Tip after C10
ship = the final commit including this decision file + STATUS + spotcheck
+ component-versions + meta bump + guide + demo + dummy-data + types
hoist + handle wiring.
