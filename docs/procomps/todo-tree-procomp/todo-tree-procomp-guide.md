# `todo-tree` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** Authored alongside v0.1.0 / v0.1.1 / v0.1.2 implementation
> **Slug:** `todo-tree` · **Category:** `data`
> **Version:** 0.1.2 (alpha) · **Shipped:** 2026-05-21
> Consumer-facing usage notes. The description doc explains "why," the plan doc explains "how"; this doc explains "use it."

---

## When to use

Reach for `todo-tree` when you need a **lightweight hierarchical task outline** — a thin two-line row per item with multi-select, sort/filter/search, and drag-and-drop, sitting in a side panel or split view rather than commanding the full canvas.

Good fits:
- **Sub-issue / sub-task lists** alongside a primary detail view
- **Hierarchical task pickers** (assign work to a node in a tree)
- **Bulk-management screens** (select N tasks → toggle active / remove / re-assign)
- **Outline navigators** for editorial or backlog content with parent/child relationships
- **Split-view companions** to `todo-rich-card` — click a row in the tree → open the card in a dialog or right pane (use `<TodoTreeWithEditor>` for the batteries-included wiring)

## When NOT to use

- **You want the full time-aware card chrome (border ramp, time-info, person chips, color override)** → use `todo-rich-card` directly. todo-tree intentionally renders a thin row.
- **You need a calendar grid / gantt timeline** → use a calendar/gantt primitive.
- **Your items aren't hierarchical** → use a flat table (`data-table`) or a kanban (`kanban-board-01`). The whole point of this component is the tree.
- **You need recurring tasks** → no RRULE engine. Generate fresh `TodoItem`s on the consumer side.

---

## Basic install

```bash
pnpm dlx shadcn@latest add @ilinxa/todo-tree
```

This pulls the sealed-folder source files PLUS the `todo-rich-card` peer (todo-tree shares the `TodoItem` schema with it; the `<TodoTreeWithEditor>` convenience wrapper also imports `<TodoRichCard>` for the edit dialog).

Then in your code:

```tsx
import { TodoTree } from "@/components/todo-tree";

export function Example() {
  return (
    <TodoTree
      defaultValue={[
        {
          id: "task-001",
          name: "Auth middleware rewrite",
          description: "Flagged by legal for token storage non-compliance.",
          status: "in-progress",
          active: true,
          children: [
            { id: "task-001-a", name: "Audit session token paths", status: "done", active: true },
            { id: "task-001-b", name: "Draft new token storage scheme", status: "todo", active: true },
          ],
        },
        { id: "task-002", name: "Q3 OKR review prep", status: "todo", active: true },
      ]}
    />
  );
}
```

For the four-item demo fixtures:
```bash
pnpm dlx shadcn@latest add @ilinxa/todo-tree-fixtures
```

---

## The row layout

Each row is **two lines**:

```
[chevron] [status●] [☐] [Bold name]            [@person ▾]
                    [thin truncated description if present]
```

- **Chevron** (left, 16px slot) — toggles collapse for that row's subtree. Always rendered; renders as an empty 16px gap when the row has no children, so all rows align vertically. UI-only state (`collapsedIds`), not stored in `TodoItem`. Default expanded.
- **Status indicator** — a small dot whose color comes from `statusOptions[i].variant` (or `secondary` for unknown status strings). Pure visual; no badge text on the row.
- **Checkbox** — toggles `active`. Indeterminate on partial selection in multi-select mode is rendered, but a click always commits to `true` (F-cross-13 defensive coerce in [`parts/todo-tree-checkbox.tsx`](../../src/registry/components/data/todo-tree/parts/todo-tree-checkbox.tsx)).
- **Name** — `font-medium`. Single-line, ellipsis on overflow.
- **Person label** — right side of the top line. Renders `assignee.name` (or initials/avatar slot, see slot props below).
- **Description** — second line. `text-xs text-muted-foreground`. Single-line, ellipsis on overflow. Omitted entirely when empty.

Rows are recursive; children render with `paddingLeft: depth * 20px`.

---

## Click → consumer popup

The tree is intentionally **read-only on click** — clicking a row fires `onItemClick(args)`, and the consumer decides what edit surface to open. This keeps todo-tree's surface lightweight; the edit dialog can be a `<TodoRichCard>` (the canonical pairing), a right-pane detail view, or a custom modal.

For the canonical wiring use the included wrapper:

```tsx
import { TodoTreeWithEditor } from "@/components/todo-tree";

<TodoTreeWithEditor defaultValue={items} />
```

`<TodoTreeWithEditor>` mounts a centered `<Dialog>` containing `<TodoRichCard editable>` on every row click; saves flow back into the tree via the imperative handle (state-transparent — controlled mode stays authoritative, uncontrolled mode keeps the tree's internal state). Consumers who want a stricter integration (confirm before edit, custom editor surface) should compose `<TodoTree>` + their own dialog using `onItemClick`.

```tsx
<TodoTree
  defaultValue={items}
  onItemClick={({ item }) => router.push(`/tasks/${item.id}`)}
/>
```

---

## Adding new items — toolbar `"+ New"` button

(New in v0.1.2.) The default toolbar gains a primary **"+ New"** button when the tree is told it has an editing affordance. The button is hidden by default to avoid surfacing an add-affordance the consumer can't follow through on (the prior "Untitled" stub problem).

### Gating

```
canAdd = editable && !readOnly && factory != null
```

- `editable` (default `false`) — signals that the tree has an edit panel / inline editor / etc.
- `readOnly` (default `false`) — when true, hides Add + bulk Delete entirely.
- `factory` — resolved from explicit `createItem` prop, else a built-in fallback using `statusOptions[0]`. If neither yields a factory, the button is hidden.

`<TodoTreeWithEditor>` passes `editable={true}` automatically. For a bare `<TodoTree>` with your own editor, pass `editable` yourself.

### Two flows: immediate-add vs. deferred-commit

**Immediate-add** (no `onCreateRequest`): click → factory runs → row is added at root → focus moves to it. Your editor wires whatever happens next (open on focus, click, etc.).

**Deferred-commit** (`onCreateRequest` provided): click → factory runs → `onCreateRequest(item)` fires → toolbar does NOT mutate the tree. The consumer is now responsible for committing via `handle.addItem(...)` when ready. This is how `<TodoTreeWithEditor>` opens the edit dialog on a pending item and only commits on Submit.

### Custom factory

```tsx
<TodoTree
  editable
  statusOptions={STATUS_OPTIONS}
  createItem={() => ({
    id: crypto.randomUUID(),
    name: "",                        // empty for inline rename
    status: "todo",
    active: true,
    setAt: new Date().toISOString(),
    creatorPerson: currentUser,      // pre-fill from auth context
  })}
/>
```

### Deferred-commit flow (the `<TodoTreeWithEditor>` pattern)

When you want the user to fill in values BEFORE the row appears in the tree:

```tsx
const ref = useRef<TodoTreeHandle>(null);
const [pending, setPending] = useState<TodoItem | null>(null);

<>
  <TodoTree
    ref={ref}
    editable
    statusOptions={STATUS_OPTIONS}
    onCreateRequest={(draft) => setPending(draft)}
  />
  <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
    <DialogContent>
      {pending && (
        <>
          <MyEditor
            value={pending}
            onChange={setPending}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={() => {
              ref.current?.addItem(pending);
              ref.current?.focusItem(pending.id);
              setPending(null);
            }}>
              Add task
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
</>
```

The wrapper does exactly this — see [`todo-tree-with-editor.tsx`](../../src/registry/components/data/todo-tree/todo-tree-with-editor.tsx).

### Going further (add-as-child, split button, etc.)

Replace the toolbar via `renderToolbar` and call `handle.addItem` / `handle.addChild` from your own button:

```tsx
<TodoTree
  state={state}
  renderToolbar={({ defaultToolbar, state }) => (
    <div className="flex items-center gap-2">
      {defaultToolbar}
      <DropdownMenu>
        <DropdownMenuItem onClick={() => state.addItem(factory(), { parentId: null })}>
          Add at root
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!state.focusedItemId}
          onClick={() =>
            state.addChild(state.focusedItemId!, factory())
          }
        >
          Add as child of focused
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  )}
/>
```

---

## Multi-select + bulk ops

| Gesture | Action |
|---|---|
| Click row | Single select |
| Shift-click row | Range select from anchor |
| Cmd/Ctrl-click row | Toggle row in selection |
| Cmd/Ctrl-A | Select all visible items |
| Escape | Clear selection |

When 2+ rows are selected, the **bulk action bar** appears at the top of the list with three default actions:

- **Toggle active** — flips `active` on every selected item (consumer can wire via `onBulkToggleActive`)
- **Remove** — fires `onBulkRemove` with the selected ids
- **Edit** — fires `onBulkEdit` with the selected items (consumer-defined dialog)

Each bulk action is permission-gated via the matrix (`canRemoveItem`, `canToggleActive`). As of v0.1.2, keyboard Space (toggle active) and Delete/Backspace (remove) shortcuts also consult the matrix + `item.locked` + `readOnly` and fire `onPermissionDenied` on denial (F-perm closed). The bulk Delete toolbar button is additionally gated on `editable` — see [§ Adding new items](#adding-new-items--toolbar--new--button).

The bar is invoked via slot if you want full custom rendering:

```tsx
<TodoTree
  defaultValue={items}
  renderToolbar={({ selectedCount, handle }) =>
    selectedCount > 0 ? (
      <MyBulkBar count={selectedCount} onArchive={() => handle.bulkRemove(handle.getSelection())} />
    ) : null
  }
/>
```

---

## Default toolbar (search · sort · filter)

The built-in toolbar above the list provides:

- **Search input** (200ms debounced). Matches against `name` + `description` substrings. Matched ancestors render even when they don't match (VSCode-style — when filter mode is `"hide"`).
- **Sort dropdown** — 5 kinds: `name` / `setAt` / `expireAt` / `status` / custom (pass `sortComparator` prop).
- **Filter active toggle** — show only active / inactive / both.
- **Filter dropdown** — by status (multi-select chips) / person / active.

Each section is renderable via slot (`renderToolbar`) for full custom replacement, or via slot props on individual filter sub-parts.

**Filter mode** (`filterMode` prop):
- `"fade"` (default) — non-matches dim to `opacity: 0.4`. Hierarchy stays visually intact.
- `"hide"` — non-matches omitted from the rendered list, but **ancestors of matches always render** (VSCode-style outline filter — the path to a match stays visible).

---

## Dual DnD (drag-and-drop)

Two transports, picked per interaction:

| Source | Transport | When it fires |
|---|---|---|
| Grip handle (left of row) → row on the same tree | `@dnd-kit/core` (Mouse 5px / Touch 300ms long-press / Keyboard sensors) | Internal moves |
| Grip handle → another `todo-tree` / `todo-rich-card` instance on the same page | Native HTML5 `dataTransfer` with `application/x-ilinxa-todo+json` MIME | Cross-procomp drops |

The MIME payload is shared with `todo-rich-card`, so consumers can drag rows from a tree onto a card's children area (and back via the card's HTML5 drop target). Touch DnD is **internal-only** by design — the native HTML5 transport doesn't fire reliably on touch.

**Edge zones during internal drag:**

```
┌────────────────────────────────────────┐
│ top 25% (cap 8px)  → drop as sibling   │
├────────────────────────────────────────┤
│ middle 50%         → drop into children │
│                       (reparent + auto- │
│                        expand target)   │
├────────────────────────────────────────┤
│ bottom 25% (cap 8px) → drop as sibling  │
└────────────────────────────────────────┘
```

**Circular-drop ban:** the hit-test refuses any drop that would land a node inside its own subtree. `onPermissionDenied` fires with `reason: 'circular-drop'`.

**Virtualization auto-suspends during drag** — for trees ≥200 items, the virtualizer steps aside while dragging so the user can see all rows scroll past. Resumes after drop.

**External (HTML5) drops** always land as **last child** of the row under the pointer (no edge-zone for HTML5; only `@dnd-kit` gets top/middle/bottom). External payloads not matching the shared MIME are rejected gracefully (no-op).

---

## Permissions

Mirrors `todo-rich-card`'s shape. Two layers:

**Declarative matrix:**

```tsx
<TodoTree
  permissions={{
    default: { edit: true, remove: false, drag: true, addChildren: true, toggleActive: true },
    byLevel: { 1: { remove: true } },              // root level can remove
    byItem: { "task-001": { drag: false } },       // pin one item
    inherit: true,                                  // cascade through descendants
  }}
/>
```

**Per-action predicates (override the matrix per call):**

```tsx
<TodoTree
  canEditItem={(id) => userIs("admin") || id.startsWith("draft-")}
  canRemoveItem={(id) => !id.startsWith("locked-")}
  canDragItem={() => isDesktop}
  canDropAsSibling={(id, targetId) => /* … */}
  canDropIntoChildren={(id, targetId) => /* … */}
  canToggleActive={() => true}
  onPermissionDenied={({ action, itemId, reason }) => {
    analytics.track("todo_permission_denied", { action, itemId, reason });
  }}
/>
```

The permission `action` codes for tree-only events map to rule keys as follows: `dropAsSibling` → `drag` rule key, `dropIntoChildren` → `addChildren` rule key.

> **✅ v0.1.2 closed F-perm.** Keyboard Space (toggleActive) and Delete/Backspace (remove) now consult the declarative `permissions` matrix + `item.locked` + `readOnly` and fire `onPermissionDenied` on denial with one of `denied-by-rule` / `denied-by-lock` / `denied-by-readOnly`. The DnD path continues to consult its own `canDropAsSibling` / `canDropIntoChildren` predicates as before.
>
> **Imperative handle methods do NOT gate.** `handle.removeItem(id)` / `handle.toggleActive(id, next)` mutate regardless of permissions, by design. The handle is the raw mutation surface for advanced consumers (controlled-mode orchestrators, server-side reconcilers) who enforce their own policy. UI affordances (keyboard, toolbar, DnD) ARE the gates.

---

## Imperative handle (26 methods)

`<TodoTree>` forwards a `ref` of type `TodoTreeHandle`. Selected highlights:

```tsx
const ref = useRef<TodoTreeHandle>(null);

// Read state
ref.current!.getValue();          // ReadonlyArray<TodoItem>
ref.current!.getItem("task-001"); // TodoItem | undefined
ref.current!.getSelection();      // ReadonlyArray<string>
ref.current!.getVisible();        // ReadonlyArray<TodoTreeVisibleRow>

// Write
ref.current!.setValue(nextItems);
ref.current!.addItem(parentId, item);
ref.current!.removeItem(itemId);
ref.current!.updateItem(itemId, (item) => ({ ...item, name: "New name" }));
ref.current!.toggleActive(itemId);
ref.current!.bulkToggleActive(ids, true);
ref.current!.bulkRemove(ids);

// Selection
ref.current!.selectItem(itemId);
ref.current!.selectItems(ids);
ref.current!.deselectItem(itemId);
ref.current!.clearSelection();
ref.current!.selectAll();

// Focus + collapse
ref.current!.focusItem(itemId);
ref.current!.setCollapsed(itemId, true);
ref.current!.expandAll();
ref.current!.collapseAll();

// Query / sort / filter (mirrors toolbar state)
ref.current!.setSort({ key: "name", direction: "asc" });
ref.current!.setFilter({ active: true });
ref.current!.setSearch("review");
```

For headless consumers, prefer the `useTodoTreeState` hook — same surface plus live state values and a `dispatch` escape hatch.

---

## Headless hook — `useTodoTreeState`

```tsx
import { useTodoTreeState } from "@/components/todo-tree";

function Custom() {
  const state = useTodoTreeState({ defaultValue: items });

  return (
    <div>
      <input
        type="search"
        onChange={(e) => state.setSearch(e.target.value)}
        placeholder="Search"
      />
      <MyCustomList rows={state.getVisible()} onRowClick={state.handleRowClick} />
      <pre>{JSON.stringify(state.selection, null, 2)}</pre>
    </div>
  );
}
```

The hook returns a superset of `TodoTreeHandle` plus live state values (`items` / `selection` / `focusedItemId` / `collapsedIds` / `sort` / `filter` / `search`) and a `dispatch` escape hatch (raw reducer access; use sparingly — the action types are public but the reducer's invariants are easier to break than the wrapped methods).

---

## Slot props (8)

Slot wins over the matching prop variant. Pass `undefined` to fall back to the default render.

| Slot | Args | Notes |
|---|---|---|
| `renderRow` | `TodoTreeRowRenderArgs` | Replace the whole row content (grip + chevron + checkbox + name + description + person). Most consumers should reach for the field-level slots below instead. |
| `renderName` | `TodoTreeFieldRenderArgs` | Replace just the bold name slot. |
| `renderDescription` | `TodoTreeFieldRenderArgs` | Replace just the second-line description. |
| `renderPerson` | `TodoTreeFieldRenderArgs` | Replace the right-side person label (good fit for avatars). |
| `renderStatusIndicator` | `TodoTreeStatusRenderArgs` | Replace the status dot (e.g. icon, colored ring). |
| `renderToolbar` | `TodoTreeToolbarRenderArgs` | Replace the top toolbar (search + sort + filter + bulk-action bar). Get `{ handle, selectedCount, items, … }`. |
| `renderEmptyState` | `TodoTreeEmptyRenderArgs` | Replace the empty-state when the visible-items pipeline returns 0 rows. |
| `renderDragOverlay` | `TodoTreeDragOverlayArgs` | Replace the floating overlay shown during `@dnd-kit` drag. Defaults to a thin row preview. |

---

## Virtualization

Auto-enables at **≥200 total items** (sum of all items across all depths, not just visible). Uses `@tanstack/react-virtual` with a fixed row height estimate (44px). Auto-suspends during drag (per R7 in the plan) so the user can see the full list scroll past.

To override:

```tsx
<TodoTree
  defaultValue={items}
  virtualization={{ mode: "always", rowHeight: 56 }}   // force-on
  // or { mode: "never" }                              // force-off
/>
```

When the list is mounted inside a scrollable wrapper, the virtualizer uses the closest scroll container — make sure that container has a fixed height. If the surrounding flex/grid causes `height: auto`, virtualization will silently degrade to "no rows visible." Wrap the tree in a `min-h-[400px]` or explicit-height container in those layouts.

---

## Keyboard nav + a11y

Full WAI-ARIA tree pattern:

- `role="tree"` on the container · `role="treeitem"` on every row
- `aria-level` (1-indexed depth) · `aria-expanded` (when collapsible) · `aria-selected` (multi-select)
- `aria-multiselectable="true"` on the container
- Single `tabindex="0"` on the focused row; all others `tabindex="-1"`

| Key | Action |
|---|---|
| `ArrowDown` / `ArrowUp` | Move focus to next/prev visible row |
| `ArrowRight` | If collapsed → expand; if expanded → focus first child |
| `ArrowLeft` | If expanded → collapse; if collapsed → focus parent |
| `Home` / `End` | Focus first / last visible row |
| `Space` | Toggle `active` on focused row (consults permissions; v0.1.2+) |
| `Enter` | Fire `onItemClick` for focused row (opens consumer popup) |
| `Delete` / `Backspace` | Fire `onItemRemoved` for focused row (consults permissions; v0.1.2+) |
| `Cmd/Ctrl + A` | Select all visible rows |
| `Escape` | Clear selection / focus |

Keyboard handlers bail out when focus is inside an interactive child (input, textarea, contenteditable, button) so consumers can render inline editors in slots without conflicting shortcuts.

---

## Controlled vs uncontrolled

Uncontrolled (default):

```tsx
<TodoTree defaultValue={items} onChange={(e) => console.log(e.items)} />
```

Controlled:

```tsx
const [items, setItems] = useState(initialItems);

<TodoTree
  value={items}
  onChange={(e) => setItems(e.items)}
/>
```

**Three-defenses controlled-mode pattern** is fully wired in [`hooks/use-controlled-mode.ts`](../../src/registry/components/data/todo-tree/hooks/use-controlled-mode.ts):

1. **Microtask-deferred consumer notify** — `onChange` invocations are queued via `queueMicrotask` so they fire post-commit, never mid-render.
2. **Structural resync guard** — round-trip echoes (consumer sets the same value back) are detected via structural equality (id / name / status / active / children) and skipped, so xyflow-style internal-state thrash doesn't happen.
3. **Suppress mid-flow notify + drop pre-flow microtasks** — during `@dnd-kit` drag, `isDraggingRef` is checked at microtask fire time and queued notifies bail; the single authoritative `dragend` snapshot is the only thing that propagates.

This is the same pattern locked in `flow-canvas-01` v0.2.2 + v0.2.3 + v0.2.4. See [`project_controlled_mode_two_defenses.md`](../../.claude/projects/.../memory/project_controlled_mode_two_defenses.md) (memory entry) for the rationale.

**External value-only mutations to fields outside the structural set** (e.g. consumer modifies `assignee.name` only) are silently dropped as echoes per the plan §11 tradeoff — `treesMatchStructurally` only compares (`id`, `name`, `status`, `active`, `children`). If you need to mutate the assignee from outside, either remount via `key` or include a structural field change as well.

---

## Events (16 typed callbacks)

All callbacks use object-args convention (post-F-cross-12):

| Event | Args shape | When |
|---|---|---|
| `onChange` | `{ items, reason }` | Any tree mutation. `reason` is one of: `'set-items' \| 'add' \| 'remove' \| 'update' \| 'toggle-active' \| 'bulk-toggle-active' \| 'bulk-remove' \| 'move' \| 'drop-as-sibling' \| 'drop-into-children' \| 'external-drop'` |
| `onItemClick` | `{ item, event }` | Row click. `event` is `MouseEvent \| KeyboardEvent` (Enter fires this too). |
| `onItemFocus` | `{ item }` | Keyboard focus moved to a row. |
| `onItemSelect` / `onItemDeselect` | `{ item }` | Multi-select change. |
| `onSelectionChange` | `{ ids, items }` | Any selection change (single or multi). |
| `onItemAdded` / `onItemRemoved` / `onItemMoved` | `{ item, parentId?, index? }` | Per-action structural events. |
| `onBulkToggleActive` / `onBulkRemove` / `onBulkEdit` | `{ ids, items }` | Bulk bar actions. |
| `onDropFromExternal` | `{ payload, targetId, items }` | HTML5 drop from another procomp. |
| `onPermissionDenied` | `{ action, itemId, reason }` | Any predicate denial. `reason` is `'permission' \| 'locked' \| 'circular-drop' \| 'invalid-target'`. |
| `onExpandChange` | `{ itemId, expanded }` | Per-row chevron toggle. |

---

## Cross-procomp shape — sharing `TodoItem` with `todo-rich-card`

Both procomps import `TodoItem` from a single source: `todo-rich-card/types`. todo-tree's shipped source uses **relative imports** to that file (`../todo-rich-card/types`) per the F-S1 cross-procomp lock — same-category sibling procomp imports must be relative because shadcn 4.6.0's path rewriter substitutes the current slug for the target slug otherwise.

For consumers, this means once you've installed `@ilinxa/todo-rich-card` (auto-pulled when you install `@ilinxa/todo-tree`), you can import `TodoItem` from either:

```tsx
import type { TodoItem } from "@/components/todo-rich-card";
// or, equivalently, since todo-tree re-exports for convenience:
import type { TodoItem } from "@/components/todo-tree";
```

Both resolve to the same type.

---

## Gotchas

- **Permissions are fully wired through the UI surface as of v0.1.2.** DnD predicates, bulk action bar, and keyboard Space/Delete shortcuts all consult the declarative `permissions` matrix + `item.locked` + `readOnly`, and fire `onPermissionDenied` on denial. **Imperative handle methods do NOT gate** — `handle.removeItem(id)` / `handle.toggleActive(id, next)` will mutate regardless of permissions, by design. The handle is the raw mutation surface; consumers driving the tree imperatively are expected to enforce their own policy. UI affordances (keyboard, toolbar, DnD) ARE the gates.
- **External (HTML5) drops always land as last child.** No edge-zone for the HTML5 transport; only `@dnd-kit` gets top/middle/bottom. If you need sibling drops from another procomp, use the `@dnd-kit` transport (same page, both endpoints).
- **Virtualization auto-disables under <200 items.** That's intentional — short trees don't pay for it. If you want a fixed mode, pass `virtualization={{ mode: "always" | "never" }}`.
- **Echo guard is structural** — only (`id`, `name`, `status`, `active`, `children`) compared. Mutations to other fields from outside the tree fall through as echoes. Remount via `key` or include a structural field change to force a resync.
- **Grip is `absolute -left-4`** (cosmetic — F-grip-clip). Narrow containers may clip the grip; pad the container or render the tree inside a wrapper with `pl-4`.
- **TodoTreeStateValue identity changes per render.** The `useTodoTreeState` hook returns a fresh object every render — don't destructure into a dep array. The inner imperative methods are stable; if you need a stable selector, useMemo it yourself.
- **Inline editing is not in v0.1.** The tree is read-only on click; consumer-owned dialogs (or `<TodoTreeWithEditor>`) provide the edit surface. Inline rename / status pickers may land in v0.2 if consumers ask.
- **`<TodoTreeWithEditor>` is state-transparent.** It owns only the dialog open/close — your `value` / `defaultValue` / `onChange` flow through unchanged. Saves inside the dialog route through the tree's imperative handle so controlled-mode consumers see them through their normal `onChange`.

---

## Migration notes

This is a new component — no migration path. If you're coming from a custom tree built on `<details>`/`<summary>` or `react-arborist`, map your data to `TodoItem` at the boundary and use `defaultValue` to seed.

---

## Open follow-ups

- ~~**v0.1.2 (patch)** — Thread `permissions` matrix end-to-end through `useTodoTreeState` + `useTreeKeyboard` so Space/Delete shortcuts honor predicates (F-perm).~~ ✅ Closed in v0.1.2.
- ~~**v0.1.x cosmetic** — Move the grip from `absolute -left-4` to an in-flow column so it never clips against narrow containers (F-grip-clip).~~ ✅ Closed in v0.1.2.
- **v0.2** — Inline-rename mode (Enter-to-rename, Esc-to-cancel); sibling-drop edge zone for HTML5 transport; per-row collapse animations (gated on framer-motion adoption); slot props for the bulk-action-bar individual buttons.
- **v0.3** — Server-rendered initial state with deferred hydration (currently full client-side); per-tree theming via `--todo-tree-*` CSS variables.
- **Test runner** — Vitest landing is project-wide. Pure `lib/` modules (`visible-items`, `flatten-tree`, `tree-walker`, `tree-mutators`, `circular-drop`, `edge-zone`) are the highest-priority test targets — they're all pure functions with no DOM dependencies.
