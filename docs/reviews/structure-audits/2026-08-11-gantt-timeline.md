# Structure audit — gantt-timeline v0.6.0 (2026-08-11)

verdict: findings-logged
artifact: 187.8 KB / budget 220 KB (14.6% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

This is the strongest compound implementation of the batch: `meta.ts` explicitly documents the
tier inventory (`GanttTimelineRoot` headless provider + flat `GanttTimelineToolbar`/`Axis`/`Gutter`/
`Body` parts + Tier-C primitives `GanttBar`/`SummaryBar`/`MilestoneDiamond`/`TodayLine`/`GutterRow`/
`AxisHeader`/`BarTooltip`/`GanttContextMenu` + the `GanttTimeline` assembly), all correctly flat-
exported from `index.ts`, and `usage.tsx` includes a "Composed (lighter)" hand-assembly example —
exactly what the rule asks for. The two heaviest `task-card` touchpoints ARE properly `React.lazy`'d:
`parts/bar-tooltip-full.tsx:9-10` and `parts/gantt-edit-popover.tsx:15-16` both
`lazy(() => import("../../task-card"))`.

**Finding 1:** the editing engine itself is not behind that lazy boundary. `hooks/use-gantt-edit.ts`
(580 LOC — the single largest hook in the folder) plus `parts/gantt-edit-popover.tsx` and
`parts/gantt-quick-composer.tsx` are imported statically at the top of
`parts/gantt-timeline-root.tsx:32-35`, and only the *render* is gated on `editable`
(`gantt-timeline-root.tsx:454-455`: `{editable ? <GanttEditPopover /> : null}`). `meta.ts:24`
explicitly claims editing is "opt-in via `editable`, default off = **byte-identical v1**" — true for
rendered output, but not for bundle weight: a read-only consumer's JS bundle still includes the full
edit engine (drag-reschedule, resize, group-move, draw-mode, quick-composer, clipboard, context
menu) even with `editable={false}`.

**Finding 2 (narrower):** `lib/color.ts:11` — `import { RAMPS } from "../../task-card"` — imports the
color ramp from `task-card`'s top-level **barrel**, unlike the tooltip/edit-popover files which
dynamic-import specifically to get a code-split boundary. `RAMPS` itself is needed unconditionally
(bar fill color is a read-only feature), so the import is legitimate — but importing via the barrel
rather than the leaf module (`../../task-card/lib/ramp`) means the safety of "task-card's component
tree stays out of the bundle" rests entirely on the consumer's bundler tree-shaking two layers of
re-export correctly, which the project cannot guarantee for a registry-distributed raw-source
component.

## 2. Dead / orphaned public API

None found. Every exported part (`index.ts`) is reachable from the assembly, documented in
`usage.tsx`'s "Composed (lighter)" example, or is a plausible standalone primitive
(`GanttFullCardTooltip`, `GanttTimelineSkeleton`).

## 3. Undocumented prop semantics

The three v0.5.0 features — double-click-on-empty-row quick-composer (`quickCompose` /
`renderQuickComposer`), cross-surface clipboard (copy/cut/paste through the shared `ilinxa/task`
envelope), and the right-click Priority submenu (`priorityOptions`) — are absent from both
`usage.tsx` (its "Editing" section stops at v0.4's Draw mode, and its one "double-click" mention
(`usage.tsx:52`) refers to the v0.2 *edit-existing-bar* popover, not the v0.5 *create-on-empty-row*
composer — a different gesture on a different target) and the guide
(`docs/procomps/gantt-timeline-procomp/gantt-timeline-procomp-guide.md:3` header still reads
"Version: v0.4.0"; zero hits for quick-composer/clipboard/priority). This is the same
shipped-feature-invisible-in-docs pattern found in `task-tree` (§3 of that audit) — both involve the
same cross-procomp `ilinxa/task` clipboard envelope, suggesting the clipboard rollout across the
task-family components systematically skipped doc updates.

Separately, `meta.ts` itself is internally inconsistent: the comment immediately above the version
field (`meta.ts:45-46`, *"0.5.2 (2026-08-11): F-cross-13 path-b sweep... zero public-API change"*)
doesn't match the field it annotates (`meta.ts:47`, `version: "0.6.0"`) — a patch-level comment next
to a minor-level value.

## 4. A11y baseline

Solid — full ARIA tree contract on the gutter (`role="treeitem"`, `aria-level`, `aria-expanded`,
`aria-selected` at `parts/gantt-timeline-gutter.tsx:99-104`, `role="tree"` at `:435`), matching
`meta.ts`'s claim. No findings.

## 5. Weight & slice candidacy

Core folder (excl. `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`): **4,919 LOC**. Top-3 files:
`parts/gantt-timeline-body.tsx` 909 (18.5%), `hooks/use-gantt-edit.ts` 580 (11.8%),
`parts/gantt-timeline-gutter.tsx` 510 (10.4%).

**Slice-candidate axis: the editing engine — the strongest candidate found in this audit batch.**
`hooks/use-gantt-edit.ts` (580) + `lib/edit-mutations.ts` (231) + `lib/edit-permissions.ts` (46) +
`parts/gantt-quick-composer.tsx` (171) + `parts/gantt-context-menu.tsx` (143) +
`parts/gantt-edit-popover.tsx` (73) = **1,244 LOC (25.3%)** of cleanly-attributable edit-only files,
before counting the editing-gesture code interleaved in `gantt-timeline-body.tsx` (909, mixed read/
edit) and `gantt-timeline-gutter.tsx` (510, includes reparent DnD). Base-coupling is uniquely low
here versus the rest of the batch: the authors already proved output-level separability (`editable`
default off is "byte-identical v1" per `meta.ts:24`) — the only gap is that the separation stops at
render-gating and doesn't extend to the import graph (§1, Finding 1). This makes `gantt-timeline` the
best-instrumented pilot candidate of the audited tail for the P3 injection-surface convention: base
already behaves correctly read-only, so extraction is a bundle-boundary change, not a behavior
change.

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| Edit engine (`use-gantt-edit.ts` + edit popover/composer, 25.3% LOC) statically imported into `GanttTimelineRoot`, only render is `editable`-gated — contradicts "byte-identical v1 default" at the bundle level | ⚠️ High | Next MAJOR touch — extract as `gantt-timeline-editing` feature-item / `React.lazy` boundary per P3 injection-surface convention (this component is the best-proven candidate for it) |
| `lib/color.ts:11` imports `RAMPS` via the `task-card` barrel rather than the leaf `lib/ramp` module — relies on consumer tree-shaking to keep task-card's component tree out of the bundle | 🔸 Medium | Next MINOR touch — retarget the import to `../../task-card/lib/ramp` |
| v0.5.0 features (quick-composer, clipboard, priority submenu) undocumented in `usage.tsx` and the guide (header still "v0.4.0") | ⚠️ High | Next PATCH touch — refresh `usage.tsx` + guide for v0.5/v0.6 |
| `meta.ts` comment says "0.5.2" next to `version: "0.6.0"` | 🔹 Low | Next PATCH touch — reconcile comment and field |
