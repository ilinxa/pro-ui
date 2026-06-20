# `gantt-timeline-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status:** 🟢 Reviewed (internal + external consistency pass, 2026-06-20) · approved to proceed → scaffold + implement
> **Slug:** `gantt-timeline-01` · **Category:** `data` · **Tier:** pro-component · **Structure:** shadcn-style compound
> **Predecessor:** [`gantt-timeline-01-procomp-description.md`](./gantt-timeline-01-procomp-description.md) (GATE 1, approved 2026-06-20)

This is the **how**. It is the contract the implementation must follow. Once signed off (**GATE 2**), `pnpm new:component data/gantt-timeline-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions (D1–D12); it operationalises them.

> **Reviewer focus:** the compound export surface (§4), the geometry/viewport engine (§5 — the heart of the build), the drag-ready state seam (§6), and the cross-procomp dependency wiring (§3.3). These are where a Gantt goes wrong.

---

## 1. Summary of what we're building

A **read-only, fully-navigable** project timeline that lays the canonical `TodoItem[]` on a continuous time axis. Bars from effective start→end, `children` rolled into collapsible WBS summary rows, milestone diamonds, a two-tier auto-adapting header, a "now" line, filled status/urgency bars (ramp imported from `todo-rich-card`), and a **pannable/zoomable canvas** (drag-pan + momentum + boundary resistance, continuous focal-point pinch/wheel zoom). Ships as a **compound**: `GanttTimelineRoot` (headless) + flat parts + Tier-C primitives + `GanttTimeline01` assembly. State model is **architected so v2 drag-to-reschedule drops in** without a rewrite.

---

## 2. Client vs server

**`"use client"` on every module that holds state, refs, effects, or gestures** — i.e. `gantt-timeline-01.tsx`, all `parts/*`, all `hooks/*`. Pure `lib/*` (math, scale, flatten, color) and `types.ts` are **framework-free, no directive** (importable from a server component's type position).

Justification: pointer/wheel/pinch gesture handlers, `useReducer` state, the `now`-tick interval, `@tanstack/react-virtual`, and imperative `useImperativeHandle` all require the client. The component still server-renders (client components SSR + hydrate in Next 16); **SSR determinism** is preserved by seeding the "now" line + urgency from the `now` prop on first paint when provided, and — when `now` is omitted — deferring now-dependent visuals to **post-mount** (a `mounted` flag) so the server and first client render match (the `rich-card` hydration-mismatch lesson — never `new Date()`/`Date.now()` during render). The tick interval only starts in a client effect.

---

## 3. Dependencies

### 3.1 — shadcn primitives (all already in `src/components/ui/`)

| Primitive | Used by | Purpose |
|---|---|---|
| `button` | Toolbar, gutter carets, pan-to indicator | zoom + / − / fit, today, expand/collapse-all, disclosure |
| `tooltip` | Body (`BarTooltip`) | lightweight hover summary surface |
| `avatar` | GutterRow, BarTooltip | assignee avatar + initials fallback |
| `badge` | GutterRow, BarTooltip | status badge |
| `skeleton` | Body/Axis loading state | skeleton rows + skeleton axis |
| `scroll-area` | Body | styled vertical scrollbar (horizontal is gesture/transform-driven) |
| `separator` | Toolbar | visual grouping |
| `toggle-group` | Toolbar (optional) | named-zoom-level segmented control |

No **new** shadcn primitive is introduced → **no F-cross-13 "new primitive" smoke risk** (the 4-ship pattern's trigger doesn't fire). Tooltip/Popover divergence (Radix vs Base UI) is already exercised by shipped components; we follow their proven usage.

### 3.2 — npm

- `@tanstack/react-virtual` — **already a dependency** (todo-tree / file-tree / file-manager). Row virtualization. No new package.
- No date library. We use raw epoch-ms arithmetic + `Intl.DateTimeFormat` (built-in) for header labels — keeps the bundle lean and avoids a `date-fns`/`luxon` dep. (Alternative considered in §10.)

### 3.3 — internal registry dependency: `todo-rich-card` *(load-bearing — locks the §8/description risk)*

- **Imports (types, value):** `TodoItem`, `TodoStatusOption`, `TodoPriorityOption`, `TodoLabelOption`, `TodoColorRamp` (types) + `RAMPS` (value) — from the **barrel** `../todo-rich-card` (same-category **relative** import; rewriter-safe — it only strips category from `@/registry/...` static imports, never relative ones).
- **`registryDependency` MUST be declared in BOTH `meta.ts` and `registry.json`** (`@ilinxa/todo-rich-card`). Even though the type imports are erased at build, the **relative `../todo-rich-card` path must resolve in a consumer install** → `todo-rich-card` must be installed. *Type-only ≠ skip-the-dep* (the `content-composer-01` F-01 lesson, now locked here).
- **Lazy boundary:** the **full-card** tooltip path is `React.lazy(() => import("../todo-rich-card").then(m => ({ default: m.TodoRichCard })))`, mounted only when a consumer passes `renderTooltip` that opts into it (via an exported `<GanttFullCardTooltip>` helper). The default lightweight `BarTooltip` never imports the card **value** → `todo-rich-card`'s runtime weight stays out of the default bundle. (The *types* are compile-time only; they don't add runtime weight.)
- **`validate:meta-deps`** must pass: `todo-rich-card` appears in `meta.ts` deps AND is actually imported. ✅ by construction.

---

## 4. Composition pattern — the compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **Flat exports, never a `GanttTimeline.Root` namespace.** Each part module co-locates a **dumb Tier-C core** + a **thin Tier-B context wrapper** (the media-library-01 one-file-two-exports pattern).

### 4.1 — Tier inventory (the GATE-2 enumeration the rule requires)

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `GanttTimelineRoot` | **B (provider)** | `parts/gantt-timeline-root.tsx` | provides | Owns ALL state (viewport, collapse, selection, normalized tree, tick), gesture handlers, the imperative handle, and the `GanttContext`. Renders `children`. **No layout opinion.** |
| `GanttTimelineToolbar` | **B** | `parts/gantt-timeline-toolbar.tsx` | yes | zoom + / − / fit, today, expand/collapse-all, named-level toggle. |
| `GanttTimelineAxis` | **B** | `parts/gantt-timeline-axis.tsx` | yes | the two-tier header; reads viewport → renders `AxisHeader`. |
| `GanttTimelineGutter` | **B** | `parts/gantt-timeline-gutter.tsx` | yes | frozen left column; reads virtual rows → renders `GutterRow`s. |
| `GanttTimelineBody` | **B** | `parts/gantt-timeline-body.tsx` | yes | scroll/transform canvas; grid + `TodayLine` + bars; owns the gesture surface. |
| `GanttBar` · `SummaryBar` · `MilestoneDiamond` | **C** | `parts/gantt-bars.tsx` | no | dumb, prop-driven bar shapes (geometry + color passed in). |
| `TodayLine` | **C** | `parts/gantt-bars.tsx` | no | dumb vertical marker at an x offset. |
| `GutterRow` | **C** | `parts/gantt-timeline-gutter.tsx` | no | dumb row (caret, name, avatar, badge, dots). |
| `AxisHeader` | **C** | `parts/gantt-timeline-axis.tsx` | no | dumb two-tier header from a tick array. |
| `BarTooltip` | **C** | `parts/gantt-bars.tsx` | no | dumb lightweight summary surface. |
| `GanttFullCardTooltip` | **C (lazy host)** | `parts/bar-tooltip-full.tsx` | no | opt-in helper that lazy-loads `<TodoRichCard>`; for consumers who want the full card in `renderTooltip`. |
| `GanttTimelineSkeleton` | **C** | `parts/gantt-timeline-skeleton.tsx` | no | loading state — skeleton axis + skeleton rows; zero state, composes anywhere (used instead of a `loading` prop, §9). |
| `GanttTimeline01` | **A (assembly)** | `gantt-timeline-01.tsx` | no (composes B parts) | `Root` + `Toolbar?` + `Gutter` + `Axis` + `Body`; only `Toolbar` is `show*`-gated (the core three always mount in the assembly; drop them only via hand-assembly). **Contains no logic the parts don't.** Demo + screenshot use this. |
| `useGanttTimeline` | hook | `hooks/use-gantt-context.ts` | — | context consumer for hand-assembled layouts. |

### 4.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. Dropping `GanttTimelineToolbar` drops its code.
- `todo-rich-card`'s **value** (`TodoRichCard`) enters the graph **only** via `GanttFullCardTooltip`'s `React.lazy`. Default usage (lightweight `BarTooltip`) ⇒ the card never loads. **Verified at GATE 3** by inspecting the built bundle / the lazy chunk boundary.
- `@tanstack/react-virtual` is imported only by `hooks/use-gantt-virtual.ts`, used by `GanttTimelineBody`/`GanttTimelineGutter`. A consumer hand-assembling without the body still pays nothing for bars they don't mount.

### 4.3 — Root holds context; assembly is logic-free

`GanttTimelineRoot` is the single source of state + the cross-cutting gesture context. `GanttTimeline01` is a fixed child tree with `show*` toggles and **zero** state of its own — so a hand-assembled layout (description §6.3) gets identical behavior. A reviewer rejects any logic that lives in the assembly but not the parts.

---

## 5. The geometry / viewport engine (`lib/time-scale.ts` + `hooks/use-gantt-viewport.ts`)

This is the core. All of it is pure where possible (`lib/`) with the stateful gesture glue in the hook.

### 5.1 — Continuous time scale (`lib/time-scale.ts`, pure)

```ts
// Viewport state: a linear map from epoch-ms → x-pixels.
type Viewport = { originMs: number; pxPerMs: number };   // x(t) = (t - originMs) * pxPerMs

export const x      = (vp: Viewport, t: number) => (t - vp.originMs) * vp.pxPerMs;
export const timeAt = (vp: Viewport, px: number) => vp.originMs + px / vp.pxPerMs;
```

- **`pxPerMs` is the real zoom state** (continuous). The five named `GanttZoom` levels are **anchor values** of `pxPerMs` (e.g. a "day" target = N px per day → `pxPerMs`); `defaultZoom`/`zoom`/`setZoom`/buttons snap to an anchor, gestures scrub freely between/around them.
- **`minZoom`/`maxZoom`** clamp `pxPerMs` to the `[hour-anchor … quarter-anchor]` span (or the consumer's narrower band).
- **Header tier selection** — `pickScales(pxPerMs): { minor: Unit; major: Unit }` chooses the minor cell unit + major grouping unit from `pxPerMs`. *(Implemented as a **single-threshold ladder**, not state-dependent hysteresis: it picks the finest ladder rung whose minor cell renders ≥ `MIN_CELL_PX` (40px). Because each rung's minor unit is ~3–7× the previous, one cutoff yields wide, stable `pxPerMs` bands per level, so the header doesn't thrash near a boundary — band stability from rung spacing rather than asymmetric up/down thresholds. True hysteresis is an available refinement if micro-jitter at a boundary ever shows.)*
- **Tick generation** — `ticks(vp, viewportPx, unit): number[]` produces aligned boundaries (hour/day/week/month/quarter) within the visible window + overscan, using epoch-ms stepping and `Intl.DateTimeFormat` for labels. Week starts are consumer-locale aware (default Monday; `weekStartsOn` prop deferred — note in guide).

### 5.2 — Effective-window + hierarchy math (`lib/geometry.ts`, pure)

```ts
effectiveStart(item, now) = startAt ?? setAt
effectiveEnd(item, now)   = expireAt ?? (duration != null ? start + duration : null)  // null = milestone
isMilestone(item)         = effectiveEnd == null
isOverdue(item, now, tone)= end != null && end < now && tone !== "done"

// Summary roll-up (parent bar spans children's min start → max end; ignores milestone-only as point span)
summarySpan(node) = { start: min(childEffectiveStarts), end: max(childEffectiveEnds) }
```

Edge: a parent whose children are **all milestones** → summary renders as a thin **bracket between min/max milestone instants** (or a point if they coincide) — never a zero-width invisible bar (description risk).

### 5.3 — Row model (`lib/flatten.ts`, pure)

`flatten(tree, collapsedIds): GanttRow[]` → depth-first visible rows (skip descendants of collapsed nodes), each `{ item, depth, parentId, hasChildren, isSummary }`. Feeds the virtualizer; gutter + body consume the **same** row array so they stay vertically aligned.

### 5.4 — Gestures (`hooks/use-gantt-viewport.ts`, client)

- **Pan/drag** — Pointer Events on the body. `pointerdown` captures; first move resolves a **dominant-direction lock** (|dx|>|dy| → time-pan, else → vertical row-scroll delegated to the scroll container). Time-pan mutates `originMs -= dx / pxPerMs`.
- **Momentum** — on `pointerup`, sample velocity (px/ms over last ~5 moves); `requestAnimationFrame` decay loop (`v *= 0.95`/frame, stop < 0.02 px/ms). Cancel on next `pointerdown`.
- **Boundary resistance** — past the data extents (fit range ± padding), applied delta ×0.25; momentum reaching a boundary eases to rest (no hard clamp jerk). Mirrors `story-viewer-01`.
- **Zoom — focal point** — on pinch (two pointers) or **⌘/ctrl+wheel**: compute `pointerTime = timeAt(vp, pointerPx)`; set `pxPerMs' = clamp(pxPerMs * factor, min, max)`; **re-solve origin so the focal time stays put**: `originMs' = pointerTime - pointerPx / pxPerMs'`. This is what makes zoom feel anchored.
- **Wheel arbitration** — **plain wheel = horizontal time-pan**, **⌘/ctrl+wheel = zoom**, trackpad two-finger (deltaX) = pan both axes. **CRITICAL:** the wheel listener is attached **non-passively** via `ref.addEventListener("wheel", handler, { passive: false })` in an effect — **NOT** the React `onWheel` prop (which is passive → `preventDefault` throws/no-ops). This is the `story-composer-01` trap, called out in description §8.
- **`disableGestures`** — when true, the hook attaches no pointer/wheel listeners; Toolbar buttons + keyboard still drive `setZoom`/`zoomBy`/`zoomToFit`/pan.
- **`onViewportChange`** — fires (rAF-throttled) with the derived `{ from, to }` ISO window after any pan/zoom settles.

### 5.5 — Imperative handle

`scrollToDate` / `scrollToItem` / `scrollToToday` set `originMs` to center the target; `setZoom` snaps `pxPerMs` to a named anchor; `zoomBy(factor)` multiplies (focal = viewport center); `zoomToFit()` solves `pxPerMs` + `originMs` to frame all bars + padding; `expandAll`/`collapseAll` set `collapsedIds`.

---

## 6. State model — architected for drag (D3 seam)

- **Data:** controlled (`data`) is the source of truth; the Root **normalizes** it into an internal `GanttNode` tree (memoized on `data` identity) for fast lookup + summary spans. There is **no uncontrolled data mode** in v1 (read-only ⇒ nothing to own); the controlled/uncontrolled split is for **UI state** (`zoom`, `collapsedIds`, `selectedId`), each a standard `value`/`defaultValue`/`onChange` trio.
- **Reducer** (`useReducer`) owns `{ viewport, collapsedIds, selectedId, focusedRow, tick }`. Pure actions: `pan`, `zoom`, `set-zoom`, `toggle-collapse`, `set-collapsed`, `select`, `focus-row`, `tick`, `fit`.
- **The drag seam (dormant in v1):** `onTaskReschedule` is typed in props but never invoked. The reducer has **no** `reschedule` action yet; v2 adds it + a drag handler on `GanttBar` that calls `onTaskReschedule` (consumer echoes new `data`). Because data is **already controlled**, v2 is purely additive — no controlled/uncontrolled conversion, no state-ownership change. **v1 ships zero drag affordances** (no resize handles, no grab cursor on bars — the grab cursor is on the *canvas* for panning, distinct from bars).

---

## 7. File-by-file plan

Sealed folder under `src/registry/components/data/gantt-timeline-01/` (compound layout; `parts/` co-locates Tier-B wrappers + Tier-C cores per the house pattern):

| File | Contents |
|---|---|
| `gantt-timeline-01.tsx` | **Tier A** `GanttTimeline01` assembly — `"use client"`; `Root` + `show*`-gated parts; the only public default-layout entry. |
| `index.ts` | Barrel — flat exports (every Tier A/B/C name + `useGanttTimeline` + all public types). Re-exports `TodoItem` + option types from `../todo-rich-card` for consumer ergonomics (tail re-export; rewriter-safe). |
| `types.ts` | Framework-free. `GanttZoom`, `GanttTimelineProps`, `GanttTimelineRootProps`, `GanttTimelineHandle`, `Viewport`, `GanttRow`, `GanttNode`, context value type, primitive prop types. Imports `TodoItem` etc. as **types** from `../todo-rich-card`. |
| `parts/gantt-timeline-root.tsx` | **Tier B** provider — reducer, normalized tree, viewport hook, virtual hook, tick hook, color memo, `useImperativeHandle`, `GanttContext.Provider`. |
| `parts/gantt-timeline-toolbar.tsx` | **Tier B** `GanttTimelineToolbar` (+ Tier-C `ZoomControls` core). |
| `parts/gantt-timeline-axis.tsx` | **Tier B** `GanttTimelineAxis` + **Tier C** `AxisHeader`. |
| `parts/gantt-timeline-gutter.tsx` | **Tier B** `GanttTimelineGutter` + **Tier C** `GutterRow`. |
| `parts/gantt-timeline-body.tsx` | **Tier B** `GanttTimelineBody` — gesture surface, grid, virtual row window, bar placement. |
| `parts/gantt-bars.tsx` | **Tier C** `GanttBar` · `SummaryBar` · `MilestoneDiamond` · `TodayLine` · `BarTooltip`. |
| `parts/bar-tooltip-full.tsx` | **Tier C (lazy)** `GanttFullCardTooltip` — `React.lazy` `<TodoRichCard>`; the only module importing the card **value**. |
| `parts/gantt-timeline-skeleton.tsx` | **Tier C** `GanttTimelineSkeleton` — skeleton axis + rows for the loading state (§9). |
| `hooks/use-gantt-context.ts` | `GanttContext` + `useGanttTimeline()` (throws if used outside Root). |
| `hooks/use-gantt-viewport.ts` | pan/zoom/momentum/pinch/wheel (non-passive) gesture state machine. |
| `hooks/use-gantt-virtual.ts` | row virtualization (mirror `use-tree-virtual`: auto/always/never + `suspended` during momentum if needed). |
| `hooks/use-color-tick.ts` | SSR-safe `now`-tick interval (`colorRefreshIntervalMs`; 0 disables). |
| `lib/time-scale.ts` | `x`/`timeAt`, zoom anchors, `pickScales` (hysteresis), `ticks`. |
| `lib/geometry.ts` | effective-window, overdue, summary roll-up, milestone. |
| `lib/flatten.ts` | tree → visible rows. |
| `lib/color.ts` | `resolveRamp` wrapper over imported `RAMPS` + `barFill(item, tone, now, ramp)` (override → tone → urgency). |
| `dummy-data.ts` | `TodoItem[]` fixture: a deep epics→tasks→subtasks tree exercising every state (overdue, blocked, done, milestone, inactive, locked, borderColor override, all-milestone parent). **Fixtures registry item.** |
| `demo.tsx` | Docs demo — `<SwipeTabsList>` tabs: **Zoom levels** (hour→quarter), **States** (empty/loading/single/deep/all-milestones/dense), **Composed / lighter** (hand-assembled subset, no toolbar — proves the compound), **Navigation** (pan/zoom/pinch playground + `disableGestures` toggle). |
| `usage.tsx` | Consumer usage notes (React component, MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; `registryDependencies: ["@ilinxa/todo-rich-card"]`; dep list incl. `@tanstack/react-virtual` + shadcn primitives. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 8. Final API (locked surface)

`GanttTimelineProps` as in description §5 (post-review), with these plan-stage locks:

- `GanttTimelineRootProps` = `GanttTimelineProps` **minus** `showToolbar` (assembly-only toggle) **plus** `children: React.ReactNode`. The assembly's `show*` props map to mounting/not-mounting parts.
- `colorRamp?: TodoColorRamp` default `"default"` → resolved via `lib/color.ts` over imported `RAMPS`.
- `now?: Date | (() => Date)`. If provided, it **seeds first paint deterministically** (SSR-safe). If omitted, now-dependent visuals (today line + urgency tint) compute **after mount** via a `mounted` flag so server and first client render match (the `rich-card` SSR-determinism lesson — no `new Date()` during render); the `colorRefreshIntervalMs` tick then keeps them fresh.
- `rowHeight` default `36`, `gutterWidth` default `280`, `showWeekendShading` default `false`, `showToolbar` default `true`.
- `defaultZoom` default `"week"`; `minZoom` default `"hour"`, `maxZoom` default `"quarter"`.
- `GanttTimelineHandle`: `scrollToDate` · `scrollToItem` · `scrollToToday` · `expandAll` · `collapseAll` · `setZoom` · `zoomBy` · `zoomToFit`.
- **Generics:** none. `TodoItem` is a fixed schema (not generic) — matches `todo-rich-card`. No `<T>`.

Feature-concept count (review §F2 method): **~21**, under the 25 ceiling. ✅

---

## 9. Edge cases

| Case | Handling |
|---|---|
| `data: []` | Empty state: muted illustration + "No tasks to schedule" + axis still renders around `now`. |
| Loading | Consumer-driven via a `loading?: boolean` prop? → **No** (keep surface lean); consumer renders their own skeleton OR mounts with `data: []`. *Decision:* ship a `<GanttTimelineSkeleton>` **Tier-C** export instead of a prop (composes cleanly, zero state). |
| Single item | Axis fits the one bar + generous padding; `zoomToFit` clamps to a sane `pxPerMs` (no absurd zoom — description risk). |
| Deeply nested | Indentation caps visually at ~8 levels (indent step shrinks); virtualization keeps it cheap. |
| All-milestones parent | Summary = bracket between min/max instants (§5.2). |
| Item entirely out of window | Gutter-edge **pan-to** chevron (← / →) → `scrollToItem` (D10). |
| Bar narrower than its label | Label moves outside the bar (right side) or hides → tooltip-only below `MIN_LABEL_PX`. |
| Mixed `startAt`/`duration`/`expireAt` | §5.2 precedence: `expireAt` wins over `duration`; `startAt` wins over `setAt`. |
| RTL | v1 LTR-only; document. Time axis flips are non-trivial → note as a known limitation, not a v1 goal. |
| Mobile / touch | Pinch-zoom + drag-pan are the primary nav; toolbar collapses to icon buttons; gutter narrows (`gutterWidth` responsive via consumer). |
| `prefers-reduced-motion` | Momentum + the `reveal-up` entrance respect it (no inertia fling, no stagger). |

---

## 10. Accessibility

- **Structure:** the chart is a labelled region (`role="group"` + `aria-label`); rows form a **tree** in the gutter (`role="tree"`/`treeitem`/`aria-expanded`/`aria-level`) mirroring `todo-tree`'s proven a11y.
- **Bars:** decorative (`aria-hidden`) — the gutter `tree` row is the single accessible representation of each task (its `aria-label` carries name + dates + status), so a bar isn't separately announced. Bars stay mouse-interactive (click to select). *(Implemented note: this **supersedes** the earlier "bars focusable + roving `tabIndex`" call — a single AT surface on the gutter tree avoids double-announcing and matches the arrows-=-tree-nav keyboard model. The Tier-C bar primitives still carry `focus-visible` styles for standalone reuse.)*
- **Keyboard (conflict-free tree + canvas model):**
  - *Gutter tree focus:* `↑`/`↓` move row focus; `→` expand (or focus first child); `←` collapse (or focus parent) — **standard `tree` semantics**; `Enter` fires `onTaskClick`; `Space` toggles collapse on a summary row.
  - *Viewport pan:* `Home`/`End` jump to chart start/end; `PageUp`/`PageDown` pan one viewport-width; toolbar `+ / − / fit` + today buttons; gestures; pan-to chevrons for off-screen items.
  - *Zoom:* `+` / `−` (no tree conflict).
  - **Note:** arrow keys are reserved for **tree navigation** (the a11y-correct binding), NOT viewport pan — this **supersedes the GATE-2 "←/→ = pan" call**, which collided with `tree` expand/collapse. Panning lives on Home/End/PageUp/PageDown + gestures + toolbar.
- **Focus management:** focus ring on bars + rows; pan-to brings focused off-screen item into view.
- **Reduced motion** as §9.
- **Color is not the only signal:** overdue adds a hatch/end-cap shape, not just red; done/blocked add an icon (from `statusOptions.icon`) — so urgency reads without color vision.

---

## 11. Risks & alternatives

Carried from description §8 (all still apply): ramp-consistency (imported), hour-zoom density, mixed-milestone summary, gutter+virtualization perf, SSR now-determinism, auto-fit absurd-zoom clamp, drag-seam cleanliness, gesture conflict, non-passive wheel, header hysteresis, pan/zoom-vs-virtualizer, cross-procomp `registryDependency`.

**Plan-stage additions:**
- **Virtualizer vs horizontal transform** — chosen model: vertical virtualization (rows) is orthogonal to horizontal pan (a `translateX` on the body's inner track + per-bar `x()` placement). They don't fight because the virtualizer owns the *vertical* scroll element only. **Prototype C-step:** confirm the body's vertical scroll element is the virtualizer's `getScrollElement`, and the gutter mirrors its `scrollTop` (single source). If sync drifts, fall back to one shared scroll container with the gutter `position: sticky`.
- **Date math without a lib** — chosen: epoch-ms + `Intl`. *Alternative:* `date-fns`. Rejected for v1 (bundle weight; month/quarter boundary stepping is a small, testable amount of code in `lib/time-scale.ts`). If boundary math proves error-prone in review, revisit.
- **Continuous vs discrete zoom** — continuous chosen (D4). *Alternative* (discrete snap) rejected per GATE-1.
- **Loading as prop vs component** — `<GanttTimelineSkeleton>` Tier-C export chosen over a `loading` prop (keeps the surface lean + composes).

---

## 12. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (`todo-rich-card` + `@tanstack/react-virtual` declared & imported). **meta-deps gotchas:** in any file with side-effect imports, place the dep-declaring `from`-import FIRST (the audit regex stops at the first `from`); never reference a dep name only inside a comment (false-positive). (blackboard-01 + content-composer-01 lessons.)
2. `pnpm build` succeeds.
3. Docs render at `/components/gantt-timeline-01`; all demo tabs interactive.
4. `pnpm registry:build`; spot-check `public/r/gantt-timeline-01.json` + `gantt-timeline-01-fixtures.json` (targets follow the locked `components/gantt-timeline-01/<sub>` convention; no demo/usage/meta shipped; `todo-rich-card` in `registryDependencies`).
5. **Compound proof:** the demo's "Composed / lighter" tab renders a hand-assembled subset; bundle inspection confirms `TodoRichCard` value is behind the lazy boundary.
6. **Geometry unit tests (Vitest — informed-defer per house convention, but the pure `lib/*` is written test-ready):** effective-window precedence, summary roll-up, milestone detection, `pickScales` hysteresis, focal-point zoom invariant (focal time fixed across a zoom step).
7. GATE 3: `docs/reviews/templates/review-spotcheck.md`, 5 dims, rotating dim = **Performance** (pan/zoom + virtualization is the risk surface) or **Robustness** — pick at review.

---

## 13. Definition of "done" for THIS document (stage gate)

- [x] Final API locked (§8); compound export surface enumerated (§4.1); tree-shaking + Root-holds-context stated (§4.2/4.3).
- [x] Geometry/viewport engine specified (§5); drag-ready state seam specified (§6).
- [x] File-by-file plan (§7) mirrors the sealed-folder + compound house pattern.
- [x] Dependencies + the `todo-rich-card` `registryDependency` wiring locked (§3.3).
- [x] Client/server, edge cases, a11y, risks, verification all covered.
- [x] Review pass (2026-06-20): 3 fixes applied (orphaned `GanttTimelineSkeleton` wired into §4.1/§7; keyboard a11y model made tree-conflict-free; meta-deps ordering gotcha noted).
- [x] **User approved to proceed** ("review and confirm… then move on") → scaffolding `data/gantt-timeline-01` + implementation **now in progress**.

After sign-off, deviations from this plan are loud and intentional, not silent.
