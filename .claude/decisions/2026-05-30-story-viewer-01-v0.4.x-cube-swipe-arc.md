---
date: 2026-05-30
session: continuation of 2026-05-29 v0.3.9 close → v0.4.0–v0.4.4
phase: ship + readiness + docs alignment
type: feature + readiness + docs
commits:
  - feat(story-viewer-01) v0.4.0–v0.4.2 — cube + swipe + mobile-fullscreen + scale-jump
  - chore(story-viewer-01) v0.4.3 — readiness review
  - docs(story-viewer-01) v0.4.4 — guide + demo doc alignment
  - docs(status) — session-close state-lock for story-viewer-01 v0.4.4
components:
  - story-viewer-01
findings:
  - cube-engagement scale-jump fixed via translateZ(-50cqw) shift (v0.4.2)
  - infinite-loop in useEffect dep on full cube object (fix v0.4.1 follow-on)
  - tap-zones aria-hidden-with-focused-child warning (mousedown preventDefault fix)
  - registry roster was missing the 2 v0.4.0 cube files (BLOCKER, fixed v0.4.3)
  - index.ts barrel missing 17 public-API types (fixed v0.4.3)
  - usage.tsx documented only v0.1 (fixed v0.4.3)
  - guide.md stale framer-motion claim + bookmark in engagement bullets + 1→7 slot count + 8 opt-out count (fixed v0.4.4)
  - meta.ts context still claimed 'eighth and final ship' and 'framer-motion v0.2 gate' (fixed v0.4.3)
  - registry.json description had the same stale framer-motion claim (fixed v0.4.3)
status: shipped + closed
---

# story-viewer-01 v0.4.x cube/swipe arc + readiness pass

## Summary

Single-session arc on top of the morning's v0.3.9 close. Five micro-versions shipped (v0.4.0 → v0.4.4), all closed in-day, no follow-ups outstanding.

| Version | What | Why |
|---|---|---|
| **v0.4.0** | Instagram-canonical 3D cube transition between stories | User: "transition from story to other story must be more professional and more like Instagram" |
| **v0.4.1** | Pointer-driven swipe gesture + mobile-fullscreen sizing fix | User: "stories are not swipable, must work exactly like Instagram" + screenshot showing 384px-cap modal with page bleed-through |
| **v0.4.2** | Cube-engagement scale-jump fix | User: "scale gets bigger on swipe, must scale down for cubic effect" |
| **v0.4.3** | Full-component readiness review | User: "review the entire component code and confirm fully aligned, consistent, clean, and professional" |
| **v0.4.4** | Docs + demo alignment pass | User: "make sure docs, guide contents, and examples are all fully up to date and matched" |

## v0.4.0 — 3D cube transition

**Substrate locked** via user choice from a 3-option `AskUserQuestion`: CSS-only cube, auto-advance + click only (no drag yet). Decision driven by the project's motion-substrate memory (framer-motion not a peer dep; CSS-first precedent).

**Geometry:**
- Outer container: `perspective-distant @container` (Tailwind v4: 1200px perspective + `container-type: inline-size`)
- Rotator: `transform-3d` (preserve-3d) + `rotateY(var(--story-cube-angle))` + `cubic-bezier(0.32, 0.72, 0, 1)` easing
- Faces (front / right wall / left wall): `translateZ(50cqw)` ± `rotateY(±90deg)` — no JS width measurement needed
- Ghost face renders only during animation window; live tree is the "incoming" or "current" face depending on cube mode

**New files:**
- `hooks/use-cube-transition.ts` — state machine (`idle` / `auto` / `dragging` / `releasing`)
- `parts/story-cube-face.tsx` — static ghost render (progress bars + header + bare image/video poster, no interactivity)

**Detection mechanism:** mid-render `setState` pattern detects story-level cursor changes and triggers cube in the SAME React commit — no 1-frame flash of new-story-without-cube. Uses `useState({storyIndex, itemIndex, isOpen})` + four-branch mid-render condition (open-close toggle / pending-drag-commit / story-change auto / item-change sync).

**Angle drive:** CSS variable `--story-cube-angle` mutated through a callback-ref-to-the-rotator — never React state. Avoids cascading-render warnings AND skips per-frame re-renders.

**Opt-outs added:** `disableStoryTransition?: boolean` and `storyTransitionDurationMs?: number` (default 400).

## v0.4.1 — swipe + mobile-fullscreen

**Swipe:** pointer drag on viewer body engages when `Δx > 10px AND > Δy`. During drag both prev + next ghosts mount on left/right walls so user can swing either way mid-gesture. Cube angle = `(dx / width) * 90°` (1:1 at half-width). Boundary resistance ×0.25 at first/last story. On release:
- `|Δx| ≥ 30% width` OR `|velocity| ≥ 0.5 px/ms` → commit (animate to ±90°, then cursor change in `onComplete`)
- otherwise → snap-back to 0

`pendingDragCommit` flag suppresses the auto-cube on the cursor change that the drag commit triggers (otherwise the auto-detection would replay the same animation).

**Conflicts handled:**
- long-press pause: drag intent cancels the long-press timer
- tap zones: `swipeJustEndedRef` flag + `onClickCapture` suppress the click that would fire on `pointerup` after a successful drag

**Mobile-fullscreen fix:** shadcn's `DialogContent` ships `sm:max-w-sm` (caps at 384px on ≥640px viewports). Without an override, the modal floated at 384px on intermediate-mobile widths with the page features list bleeding through the `bg-black/10` dialog overlay around it. Added `sm:max-w-none sm:rounded-none sm:h-dvh sm:w-screen` — initially insufficient (cascade order let shadcn win). Hardened with Tailwind v4 important suffix (`h-dvh! w-screen! …`) so the override wins regardless of stylesheet order.

**Bundled:** `src/app/components/[slug]/page.tsx` got `overflow-x-hidden sm:overflow-x-visible` + `wrap-break-word` on feature `<li>` (Tailwind v4 spelling) so the long v0.4.x bullets wrap cleanly on mobile.

**Stability fixes during the arc:**
- Infinite-loop in `useEffect(() => { if (!isOpen) cube.forceIdle(); }, [isOpen, cube])` — `cube` is a fresh object literal each render → infinite loop. Fixed by destructuring `cube.forceIdle` to a stable reference + adding bail-if-idle inside `forceIdle` using functional `setState`.
- `aria-hidden` on TapZones wrapper trapping focused button after click. Fixed with `onMouseDown={e => e.preventDefault()}` on each tap-zone button (blocks focus-on-click without breaking the click handler).

## v0.4.2 — scale-jump fix

**Diagnosis:** front face at `translateZ(50cqw)` is `50cqw` closer to the viewer than the perspective plane. CSS perspective magnifies it by `1200 / (1200 − halfWidth)` ≈ 1.2× at rest. When the cube engaged mid-swipe, the live story jumped from natural 1.0× (idle, no cube) to 1.2× (cube engaged at angle 0), then shrank during rotation. User read this as "big then shrinking" — not a clean cube.

**Fix:** prefix the rotator transform with `translateZ(-50cqw)` so the front face lands at world z=0 (the natural perspective plane) at idle. Now:
- Idle (cube engaged, angle 0): scale 1.0× — no jump from idle-no-cube
- Mid-rotation: scales DOWN toward ≈0.857× as front face moves to z=-50cqw at ±90°
- Incoming face mirrors curve: starts at 0.857× on the side wall, grows to 1.0× as it arrives at front

One-line CSS change, proper cube perspective restored.

## v0.4.3 — readiness review

5 drift findings surfaced, all closed in-review:

| # | Severity | Drift | Fix |
|---|---|---|---|
| F-01 | 🚫 Blocker | `registry.json` missing `hooks/use-cube-transition.ts` + `parts/story-cube-face.tsx` (v0.4.0 additions) → consumer installs would have broken with missing-import TS errors | Added both files + smoke-rebuilt artifact (now ships 28 files vs 26) |
| F-02 | ⚠️ High | `meta.context` + `registry.json.description` claimed "framer-motion v0.2 gate" and "eighth and final ship" — never updated since v0.1 | Rewrote both to reflect actual v0.4 state |
| F-03 | ⚠️ High | Stale feature counts: "1→7 slots" (actual 9), "8 opt-outs" (actual 12) | Updated bullets |
| F-04 | ⚠️ High | `index.ts` barrel missing 17 public-API types referenced by props (`StoryViewerMode`, `StoryViewerPermissions`, `StoryEngagementDelta`, `StoryEngagementReactionKind`, `ViewerListItem`, `StoryCurrentUser`, `StoryKebabMenuItem`, etc.) | Added all 17 to barrel |
| F-05 | 🔸 Medium | `usage.tsx` documented only v0.1 (no engagement / comments / share / cube / swipe / role-aware) | Added 6 new sections covering v0.2–v0.4 surfaces |

## v0.4.4 — docs + demo alignment

4 doc-side drift findings:

| # | Surface | Drift | Fix |
|---|---|---|---|
| F-D1 | `demo.tsx` | Multi-story tab silently exercised cube + swipe without calling them out; no `disableStoryTransition` toggle anywhere | Renamed tab "Cube + swipe", rewrote explainer, added checkbox + duration slider |
| F-D2 | `guide.md` "5 rules" | Rule 5 still claimed "framer-motion enters in v0.2 for swipe-to-dismiss" | Replaced with "engagement opt-in" + "everything is pure CSS" rules (now 6 rules total) |
| F-D3 | `guide.md` engagement bullets | Still listed bookmark (removed v0.3.0) + kebab "6th item" (moved to header v0.3.5) | Rewrote section: collapsed-by-default column + heart-toggle reveal + kebab-in-header. Slot count table extended to 9. Opt-out table extended to 12. |
| F-D4 | `guide.md` missing sections | No v0.3 (panels / link drawer / label keys) or v0.4 (cube / swipe / mobile fix) coverage | Added 6 new sections. "What's NOT in v0.1" retitled "Still out of scope (as of v0.4)" with a "now shipped" subsection clearing engagement/reply/kebab/swipe. |

Per-version planning docs (`description.md`, `description-v0.2.0.md`, `plan.md`, `plan-v0.2.0.md`) intentionally left frozen — they are historical records, not live docs.

## Verification

All checks clean post-arc:
- `pnpm tsc --noEmit` — 0 errors
- `pnpm validate:meta-deps` — 49/49 clean
- `pnpm registry:build` — clean; `story-viewer-01.json` artifact ships 28 files
- Docs page returns 200 at http://localhost:3002/components/story-viewer-01

## Files touched

**New:**
- `src/registry/components/media/story-viewer-01/hooks/use-cube-transition.ts`
- `src/registry/components/media/story-viewer-01/parts/story-cube-face.tsx`

**Modified:**
- `src/registry/components/media/story-viewer-01/story-viewer-01.tsx` — cube wiring + swipe gestures + lint-clean refactors
- `src/registry/components/media/story-viewer-01/types.ts` — `disableStoryTransition` + `storyTransitionDurationMs`
- `src/registry/components/media/story-viewer-01/parts/viewer-shell.tsx` — mobile-fullscreen `!` overrides
- `src/registry/components/media/story-viewer-01/parts/tap-zones.tsx` — `onMouseDown` focus suppression
- `src/registry/components/media/story-viewer-01/index.ts` — 17 public types exposed
- `src/registry/components/media/story-viewer-01/usage.tsx` — v0.2–v0.4 sections added
- `src/registry/components/media/story-viewer-01/demo.tsx` — multi-story tab renamed + toggles added
- `src/registry/components/media/story-viewer-01/meta.ts` — 5 new feature bullets + version `0.3.9 → 0.4.4` + description rewritten + context rewritten
- `docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-guide.md` — major refresh
- `registry.json` — 2 missing files added + description rewritten
- `src/app/components/[slug]/page.tsx` — mobile-friendly overflow + word-wrap

## Open follow-ups

None. The earlier handoff's pending items have been folded in:
- ~~Smile-icon polish~~ — still blocked on engagement-bar-01 upstream; not addressed in this arc (deferred)
- ~~v0.3 guide section + usage.tsx update~~ — ✅ done in v0.4.3 / v0.4.4
- ~~Smoke harness re-run~~ — registry artifact rebuilt + verified; live smoke can run post-push
- ~~Optional GATE 3 spotcheck for v0.3.5+ surfaces~~ — ✅ subsumed by v0.4.3 full-component readiness review (verdict Pass)

**Deferred (carried forward):**
- Smile-icon reaction polish — needs engagement-bar-01 upstream `defaultReactionIcon`
- Post-push live smoke harness verification (`pnpm dlx shadcn add @ilinxa/story-viewer-01` into `e:/tmp/ilinxa-smoke-consumer/` + consumer-side `pnpm tsc --noEmit`)

## Memory snapshots

- Updated topic file: `project_story_viewer_01_v0_3_x_arc.md` → renamed implicitly via the new `project_story_viewer_01_v0_4_x_arc.md` topic
- No new feedback memories — the Tailwind v4 important-suffix + perspective+translateZ-shift were one-off geometry knowledge, not durable user feedback
