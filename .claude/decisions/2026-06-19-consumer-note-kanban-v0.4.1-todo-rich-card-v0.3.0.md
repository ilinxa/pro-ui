---
date: 2026-06-19
session: consumer-integration-note fixes (kanban-board-01 / todo-rich-card)
phase: maintenance — patch (kanban) + public-API-touching minor (todo-rich-card)
type: bug-fix + feature + docs-alignment
commits: [single commit this session — COMMITTED, NOT PUSHED; see git log on master]
components: [kanban-board-01, todo-rich-card]
findings: 15 (A1–A5, B1–B8, C1) — all validated vs current source; B6 = MISMATCH (skipped)
status: COMMITTED, NOT PUSHED (kanban v0.4.1 + todo-rich-card v0.3.0; both GATE 3 Pass-with-follow-ups; push + post-deploy smoke pending)
---

# Consumer-integration-note fixes — kanban-board-01 v0.4.1 + todo-rich-card v0.3.0

## Context

A **second** external consumer note arrived on the same two components as the 2026-06-18
code-review cohort — but this one is **usage-driven**: the author ported both components and built a
"My Tasks" surface (a vertical list of rich cards + a kanban board where the rich card is the
column-card renderer via `todoRichCardKanbanRenderer`). The note (`e:/tmp/ilinxa-ui-pro-update-note.md`)
writes up the generic improvements they made while integrating, tagged **[Adopt]** (generic),
**[API]** (backward-compatible opt-in), **[Skin]** (their visual taste).

Per the 2026-06-18 R10 lesson ("a report finding analyzed against one backend can be wrong for the
other"), **every finding was validated against current source before adoption** (2 parallel
validation agents, quoted evidence). The user chose **all three cohorts in one pass** with the full
v0.3.0 API scope (B3 + B4 + B7).

## Validation outcomes (notable)

- **B6 — MISMATCH (skipped).** The note claimed the card *surface* is painted via inline
  `style.backgroundColor`, blocking consumer `bg-*` / class-based dark mode. **False vs current
  source**: the surface is already a `bg-card` className token; only the *border color* is inline,
  by time-engine design. No code change — recorded as a finding. (Same shape as R10: a report can be
  flat wrong against our backend.)
- **B8 — `canDragItem` already public.** The note proposed adding it; it already exists on
  `TodoRichCardProps`, so `canDragItem={() => false}` works with the existing API (no new prop). The
  note also claimed `edit-inline.tsx` already `stopPropagation`s on pointerdown — it did **not**; that
  hardening was added.
- **B7-gotcha — confirmed, load-bearing.** `lib/normalize.ts` rebuilds each item from a fixed
  allow-list; new fields are dropped unless added there (and to `denormalize`'s `optionalKeys`).
  Critical under controlled mode, which re-normalizes on every `sync-tree`. Gated B4/B7.
- **A1 — body wrapper had to be added.** The note said "wrap the ItemRenderer body"; no wrapper
  existed in `item-shell.tsx` — it was introduced (header mode only).

## What shipped

### kanban-board-01 → v0.4.1 (patch — no public-API change)

| # | Change | Files |
|---|---|---|
| A1 | Header drag-strip corner notch fix (`h-9 rounded-t-xl pb-2` + body `-mt-2 z-10` wrapper) | `parts/item-shell.tsx` |
| A2 | Column width `w-72` → `w-80` (column + overlay clone + add-column button, lockstep) | `parts/column.tsx`, `parts/drag-overlay.tsx`, `parts/add-column-button.tsx` |
| A3 | Portal `DragOverlay` into `document.body` (transformed-ancestor containing-block trap) | `parts/drag-overlay.tsx` |
| A4 | Drop anywhere in a column: `pointerWithin` collision (columns-only `closestCenter` for reorder) + `kind:"column"` append-target + single-lane cell fill | `kanban-board-01.tsx`, `hooks/use-drag-handlers.ts`, `parts/column-body.tsx`, `parts/swimlane-cell.tsx` |
| A5 | Vertical mouse-wheel → horizontal scroll (non-passive listener, yields to a not-at-edge column) | `parts/board.tsx` |

### todo-rich-card → v0.3.0 (minor — additive public API)

| # | Change | Surface |
|---|---|---|
| B3 | Status badge → status-change dropdown | NEW prop `statusEditable?` (default true) + `TodoCardContextValue.statusEditable`; `StatusBadge` signature `{status}` → `{node}` (internal part) |
| B4 | Status tones (terminal overlay + gray border + auto-collapse) | NEW `TodoStatusOption.tone?` (`active`/`done`/`blocked`) + `icon?`; auto-collapse is a **derived** render value, no reducer change |
| B7 | Priority + labels model + meta row | NEW `TodoItem.priority?` / `labels?`, `TodoPriorityOption`/`TodoLabelOption`, props `priorityOptions`/`labelOptions`, new `parts/card-meta.tsx` |
| B7-gotcha | `normalize` allow-list + `denormalize` strip-list teach `priority`/`labels` | `lib/normalize.ts` (+ authoritative-allow-list comment + `validateLabels`) |
| B1 | Two-line header (title `line-clamp-3`, never truncates to 0) | `parts/card-header.tsx` |
| B2 | Smaller controls (`Switch size="sm"`, `size-6` icon buttons) | `parts/card-header.tsx`, `parts/action-menu.tsx` |
| B5 | `border-2` → `border` (1px) | `parts/card.tsx` |
| B8 | Adapter `dragHandle:"header"` → `"shell"` + `canDragItem={()=>false}` + edit-inline `stopPropagation` | `parts/kanban-adapter.tsx`, `parts/edit-inline.tsx` |
| C1 | Inline `import()` type annotations → top-level `import type` | `hooks/use-keyboard.ts` |

Demo + fixtures wire the new APIs (a v0.3 section + toned status set + priority/label options, kept
separate from the existing fixtures so the 4 original demos are unchanged). `registry.json` gained
`parts/card-meta.tsx`; `meta.ts` description + features + companion line updated. Both guides updated.

## Key decisions / lessons

- **B4 auto-collapse is derived, not dispatched** (`collapsed = isTerminal || isCollapsed(id)`). The
  existing collapse action is a *toggle*; deterministically driving it from `tone` would risk a
  double-toggle. A derived render value sidesteps the reducer entirely.
- **A3 mount-guard uses `useSyncExternalStore`**, not `useState`+`useEffect`. `set-state-in-effect`
  is an ESLint **error** in this repo (React Compiler); the repo's SSR-safe client-detect primitive
  (`use-match-media.ts`) is `useSyncExternalStore` with a `false` server snapshot. Reused it.
- **B3 `asChild` cross-backend** is the R10 / engagement-bar-Popover risk class. Mitigated by
  following `action-menu.tsx`'s already-shipped, smoke-proven `asChild` pattern; the real gate is the
  post-deploy cross-backend consumer-tsc smoke (open follow-up).
- **A4 is the high-risk change** — it touches the drop-routing core. The new column-append path still
  flows through `canDrop` (`acceptsRendererIds` preserved); swimlane lane-targeting and the
  same-column index-shift/no-op logic are unchanged; the cell-fill is gated on single-lane.

## Gates

tsc 0 · lint clean both components (81-22 baseline elsewhere, 0 new) · `validate:meta-deps` 55-55 ·
`registry:build` (todo-rich-card artifact 26 files incl. `card-meta.tsx`) · `pnpm build` (64 pages) — all green.

## Verdicts

- todo-rich-card v0.3.0 GATE 3 spot-check (mandatory, minor bump): **Pass with follow-ups**.
- kanban-board-01 v0.4.1 (patch — GATE 3 not required): review note authored for the A4 risk; **Pass with follow-ups**.

## Open follow-ups

| Action | Owner | Target | Status |
|---|---|---|---|
| Push to master + post-deploy F-cross-11 path-b cross-backend consumer-tsc smoke (B3 `asChild`) | author | v0.3.x | Open |
| Manual DnD smoke across all 4 kanban modes + wheel-scroll yielding (A4/A5) | author/user | v0.4.x | Open |
| todo-rich-card person/image/link editors + re-add to `TodoEditableField` | author | v0.4.0 | Deferred (carried from v0.2.0) |
| todo-rich-card SSR deterministic first-paint (`useSyncExternalStore` in card) | author | v0.4.0 | Deferred (carried from v0.2.0) |
