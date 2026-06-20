# HANDOFF — gantt-timeline-01 v0.1.0 BUILT (uncommitted) · 2026-06-20

> **State: BUILT through GATE 3, all gates green, UNCOMMITTED.** Paused at the user's request to resume in a new chat. Built on top of `2c3bc24` (working tree has the gantt component + docs + STATUS/decision/memory updates, all unstaged).

---

## TL;DR for the next session

`gantt-timeline-01` v0.1.0 (56th procomp, `data`) is **fully implemented, gates green, GATE 3 Pass-with-follow-ups, but not committed**. It **completes the task-management set** (todo-rich-card / todo-tree / kanban-board-01 + this). **The user's stated NEXT procomp is `calendar-01`** — the 2nd of the two they named ("we need 2 other procomp to make our set complete: 1. gantt timeline 2. calendar").

**RESUME (do this first, only when the user says go):**
1. `git checkout -b <branch>` (currently on `master`; branch before committing per the harness rule).
2. Stage + commit the gantt component + docs + STATUS/decision/memory. Suggested message subject: `feat(gantt-timeline-01): v0.1.0 — read-only Gantt over TodoItem[] (56th procomp)`.
3. Push → Vercel auto-runs `pnpm vercel-build` (regenerates `public/r/*` from `registry.json`).
4. **Run F-01: post-deploy F-cross-11 path-b consumer smoke** — `pnpm dlx shadcn@latest add @ilinxa/gantt-timeline-01` in a tmp consumer + consumer `pnpm tsc --noEmit`. **Expected CLEAN** (no new shadcn primitive introduced; the cross-procomp dep is a relative `../../todo-rich-card` which the rewriter leaves untouched + `@ilinxa/todo-rich-card` is a declared `registryDependency`). If anything surfaces (esp. cross-backend Base-UI), patch v0.1.1 per the 4-ship pattern.
5. After clean smoke: update STATUS top banner `🛠️ BUILT (uncommitted)` → `🔒 PUSHED + smoke CLEAN`, update the decision file `status:` + `commits:`, add the smoke row to `docs/reviews/sweep-tracker.md`.

---

## What was built

A read-only, fully-navigable **Gantt** over the canonical `TodoItem[]`. shadcn **compound** (per `.claude/rules/compound-component-structure.md`):

- **Tier B headless** `GanttTimelineRoot` — owns all state (viewport/collapse/selection/focus/tick), gesture engine, imperative handle, `GanttContext`. Layout-free (role=group wrapper only).
- **Tier B parts** (flat): `GanttTimelineToolbar` · `GanttTimelineAxis` · `GanttTimelineGutter` · `GanttTimelineBody`.
- **Tier C primitives** (context-free): `GanttBar` · `SummaryBar` · `MilestoneDiamond` · `TodayLine` · `GutterRow` · `AxisHeader` · `BarTooltip` · `GanttTimelineSkeleton` · `GanttFullCardTooltip` (lazy).
- **Tier A assembly** `GanttTimeline01` — Root + parts gated by `showToolbar`; empty state built-in.
- Hook `useGanttTimeline`. All flat exports (no `Name.Root` namespace).

**Behaviors:** effective-window math (`startAt??setAt` → `expireAt??(start+duration)`; null end = milestone); WBS summary roll-up (children min→max); continuous `pxPerMs` zoom with 5 named header buckets + hysteresis; pan/swipe/zoom canvas (dominant-direction lock, momentum, ×0.25 boundary resistance, pinch, non-passive ⌘/ctrl-wheel focal-point zoom, plain wheel = row scroll, shift-wheel = pan); filled bars colored by status tone (`done`=gray, `blocked`=red, `active`=urgency ramp **imported** from todo-rich-card `RAMPS`); `borderColor` override; overdue red end-cap; today line; SSR-safe `now`; WAI-ARIA tree gutter (arrows = tree nav, Enter/Space, conflict-free with pan); `@tanstack/react-virtual` rows (gutter mirrors body scrollTop imperatively); lightweight hover tooltip (custom floating div — avoids the Radix/Base-UI Tooltip `asChild` divergence) with `renderTooltip` override; `onTaskReschedule` typed-but-dormant for v2 drag.

## Files (all unstaged)

- **Component:** `src/registry/components/data/gantt-timeline-01/` — `types.ts`, `lib/{geometry,time-scale,flatten,color}.ts`, `hooks/{use-gantt-context,use-color-tick,use-gantt-viewport,use-gantt-virtual}.ts`, `parts/{gantt-timeline-root,gantt-timeline-toolbar,gantt-timeline-axis,gantt-timeline-gutter,gantt-timeline-body,gantt-bars,gantt-timeline-skeleton,bar-tooltip-full}.tsx`, `gantt-timeline-01.tsx`, `index.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`.
- **Registry:** `registry.json` (base `gantt-timeline-01` + `gantt-timeline-01-fixtures` items appended) → `public/r/gantt-timeline-01.json` + `…-fixtures.json` regenerated.
- **Manifest:** `src/registry/manifest.ts` (import block + REGISTRY entry).
- **Docs:** `docs/procomps/gantt-timeline-01-procomp/{…-description,…-plan,…-guide}.md` + `reviews/2026-06-20-v0.1.0-spotcheck.md`.
- **Tracking:** `.claude/STATUS.md` (banner + table row + count 56 + recent-activity pointer), `.claude/decisions/2026-06-20-gantt-timeline-01-v0.1.0-first-ship.md`, memory (`project_gantt_timeline_01_v0_1_0_built.md` + MEMORY.md pointer).

## Gates (verified this session)

| Gate | Result |
|---|---|
| `pnpm tsc --noEmit` | 0 errors |
| ESLint (scoped to folder) | 0 errors (1 unavoidable virtualizer "incompatible-library" warning, same as todo-tree) |
| `pnpm validate:meta-deps` | 0 high / 0 warn / 0 error |
| `pnpm build` | ✓ 65/65 pages incl. `/components/gantt-timeline-01`, no SSR error |
| `pnpm registry:build` | ✓ base (19 files) + fixtures; artifact spot-check: no demo/usage/meta, `@ilinxa/todo-rich-card` dep, relative import preserved |

## GATE 3 verdict: Pass with follow-ups

- **F-01 (Med)** — post-deploy consumer-tsc smoke (can't run pre-deploy; the RESUME step above). Expected clean.
- **F-02 (Low, v0.2)** — chart height is assembly-fixed (`clamp(280px,52vh,560px)`); add an optional `height` prop.
- **F-03 (Low, defer)** — Vitest deferred (the pure `lib/*` is test-ready: `pickScales` band-selection, effective-window precedence, summary roll-up, focal-point-zoom invariant).
- **F-04 (Low, deferred — tracked)** — `GanttContext` not split → Gutter+Toolbar re-render per pan/momentum frame; bounded by virtualization, deferred (refactor risk > marginal gain). Revisit on a perf profile.

### Pre-commit second-review fixes (folded into v0.1.0 — see decision file)

A full re-read before the first commit applied **5 fixes** (gates re-run green): **(1)** `prefers-reduced-motion` momentum guard, **(2)** stale-velocity guard on pause-then-release, **(3)** `onViewportChange` now literally rAF-throttled, **(4)** `pickScales` "hysteresis"→honest "single-threshold ladder" in comment + plan §5.1 + guide; plan §10 a11y updated (bars `aria-hidden`, gutter tree is the AT surface), **(5)** canonical Tailwind class. No version bump (never shipped).

## Decisions worth remembering

- **Don't commit/push without the user's go-ahead** (they explicitly paused before that step). Branch first (we're on `master`).
- The user's GATE-1 draft was written against a different repo — already reconciled; don't reintroduce `packages/ui`/`@workspace/ui`/cobalt/IBM-Plex.
- `calendar-01` is the planned next procomp (the shadcn `calendar.tsx` primitive already exists in `src/components/ui/`). It is NOT yet started — would need its own GATE 1 → 2 → 3.
- Prior-session open item still standing (unrelated): **blackboard-01 v0.1.0** F-01 post-deploy smoke.

## How to eyeball it

`pnpm dev` → `/components/gantt-timeline-01`. Demo tabs: **Timeline** (full + handle buttons), **Composed (lighter)** (hand-assembled subset, proves the compound), **States** (skeleton / empty / gestures-off), **Full-card tooltip** (lazy todo-rich-card). The demo passes `now={new Date("2026-06-20…")}` so the today line + overdue treatment are deterministic.
