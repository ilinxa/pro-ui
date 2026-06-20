---
date: 2026-06-20
session: gantt-timeline-01 first ship
phase: procomp v0.1.0
type: first-ship
commits: []   # uncommitted — built on top of 2c3bc24, awaiting user commit/push
components: [gantt-timeline-01]
findings: [F-01-postdeploy-smoke, F-02-chart-height-prop, F-03-vitest-defer, F-04-context-split-perf]
status: built-reviewed-fixed-uncommitted
---

# gantt-timeline-01 v0.1.0 — first ship (56th procomp)

Read-only project-management **Gantt** over the canonical `TodoItem[]`. The time-axis sibling of `todo-rich-card` (cards) and `kanban-board-01` (columns); **completes the task-management set** — `calendar-01` is the next (queued) procomp. Greenfield (no migration).

## Three gates

- **GATE 1 (description):** The user supplied a draft written against a *different repo* (`packages/ui`, `@workspace/ui`, cobalt/IBM-Plex/`--paper`). Reconciled to `ilinxa-ui-pro` (paths, `@/registry/...` imports, signal-lime/Onest/JetBrains-Mono tokens); corrected the "kanban consumes the same array" claim (kanban has its own `KanbanData`; the honest shared spine is the canonical `TodoItem` type); marked `calendar-01` as not-yet-built. Added the mandated compound declaration. **User chose** (AskUserQuestion): read-only-architected-for-drag · filled bars · lightweight tooltip · then **pan/swipe/zoom must-have** → continuous zoom + axis-aware drag/momentum/pinch. A consistency review pass applied **9 fixes** (boundary wording, surface-budget honest count, cross-procomp `registryDependency` risk, ramp-match scope, tooltip primitive, D6 lock).
- **GATE 2 (plan):** Full compound tier inventory, the `pxPerMs`/origin geometry engine (focal-point zoom invariant, hysteresis scale selection), the drag-ready state seam, file-by-file. A consistency review applied **3 fixes** (orphaned `GanttTimelineSkeleton` wired in; **keyboard a11y made tree-conflict-free** — arrows = tree nav, NOT pan, superseding an earlier "←/→ = pan" call that collided with `role=tree` expand/collapse; meta-deps ordering gotcha noted).
- **GATE 3 (review):** Spot-check, rotating dim = **Performance**. **Pass with follow-ups.** ([review](../../docs/procomps/gantt-timeline-01-procomp/reviews/2026-06-20-v0.1.0-spotcheck.md))

## What shipped

shadcn compound (per the compound rule): `GanttTimelineRoot` (headless: all state + viewport gestures + imperative handle + context) → flat parts `Toolbar`/`Axis`/`Gutter`/`Body` → Tier-C primitives `GanttBar`/`SummaryBar`/`MilestoneDiamond`/`TodayLine`/`GutterRow`/`AxisHeader`/`BarTooltip`/`GanttTimelineSkeleton` → `GanttTimeline01` assembly. **19 source files** (types + 4 `lib/` + 4 `hooks/` + 8 `parts/` + assembly + index). Continuous-zoom two-tier axis; pan/swipe/zoom canvas; filled status/urgency bars with the ramp **imported** from `todo-rich-card` (not re-derived); WBS summary rows; milestone diamonds; overdue red end-cap; SSR-safe `now`; WAI-ARIA tree gutter; `@tanstack/react-virtual` row virtualization. Full-card tooltip (`GanttFullCardTooltip`) `React.lazy`-loads the card so the default tooltip keeps it out of the bundle.

## Gates green

`tsc` 0 · scoped ESLint **0 errors** (1 unavoidable virtualizer "incompatible-library" warning, same as todo-tree) · `validate:meta-deps` 0/0/0 · `pnpm build` ✓ (65/65 pages incl. `/components/gantt-timeline-01`) · `registry:build` ✓ (base + fixtures). Artifact spot-check: no demo/usage/meta, dummy-data isolated to fixtures, `@ilinxa/todo-rich-card` declared, relative `../../todo-rich-card` preserved (rewriter-safe).

## Reusable lessons

1. **A user-supplied spec can be written against another repo.** First move on intake was to ground every path / import / design-token / factual claim against the *actual* registry before writing the GATE-1 doc — caught the `packages/ui` vs `src/registry`, cobalt vs signal-lime, and "kanban shares the array" drift.
2. **Cross-procomp imports from a sub-folder need `../../<slug>`, not `../<slug>`.** `types.ts` (component root) resolves `../todo-rich-card`, but `lib/color.ts` + `parts/bar-tooltip-full.tsx` are one level deeper → `../../todo-rich-card`. tsc caught it; the fix is rewriter-safe (relative imports are left untouched; resolves in the consumer flat layout too).
3. **React-Compiler lint:** a rAF momentum loop that self-references a `useCallback` const trips "access before declared" → use a **hoisted `function` declaration** inside the callback. Context-bundled refs (`bodyScrollRef`/`gutterTrackRef`) false-positive `react-hooks/refs` → file-level scope-suppress (the blackboard-01 precedent). Legitimate measure/sync `setViewport` in an effect → `// eslint-disable-next-line react-hooks/set-state-in-effect` (the media-editor/article-body precedent). Remove any suppression the linter reports as **unused**.
4. **a11y review caught a keybinding collision at GATE 2:** binding `←/→` to viewport pan conflicts with the `role=tree` gutter's expand/collapse. Resolution: arrows = tree nav; pan = gestures + toolbar. The consistency pass is where this surfaced — not at runtime.
5. **Continuous zoom + row virtualization are orthogonal** (horizontal `pxPerMs`/origin transform vs vertical virtualizer) — they don't fight; the gutter mirrors the body's `scrollTop` imperatively. Wheel zoom needs a **non-passive** native listener (`story-composer-01` trap).

## Pre-commit second-review pass (2026-06-20, before first commit)

An independent full-implementation re-read (all 19 source files vs the plan + compound rule + design tokens + registry convention) confirmed the build is clean, well-structured, and faithful to the plan, and surfaced **4 Low findings**, of which **5 fixes were folded into v0.1.0 before the first commit** (never shipped, so no version bump):

1. **`prefers-reduced-motion` now honored** — plan §9/§10 promised "no inertia fling" under reduced motion; `endPanWithVelocity` now bails via a `prefersReducedMotion()` guard (client-only `matchMedia`). (The plan's "reveal-up entrance" clause was N/A — this component has no entrance animation; only momentum was actionable.)
2. **Stale-velocity guard** — a pause-then-release no longer flings: `endPointer` passes velocity `0` when the last pointermove was > 100 ms before release.
3. **`onViewportChange` is now literally rAF-throttled** — the echo effect coalesces multiple commits per frame via `requestAnimationFrame` + cancel-on-rerun (matches the documented "rAF-throttled" contract; was firing per committed frame).
4. **Doc/comment accuracy** — `pickScales` is honestly described as a **single-threshold ladder** (wide stable bands from multiplicative rung spacing), not "hysteresis," in the `lib/time-scale.ts` comment + plan §5.1 + guide. Plan §10 a11y updated: **bars are `aria-hidden`; the gutter tree is the sole AT surface** (supersedes the earlier "bars focusable" call — the guide already documented this correctly). Guide a11y line tightened (status reads via gutter **badge text**, not a bar icon). Canonical Tailwind class (`max-w-[220px]`→`max-w-55`).

Gates re-run after the fixes: **tsc 0 · lint 0 err (1 known virtualizer warning) · meta-deps 56/56 · registry:build ✓ · build ✓**.

- **F-04 (Low, deferred — tracked):** the `GanttContext` value isn't split, so Gutter + Toolbar re-render on every pan/momentum frame. **Bounded by row virtualization → cheap**; deferred deliberately (a context split touches every part and is a regression risk disproportionate to the marginal gain right before first ship). Revisit if a perf profile shows it.

## Open / RESUME

**Uncommitted (fixes applied above).** RESUME = commit + push → run **F-01** post-deploy F-cross-11 path-b consumer smoke (`shadcn add @ilinxa/gantt-timeline-01` + cross-backend consumer-tsc; expected clean — no new shadcn primitive, relative import rewriter-safe). Then F-02 (chart `height` prop, v0.2) + F-03 (Vitest, defer). Prior-session open item still standing: **blackboard-01 v0.1.0** F-01 post-deploy smoke.
