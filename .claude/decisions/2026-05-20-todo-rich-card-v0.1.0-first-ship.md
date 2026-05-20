---
date: 2026-05-20
type: feat
commits: [pending-push]
components: [todo-rich-card]
findings: [F-01-v0.2, F-02-doc, F-03-v0.1.1, F-04-post-push, F-05-future]
status: shipped (pending push)
---

# todo-rich-card v0.1.0 — first ship (44th component)

## Summary

`todo-rich-card@v0.1.0` is a new fixed-schema sibling to `rich-card`: a time-aware task renderer carrying the standard task fields (name, description, status, active, target/creator person, multi-image, multi-link, four time fields) painted with urgency via a deterministic time → OKLCH color engine on the card border. Two edit modes ship in v0.1 (popup default + inline-toggle when `editable=true`), with JSON I/O / clipboard / DnD-payload patterns mirroring rich-card v0.3 (`defaultValue` uncontrolled + 12-method imperative handle + `application/x-ilinxa-todo+json` MIME + HTML5 DnD as source and children-group target). Eleven typed granular events cover every mutation; permission resolution mirrors rich-card's matrix (`{default, byLevel, byItem, inherit}` + 6 per-action predicates + `onPermissionDenied`). Infinite recursive children with same action affordances at every depth.

This is the **first of two procomps** in the todo family. Sibling `todo-list` (orchestration shell with `variant="rich" | "tree" | "kanban"`, sort/filter/search, drag-reorder/reparent, multi-select) and companion adapter `todo-rich-card-in-flow` (flow-canvas-01 NodeRenderer mirroring `rich-card-in-flow`'s shape) ship separately in their own v0.1 cycles.

**Three locked architectural calls** flagged at the top of the description doc:

1. **Do NOT extend `rich-card`** — rich-card is arbitrary-JSON outline-editor; todo-rich-card is fixed-schema. Build fresh, mirror patterns (uncontrolled + imperative handle, granular events, permission predicates, JSON I/O). Same family, separate genes.
2. **Kanban-board-01 integration via named `KanbanCardRenderer<TodoItem>` export** (`todoRichCardKanbanRenderer`) with `dragHandle: "header"` — the kanban-board-01 documented pattern for renderers with internal pointer interactions (inline editors, nested DnD). Lives inside this procomp (Q-P6).
3. **Tree variant lives on `todo-list`, NOT on this card.** `todo-rich-card` always carries auto-color; consumers wanting a lightweight no-auto-color row use the (forthcoming) tree variant of `todo-list`.

### Release notes

> **First ship.** `@ilinxa/todo-rich-card@v0.1.0` (alpha) — time-aware task card with OKLCH urgency border-color engine, dual edit modes (popup + inline-toggle), JSON I/O, clipboard, DnD payload, granular events, permission predicates.
>
> **Auto-color engine:** `elapsed = clamp01((now - startAt) / (expireAt - startAt))` (or `/ duration` if no `expireAt`), mapped through an OKLCH ramp — green at 0, red at 1. Past `expireAt` pins full red. Four named presets (`default | muted | vivid | monochrome`) + custom-fn escape hatch. Single root `setInterval` (default 60s; configurable; 0 disables) drives the whole tree.
>
> **Two edit modes in v0.1:** popup dialog by default (all fields in one form, batched on Save); inline-toggle when `editable=true` (fields swap to inputs in place, commit on blur). Secondary "Edit in dialog…" icon appears when `editable=true` (per Q-P3). `locked: true` blocks both with `reason: 'locked'`.
>
> **JSON I/O mirroring rich-card v0.3:** `defaultValue` uncontrolled + 12-method imperative handle (`getValue` / `getTree` / `isDirty` / `markClean` / `focusItem` / `copy` / `paste` / `setBorderColor` / `toggleActive` / `setLocked` / `openEdit` / `closeEdit`). Clipboard via `application/x-ilinxa-todo+json` MIME + `text/plain` fallback + Cmd/Ctrl+C/V on focused card. HTML5 DnD card-as-source (`effectAllowed = 'copy'`; cross-card moves are list-shell concern) + children-group-as-drop-target.
>
> **11 typed granular events** (post-F-cross-12 object-args throughout): `onChange`, `onEditRequest` (veto-capable), `onFieldEdited`, `onStatusChanged`, `onItemAdded`, `onItemRemoved`, `onItemMoved`, `onColorOverridden`, `onActiveToggled`, `onLockedToggled`, `onCopy`, `onPaste`.
>
> **Permission matrix mirroring rich-card:** `permissions?: { default?, byLevel?, byItem?, inherit? }` + 6 per-action predicates (`canEditItem` / `canRemoveItem` / `canAddChildren` / `canDragItem` / `canToggleActive` / `canOverrideColor`) + `onPermissionDenied(action, itemId, reason)` for analytics.
>
> **Infinite recursive children** with identical action affordances at every depth — edit button, drag handle, lock toggle, color override, status badge, person chips all carry through recursion.
>
> **Companion `todoRichCardKanbanRenderer`** named export for kanban-board-01 (Q-P6) with `dragHandle: "header"`.
>
> **Install:** `pnpm dlx shadcn@latest add @ilinxa/todo-rich-card` — pulls 26 source files + 14 shadcn primitives + `lucide-react`. Fixtures: `pnpm dlx shadcn@latest add @ilinxa/todo-rich-card-fixtures`.

## Workflow

GATE 1 → GATE 2 → impl → GATE 3 all in one session, 2026-05-20.

- **GATE 1 (description)** signed off after consolidated-spec review pass surfacing 5 internal inconsistencies (`editButtonVisible` orphan, `inherit?` flag drift, `onPermissionDenied` hedge, "fixed palette" wording, nested children action-affordances clarity); fixed all 5 in place; user signed off.
- **GATE 2 (plan)** signed off after a deep audit pass surfacing 8 substantive findings (missing `onLockedToggled` event + `setLocked` handle method; `statusOptions` orphaned between §6.3/§9.8/Q-P4 and §2; `TodoEditableField` routing unclear; `effectAllowed = 'copyMove'` should be `'copy'`; §9.2 card-header missing Q-P3's "Edit in dialog" icon; missing shadcn `<Select>` `w-fit` risk per project memory; context shape not enumerated; 200-card budget vs rich-card's 500 not justified); fixed all 8 in place; user signed off.
- **Implementation** followed plan §17 step 4 order — types → lib (time → normalize → ramp → color-engine → permissions → json-io → reducer) → hooks/use-card-context → 5 leaf parts → action-menu → card-header → card-body → edit-popup → edit-inline → card (recursive shell) → use-color-engine + use-keyboard → root component → kanban-adapter → dummy-data → demo → usage → meta → index. Two pivots from the plan, both loud:
  1. **SSR strategy:** plan §5.5 / §11 called for `useLayoutEffect`-based first-paint deferral; implementation pivoted to `suppressHydrationWarning` after React Compiler's `react-hooks/incompatible-library` rule flagged the `setState`-in-`useEffect` pattern as cascading-render unsafe. Tracked as F-01.
  2. **`createInitialState`** dropped its unused `_props` parameter to satisfy lint. Tracked as F-02 (doc-only).
- **GATE 3 spotcheck** Pass with follow-ups. Rotating dim Public API (chosen due to largest single-component public surface in the project: ~25 props + 12 imperative methods + 11 typed events + ~25 exported types). 5 findings — only one ⚠️ High (F-04 path-b smoke deferred to post-push); F-01 / F-03 / F-05 are v0.2.0 / v0.1.1 / future bumps; F-02 doc-only.

## Files

### Sealed-folder: `src/registry/components/data/todo-rich-card/`

26 shipped files + 4 docs-site-only (`demo.tsx`, `usage.tsx`, `meta.ts`, registered in manifest):

- `todo-rich-card.tsx` — root; `"use client"`; `forwardRef` + `useReducer` + `useImperativeHandle` + Context.Provider wiring
- `types.ts` — every public + internal type from plan §2 (`TodoItem`, `TodoPerson`, `TodoImage`, `TodoLink`, `TodoColorRamp`, `TodoStatusOption`, `TodoEditableField`, `TodoPermissionRule`, `TodoPermissions`, 11 event types, `TodoRichCardProps`, `TodoRichCardHandle`, + internal `TodoNode`, `EditState`, `Action`, `ResolvedPermissions`, `State`, `TodoCardContextValue`, `TodoEventMap`)
- `index.ts` — barrel; exports component + kanban adapter + all public types + `RAMPS` + `TODO_RAMPS` + `TODO_CLIPBOARD_MIME`
- `lib/time.ts` — `parseIso`, `toIso`, `formatRelative`, `formatAbsolute`, `formatDuration`, `clamp01`, `resolveNowFactory` (pure)
- `lib/normalize.ts` — `normalize(input)` → `{ root, errors, idIndex }`, `denormalize(node)`, `findNode`, `reindex` (pure)
- `lib/ramp.ts` — `RAMPS` record + `interpolateOklch` short-path hue interpolation + `resolveRamp` (pure)
- `lib/color-engine.ts` — `computeElapsed`, `resolveBorderColor` (pure)
- `lib/permissions.ts` — `resolveForNode`, `buildResolver` (pure, depth-first cache pre-walk)
- `lib/json-io.ts` — `serialize`, `validate` (throws `TodoValidationError`), `parse`, `toClipboardItem`, `fromClipboardItems`, `fromDataTransfer`, `copyToClipboard`, `readFromClipboard` (pure + clipboard side-effects)
- `lib/reducer.ts` — `reducer`, `createInitialState`, `lookup` (pure)
- `hooks/use-card-context.ts` — `TodoCardContext` + `useCardContext()` consumer hook
- `hooks/use-color-engine.ts` — single root `setInterval` tick driver
- `hooks/use-keyboard.ts` — root keyboard bindings (Cmd/Ctrl+C/V, Enter/Space, Escape)
- `parts/card.tsx` — recursive card shell; article + chrome + DnD + color-picker popover; children-group recursion
- `parts/card-header.tsx` — name + status + active switch + primary edit + secondary "Edit in dialog" (when `editable=true`) + action menu
- `parts/card-body.tsx` — description + time-info + person chips + link chips + image strip
- `parts/status-badge.tsx` — `<Badge>` with statusOptions-driven variant/label
- `parts/person-chip.tsx` — avatar + name (target / creator variants); initials fallback
- `parts/link-chip.tsx` — `<a>` chip with icon + label + external-link affordance; invalid-URL fallback
- `parts/image-strip.tsx` — horizontal `<ScrollArea>` with thumbs + captions; click opens original in new tab
- `parts/time-info.tsx` — primary "Due in 2 days" / "Duration: 30m" + tooltip with full date breakdown
- `parts/action-menu.tsx` — DropdownMenu trigger; 8 items (Edit / Edit in dialog / Copy / Paste / Toggle active / Lock/Unlock / Override color / Remove)
- `parts/edit-popup.tsx` — `<Dialog>` form with all fields; uncontrolled draft → commits batched on Save (`<Select className="w-full">` per F-cross-13 lock)
- `parts/edit-inline.tsx` — Inline editors for name / description / status; commits on blur or Enter
- `parts/kanban-adapter.tsx` — `todoRichCardKanbanRenderer: KanbanCardRenderer<TodoItem>` with `dragHandle: "header"` (Q-P6)
- `dummy-data.ts` — 4 demo items (fresh / urgent / overdue / nested 3-level) anchored to frozen `DEMO_NOW = 2026-05-20T12:00:00Z`

Docs-site-only:
- `demo.tsx` — interactive playground: editable toggle, ramp picker (4 presets), 4 demos rendered with frozen clock
- `usage.tsx` — 7-section prose docs (when-to-use, basic example, auto-color, edit modes, JSON I/O, SSR, composing, gotchas)
- `meta.ts` — 14 shadcn deps + lucide-react; 16 features bullet-list; tags + related

### Registry distribution

`registry.json` adds two items:
- `todo-rich-card` — base; 26 shipped files; `registryDependencies` 14 shadcn primitives + `lucide-react`
- `todo-rich-card-fixtures` — sibling; just `dummy-data.ts`; depends on `@ilinxa/todo-rich-card`

All file entries follow the locked target convention (`type: "registry:component"`, `target: "components/todo-rich-card/<sub-path>"`).

### Verification

- `pnpm tsc --noEmit` clean (0 errors)
- `pnpm lint` clean (0 errors for todo-rich-card; only 2 unrelated pre-existing warnings in file-tree/file-manager)
- `pnpm validate:meta-deps` 44/44 clean (one cycle: `calendar` was initially over-declared in meta.shadcn → removed pre-PR since I shipped `<Input type="datetime-local">` instead)
- `pnpm build` clean (53 static pages)
- `pnpm registry:build` regen pending (chained via `pnpm vercel-build` on push)
- **F-cross-11 path-b smoke: NOT YET RUN** — requires published Vercel artifact; tracked as F-04 in the spotcheck; first action post-push

## Q-P decisions (from GATE 2 plan)

| # | Question | Decision |
|---|---|---|
| Q-P1 | Single React context vs. pure prop drilling? | **Single context** (`TodoCardContext`). 8+ values need to flow to every card (now, ramp, dispatch, editState, focusedId, dirty, resolvePermissions, statusOptions, editable, showEditButton, fireEvent, reportPermissionDenied); drilling them per recursion level is noise. Memoized provider. |
| Q-P2 | Add `lib/` directory? | **Yes** — same precedent as rich-card and workspace plans; pure non-React algorithms (color engine, permissions, json-io, normalize) testable in isolation when Vitest lands. |
| Q-P3 | Secondary popup access when `editable=true`? | **Small inline `<Dialog>` icon next to the toggle.** Discoverable + consistent across input methods. Long-press unergonomic; right-click conflicts with context menu. |
| Q-P4 | Add `statusOptions` to public props? | **Yes** — without it, status edit is a free `<Input>` (no validation, no constraint, no visual variants). With it: `<Select>` in edit modes + colored badges in view. Additive, non-breaking. |
| Q-P5 | Test-runner stance? | **Ship with test-debt note** — same as rich-card / workspace. Color engine + ramp + permissions + normalize are property-test-ready when Vitest lands. |
| Q-P6 | Kanban adapter location? | **In this procomp** (`parts/kanban-adapter.tsx` + exported from `index.ts`). Consumers using kanban-board-01 directly get a one-stop install. |
| Q-P7 | SSR first paint? | **Plan called for `useLayoutEffect`-based deferral; implementation pivoted to `suppressHydrationWarning`** after React Compiler ESLint flagged the `setState`-in-`useEffect` pattern. Documented in guide.md ("SSR + the `now` prop") so consumers know to pass frozen `now` for clean SSR. Tracked as F-01 in spotcheck for v0.2 revisit via `useSyncExternalStore`. |

## Post-sign-off fast-follows (in the same session, before push)

Two additions landed after GATE 3 spotcheck while the user was test-driving the demo:

1. **Color-override `<Popover>` → `<Dialog>`** — the popover was opening then immediately closing because the action-menu's lingering click bubbled and triggered the popover's outside-click handler. Pivoted to a centered modal Dialog (no outside-click race). The footer also got a more prominent **Auto** button (Sparkles icon, secondary variant) that clears the override. `popover` was dropped from `meta.shadcn` and `registry.json` (no other file imports it).
2. **Per-card collapsibility** — chevron at the left of every card header toggles a UI-only `collapsedIds: ReadonlySet<string>` slice on the reducer state. Collapsed cards hide their body (description, time-info, chips, links, images) AND their nested children — only the header remains visible. Per-item, independent at every depth. Not stored in `TodoItem` (JSON round-trip ignores it). Default expanded.

Both deviations are folded into spotcheck F-02 (which now covers four total post-sign-off deviations across two lint-driven, one race-condition, and one scope-expansion). guide.md + usage.tsx + meta.ts all updated in the same session to match current behavior. Description.md + plan.md stay frozen (signed-off historical); deviations fold into the next gate-doc bump alongside F-01's SSR strategy switch.

## Lessons learned

1. **`react-hooks/incompatible-library` ESLint rule blocks the `useState + useEffect`-driven "mounted" pattern for first-paint deferral.** React Compiler treats this as cascading-render unsafe. The cleaner long-term pattern for SSR-divergent client-only computed values is `useSyncExternalStore` with a `null`-returning server snapshot. v0.2 candidate (F-01).
2. **Popover-with-sr-only-trigger races with DropdownMenu dismissal.** When the dropdown's menu-item click dispatches `setColorPickerOpen(true)`, the dropdown closes in the same tick, the lingering click event bubbles to document level, and the popover's freshly-mounted outside-click handler treats it as an outside-click → immediate dismissal. The shadcn Dialog primitive doesn't have this race because its modal overlay catches all clicks. **Rule for future procomps:** any "programmatically-opened-from-dropdown" overlay should be Dialog, not Popover, unless there's a strong reason for non-modal behavior.
3. **Plan refinements need to land in §2 immediately when introduced.** GATE 2 audit caught `statusOptions` introduced in §6.3 / §9.8 / Q-P4 but never added to the props block. Author-time discipline: when adding a prop downstream, immediately patch §2's type block; don't trust "I'll catch it later."
4. **`effectAllowed` for DnD should match the actual semantics, not the universe of possible semantics.** `'copyMove'` is misleading when the card never performs moves (only copies); the visual cursor feedback during drag confused the protocol. Specific value > superset value.
5. **`<Select>` `w-fit` lock from project memory is now a baked-in plan-level risk.** F-cross-13 covers Radix → Base UI divergence; the `w-fit` quirk is a separate concrete instance that needed an explicit override at every `<SelectTrigger>` instance in edit-popup + edit-inline. Future plans involving `<Select>` should auto-include the `className="w-full"` lock.
6. **Two procomps shipped via one description / plan, in order** is a workable pattern. We deferred `todo-list` and `todo-rich-card-in-flow` to their own ships rather than bundling, which kept the v0.1 scope honest. Each will get its own GATE 1+2+3 cycle.

## Cross-references

- Description: [`docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-description.md`](../../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-description.md)
- Plan: [`docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-plan.md`](../../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-plan.md)
- Guide: [`docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-guide.md`](../../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-guide.md)
- Spotcheck: [`docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md`](../../docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md)
- Sibling procomps queued: `todo-list` (orchestration shell — rich/tree/kanban variants), `todo-rich-card-in-flow` (flow-canvas-01 adapter)
- Architectural sibling: [`rich-card`](2026-04-28-rich-card-v0.1.0-first-ship.md) (the pattern we mirror without code-sharing)
