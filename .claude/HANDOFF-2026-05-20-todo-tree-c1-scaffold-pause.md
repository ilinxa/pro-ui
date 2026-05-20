# Session pause — 2026-05-20 (todo-tree C1 scaffold)

> **Status at pause:** `todo-tree@v0.1.0` is **scaffolded** (C1 of C1–C11 commit chain per [GATE 2 plan §18](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#18-implementation-order-commit-chain)). Sealed folder bootstrapped, full type catalog (264 LOC), stub component renders a placeholder, manifest entry registered, all checks clean. Tip: `aa623a0`. **C2 (lib/ pure functions) is the next-up commit.**
>
> **Earlier today (already pushed):** Resumed paused todo-rich-card v0.1.0 → committed + pushed → F-04 path-b smoke surfaced 3 F-cross-13 hits → patched to v0.1.1 → re-smoked clean → spotcheck F-04 closed (commits `a7db466` → `4670099`). Then added live rich+kanban composition demo (`a8ebd0a`). Then drafted + signed off **todo-tree GATE 1 description** (`e36c90d`/`aa68588`) and **GATE 2 plan** (`6dc8d7e`/`cbfa597`/`8f7e11f`). Then **C1 scaffold** (`aa623a0`).
>
> **Active handoffs prior to this:** all historical — [2026-05-20 todo-rich-card pause](HANDOFF-2026-05-20-todo-rich-card-shipped-pause.md) (closed same-session in this session), [2026-05-17 port-editor pause](HANDOFF-2026-05-17-port-editor-pause.md) (closed), and earlier. All paused work shipped; this is the only active handoff.

---

## What shipped this session (today)

### 1. `todo-rich-card@v0.1.0` + `v0.1.1` patch (resumed from prior pause + F-04 closure)

- v0.1.0 committed + pushed in `a7db466` (code), `d90f3a3` (docs), `c2f7425` (status). 44th component.
- F-04 path-b smoke surfaced 3 F-cross-13 hits (Select.onValueChange Radix→Base UI signature divergence at `parts/edit-inline.tsx:134` + `parts/edit-popup.tsx:177`; `TooltipProvider.delayDuration` at `parts/time-info.tsx:32`).
- Patched in `431da34` — widened Select callbacks to `(v: string | null)` + dropped `delayDuration`. v0.1.0 → v0.1.1.
- Re-smoke clean (0 todo-rich-card errors).
- Spotcheck F-04 flipped to ✅ Closed; STATUS bumped; handoff marked historical; v0.1.1 decision file authored — all in `4670099`.

### 2. Live rich+kanban composition demo (`a8ebd0a`)

- New "Inside kanban-board-01" section in todo-rich-card `demo.tsx` composing `KanbanBoard` + `todoRichCardKanbanRenderer` + `kanbanNoteRenderer` over 3 columns with mixed renderers.
- Full copy-paste recipe in todo-rich-card `usage.tsx` with KanbanData fixture + rendererId wiring + minimum imports.
- Brief cross-link added to kanban-board-01 `usage.tsx` pointing at the live demo.
- Docs-site only — no version bump, no registry artifacts changed.

### 3. `todo-tree` procomp planning + scaffold

#### GATE 1 description (`e36c90d` + `aa68588`)

- 24 locks (L1–L24) covering: shared `TodoItem` schema (cross-procomp dep on todo-rich-card via relative imports per F-S1), 2-line row layout, per-row collapsibility, click→consumer popup, shared DnD payload, permissions matrix mirroring todo-rich-card, controlled + uncontrolled modes, three-defenses pattern, F-cross-13 pre-emption, `<TodoTreeWithEditor>` in same package, multi-select, sort/filter/search toolbar, 8 slot props, headless `useTodoTreeState` hook, touch DnD via dual system (Q8 = option a), virtualization at ≥200, keyboard delete, 26-method imperative handle, copy semantics cross-procomp, drop visual affordance, circular-drop ban, **single feature-complete v0.1 (no v0.2/v0.3 deferrals)**.
- 8 Q-Ps all resolved (Q1–Q7 = author's suggested defaults; Q8 = option (a) Dual DnD system).
- 2 re-validation passes surfaced 6 + 3 substantive findings; all fixed pre-close.

#### GATE 2 plan (`6dc8d7e` + `cbfa597` + `8f7e11f`)

- 22 sections; ~1340 lines.
- Final API locked: 10 types fully defined incl. `TodoTreeAction` reducer-action union (19 cases) and `TodoTreeStateValue` (extends Handle + live state + dispatch).
- Architecture diagram + reducer-as-engine + three-defenses controlled-mode + Dual DnD activation rules (MouseSensor distance:5 + TouchSensor delay:300 + KeyboardSensor + native HTML5 + mutual exclusion via `isInternalDragRef`) + visible-items pipeline (filter→sort→flatten with VSCode-style ancestor-of-match) + virtualization (auto-enable ≥200 total items, suspend during drag) + toolbar architecture + multi-select math + permissions evaluator + 8 slot props with priority rule + `<TodoTreeWithEditor>` composition + cross-procomp deps + 20 edge cases + full WAI-ARIA accessibility + 11-commit ship order (C1–C11) + F-cross-11 path-b smoke plan with pre-emption checklist + 6 plan-side risks + 8 plan-stage Q-Ps.
- 2 LDs documented in §22:
  - **LD1** — `visibleItems` shape refined to `ReadonlyArray<TodoTreeVisibleRow>` (renderer-ready with level + parentId + index) vs description's loose `TodoItem[]`.
  - **LD2** — Sensor split (Mouse+Touch separate) vs description's "same UX as kanban-board-01" claim (kanban-board uses unified PointerSensor, doesn't actually deliver 300ms long-press).
- 2 re-validation passes surfaced 3 + 7 substantive findings; all fixed pre-close (including F-A R6 lock count, F-2 sensor table stale reference, F-11 undefined CSS var, F-16 ADD_ITEM action symmetry with `via` field, F-20 `dndContext` prop addition).
- Q-P1–Q-P8 + LD1 + LD2 all accepted by user at sign-off.

#### C1 scaffold (`aa623a0`)

- `pnpm new:component data/todo-tree` bootstrapped the sealed folder.
- `types.ts`: full type catalog (264 LOC) — `TodoTreeProps` (with `dndContext` per Q-P6), `TodoTreeHandle` (26 methods), `TodoTreeStateValue` (extends Handle + live state + dispatch), `TodoTreeVisibleRow`, `TodoTreeAction` (19 cases with symmetric `via` fields on ADD_ITEM + REMOVE_ITEM), 10 mutation reasons, sort/filter specs, 7 event arg interfaces, 6 slot render-prop arg interfaces.
- `todo-tree.tsx`: stub `forwardRef<TodoTreeHandle, TodoTreeProps>` component returning a placeholder div with a no-op imperative handle. Real implementation lands across C2–C8.
- `index.ts`: full type re-exports (no cross-procomp re-exports per F-S1; consumers import `TodoItem` etc. from `@ilinxa/todo-rich-card` directly).
- `dummy-data.ts`: 3-level fixture (`TODO_TREE_DEMO_ITEMS` — Q3 planning theme with 3 root items, mixed status/active, sub-children up to depth 3) + `TODO_TREE_DEMO_STATUS_OPTIONS` (4 status variants) + `TODO_TREE_DEMO_NOW` (frozen demo clock).
- `meta.ts`: full description + context + 18 features + 9 tags. `dependencies.shadcn=[]` and `dependencies.npm={}` intentionally empty for C1 (validate-meta-deps enforces parity — deps grow as imports land in C2–C8). `dependencies.internal=["todo-rich-card"]` carries the type-only cross-procomp dep.
- `demo.tsx`: yellow scaffold banner + minimal `<TodoTree defaultValue={TODO_TREE_DEMO_ITEMS} />`.
- `usage.tsx`: When-to-use + scaffold-status banner + "Locked surface (from GATE 1 + GATE 2)" bullet list.
- `manifest.ts` entry registered.

---

## Git state at pause

```
On branch master
Tip: aa623a0  feat(todo-tree): C1 — scaffold + type catalog + manifest entry

Modified (1, auto-regenerated):
  M src/app/components/[slug]/_lib/source-map.generated.ts   (rebuilds on predev/prebuild; harmless)

Untracked: 0
```

The `source-map.generated.ts` modification is from the build-source-map script running during `pnpm build` after C1 — it's a regeneration to include the new todo-tree source paths. Can be committed alongside the C2 commit or reverted; it'll regenerate identically on the next `pnpm prebuild`.

---

## Verification at pause

```
pnpm tsc --noEmit                  → 0 errors
pnpm lint                          → 0 errors for todo-tree (2 pre-existing virtualizer warnings unchanged)
pnpm validate:meta-deps            → 45/45 clean
pnpm build                         → succeeds, 45 component routes generated (was 44 before C1)
```

Components total: **45** (todo-rich-card v0.1.1 + todo-tree v0.1.0-scaffold).

---

## Pending work on resume (in priority order)

### 1. C2 — `lib/` pure functions ⭐ NEXT-UP

Per [plan §18 C2](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#18-implementation-order-commit-chain). 14 files to author in `src/registry/components/data/todo-tree/lib/`:

1. **`reducer.ts`** — pure `function reducer(state: State, action: TodoTreeAction): State`. 19 action types covered per plan §5.3. Returns reference-equal state on no-op (e.g., `SET_QUERY` with same string).
2. **`tree-walker.ts`** — `findItemById(items, id)`, `findParentId(items, id)`, `findAncestors(items, id)`. Pure, DFS over tree.
3. **`tree-mutators.ts`** — immutable `insertAt(items, parentId, index, item)`, `removeById(items, id)`, `updateById(items, id, updater)`, `moveItem(items, sourceId, to)`. Each returns new top-level array + new spine.
4. **`filter-items.ts`** — apply `TodoTreeFilter` (statuses, personIds, active) producing match-flag map.
5. **`search-items.ts`** — case-insensitive `.includes()` on `name` + `description`; folds into filter-items pipeline.
6. **`sort-items.ts`** — apply `TodoTreeSort`. 4 named kinds (name/setAt/expireAt/status) + custom compare fn. Children sort recursively under each parent.
7. **`flatten-tree.ts`** — DFS flatten respecting `collapsedIds`; emits `TodoTreeVisibleRow[]` with level + parentId + index. Handles `filterMode === "fade"` (emits all with `dimmed: true` flag) vs `"hide"` (omits non-matching + non-ancestor-of-match).
8. **`visible-items.ts`** — top-level pipeline orchestrator: items → filter → sort → flatten → `TodoTreeVisibleRow[]`. Memoize-friendly.
9. **`circular-drop.ts`** — `isAncestor(items, sourceId, targetId): boolean`. Pure DFS hit-test.
10. **`dnd-payload.ts`** — `TODO_TREE_MIME = "application/x-ilinxa-todo+json"` constant, `serializeForDataTransfer(item)`, `parseFromDataTransfer(dt)`.
11. **`permissions.ts`** — `evalPermission(permissions, action, item, level): boolean`. Mirrors todo-rich-card's predicate-evaluator pattern.
12. **`edge-zone.ts`** — `computeEdgeZone(pointerY, rowBounds): "top" | "middle" | "bottom"`. Caps top/bottom at 8px per L6.
13. **`shallow.ts`** — small shallow-equality util for the structural resync guard.
14. **`default-status-options.ts`** — fallback status enum when consumer provides none.

All pure functions; unit-testable. ~700 LOC total per plan budget. No React imports. **At end of C2, validate-meta-deps should still be 45/45 clean** (no shadcn/npm imports added yet — those come in later commits).

### 2. C3 — `hooks/` layer

Per [plan §18 C3](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#18-implementation-order-commit-chain). 11 hooks:
- `use-todo-tree-state.ts` (the main hook; calls reducer + selectors; returns `TodoTreeStateValue`)
- `use-todo-tree-context.ts` (`<TodoTreeStateContext>` provider + consumer bridge)
- `use-controlled-mode.ts` (three-defenses pattern — microtask-defer + structural resync guard + isDraggingRef bail; mirrors flow-canvas-01 v0.2.4 verbatim where possible)
- `use-tree-events.ts` (consumer callback dispatcher; called by host after each dispatch)
- `use-selection.ts` (multi-select shift/cmd math)
- `use-debounced-callback.ts` (small util for 200ms search debounce)
- `use-status-option-by-value.ts` (lookup from `statusOptions[]`)
- `use-tree-virtual.ts` (deferred to C5)
- `use-tree-keyboard.ts` (deferred to C8)
- `use-tree-dnd-internal.ts` (deferred to C6)
- `use-tree-dnd-html5.ts` (deferred to C6)

At end of C3, `useTodoTreeState` is standalone-usable. Bare `<TodoTree>` doesn't render rows yet (still C1 stub).

### 3. C4 — Row primitives (`parts/`)

7 small presentational components: `todo-tree-chevron`, `todo-tree-status-indicator` (dot/strip/none variants), `todo-tree-checkbox` (with permission gate), `todo-tree-name` (bold), `todo-tree-description` (truncated), `todo-tree-person-label`, `todo-tree-row-content` (the default `renderRow` paint that composes the above).

### 4. C5 — List + virtualization

`parts/todo-tree-list.tsx` + `hooks/use-tree-virtual.ts`. Renders rows from `visibleItems` snapshot. `@tanstack/react-virtual` auto-enables at ≥200 total items. **No DnD yet at this commit** — rows render statically.

### 5. C6 — Dual DnD wiring ⚠️ The architecturally tricky commit

`parts/todo-tree-row.tsx` (full row with BOTH bindings) + `parts/todo-tree-grip.tsx` (hover-revealed grip strip) + `parts/todo-tree-drop-indicator.tsx` (horizontal line OR inner-glow ring) + `parts/todo-tree-drag-overlay.tsx` (cursor-follow). Plus `hooks/use-tree-dnd-internal.ts` (@dnd-kit configuration: MouseSensor distance:5 + TouchSensor delay:300 + KeyboardSensor) + `hooks/use-tree-dnd-html5.ts` (HTML5 dragstart + drop handlers; shared `application/x-ilinxa-todo+json` MIME). Activator mutual exclusion via `isInternalDragRef` flag (per plan §6.5).

**This is the F-cross-13 highest-risk commit** — Select hasn't been touched yet, but if any tooltip is wired into the row, drop `delayDuration`. F-cross-13 pre-emption in `meta.ts` deps as they grow.

### 6. C7 — Toolbar

`parts/todo-tree-toolbar.tsx` + sub-parts (`todo-tree-search-input`, `todo-tree-sort-dropdown`, `todo-tree-filter-dropdown`, `todo-tree-filter-active-toggle`, `todo-tree-bulk-action-bar`). **F-cross-13 pre-emption MANDATORY here** — Sort + Filter dropdowns use Select primitive. Widen `onValueChange` to `(v: string | null) => ...`. Per L11 lock — saves a same-day patch cycle.

### 7. C8 — Keyboard + a11y + empty state

`hooks/use-tree-keyboard.ts` + `parts/todo-tree-keyboard-handler.tsx` + `parts/todo-tree-empty-state.tsx`. Full WAI-ARIA tree pattern per plan §16. Delete/Backspace remove (gated on `canRemoveItem`), Cmd-A select all visible, Shift-click range, Escape clear.

### 8. C9 — `<TodoTreeWithEditor>` wrapper + demo + usage polish

`todo-tree-with-editor.tsx` (the convenience wrapper — Q-P1 lock = auto-persists; tracks tree state, wires onChange from inner TodoRichCard back to setValue). Update `demo.tsx` to remove the scaffold banner and add 6+ sub-demos (flat list, nested, permissions-locked, drag-to-reparent, toolbar in action, multi-select bulk, slot prop, virtualization at scale, cross-procomp drag). Update `usage.tsx` with full 7+ sections.

### 9. C10 — Registry distribution + F-cross-11 smoke

Add `todo-tree` base + `todo-tree-fixtures` sibling items to `registry.json`. Run `pnpm registry:build`. Push. Then run F-cross-11 path-b smoke from `e:/tmp/ilinxa-smoke-consumer/`:

```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/todo-tree @ilinxa/todo-tree-fixtures --yes --overwrite
pnpm tsc --noEmit
```

Expected: 0 todo-tree errors. Pre-existing errors in code-block / flow-canvas-01 / json-form / pdf-viewer carry forward (per the 2026-05-13 STATUS note). **Likely v0.1.1 patch loop** for F-cross-13 hits the toolbar surfaces during the smoke walk.

### 10. C11 — GATE 3 spotcheck + STATUS + decision file

Author `docs/procomps/todo-tree-procomp/reviews/2026-MM-DD-v0.1.0-spotcheck.md` per the [readiness-review rule](../.claude/rules/component-readiness-review.md). Rotating dim = Public API (largest surface in the project). Update STATUS.md (45 → still 45 but todo-tree promotes from scaffold to v0.1.0 shipped). Author decision file in `.claude/decisions/`. Update component-versions.md.

---

## Pre-resume reading list

Before starting C2, re-read these (in order):

1. **[plan §5 — State model](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#5-state-model)** — the reducer's contract; every action's pure transform. This is C2's spec.
2. **[plan §2.2 — Final API](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#22-public-types)** — type catalog. ALL public types are already in `src/registry/components/data/todo-tree/types.ts` (verified at C1 commit).
3. **[plan §3.4 — Visible items pipeline](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#34-visible-items-pipeline)** — what lib/visible-items.ts orchestrates.
4. **[plan §6 — DnD architecture](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#6-dnd-architecture-dual-dnd--q8--a)** — for context only at C2; deeply relevant at C6.
5. **[plan §22 LDs](../docs/procomps/todo-tree-procomp/todo-tree-procomp-plan.md#loud-deviations-from-description-plan-stage-refinements)** — the 2 plan-stage refinements user accepted.

---

## Locked Q-Ps (all 8 resolved at GATE 2 sign-off)

| Q | Lock |
|---|---|
| Q-P1 | TodoTreeWithEditor ships auto-persistence (wires TodoRichCard.onChange → setValue internally) |
| Q-P2 | Fixed row height 52px in v0.1 |
| Q-P3 | Bulk action bar top-right of toolbar (alongside search/sort/filter) |
| Q-P4 | Search debounced TO state (200ms), raw value in local input ref |
| Q-P5 | Pipeline order: filter → sort → flatten |
| Q-P6 | `<DndContext>` mounted internally; `dndContext="external"` opt-out prop (already in TodoTreeProps post-C1) |
| Q-P7 | Full TodoTreeAction union exposed via dispatch escape hatch; sanity checks in reducer |
| Q-P8 | Touch-drag cross-procomp graceful degradation = dev-mode console warning + documented limit (no on-screen hint) |

---

## Description-doc Q's (Q1–Q8 from GATE 1)

| Q | Lock |
|---|---|
| Q1 | Drag handle: grip-on-hover (invisible at rest) |
| Q2 | Description preview: existing `description` field with CSS ellipsis |
| Q3 | Status indicator default: `"dot"` |
| Q4 | Bulk edit popup baked? No — expose `onBulkEdit` only |
| Q5 | Search algorithm: plain case-insensitive `.includes()` |
| Q6 | Filter "hide" mode: ancestor-of-match always renders (VSCode-style) |
| Q7 | Selection across data changes: drop silently |
| Q8 | Touch DnD strategy: option (a) Dual DnD (@dnd-kit internal + HTML5 cross-procomp) |

---

## Memory-driven locks active for next session

- **F-S1** — Cross-procomp imports use **relative paths** in shipped source (`../todo-rich-card/types` from top-level; `../../todo-rich-card/types` from subdirs). NEVER `@ilinxa/` package alias in shipped source. NO cross-procomp re-exports from this folder's `index.ts`. [memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_cross_procomp_imports.md)
- **F-cross-13** — Pre-emption locked at L11. ANY `Select.onValueChange` callback **must** be widened to `(v: string | null) => ...`. NEVER pass `TooltipProvider delayDuration`. Toolbar Sort + Filter dropdowns are the largest surface — most critical at C7. [memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_primitive_radix_baseui_divergence.md)
- **Controlled-mode three defenses** — Microtask-defer consumer notify + structural resync guard + suppress mid-drag onChange. Implementation lands in C3 (`use-controlled-mode.ts`). [memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_controlled_mode_two_defenses.md)
- **shadcn v4 Select w-fit** — `SelectTrigger` ships with `w-fit` baked in. If a Select needs to fill its container, add `className="w-full"`. Hits C7 toolbar Sort + Filter dropdowns. [memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_v4_select_w_fit.md)
- **Popover-from-Dropdown race** — Avoid Popover programmatically opened from DropdownMenu (outside-click race). Use Dialog OR defer Popover open with `queueMicrotask`. Most likely to surface in C7 if filter dropdown is implemented as Popover-with-trigger inside a bulk-action-menu. [memory](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_popover_dropdown_race.md)
- **Verify peer packages exist on npm during plan** — Already done at GATE 2; all 4 peer deps (@dnd-kit/core, @dnd-kit/utilities, @tanstack/react-virtual, lucide-react) verified.
- **Re-validation pass catches real issues** — Continue to apply at each commit's mid-implementation drift point; surfaces 1–3 substantive refinements per stage.

---

## State of the surrounding world

- **Components:** 45 across 8 categories (todo-rich-card v0.1.1 + todo-tree v0.1.0-scaffold added today)
- **Active queue:** 7/8 progress (pdf-viewer + file-tree + file-manager + code-block + json-form + todo-rich-card + **todo-tree-in-flight**); 2 remaining when todo-tree closes (chat-panel + notification-system). rich-graph-2 still on the roadmap (separate from active queue).
- **Open project-wide decisions / TODOs** (unchanged from pre-session): F-cross-13 path (b) primitive refresh, F-S1 watch, flow-canvas-01 v0.2.0 spotcheck follow-ups, pdf-viewer worker default v0.2 candidate, smoke harness baseline at `e:/tmp/ilinxa-smoke-consumer/`. See STATUS.md "Open decisions / TODOs" §.
- **Sibling procomp** to todo-tree: `todo-rich-card-in-flow` (flow-canvas-01 adapter mirroring rcif's shape) still queued for its own ship cycle. Lower priority; no GATE 1 doc yet.

---

## Resume checklist

```
[ ] 1. git status — confirm working tree matches §"Git state" snapshot above (only source-map.generated.ts may differ harmlessly)
[ ] 2. Verify dev server is not running on port 3000 (kill if alive)
[ ] 3. Read [plan §5 — State model] + [plan §2.2 — Final API] before starting C2
[ ] 4. Author lib/ files in C2 order (reducer first, then walker/mutators, then filter/search/sort/flatten/visible-items, then circular-drop/dnd-payload/permissions/edge-zone/shallow/default-status-options)
[ ] 5. After each lib file: pnpm tsc --noEmit should stay clean. validate-meta-deps stays 45/45 (no shadcn/npm imports yet).
[ ] 6. Once all 14 lib/ files are in: commit as C2 with message format from §18 + push
[ ] 7. Continue with C3 hooks, C4 row primitives, ... C11 GATE 3
[ ] 8. Mark this handoff historical when C11 is committed (flip status banner in this file)
```

This handoff replaces the [2026-05-20 todo-rich-card pause](HANDOFF-2026-05-20-todo-rich-card-shipped-pause.md) which closed in this session. On resume, mark this file as historical in STATUS.md after C11 commits.
