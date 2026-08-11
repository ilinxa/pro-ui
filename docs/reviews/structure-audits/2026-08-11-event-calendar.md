# Structure audit â€” event-calendar v0.4.0 (2026-08-11)

> Post-P3-split baseline. Base + `event-calendar-editing` feature item (strategy-b prop-injection,
> R1 VERDICT). R4 findings CAL-1/CAL-2/CAL-3/INFRA-1 verified landed below, not re-litigated.

verdict: findings-logged
artifact: base 137.3 KB / budget 160 KB (41.6% headroom â€” R6 tightening to 160 is a tracked pending
plan action per `docs/plans/p3-feature-slicing-plan.md`, not re-logged here) Â· feature item
`event-calendar-editing` 95.4 KB / budget 110 KB (13.3% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

Compliant. The editing injection seam is correctly modeled: `EventCalendarRoot`
(`parts/calendar-root.tsx`) owns `CalendarContext` and mounts `editing.Provider` around its shell
only when both `editable` and `editing` are set (`calendar-root.tsx:471,494-498`); no base file
statically imports `features/editing/` â€” the only two hits for `from ".../features"` anywhere in the
folder are `demo.tsx:18` and `usage.tsx:46` (docs-site-only files, never shipped in the base registry
item). Flat exports confirmed (`index.ts`, no `EventCalendar.Root` namespace); Tier C primitives
(`CalendarEventChip`/`CalendarEventBar`/`CalendarTimeBlock`/`NowIndicator`/`MonthDayCell`/`TimeGrid`/
`TimeGutter`/`AgendaRow`/`CalendarSkeleton`) are prop-driven and context-free; the full-card tooltip
lazy-loads `task-card` (`parts/event-tooltip-full.tsx:12`, confirmed via grep alongside the editing
feature's own `LazyTaskCard` at `features/editing/parts/calendar-edit-overlays.tsx:32`).

R4 fixes verified landed (fresh re-check, not assumed):
- **CAL-1** â€” base registry item's `registryDependencies` no longer include `context-menu`/`input`
  (confirmed via `registry.json` + grep: zero uses of either primitive anywhere under the base
  folder outside `features/editing/`); the editing item declares them instead (plus `button`, the
  merge correction).
- **CAL-2** â€” the imperative-handle "no editing wired" dev-warn dedup is per-instance:
  `calendar-root.tsx:83` (`const warnedNoEditingRef = useRef(false)`, inside `RootShell`), not
  module-scoped.
- **CAL-3** â€” the type-only re-export block for edit-prop-referenced types lives at
  `index.ts:69-84`, correctly erased-at-compile (no runtime feature dependency added to the base).
- **INFRA-1** (baseâ†’own-features import invisibility) â€” no violation exists to catch; confirmed above.

No findings.

## 2. Dead / orphaned public API

None found. Every exported view (`CalendarMonthView`/`WeekView`/`DayView`/`AgendaView`) and chrome
part (`CalendarToolbar`/`MiniNav`/`EventInspector`) is mounted internally by the `EventCalendar`
assembly (`event-calendar.tsx`'s `ActiveView` switch + the `EventCalendar` JSX tree) AND
independently demonstrated as an Ã -la-carte subset live in `demo.tsx`'s "Lighter (composed)" tab
(`EventCalendarRoot` + `CalendarToolbar` + a hand-rolled `ComposedBody` â€” `demo.tsx:36-39,149-161`) â€”
satisfying the compound rule's "hand-assembled subset actually renders" bar directly, not just by
plausibility.

## 3. Undocumented prop semantics

**Finding 1 â€” stale "editing lands in v0.2" line survives in `usage.tsx`'s opening paragraph,
immediately contradicted by the section 22 lines below it.** `usage.tsx:10-11` reads: *"It is the
read-only display sibling of the gantt; editing lands in v0.2."* Editing shipped in v0.2.0 long ago
and is now itself a v0.4.0 opt-in feature slice â€” the very next section, "Editing (opt-in feature)"
(`usage.tsx:33-61`), fully documents it as shipped with a real install command and code sample. Unlike
the app-sidebar precedent in this audit batch (where stale scaffold copy was the first and only thing
a reader saw), this is quickly self-corrected by the adjacent section â€” real but minor.

**Finding 2 â€” `renderQuickComposer` undocumented outside historical planning docs.**
`types.ts:270-271` (`/** Override the default quick-composer body. */ renderQuickComposer?:
CalendarQuickComposerRenderer;`) is a real customization render-prop, exported as a public type from
both the base barrel (`index.ts:78`) and the editing feature's barrel
(`features/editing/index.ts:47`). It has zero mention in `usage.tsx` or
`event-calendar-procomp-guide.md` (grep-confirmed) â€” the only hits are in the pre-implementation
`event-calendar-procomp-description-v0.2.0.md` and `-plan-v0.2.0.md`. A consumer wanting to customize
the quick-composer body has no discoverable documentation path short of reading `types.ts` directly.

## 4. A11y baseline

No findings. Quick-composer overlay: `role="dialog"` + `aria-label="Create event"` +
`autoFocus` on its first field (`features/editing/parts/calendar-quick-composer.tsx:50-53,117`).
Inspector: `aria-label="Clear selection"` (`calendar-event-inspector.tsx:85`). Event chips:
`aria-label="High priority"` flag, `aria-describedby` wiring, `role="tooltip"` on the hover card
(`calendar-event.tsx:24,112,144`). Keyboard router in `calendar-root.tsx`'s `handleKeyDown` covers
M/W/D/A view switch, â†/â†’ + PageUp/PageDown period step, T-today, plus delegated event-key and
day-Enter handling when editing is wired (`calendar-root.tsx:125-179`) â€” matches `meta.ts`'s claimed
keyboard surface.

## 5. Weight & slice candidacy (already-sliced â€” is the remaining base coherently sized; second axis?)

Remaining base (excl. `features/editing/`, `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`):
**3,660 LOC**. Top-3: `parts/calendar-root.tsx` 502 (13.7% â€” the provider/shell), `parts/calendar-time-grid.tsx`
391 (10.7%), `parts/calendar-month-view.tsx` 380 (10.4%).

No second npm-weight-bearing axis clears the â‰¥20% bar. `@dnd-kit/*` is already fully shed to the
editing slice (confirmed in Â§1's registry.json check) â€” the remaining size is view machinery
(month/week/day/agenda + the shared time-grid), and that's already tree-shakeable at the ES-module
level (a month-only consumer drops week/day/time-grid code by simply not importing those parts, no
feature-item split needed â€” proven live by the demo's composed tab). **Not a further slice
candidate**; the base is coherently sized for what it now is.

## Owners

| Finding | Severity (ðŸš«/âš ï¸/ðŸ”¸/ðŸ”¹) | Owner target |
|---|---|---|
| `usage.tsx:10-11` stale "editing lands in v0.2" line contradicts the "Editing (opt-in feature)" section 22 lines below | ðŸ”¹ Low | Next PATCH touch â€” delete/replace |
| `renderQuickComposer` (`types.ts:270-271`) render-prop undocumented in `usage.tsx` and the guide doc â€” only in superseded v0.2.0 planning docs | ðŸ”¸ Medium | Next MINOR touch â€” add an example to `usage.tsx`'s "Editing" section + the guide doc |
