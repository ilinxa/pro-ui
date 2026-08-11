# Structure audit — file-manager v0.1.3 (2026-08-11)

verdict: findings-logged
artifact: 174.1 KB / budget 205 KB (15.1% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

`FileManagerContext` (`hooks/use-file-manager-context.ts`) is a real headless context, and the 11
exported chrome parts (`FileManagerToolbar`/`PathBar`/`ViewToggle`/`IconSizeControl`/`SortMenu`/
`SearchInput`/`StatusBar`/`BackForward`/`UpButton`/`NewButtons`/`RefreshButton`) correctly read it
via `useFileManager()` and are flat-exported (`index.ts:2-13`).

**Finding 1:** `@tanstack/react-virtual` is statically imported in
`parts/file-manager-list-view.tsx:13` (`useVirtualizer`), and `FileManagerContentPane` imports
**both** `FileManagerGridView` and `FileManagerListView` unconditionally regardless of `viewMode`
(`parts/file-manager-content-pane.tsx:24-25`). Per `usage.tsx`'s own "Gotchas" section — *"Grid view
does NOT virtualize at v0.1.0"* — there is a real, documented consumer path (grid-view-only usage)
that provably never benefits from `@tanstack/react-virtual`'s weight, yet bundles it every time. This
is the same class of heavy-dep-not-lazy gap found in every other data/navigation-family component in
this audit batch (card-tree's DnD, task-tree's DnD+virtualizer, story-viewer's 3 composed procomps,
gantt-timeline's edit engine) — see the cross-cutting note in the final report.

**Finding 2 (narrower):** unlike `gantt-timeline` (which ships a headless `GanttTimelineRoot`
separate from the full `GanttTimeline` assembly, letting a consumer hand-assemble a genuinely
lighter subset), `file-manager` has no exported Root — `FileManager` is simultaneously the only
context provider AND the full assembly (`file-manager.tsx`, statically mounting content-pane,
status-bar, drag-overlay, delete-confirm, and context-menu together). The 11 exported parts only
support re-skinning chrome via `renderToolbar`-style composition; they cannot be used to opt out of
the underlying engine (selection, native DnD, marquee, virtualization, keyboard nav all ship as one
unit). A consumer who only wants a lightweight read-only file browser cannot get one.

## 2. Dead / orphaned public API

None found. `FileManagerHandle` is a thin `{ state, actions }` wrapper (`types.ts:99-102`), not a
method-by-method surface prone to individual dead stubs, and `FileManagerActions` traces back to a
real internal implementation, not a placeholder.

## 3. Undocumented prop semantics

Minor: `usage.tsx`'s "Custom chrome" section (`usage.tsx:118-130`) names 7 of the 11 flat-exported
parts (`FileManagerToolbar`/`PathBar`/`ViewToggle`/`IconSizeControl`/`SortMenu`/`SearchInput`/
`StatusBar`) and omits `FileManagerBackForward`, `FileManagerUpButton`, `FileManagerNewButtons`, and
`FileManagerRefreshButton` — all four are exported from `index.ts:9-12` and read the same
`useFileManager()` context, so the omission is a prose gap, not a functional one.

## 4. A11y baseline

No findings — `role="grid"` + `aria-multiselectable="true"` confirmed in
`parts/file-manager-grid-view.tsx:68-69`, matching `meta.ts`'s WCAG 2.1 AA claim.

## 5. Weight & slice candidacy

Core folder (excl. `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`): **4,962 LOC**. Top-3 files:
`file-manager.tsx` 731 (14.7% — the assembly/engine itself), `types.ts` 435 (8.8%),
`hooks/use-drag.ts` 312 (6.3%).

No axis clears the ≥20% LOC bar — native-DnD + marquee (`use-drag.ts` + `file-manager-drag-overlay.tsx`
+ `use-marquee.ts` + `file-manager-marquee.tsx` ≈ 483 LOC, 9.7%) and the list-view/virtualizer stack
(`file-manager-list-view.tsx` + `use-visible-items.ts` ≈ 407 LOC, 8.2%) are both sub-threshold and,
per §1, this is a case where the actionable fix is a `React.lazy` boundary around
`FileManagerListView` rather than a formal feature-item split — the LOC is small but the npm weight
(`@tanstack/react-virtual`) is the real cost, and it's already proven unnecessary for grid-only
consumers. **Not a feature-slice candidate on the P3 LOC model, but a concrete lazy-boundary fix.**

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| `@tanstack/react-virtual` bundled unconditionally via `FileManagerListView`, even for grid-only consumers who the docs confirm never use virtualization | ⚠️ High | Next MINOR touch (v0.1.4) — `React.lazy` the list-view module or defer the `useVirtualizer` import until `viewMode === "list"` |
| No headless `FileManagerRoot` — the only entry point is the full engine; can't hand-assemble a lighter subset the way `gantt-timeline` allows | 🔸 Medium | Next MAJOR touch — extract a `FileManagerRoot` provider per the compound-rule Tier-A/B split |
| `usage.tsx` "Custom chrome" list omits 4 of the 11 exported parts (`BackForward`/`UpButton`/`NewButtons`/`RefreshButton`) | 🔹 Low | Next PATCH touch — complete the list |
