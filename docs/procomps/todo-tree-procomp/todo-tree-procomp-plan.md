# `todo-tree` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** ⬜ Draft — awaiting GATE 2 sign-off
> **Inherits from:** [description doc](todo-tree-procomp-description.md) (GATE 1 closed 2026-05-20)
> **Sibling-of:** [`todo-rich-card@v0.1.1`](../todo-rich-card-procomp/) — shared `TodoItem` schema; cross-procomp DnD via `application/x-ilinxa-todo+json`.

The description's job was *what & why*. This doc's job is *how*: every file, every type, every reducer action, every activation rule, every smoke-walk pre-emption. No new scope; surface every concrete decision so implementation can be ~mechanical.

---

## 1. Inherited inputs (one paragraph)

Description doc carries 24 locks (L1–L24) and 8 Qs all resolved (Q1–Q7 = author's defaults; Q8 = option (a) Dual DnD). This plan refines but does not re-open them. The single feature-complete v0.1 ship covers: two-line row, recursive collapsibility, multi-select + bulk ops, sort/filter/search default toolbar, dual DnD (@dnd-kit internal + HTML5 cross-procomp), 26-method imperative handle, 17-event surface, 8 slot props, virtualization at ≥200 rows, three-defenses controlled-mode pattern, full WAI-ARIA tree keyboard. Out of scope (design exclusions, not deferrals): auto-color engine, image/link rendering, undo/redo, direct edit-in-row.

---

## 2. Final API (locked)

This is the source-of-truth for shapes. Implementation files must match.

### 2.1 Imports / cross-procomp dep

```ts
// Top-level files (todo-tree.tsx, index.ts, types.ts):
import type {
  TodoItem,
  TodoStatusOption,
  TodoPermissions,
} from "../todo-rich-card/types";

// Subdir files (parts/*.tsx, hooks/*.ts, lib/*.ts):
import type {
  TodoItem,
  TodoStatusOption,
  TodoPermissions,
} from "../../todo-rich-card/types";
```

NEVER `@ilinxa/todo-rich-card` in shipped source (F-S1 lock).

### 2.2 Public types

```ts
import type { ReactNode, MouseEvent } from "react";
import type { TodoItem, TodoStatusOption, TodoPermissions } from "../todo-rich-card/types";

// Tree location pointer (used by onItemMoved.from / .to)
export interface TreeLocation {
  parentId: string | null;        // null = top-level
  index: number;                  // position in parent.children[] or top-level items[]
}

// Mutation reason tag (10 codes; one per public mutation pathway)
export type TodoTreeChangeReason =
  | "reorder"               // internal drag, same parent
  | "reparent"              // internal drag, different parent
  | "toggle-active"         // checkbox or imperative single toggle
  | "imperative-set"        // setValue()
  | "drop-from-external"    // HTML5 drop with cross-procomp payload
  | "add-item"              // imperative addItem()
  | "remove-item"           // imperative removeItem() OR keyboard Delete
  | "add-child"             // imperative addChild()
  | "bulk-toggle-active"    // toolbar / imperative bulk
  | "bulk-remove";          // toolbar / imperative bulk

// Sort spec
export type TodoTreeSort =
  | { kind: "name" | "setAt" | "expireAt" | "status"; direction: "asc" | "desc" }
  | { kind: "custom"; compare: (a: TodoItem, b: TodoItem) => number };

// Filter spec
export interface TodoTreeFilter {
  statuses?: ReadonlyArray<string>;
  personIds?: ReadonlyArray<string>;
  active?: "all" | "active" | "inactive";
}

// Permission action codes (tree-specific; distinct from todo-rich-card's set)
export type TodoTreePermissionAction =
  | "edit"
  | "toggleActive"
  | "drag"
  | "dropAsSibling"
  | "dropIntoChildren"
  | "remove";

// Denial reasons
export type TodoTreePermissionDenialReason =
  | "denied-by-rule"        // a predicate returned false
  | "denied-by-readOnly"    // top-level readOnly=true
  | "denied-by-lock"        // item.locked (if we adopt locking; v0.1 ignores)
  | "circular-drop";        // hit-test ban

// Reducer action union (private to lib/reducer; surfaced via dispatch escape hatch)
export type TodoTreeAction =
  | { type: "SET_ITEMS"; items: TodoItem[]; reason: TodoTreeChangeReason }
  | { type: "ADD_ITEM"; item: TodoItem; parentId: string | null; index?: number }
  | { type: "REMOVE_ITEM"; id: string; via: "imperative" | "keyboard" | "bulk" }
  | { type: "REMOVE_ITEMS"; ids: ReadonlyArray<string> }
  | { type: "ADD_CHILD"; parentId: string; item: TodoItem; index?: number }
  | { type: "MOVE_ITEM"; itemId: string; to: TreeLocation; reason: "reorder" | "reparent" }
  | { type: "TOGGLE_ACTIVE"; id: string; nextActive: boolean }
  | { type: "TOGGLE_ACTIVE_BULK"; ids: ReadonlyArray<string>; nextActive: boolean }
  | { type: "TOGGLE_COLLAPSE"; id: string }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" }
  | { type: "SET_COLLAPSED"; ids: ReadonlyArray<string> }
  | { type: "SELECT_ONE"; id: string; mode: "replace" | "toggle" | "range" }
  | { type: "SELECT_ALL" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_QUERY"; query: string }
  | { type: "SET_SORT"; sort: TodoTreeSort }
  | { type: "SET_FILTER"; filter: TodoTreeFilter }
  | { type: "CLEAR_FILTERS" };

// Event arg shapes
export interface TodoTreeChangeArgs {
  items: TodoItem[];
  reason: TodoTreeChangeReason;
}
export interface TodoTreeItemEvent {
  item: TodoItem;
  level: number;
  event: MouseEvent;
}
export interface TodoTreeMoveEvent {
  item: TodoItem;
  from: TreeLocation;
  to: TreeLocation;
  via: "drag" | "imperative";
}
export interface TodoTreeDropEvent {
  item: TodoItem;
  from: "internal" | "external";
  targetParentId: string | null;
  targetIndex: number;
}
export interface TodoTreeAddEvent {
  item: TodoItem;
  parentId: string | null;
  index: number;
  via: "imperative" | "drop-from-external";
}
export interface TodoTreeRemoveEvent {
  item: TodoItem;
  via: "imperative" | "keyboard" | "bulk";
}
export interface TodoTreePermissionDeniedEvent {
  action: TodoTreePermissionAction;
  itemId: string;
  reason: TodoTreePermissionDenialReason;
}

// State value (returned by useTodoTreeState; passable via `state` prop)
export interface TodoTreeStateValue extends TodoTreeHandle {
  items: TodoItem[];
  visibleItems: ReadonlyArray<{ item: TodoItem; level: number; parentId: string | null; index: number }>;  // flattened + filtered + sorted snapshot, level included for renderer
  collapsedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  dispatch: (action: TodoTreeAction) => void;
}

// Imperative handle (26 methods)
export interface TodoTreeHandle {
  // Tree state (2)
  getValue(): TodoItem[];
  setValue(next: TodoItem[]): void;

  // Item ops (6)
  addItem(item: TodoItem, opts?: { parentId?: string; index?: number }): void;
  removeItem(id: string): void;
  addChild(parentId: string, item: TodoItem, index?: number): void;
  removeItems(ids: ReadonlyArray<string>): void;
  toggleActive(id: string, nextActive: boolean): void;
  toggleActiveBulk(ids: ReadonlyArray<string>, nextActive: boolean): void;

  // Focus / lookup (2)
  focusItem(id: string): void;
  getItemById(id: string): TodoItem | undefined;

  // Collapse (6)
  expandItem(id: string): void;
  collapseItem(id: string): void;
  toggleCollapse(id: string): void;
  expandAll(): void;
  collapseAll(): void;
  isCollapsed(id: string): boolean;

  // Selection (6)
  selectItem(id: string): void;
  deselectItem(id: string): void;
  selectRange(idA: string, idB: string): void;
  selectAll(): void;
  clearSelection(): void;
  getSelectedIds(): ReadonlySet<string>;

  // Query / sort / filter (4)
  setQuery(query: string): void;
  setSort(sort: TodoTreeSort): void;
  setFilter(filter: TodoTreeFilter): void;
  clearAllFilters(): void;
}

// Slot render-prop arg shapes
export interface TodoTreeRowRenderArgs {
  item: TodoItem;
  level: number;
  isSelected: boolean;
  isCollapsed: boolean;
  isExpanded: boolean;       // !isCollapsed && has children
  defaultRender: ReactNode;
}
export interface TodoTreeFieldRenderArgs {
  item: TodoItem;
  level: number;
}
export interface TodoTreeStatusRenderArgs extends TodoTreeFieldRenderArgs {
  statusOption?: TodoStatusOption;
}
export interface TodoTreeToolbarRenderArgs {
  defaultToolbar: ReactNode;
  state: TodoTreeStateValue;
}
export interface TodoTreeEmptyRenderArgs {
  hasFilter: boolean;
}
export interface TodoTreeDragOverlayArgs {
  item: TodoItem;
  level: number;
}

// Full props
export interface TodoTreeProps {
  // Data
  defaultValue?: TodoItem[];
  value?: TodoItem[];
  onChange?: (args: TodoTreeChangeArgs) => void;
  state?: TodoTreeStateValue;  // lifted; supersedes value/defaultValue

  // Status enum
  statusOptions?: TodoStatusOption[];

  // Permissions
  permissions?: TodoPermissions;
  onPermissionDenied?: (args: TodoTreePermissionDeniedEvent) => void;

  // Behavior
  readOnly?: boolean;
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  indentSize?: number;                            // default 20
  filterMode?: "fade" | "hide";                   // default "fade"
  statusIndicator?: "dot" | "strip" | "none";     // default "dot"
  virtualize?: boolean | { threshold?: number };  // default auto (threshold 200)
  toolbar?: "default" | "none" | ReactNode;       // default "default"

  // Slots (priority rule: slot wins over prop variant)
  renderRow?: (args: TodoTreeRowRenderArgs) => ReactNode;
  renderName?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderDescription?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderPerson?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderStatusIndicator?: (args: TodoTreeStatusRenderArgs) => ReactNode;
  renderToolbar?: (args: TodoTreeToolbarRenderArgs) => ReactNode;
  renderEmptyState?: (args: TodoTreeEmptyRenderArgs) => ReactNode;
  renderDragOverlay?: (args: TodoTreeDragOverlayArgs) => ReactNode;

  // Events
  onItemClick?: (args: TodoTreeItemEvent) => void;
  onItemContextMenu?: (args: TodoTreeItemEvent) => void;
  onActiveToggled?: (args: { item: TodoItem; nextActive: boolean }) => void;
  onCollapseToggled?: (args: { item: TodoItem; collapsed: boolean }) => void;
  onItemMoved?: (args: TodoTreeMoveEvent) => void;
  onItemDropped?: (args: TodoTreeDropEvent) => void;
  onItemAdded?: (args: TodoTreeAddEvent) => void;
  onItemRemoved?: (args: TodoTreeRemoveEvent) => void;
  onBulkToggleActive?: (args: { ids: ReadonlyArray<string>; nextActive: boolean }) => void;
  onBulkRemove?: (args: { ids: ReadonlyArray<string> }) => void;
  onBulkEdit?: (args: { ids: ReadonlyArray<string> }) => void;
  onSelectionChanged?: (args: { selectedIds: ReadonlySet<string> }) => void;
  onSearchChanged?: (args: { query: string }) => void;
  onSortChanged?: (args: { sort: TodoTreeSort }) => void;
  onFilterChanged?: (args: { filter: TodoTreeFilter }) => void;

  // Standard
  className?: string;
  "aria-label"?: string;
}
```

### 2.3 Exports (index.ts barrel)

```ts
// Components
export { TodoTree } from "./todo-tree";
export { TodoTreeWithEditor } from "./todo-tree-with-editor";

// Hook
export { useTodoTreeState } from "./hooks/use-todo-tree-state";

// Types (re-exported for convenience)
export type {
  TodoTreeProps,
  TodoTreeHandle,
  TodoTreeStateValue,
  TodoTreeChangeReason,
  TodoTreeChangeArgs,
  TodoTreeSort,
  TodoTreeFilter,
  TodoTreePermissionAction,
  TodoTreePermissionDenialReason,
  TodoTreeAction,
  TreeLocation,
  TodoTreeItemEvent,
  TodoTreeMoveEvent,
  TodoTreeDropEvent,
  TodoTreeAddEvent,
  TodoTreeRemoveEvent,
  TodoTreePermissionDeniedEvent,
  TodoTreeRowRenderArgs,
  TodoTreeFieldRenderArgs,
  TodoTreeStatusRenderArgs,
  TodoTreeToolbarRenderArgs,
  TodoTreeEmptyRenderArgs,
  TodoTreeDragOverlayArgs,
} from "./types";
```

**F-S1 lock:** NO cross-procomp re-exports from this barrel. Shipped source uses relative paths to todo-rich-card; downstream consumers import TodoItem etc. directly from `@ilinxa/todo-rich-card`.

---

## 3. Architecture

```
                    ┌────────────────────────────────┐
                    │       <TodoTreeWithEditor>     │
                    │  (convenience wrapper)         │
                    │  • mounts <Dialog>             │
                    │  • mounts <TodoRichCard>       │
                    │  • holds editTarget state      │
                    └─────────────┬──────────────────┘
                                  ▼
              ┌───────────────────────────────────────────┐
              │                <TodoTree>                 │
              │   • mounts <DndContext> (@dnd-kit)        │
              │   • mounts <TodoTreeToolbar> (if default) │
              │   • mounts <TodoTreeList> (virtualized)   │
              └─────────┬──────────────────────┬──────────┘
                        ▼                      ▼
          ┌─────────────────────────┐  ┌─────────────────────┐
          │  useTodoTreeState       │  │  <TodoTreeList>     │
          │  (reducer + selectors)  │  │  • virtualizer      │
          │                         │  │  • renders Rows[]   │
          └────┬────────────────────┘  └──────┬──────────────┘
               │                              ▼
               │                  ┌──────────────────────────┐
               │                  │       <TodoTreeRow>      │
               │                  │  • @dnd-kit Draggable    │
               │                  │  • native HTML5 drag     │
               │                  │  • slots: name/desc/etc  │
               │                  └──────────────────────────┘
               ▼
          lib/reducer.ts (pure)
          lib/visible-items.ts (filter + sort + flatten)
          lib/permissions.ts (predicate eval)
          lib/dnd-payload.ts (HTML5 MIME I/O)
          lib/circular-drop.ts (ancestor hit-test)
```

### 3.1 Reducer-as-engine

All state mutations flow through `lib/reducer.ts`. Reducer is **pure** — no side effects, no consumer-callback firing. Side effects (firing `onChange` / `onItemMoved` / `onActiveToggled` etc.) happen in **`hooks/use-tree-events.ts`**, called by the host (`<TodoTree>`) after each dispatch. The `dispatch` escape hatch exposed on `TodoTreeStateValue` lets advanced consumers fire actions directly.

### 3.2 Three-defenses controlled mode

When `value` is provided (controlled), `<TodoTree>` runs the canonical pattern (lifted from `flow-canvas-01` v0.2.2/v0.2.3/v0.2.4 saga, locked in [`project_controlled_mode_two_defenses.md`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_controlled_mode_two_defenses.md)):

1. **Microtask-defer consumer notify** — every `fireOnChange` call wraps its body in `queueMicrotask(...)`. Internal state has settled before consumer's setState fires.
2. **Structural resync guard** — when `value` prop changes, compare against current internal snapshot (`canvasMatchesInternalState(value, internalItems, query, sort, filter)`). If structurally equal (round-trip echo), skip resync. Genuine external changes still resync correctly.
3. **Suppress mid-drag onChange** — `isDraggingRef` + `isDraggingTouchRef` set during drag; fireOnChange microtask bails early if drag is in flight. Single authoritative snapshot fires on drag-end.

Reducer + visible-items selectors do NOT participate — only the event emitter does.

### 3.3 Dual DnD activation (Q8 = a)

Every `<TodoTreeRow>` carries **both** drag bindings simultaneously. Activation rules:

| User gesture | Activator | System | Edge zones |
|---|---|---|---|
| Mouse-down on grip strip (hover-revealed, left edge) | `@dnd-kit` `useDraggable` listener | Internal (@dnd-kit) | @dnd-kit's drop detection inside the tree's `DndContext` |
| Mouse-down on row body (outside grip) | native `onDragStart` | HTML5 | Native drop targets — both internal rows AND external `todo-rich-card` drop targets |
| Touch-start + 300ms hold on grip strip | `@dnd-kit` `PointerSensor` with `activationConstraint: { delay: 300, tolerance: 5 }` | Internal (@dnd-kit, supports touch) | Same as @dnd-kit pointer |
| Touch-start on row body (no grip-hover affordance on touch) | nothing — native HTML5 drag does NOT fire on touch | — | — |

**Implication:** internal touch-drag works (via @dnd-kit). Cross-procomp touch-drag does NOT work in v0.1 (native HTML5 has no touch). Internal pointer-drag and cross-procomp pointer-drag both work. This matches the L17 lock + R11 mitigation: full feature delivery on pointer; touch is internal-only.

**Mutual exclusion:** when the user grabs the grip strip, the row's HTML5 `onDragStart` is suppressed (`e.preventDefault()` on the native dragstart if @dnd-kit's drag has started in the same tick). Activator wins.

### 3.4 Visible items pipeline

```
items[] (raw tree)
    │
    ▼
lib/filter-items.ts  (apply TodoTreeFilter + search query)
    │
    ▼
lib/sort-items.ts    (apply TodoTreeSort)
    │
    ▼
lib/flatten-tree.ts  (DFS flatten respecting collapsedIds; preserve level + parentId + index)
    │
    ▼
visibleItems: ReadonlyArray<{ item, level, parentId, index }>
```

Filter is non-destructive: if `filterMode === "fade"`, non-matching items still emit with a `dimmed: true` flag (renderer applies opacity-30); if `filterMode === "hide"`, non-matching items + their non-matching descendants are omitted, but **ancestors-of-match still render** (VSCode-style — Q6 lock).

Memoization: `useMemo` keyed on `[items, query, sort, filter, collapsedIds, filterMode]`. Reference-stable when inputs unchanged so virtualizer doesn't churn.

### 3.5 Virtualization integration

`hooks/use-tree-virtual.ts` (mirrors file-tree's pattern). Threshold check uses **TOTAL items count** (not visible) so filter doesn't defeat the optimization (R9 lock).

`@tanstack/react-virtual`'s `useVirtualizer` returns `getVirtualItems()` — list virtualization, fixed row height (~52px for the 2-line layout). `estimateSize` is a constant — slot consumers using `renderRow` with variable heights opt out by passing `virtualize={false}` (R7 mitigation: auto-suspend during drag is wired via `setIsDragging` → virtualizer-disabling flag).

### 3.6 Toolbar architecture

`<TodoTreeToolbar>` is a self-contained component that reads state from the `useTodoTreeState` context (provided by `<TodoTree>` via `<TodoTreeStateContext.Provider>`). Three sub-parts:

- `<TodoTreeSearchInput>` — debounced 200ms via `useDebouncedCallback` (rebuild local `useEffect` since we already have lib-internal debounce). Fires `setQuery` + `onSearchChanged`.
- `<TodoTreeSortDropdown>` — Select primitive; F-cross-13 pre-emption (L11): `onValueChange` widened to `(v: string \| null) => void` + null-coerce.
- `<TodoTreeFilterDropdown>` — Popover + Checkbox group; same F-cross-13 pre-emption posture.
- `<TodoTreeBulkActionBar>` — appears when `selectedIds.size > 0`; surfaces buttons for `onBulkToggleActive`, `onBulkRemove`, `onBulkEdit`.

---

## 4. File structure

Sealed folder at `src/registry/components/data/todo-tree/`. Expected ~53 files (~46 shipped via registry; demo/usage/meta docs-site only).

```
src/registry/components/data/todo-tree/
├─ todo-tree.tsx                  (main component, ~250 LOC)
├─ todo-tree-with-editor.tsx      (convenience wrapper, ~80 LOC)
├─ types.ts                       (all type exports, ~200 LOC)
├─ index.ts                       (barrel re-exports)
├─ dummy-data.ts                  (fixtures; ships via -fixtures registry item)
├─ demo.tsx                       (docs-site only)
├─ usage.tsx                      (docs-site only)
├─ meta.ts                        (docs-site only)
│
├─ parts/                         (presentational components)
│  ├─ todo-tree-list.tsx          (virtualized list root; reads from context)
│  ├─ todo-tree-row.tsx           (the 2-line row; dual DnD bindings)
│  ├─ todo-tree-row-content.tsx   (defaultRender for slot)
│  ├─ todo-tree-chevron.tsx       (collapse toggle button)
│  ├─ todo-tree-status-indicator.tsx (dot / strip / none paint)
│  ├─ todo-tree-checkbox.tsx      (native checkbox with permission gate)
│  ├─ todo-tree-name.tsx          (name span; bold)
│  ├─ todo-tree-description.tsx   (truncated description preview)
│  ├─ todo-tree-person-label.tsx  (person label, right edge)
│  ├─ todo-tree-grip.tsx          (hover-revealed drag handle)
│  ├─ todo-tree-drop-indicator.tsx (top/bottom line OR middle glow)
│  ├─ todo-tree-drag-overlay.tsx  (cursor-follow visual)
│  ├─ todo-tree-empty-state.tsx   (default placeholder)
│  ├─ todo-tree-toolbar.tsx       (default toolbar root)
│  ├─ todo-tree-search-input.tsx  (debounced input)
│  ├─ todo-tree-sort-dropdown.tsx (Select primitive)
│  ├─ todo-tree-filter-dropdown.tsx (Popover + checkbox group)
│  ├─ todo-tree-filter-active-toggle.tsx (segmented control: all/active/inactive)
│  ├─ todo-tree-bulk-action-bar.tsx (appears on selection)
│  └─ todo-tree-keyboard-handler.tsx (invisible div with keydown handlers)
│
├─ hooks/                         (state + interaction logic)
│  ├─ use-todo-tree-state.ts      (the headless hook; main reducer host)
│  ├─ use-todo-tree-context.ts    (context bridge for parts/)
│  ├─ use-tree-virtual.ts         (virtualizer wrapper)
│  ├─ use-tree-keyboard.ts        (key dispatch: arrows + delete + cmd-a + esc)
│  ├─ use-tree-dnd-internal.ts    (@dnd-kit hooks, drop detection)
│  ├─ use-tree-dnd-html5.ts       (native HTML5 drag handlers + payload I/O)
│  ├─ use-tree-events.ts          (consumer callback dispatcher; microtask-defer)
│  ├─ use-controlled-mode.ts      (three-defenses pattern)
│  ├─ use-selection.ts            (multi-select state + shift/cmd interactions)
│  ├─ use-debounced-callback.ts   (small util)
│  └─ use-status-option-by-value.ts (lookup from statusOptions[])
│
└─ lib/                           (pure functions)
   ├─ reducer.ts                  (TodoTreeAction → state)
   ├─ visible-items.ts            (filter + sort + flatten pipeline)
   ├─ filter-items.ts             (apply TodoTreeFilter)
   ├─ search-items.ts             (case-insensitive .includes on name + description)
   ├─ sort-items.ts               (apply TodoTreeSort; 5 kinds + custom)
   ├─ flatten-tree.ts             (DFS flatten + collapsed-respecting)
   ├─ tree-walker.ts              (find-by-id, find-parent, find-ancestors)
   ├─ tree-mutators.ts            (immutable add/remove/move/reparent)
   ├─ circular-drop.ts            (ancestor hit-test ban)
   ├─ dnd-payload.ts              (TODO_TREE_MIME + serialize/parse)
   ├─ permissions.ts              (predicate evaluator, mirrors todo-rich-card)
   ├─ edge-zone.ts                (compute drop zone from pointer + row bounds)
   ├─ shallow.ts                  (small shallow-equality util for resync guard)
   └─ default-status-options.ts   (fallback status enum when none provided)
```

**File-count summary:**
- 8 top-level (5 shipped: todo-tree.tsx, todo-tree-with-editor.tsx, types.ts, index.ts, dummy-data.ts; 3 docs-site: demo, usage, meta)
- 20 parts/ (all shipped)
- 11 hooks/ (all shipped)
- 14 lib/ (all shipped)
- Total: 53 files; **50 shipped via registry**, 3 docs-site

R6 lock: "Likely 50+ files in the sealed folder." ✅

---

## 5. State model

### 5.1 Internal state shape

```ts
interface State {
  items: TodoItem[];
  collapsedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  selectionAnchorId: string | null;   // last clicked; used for shift-click range
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  focusedItemId: string | null;
}
```

### 5.2 Initial state

```ts
function createInitialState(input: {
  items: TodoItem[];
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  defaultSort?: TodoTreeSort;
  defaultFilter?: TodoTreeFilter;
}): State;
```

Default sort: `{ kind: "name", direction: "asc" }` — stable, predictable.
Default filter: `{ statuses: [], personIds: [], active: "all" }`.
Default query: `""`.
Default collapsedIds: `new Set(defaultCollapsedIds ?? [])`.
Default selectedIds: `new Set(defaultSelectedIds ?? [])`.

### 5.3 Reducer

`lib/reducer.ts` exports a pure `function reducer(state: State, action: TodoTreeAction): State`.

Each action's pure transform:

- **`SET_ITEMS`** → `{ ...state, items: action.items }`.
- **`ADD_ITEM`** → use `lib/tree-mutators.ts::insertAt(items, parentId, index, item)`. If `parentId` null + index undefined: append to top-level.
- **`REMOVE_ITEM`** → `lib/tree-mutators.ts::removeById(items, id)`. Also prune from `collapsedIds` + `selectedIds`.
- **`REMOVE_ITEMS`** → fold REMOVE_ITEM over each id.
- **`ADD_CHILD`** → like ADD_ITEM with parentId required. Auto-expand parent (remove from `collapsedIds`).
- **`MOVE_ITEM`** → atomic remove + insert. Bans circular per `lib/circular-drop.ts`. Auto-expand target parent.
- **`TOGGLE_ACTIVE`** → `lib/tree-mutators.ts::updateById(items, id, item => ({...item, active: nextActive}))`.
- **`TOGGLE_ACTIVE_BULK`** → fold TOGGLE_ACTIVE.
- **`TOGGLE_COLLAPSE`** → `collapsedIds.has(id) ? delete : add`.
- **`EXPAND_ALL` / `COLLAPSE_ALL`** → empty set / set of all ids with children.
- **`SET_COLLAPSED`** → replace with `new Set(action.ids)`.
- **`SELECT_ONE`** with `mode: "replace"` → `selectedIds: new Set([id])`, anchor: id.
- **`SELECT_ONE`** with `mode: "toggle"` (cmd/ctrl-click) → toggle id in selection, anchor stays.
- **`SELECT_ONE`** with `mode: "range"` (shift-click) → select id range from anchor (or top) to id in DFS order over visible items.
- **`SELECT_ALL`** → selectedIds = all VISIBLE item ids.
- **`CLEAR_SELECTION`** → empty set, anchor: null.
- **`SET_QUERY` / `SET_SORT` / `SET_FILTER` / `CLEAR_FILTERS`** → trivial.

All actions return a NEW state object when state changes (reference inequality for selectors to memoize off of). When action would be a no-op (e.g., `TOGGLE_COLLAPSE` on already-collapsed id is delete, not no-op — but `SET_QUERY` with same string returns same state ref).

---

## 6. DnD architecture (Dual DnD — Q8 = a)

### 6.1 @dnd-kit configuration (internal drag)

```tsx
// In <TodoTree>
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),                       // mouse: 5px drag distance activates
  useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),          // touch: 300ms long-press
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleInternalDragStart}
  onDragOver={handleInternalDragOver}
  onDragEnd={handleInternalDragEnd}
  onDragCancel={handleInternalDragCancel}
>
  {/* tree content */}
  <DragOverlay>{activeItem && <TodoTreeDragOverlay item={activeItem.item} level={activeItem.level} />}</DragOverlay>
</DndContext>
```

**Sensor rationale:**
- **MouseSensor + `distance: 5`** — drag activates after 5px of mouse movement from press. Click is preserved; click-to-edit + drag are independent gestures on the same grip.
- **TouchSensor + `delay: 300, tolerance: 5`** — touch must hold for 300ms with <5px jitter to activate. This is the long-press UX from the description doc L17. Below 300ms a touch acts as a tap (fires `onItemClick`); the gesture is unambiguous to the user.
- **KeyboardSensor** — Space-to-lift, arrow keys to move, Space-to-drop. Standard @dnd-kit accessibility primitive.

`PointerSensor` (which unifies mouse + touch) is NOT used here because we want **divergent activation timings** between mouse (immediate) and touch (long-press). Splitting into Mouse + Touch sensors gives the correct UX per modality. This is a deliberate divergence from kanban-board-01 (which uses unified PointerSensor) — locked here because the description doc L17 specifies 300ms long-press semantics that kanban-board-01 doesn't actually deliver via its current sensor config.

### 6.2 Drop detection (internal)

`onDragOver` fires repeatedly during drag. Each row registers as a `useDroppable` with id = item id. On drag over, compute the edge zone (top/middle/bottom) from pointer Y vs row bounds — `lib/edge-zone.ts::computeEdgeZone(pointerY, rowBounds): "top" | "middle" | "bottom"`.

Drop indicators (`<TodoTreeDropIndicator>`) render based on the current `over` + `edgeZone`. Top/bottom: horizontal line between rows. Middle: inner-glow ring on the target row.

### 6.3 Circular drop ban

```ts
// lib/circular-drop.ts
export function isAncestor(items: TodoItem[], sourceId: string, targetId: string): boolean;
```

Called in `onDragOver` — if `isAncestor(items, draggedId, targetId)` AND edge zone is middle (reparent), reject the drop (drop indicator hidden, drop ignored). Fires `onPermissionDenied({ action: "dropIntoChildren", itemId: targetId, reason: "circular-drop" })`.

### 6.4 HTML5 cross-procomp drag

Each row has native:

```tsx
<div
  draggable={canDragNative}
  onDragStart={(e) => {
    e.dataTransfer.setData(TODO_TREE_MIME, JSON.stringify(item));
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  }}
  onDragOver={(e) => {
    if (e.dataTransfer.types.includes(TODO_TREE_MIME)) {
      e.preventDefault();  // allow drop
      e.dataTransfer.dropEffect = "copy";
    }
  }}
  onDrop={handleHtml5Drop}
>
```

Where `TODO_TREE_MIME = "application/x-ilinxa-todo+json"` (same MIME todo-rich-card uses; defined in `lib/dnd-payload.ts`).

### 6.5 Activator mutual exclusion

Wire `<TodoTreeGrip>` as the `useDraggable` listener target. When grip-drag activates, set `isInternalDragRef.current = true`. The row-level `onDragStart` (native) checks this flag — if true, call `e.preventDefault()` to suppress the HTML5 drag. Otherwise (drag started outside grip), let HTML5 proceed and skip the @dnd-kit drag.

Reset flag on @dnd-kit `onDragEnd` / `onDragCancel`.

### 6.6 Drop flow (full)

```
User drags row → grip activator? → YES → @dnd-kit DnD
                                        → onDragEnd → dispatch MOVE_ITEM → reducer commits → fireOnChange (microtask) → onItemMoved + onChange fire
                              → NO  → HTML5 drag
                                        → drops on another tree row → dispatch MOVE_ITEM (internal HTML5 path; rarely used since grip is the affordance)
                                        → drops on external (rich-card) → external handles drop natively; tree emits onItemDropped({ from: "internal", ... }) when its drag ends if drop happened in an HTML5 drop target
```

Tree as drop TARGET for external drag:
```
External drag enters tree row → HTML5 onDragOver → tree edge-zone detection → dispatch ADD_ITEM (drop-from-external) → reducer commits → fireOnChange + onItemDropped({ from: "external", ... }) + onItemAdded
```

---

## 7. Toolbar implementation

### 7.1 `<TodoTreeToolbar>` composition

```tsx
<div role="toolbar" aria-label="Tree controls" className="flex items-center gap-2 px-2 py-1.5">
  <TodoTreeSearchInput value={query} onChange={setQuery} />
  <TodoTreeFilterActiveToggle value={filter.active} onChange={(active) => setFilter({ ...filter, active })} />
  <TodoTreeSortDropdown value={sort} onChange={setSort} />
  <TodoTreeFilterDropdown value={filter} onChange={setFilter} statusOptions={statusOptions} />
  <div className="flex-1" />
  {selectedIds.size > 0 && (
    <TodoTreeBulkActionBar
      count={selectedIds.size}
      onToggleActive={(next) => onBulkToggleActive({ ids: [...selectedIds], nextActive: next })}
      onRemove={() => onBulkRemove({ ids: [...selectedIds] })}
      onEdit={() => onBulkEdit({ ids: [...selectedIds] })}
    />
  )}
</div>
```

### 7.2 F-cross-13 pre-emption (L11)

All `Select.onValueChange` callbacks in `<TodoTreeSortDropdown>` and `<TodoTreeFilterDropdown>` are widened:

```tsx
onValueChange={(v: string | null) => {
  const next = v ?? "name";  // sane fallback per case
  // ...
}}
```

NO `TooltipProvider delayDuration` anywhere — drop the prop entirely (default delay is fine).

### 7.3 Sort dropdown sources

```ts
const SORT_OPTIONS: Array<{ value: string; label: string; spec: TodoTreeSort }> = [
  { value: "name-asc",       label: "Name ↑",          spec: { kind: "name",      direction: "asc"  } },
  { value: "name-desc",      label: "Name ↓",          spec: { kind: "name",      direction: "desc" } },
  { value: "setAt-asc",      label: "Created ↑",       spec: { kind: "setAt",     direction: "asc"  } },
  { value: "setAt-desc",     label: "Created ↓",       spec: { kind: "setAt",     direction: "desc" } },
  { value: "expireAt-asc",   label: "Due ↑",           spec: { kind: "expireAt",  direction: "asc"  } },
  { value: "expireAt-desc",  label: "Due ↓",           spec: { kind: "expireAt",  direction: "desc" } },
  { value: "status-asc",     label: "Status ↑",        spec: { kind: "status",    direction: "asc"  } },
  { value: "status-desc",    label: "Status ↓",        spec: { kind: "status",    direction: "desc" } },
];
// Custom sort spec ({ kind: "custom" }) hides the dropdown selection and displays "Custom" label.
```

### 7.4 Filter dropdown

Popover with:
- Status: multi-select chips (one per `statusOption`).
- Person: multi-select chips (one per unique person across all items — computed lazily on dropdown open).
- "Clear all" button → dispatches `CLEAR_FILTERS`.

### 7.5 Search debounce

`use-debounced-callback.ts`:
```ts
export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delayMs: number): T;
```

Wires raw input → `useDebouncedCallback(setQuery, 200)` → debounced query update fires reducer + `onSearchChanged`.

---

## 8. Multi-select implementation

### 8.1 Row click handler

```ts
function handleRowClick(item: TodoItem, e: React.MouseEvent) {
  const mode = e.shiftKey ? "range" : (e.metaKey || e.ctrlKey) ? "toggle" : "replace";
  dispatch({ type: "SELECT_ONE", id: item.id, mode });
  if (mode === "replace" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
    onItemClick?.({ item, level: getLevel(item), event: e });  // fires only on plain click
  }
  onSelectionChanged?.({ selectedIds: getNextSelection() });
}
```

### 8.2 Range select math

Range select needs DFS order of `visibleItems`. The reducer's `SELECT_ONE` with `mode: "range"` derives the range from `state.selectionAnchorId` (last clicked) to `id`, both projected onto `visibleItems[]` ordinal positions.

If anchor doesn't exist (first interaction is shift-click), treat as `mode: "replace"`.

### 8.3 Keyboard `Cmd/Ctrl + A`

`use-tree-keyboard.ts` listens for the key combo at the tree-level keyboard handler. Dispatches `SELECT_ALL` (selects all VISIBLE items only — respects filter / collapsed).

### 8.4 Escape

`Escape` → dispatch `CLEAR_SELECTION`. Also closes any open menus (handled by primitives' own escape logic + Radix-style portal).

### 8.5 Selection across data changes (Q7 = drop silently)

When `value` prop changes (controlled) OR `setItems` is called, the reducer's resync step prunes `selectedIds` of any id not in the new items tree. `onSelectionChanged` fires with the pruned set.

---

## 9. Permissions

### 9.1 Predicate evaluator

`lib/permissions.ts` mirrors todo-rich-card's pattern:

```ts
export function evalPermission(
  permissions: TodoPermissions | undefined,
  action: TodoTreePermissionAction,
  item: TodoItem,
  level: number,
): boolean;
```

Evaluates `permissions.byItem?.[item.id]?.[action]` first, then `permissions.byLevel?.[level]?.[action]`, then `permissions.default?.[action]`. `inherit: true` (default) falls back through the chain; `inherit: false` stops at first defined level.

### 9.2 Where each permission gate fires

| Gate | When | If denied |
|---|---|---|
| `canEditItem` | onItemClick handler | click bubbles to `onItemClick` is suppressed; `onPermissionDenied` fires |
| `canToggleActive` | checkbox onChange | checkbox renders with `aria-disabled`; click is a no-op + denial fires |
| `canDragItem` | row-level @dnd-kit + HTML5 drag start | grip strip not rendered; native draggable={false} |
| `canDropIntoChildren` | onDragOver, middle zone | drop indicator hidden for middle zone; circular check also gates here |
| `canDropAsSibling` | onDragOver, top/bottom zone | drop indicator hidden for top/bottom |
| `canRemoveItem` | Delete keypress + bulk-remove + imperative `removeItem` | key handler / imperative noops + denial fires |

`readOnly` short-circuits ALL gates (treats every action as denied).

---

## 10. Virtualization integration

### 10.1 Virtualizer setup

`hooks/use-tree-virtual.ts`:

```ts
export function useTreeVirtual(args: {
  visibleItems: ReadonlyArray<...>;
  scrollRef: RefObject<HTMLDivElement>;
  rowHeight: number;  // default 52
  enabled: boolean;
}) {
  const virtualizer = useVirtualizer({
    count: args.visibleItems.length,
    getScrollElement: () => args.scrollRef.current,
    estimateSize: () => args.rowHeight,
    overscan: 5,
    enabled: args.enabled,
  });
  return virtualizer;
}
```

Lint rule `react-hooks/incompatible-library` warns on this; matches the pattern in `file-tree/hooks/use-tree-virtual.ts` so the warning is accepted project-wide.

### 10.2 Auto-enable threshold

`<TodoTree>` computes:

```ts
const totalItemsCount = useMemo(() => countAllItems(items), [items]);  // recursive
const shouldVirtualize =
  virtualize === false ? false :
  virtualize === true ? true :
  virtualize?.threshold !== undefined ? totalItemsCount >= virtualize.threshold :
  totalItemsCount >= 200;  // default threshold
```

`countAllItems` walks the full tree (NOT just visible) so filter doesn't suppress virtualization (R9 lock).

### 10.3 Auto-suspend during drag (R7 mitigation)

`<TodoTreeList>` reads `isDraggingRef` from context. When drag is in flight, virtualizer is forced disabled (renders all visible items, no windowing) so dragged item can't scroll out of windowed range.

```tsx
const virtualizer = useTreeVirtual({
  visibleItems,
  scrollRef,
  rowHeight: 52,
  enabled: shouldVirtualize && !isDragging,
});
```

When `enabled` toggles, virtualizer re-runs cleanly per `@tanstack/react-virtual`'s contract.

### 10.4 Slot-row + virtualization

If consumer provides `renderRow` with variable height, virtualization with fixed `estimateSize` causes layout glitches. Solutions:

- **Default behavior:** disable virtualization automatically when `renderRow` is provided (warn in dev mode about the perf tradeoff).
- **Power-user opt-in:** consumer who knows their renderRow height is constant can pass `virtualize={{ threshold: 200 }}` explicitly to override.

```ts
const finalEnabled = renderRow ? (virtualize === true || (typeof virtualize === "object" && virtualize !== null)) : shouldVirtualize;
```

---

## 11. Three-defenses controlled-mode wiring

Implementation in `hooks/use-controlled-mode.ts`. Mirrors flow-canvas-01 v0.2.4 verbatim where possible.

```ts
export function useControlledMode(args: {
  value: TodoItem[] | undefined;
  defaultValue: TodoItem[] | undefined;
  onChange: ((args: TodoTreeChangeArgs) => void) | undefined;
  internalState: State;
  dispatch: (action: TodoTreeAction) => void;
}) {
  const isControlled = args.value !== undefined;
  const isDraggingRef = useRef(false);

  // (1) Microtask-defer consumer notify
  const fireOnChange = useCallback((next: TodoItem[], reason: TodoTreeChangeReason) => {
    if (!args.onChange) return;
    queueMicrotask(() => {
      // (3) Suppress mid-drag onChange — bail if drag started after queue
      if (isDraggingRef.current) return;
      args.onChange?.({ items: next, reason });
    });
  }, [args.onChange]);

  // (2) Structural resync guard
  useEffect(() => {
    if (!isControlled) return;
    if (canvasMatchesInternalState(args.value!, args.internalState)) return;  // echo
    dispatch({ type: "SET_ITEMS", items: args.value!, reason: "imperative-set" });
  }, [args.value, isControlled]);

  return { isDraggingRef, fireOnChange };
}
```

`canvasMatchesInternalState`:
- Compares length of `items` and `internalState.items`.
- DFS-walks both: same id at same path? Same name/status/active/children-length?
- Short-circuits on first mismatch.
- Reference-equal returns true immediately (best case).

---

## 12. Slot props implementation

### 12.1 Default row renderer

`parts/todo-tree-row-content.tsx`:

```tsx
export function TodoTreeRowContent({ item, level, isSelected, isCollapsed }: TodoTreeRowRenderArgs & { /* internal */ }) {
  const { renderName, renderDescription, renderPerson, renderStatusIndicator, statusIndicator } = useTodoTreeContext();
  return (
    <div
      data-level={level}
      style={{ paddingLeft: level * indentSize + 8 }}
      data-selected={isSelected || undefined}
      data-collapsed={isCollapsed || undefined}
    >
      <div className="flex items-center gap-1.5">
        <TodoTreeChevron item={item} />
        {renderStatusIndicator
          ? renderStatusIndicator({ item, level, statusOption })
          : <TodoTreeStatusIndicator variant={statusIndicator} item={item} />}
        <TodoTreeCheckbox item={item} />
        <span className="flex-1 truncate font-semibold">
          {renderName ? renderName({ item, level }) : item.name}
        </span>
        {item.targetPerson && (
          renderPerson ? renderPerson({ item, level }) : <TodoTreePersonLabel person={item.targetPerson} />
        )}
      </div>
      {item.description && (
        <div className="text-xs text-muted-foreground truncate pl-[calc(level*var(--indent)+24px)]">
          {renderDescription ? renderDescription({ item, level }) : item.description}
        </div>
      )}
    </div>
  );
}
```

### 12.2 Slot priority (description doc §2 priority rule)

```tsx
// In <TodoTreeRow>
const rowContent = <TodoTreeRowContent {...args} />;
return renderRow ? renderRow({ ...args, defaultRender: rowContent }) : rowContent;
```

For toolbar:
```tsx
const defaultToolbar = toolbar === "default" ? <TodoTreeToolbar /> : null;
const customNodeToolbar = isReactNode(toolbar) ? toolbar : null;

const rendered = renderToolbar
  ? renderToolbar({ defaultToolbar, state: contextState })
  : customNodeToolbar
  ?? (toolbar === "none" ? null : defaultToolbar);
```

For status:
```tsx
const statusOption = statusOptions?.find(o => o.value === item.status);
const rendered = renderStatusIndicator
  ? renderStatusIndicator({ item, level, statusOption })
  : <TodoTreeStatusIndicator variant={statusIndicator} statusOption={statusOption} />;
```

---

## 13. `<TodoTreeWithEditor>` composition

`todo-tree-with-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { TodoTree } from "./todo-tree";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TodoRichCard } from "../todo-rich-card";       // relative cross-procomp import (F-S1)
import type { TodoItem } from "../todo-rich-card/types";
import type { TodoTreeProps } from "./types";

export function TodoTreeWithEditor(props: TodoTreeProps) {
  const [editTarget, setEditTarget] = useState<TodoItem | null>(null);

  return (
    <>
      <TodoTree
        {...props}
        onItemClick={(args) => {
          setEditTarget(args.item);
          props.onItemClick?.(args);
        }}
      />
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          {editTarget && <TodoRichCard editable defaultValue={editTarget} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Important:** the wrapper does NOT propagate edit changes back into the tree by default — the edited item exists only inside the dialog's TodoRichCard. Closing the dialog discards changes unless consumer also wires `onChange` on the TodoRichCard.

A "complete" wrapper would wire onChange + dispatch to setValue. **Q-P1 (plan-stage):** does v0.1 ship the auto-wire (consumer gets persistence for free), or stays as-is (consumer wires onChange themselves if they want persistence)?

---

## 14. Dependencies

### 14.1 New external deps (relative to producer + meta.ts declarations)

| Package | Version pinned by producer | Used by | Verified? |
|---|---|---|---|
| `@dnd-kit/core` | `^6.3.1` | Internal drag (Dual DnD) | ✅ already used by kanban-board-01 |
| `@dnd-kit/utilities` | `^3.2.2` | @dnd-kit transform util | ✅ already used by kanban-board-01 |
| `@tanstack/react-virtual` | `^3.13.24` | Virtualization | ✅ already used by file-tree + file-manager |
| `lucide-react` | `^1.11.0` | Chevron / dropdown icons | ✅ project-wide standard |

NO new peer deps required. All four are already in the producer's `package.json`. `meta.ts.dependencies` lists them as peer deps; consumer install resolves them.

### 14.2 Cross-registry deps

`dependencies.internal: ["todo-rich-card"]` — `<TodoTreeWithEditor>` mounts TodoRichCard. Bare `<TodoTree>` has only TYPE deps on todo-rich-card (`TodoItem`, `TodoStatusOption`, `TodoPermissions`) — those are type-only imports erased at compile time. Still declared in `dependencies.internal` because the convenience wrapper carries the runtime dep.

### 14.3 shadcn primitives

| Primitive | Used by | F-cross-13 risk |
|---|---|---|
| `button` | chevron, bulk-action-bar buttons, sort/filter triggers | low |
| `checkbox` | row checkbox | low (native input anyway) |
| `select` | sort dropdown | ⚠️ **HIGH — Select.onValueChange must be widened to `(v: string \| null)` per L11** |
| `popover` | filter dropdown | medium (used in todo-rich-card v0.1.1, no issues yet) |
| `tooltip` | grip strip hover hint, person-label hover for truncated names | ⚠️ **MEDIUM — `delayDuration` prop must NOT be used per L11; default delay only** |
| `input` | search input | low |
| `dialog` | only via `<TodoTreeWithEditor>` | none |
| `separator` | toolbar dividers | none |
| `dropdown-menu` | possibly for bulk action overflow | low |
| `label` | search input label, filter label | none |
| `scroll-area` | virtualizer container | none |
| `badge` | selected count display in bulk bar | none |

Total: ~12 shadcn primitives. All already installed (per todo-rich-card v0.1.1).

---

## 15. Edge cases

| # | Case | Behavior |
|---|---|---|
| E1 | Empty tree (zero items) | `<TodoTreeEmptyState>` renders. If filter is active, message reads "No matches"; else "No tasks." Slot via `renderEmptyState`. |
| E2 | Single root item, no children | Chevron is hidden (only items WITH children get a chevron). Indent still applied (level 0). |
| E3 | Filter matches nothing | Empty state renders with `hasFilter: true`. |
| E4 | Search query that matches description but not name | Item shows (search ORs name + description). |
| E5 | Selected item gets removed via incoming `value` change | Pruned from `selectedIds` silently per Q7. `onSelectionChanged` fires reflecting new state. |
| E6 | Collapsed item gets a child added imperatively | Auto-expand: dispatch removes the parent from `collapsedIds`. |
| E7 | Circular drop (parent dragged into descendant) | Drop indicator hidden during dragover; drop ignored; fires `onPermissionDenied({ reason: "circular-drop" })`. |
| E8 | Sort + filter + collapse all interacting | Pipeline order: filter → sort → flatten(respecting collapsed) → render. All three coexist. |
| E9 | Drop from external (todo-rich-card) onto top-level (no row hit) | `<TodoTreeList>` itself is a drop zone for the bottom whitespace; drop becomes new top-level item at end. |
| E10 | `defaultSelectedIds` references id not in `defaultValue` | Silently pruned at init. |
| E11 | Item with `id` collision (two items with same id) | Dev warning; reducer uses first-found-by-DFS for mutations. (Validate at boundary?) |
| E12 | Custom `sort: { kind: "custom", compare }` returns inconsistent results | Inherent JS sort instability; documented in usage.tsx gotchas. |
| E13 | Person-label width pushes name truncation past edge | Person label clamps to max-width 25% of row. Name takes remaining flex space; description truncates separately. |
| E14 | User hits Cmd+A while no rows are visible (filter matches nothing) | No-op; no selection change. |
| E15 | Cross-procomp drop while internal @dnd-kit drag is in flight | Internal drag wins (HTML5 drag suppressed via `e.preventDefault()` on dragstart). |
| E16 | `state` prop changes mid-render (consumer swaps hook instance) | Treated as full resync; previous internal state discarded; `onChange` does NOT fire (this is consumer's authoritative state change). |
| E17 | Touch-drag attempts cross-procomp drop into rich-card | Touch drag uses @dnd-kit (no native dataTransfer) — rich-card cannot receive. Documented as a known limit (L17 lock, R11 risk). |
| E18 | Very deep nesting (level 10+) | Indent paddingLeft compounds; rows can overflow horizontally. Document `overflow-x: auto` on the scroll container so users can scroll right. Slot consumers using `renderRow` are responsible for their own overflow. |
| E19 | TodoItem with `children: []` (empty array) vs `children: undefined` | Both treated as "no children" — no chevron, no expand affordance. |
| E20 | Rapid query typing (faster than 200ms debounce) | Only the final value commits to state via setQuery. Older keystrokes' debounced calls are canceled. |

---

## 16. Accessibility

### 16.1 ARIA tree

```html
<div role="tree" aria-label="Tasks" aria-multiselectable="true">
  <div role="treeitem" aria-level="1" aria-expanded="true" aria-selected="false" id="row-task-1" tabindex="0">
    <!-- row content -->
    <div role="group">
      <div role="treeitem" aria-level="2" aria-expanded="false" id="row-task-1a" tabindex="-1">
        <!-- nested row -->
      </div>
    </div>
  </div>
</div>
```

- `role="tree"` on root, `role="treeitem"` on each row, `role="group"` on children container.
- Exactly one `treeitem` has `tabindex="0"` at any time (the focused row); others have `tabindex="-1"`.
- `aria-multiselectable="true"` enables multi-select semantics.
- `aria-selected` reflects selection state.
- `aria-expanded` only set when item has children.

### 16.2 Focus management

`focusedItemId` in state. Arrow Up/Down move focus + re-tabindex the rows. Focusing a row scrolls it into view if outside the virtualizer's window.

### 16.3 Keyboard map (full)

```
Arrow Down              → focus next visible row
Arrow Up                → focus previous visible row
Arrow Right             → expand collapsed row, else move into first child
Arrow Left              → collapse expanded row, else move to parent
Home                    → focus first visible row
End                     → focus last visible row
Space                   → toggle checkbox
Enter                   → fire onItemClick
Delete / Backspace      → remove focused row (gated)
Cmd/Ctrl + A            → select all visible
Cmd/Ctrl + Click        → toggle row in selection
Shift + Click           → range select from anchor
Escape                  → clear selection + close menus
Tab                     → leave tree (focuses next page tabbable)
```

### 16.4 Screen reader announcements

Default toolbar announces:
- Search input: `aria-label="Search tasks"` + live debounce → no SR storm.
- Sort dropdown: `aria-label="Sort by"`.
- Filter dropdown: `aria-label="Filter tasks"`.
- Bulk action bar appears: `aria-live="polite"` region announces "N items selected."

---

## 17. Performance

### 17.1 Memo strategy

- `visibleItems` computed via `useMemo` keyed on items + query + sort + filter + collapsedIds + filterMode.
- Each `<TodoTreeRow>` wrapped in `React.memo` with custom equality: shallow-compare item ref + level + isSelected + isCollapsed.
- `useTodoTreeContext` returns a STABLE context object via `useMemo` with narrow deps.
- Renderer slots passed via context — identity churn on every render UNLESS consumer memoizes the render function. Document.

### 17.2 Virtualization win

At 1000+ items, only ~12-15 rows render at a time. Memory: O(visible) instead of O(total).

### 17.3 Reducer dispatch cost

Per dispatch: O(tree size) for tree-mutators in the worst case (remove-by-id walks the tree). Bulk ops fold this — `REMOVE_ITEMS` with N ids is O(N × tree size); acceptable.

### 17.4 DnD perf

@dnd-kit drag tick fires `onDragOver` continuously. Edge-zone computation is O(1) per row. Drop indicator rendering happens via CSS variables, not React state — moves don't trigger re-render storm.

---

## 18. Implementation order (commit chain)

Plan §18 = the ship-by-ship order to actually code this in. Each commit must leave the tree compiling. 11 commits (C1–C11).

| # | Title | Scope |
|---|---|---|
| **C1** | scaffold | `pnpm new:component data/todo-tree`. Top-level files stubbed. types.ts complete. meta.ts populated. manifest.ts entry added. Builds + ts-checks pass. |
| **C2** | reducer + state pipeline | lib/reducer.ts, lib/tree-walker.ts, lib/tree-mutators.ts, lib/filter-items.ts, lib/sort-items.ts, lib/flatten-tree.ts, lib/visible-items.ts, lib/circular-drop.ts, lib/permissions.ts, lib/dnd-payload.ts, lib/edge-zone.ts, lib/shallow.ts, lib/default-status-options.ts. All pure, unit-testable. |
| **C3** | hooks layer | hooks/use-todo-tree-state.ts (the hook), hooks/use-todo-tree-context.ts, hooks/use-controlled-mode.ts, hooks/use-tree-events.ts, hooks/use-selection.ts, hooks/use-debounced-callback.ts, hooks/use-status-option-by-value.ts. Hook standalone-usable post-this commit. |
| **C4** | row primitives | parts/todo-tree-chevron, status-indicator, checkbox, name, description, person-label, row-content. Pure presentational. Storybook-friendly. |
| **C5** | list + virtualization | parts/todo-tree-list, hooks/use-tree-virtual. Renders rows without DnD. |
| **C6** | Dual DnD wiring | parts/todo-tree-row (the full row with both bindings), parts/todo-tree-grip, parts/todo-tree-drop-indicator, parts/todo-tree-drag-overlay. hooks/use-tree-dnd-internal.ts (the @dnd-kit hooks). hooks/use-tree-dnd-html5.ts (HTML5 handlers). Internal + cross-procomp drag work. |
| **C7** | toolbar | parts/todo-tree-toolbar, todo-tree-search-input, todo-tree-sort-dropdown, todo-tree-filter-dropdown, todo-tree-filter-active-toggle, todo-tree-bulk-action-bar. F-cross-13 pre-emption applied. |
| **C8** | keyboard + a11y | hooks/use-tree-keyboard.ts, parts/todo-tree-keyboard-handler, parts/todo-tree-empty-state. Full WAI-ARIA tree pattern. |
| **C9** | wrapper + demo + usage + meta sync | todo-tree-with-editor.tsx. demo.tsx with 6+ sub-demos. usage.tsx with 7+ sections. meta.ts final pass. dummy-data.ts comprehensive. |
| **C10** | registry distribution + smoke | registry.json adds base + fixtures items. `pnpm registry:build` regen. F-cross-11 path-b smoke from `e:/tmp/ilinxa-smoke-consumer/`. Fix any F-S1 / F-cross-13 issues. |
| **C11** | GATE 3 spotcheck + status + tracking | docs/procomps/todo-tree-procomp/reviews/2026-MM-DD-v0.1.0-spotcheck.md. STATUS.md row + version-pointer + recent-activity. Decision file in `.claude/decisions/`. |

Tip-of-master after C11: todo-tree shipped via push to master, Vercel deploys, consumer can `pnpm dlx shadcn@latest add @ilinxa/todo-tree`.

---

## 19. Smoke harness plan (path-b)

Mandatory per readiness-review rule + F-cross-11 lock for v0.1.0 first ships.

### 19.1 Pre-smoke checklist (do BEFORE running smoke)

- [x] F-cross-13 pre-emption applied in C7 (Select callback widening + no delayDuration).
- [x] F-S1 cross-procomp imports use relative paths in all shipped source (verified via `grep -rE "@ilinxa/" src/registry/components/data/todo-tree/` — must return 0 matches in shipped files).
- [x] No barrel re-exports from cross-procomp (todo-rich-card types are type-only, imported per file).
- [x] `dependencies.internal: ["todo-rich-card"]` declared in meta.ts.

### 19.2 Smoke run

```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/todo-tree @ilinxa/todo-tree-fixtures --yes --overwrite
pnpm tsc --noEmit
```

Expected: 0 todo-tree errors. The 97 pre-existing errors in code-block / flow-canvas-01 / json-form / pdf-viewer remain unchanged.

### 19.3 If smoke fails

- F-cross-13 hits → widen the callback / drop the divergent prop → bump v0.1.1 → re-run smoke. Same pattern as todo-rich-card v0.1.0→v0.1.1.
- F-S1 import-path hits → fix relative paths → bump v0.1.1 → re-run smoke.
- New class → escalate to F-cross-NN in sweep-tracker.md.

### 19.4 Acceptance

GATE 3 spotcheck verdict requires F-04 (consumer-side smoke) to flip from Open → Closed. Re-smoke after every v0.1.x patch until clean.

---

## 20. Risks & alternatives

### 20.1 Risks not in description doc §9

| # | Risk | Mitigation |
|---|---|---|
| RP1 | Reducer pure-function purity violated by tree-mutators producing shared references | Use `structuredClone(items)` at the boundary OR strict immutable-update pattern with new arrays at every mutation level. Lock at C2. |
| RP2 | Visible-items memoization breaks when consumer passes new `permissions` object each render (identity churn) | `useTodoTreeContext` stabilizes permissions via shallow-compare in a `useMemo`. Documented in usage.tsx perf section. |
| RP3 | @dnd-kit's DragOverlay re-renders on every drag tick — heavy if drag overlay uses TodoRichCard-sized children | Default `<TodoTreeDragOverlay>` is the simplified one-line view; `renderDragOverlay` slot exists for full control. |
| RP4 | TodoTreeWithEditor wraps consumer's `onItemClick` — possible double-fire if consumer also passes their own | Wrapper composes both: setEditTarget(item) + delegate to consumer. Documented in usage.tsx. |
| RP5 | Filter "fade" mode with virtualization: faded rows still take row-height space, consuming virtualizer slots | This is intentional (visual indication of where they live in the tree); "hide" mode is the alternative for users who want them gone. |
| RP6 | Selection range across collapsed children | Range select walks `visibleItems` (not full tree) — collapsed children NOT selected even if visually between anchor and target. Document. |

### 20.2 Alternatives considered + rejected

| Alternative | Why rejected |
|---|---|
| Use @dnd-kit for cross-procomp too (drop HTML5 entirely) | todo-rich-card uses native HTML5; cross-procomp would not work. |
| Use HTML5 only (drop @dnd-kit) | No touch support. Q8 = a rejected this. |
| Headless-only (no `<TodoTree>` component, just hook + caller renders) | Too low-level for the "lightweight" promise; consumers would re-implement the 80% common UI. |
| Re-use todo-rich-card's `<TodoRichCard>` rendering in tree mode | Defeats the entire "lightweight" purpose. Already rejected in description doc. |
| Merge sort/filter/search into a single "query" string with mini-DSL | Over-engineering for v0.1; consumers can build that as a slot. |

---

## 21. Plan-stage open questions

| # | Question | Suggested answer |
|---|---|---|
| Q-P1 | **`<TodoTreeWithEditor>` edit-save behavior** — does v0.1 ship auto-persistence (wire TodoRichCard's onChange → setValue), or stays unwired (consumer wires onChange themselves if they want persistence)? | **Suggest**: ship auto-persistence. The wrapper IS the convenience path; making consumers wire onChange defeats the convenience. Internal: wrapper tracks its own items state, lifts changes via setValue on dialog close (or live during edit). |
| Q-P2 | **Default row height — 52px or other?** | **Suggest**: 52px (top-line ~24px + bottom-line ~16px + padding ~12px). Adjustable via `rowHeight` prop in v0.2. v0.1 ships fixed. |
| Q-P3 | **Bulk action bar placement — top-right of toolbar, or replacing the toolbar entirely when ≥1 selected?** | **Suggest**: top-right of existing toolbar (alongside search/sort/filter). Doesn't disrupt the toolbar layout; consumer sees both at once. |
| Q-P4 | **Search query persistence — debounced to state, OR raw input value mirrored to state with debounced effect?** | **Suggest**: debounced TO state (200ms). Raw value lives in local input ref. Cleaner state shape; matches usage expectations. |
| Q-P5 | **Filter pipeline order — filter then sort, or sort then filter?** | **Suggest**: filter THEN sort. Sorting filtered subset is always smaller (cheaper); user perceives "show me what matches, sorted by X". |
| Q-P6 | **`@dnd-kit` `DndContext` scope — mount it inside `<TodoTree>` OR require consumer to mount it externally?** | **Suggest**: mount internally. Consumers who already have a `DndContext` higher in their tree (e.g., kanban-board-01 wrapping TodoTree) need a way to opt out — provide `dndContext="external"` prop (boolean) that disables internal mounting. |
| Q-P7 | **Reducer dispatch from outside — should `dispatch` on `TodoTreeStateValue` accept the full `TodoTreeAction` union, or filter to public-safe actions only?** | **Suggest**: full union exposed. Marks as "escape hatch" in docs. Power users can dispatch SELECT_ALL directly; sanity checks live in reducer (e.g., MOVE_ITEM bans circular). |
| Q-P8 | **Touch-drag cross-procomp graceful degradation** — when a user tries to touch-drag a tree row toward a rich-card and nothing happens (because @dnd-kit doesn't write to dataTransfer), do we show a hint? | **Suggest**: no hint in v0.1. The behavior is internal-drag works on touch; cross-procomp doesn't. Document the limit in usage.tsx + dev-mode console warning if a touch drag exits the tree's drop zones. |

---

## 22. Definition of "done" for THIS document (stage gate)

- [ ] All 8 Q-P open questions in §21 answered with explicit picks before C1 starts.
- [ ] No new scope additions beyond description doc's locks (loud deviations only — fold into §7 of description on next revision).
- [ ] All 11 commits in §18 have a clear scope; can be implemented mechanically.
- [ ] User explicitly says "GATE 2 closed" (or equivalent).

### Loud deviations from description (plan-stage refinements)

| # | Where | Description shape | Plan shape | Reason |
|---|---|---|---|---|
| LD1 | §2.2 `visibleItems` | `TodoItem[]` (per description's API sketch) | `ReadonlyArray<{ item, level, parentId, index }>` | Renderer + slot consumers need level/parentId/index alongside the item for indent + DnD reparent. Description's English text ("flattened + filtered + sorted snapshot") supports this richer shape; the type annotation in §4 sketch was imprecise. Description's sketch is "NOT final" (line 189). |
| LD2 | §6.1 sensor config | Description L17 mentions "long-press 300ms" with claim "same UX as kanban-board-01" | Plan uses `MouseSensor` (distance: 5) + `TouchSensor` (delay: 300, tolerance: 5) separately — NOT kanban-board-01's unified PointerSensor | kanban-board-01's PointerSensor with no constraint activates immediately on touch, which would conflict with scroll. Splitting Mouse + Touch sensors gives the correct divergent UX (immediate mouse, long-press touch) that L17 actually intends. |

---

## Appendix A — Cross-reference matrix (description ↔ plan)

| Description lock | Plan section |
|---|---|
| L1 (slug + category) | §1, §4 file structure |
| L2 (shared schema) | §2.1, §13 cross-procomp imports |
| L3 (2-line row) | §12.1 row content, §15 E2 (no-children chevron) |
| L4 (collapsibility) | §5.1 state, §5.3 reducer TOGGLE_COLLAPSE / EXPAND_ALL / COLLAPSE_ALL |
| L5 (click → consumer popup) | §13 TodoTreeWithEditor, §9 canEditItem gate |
| L6 (DnD payload + edge zones) | §6 full DnD section, §15 E7/E9/E15 |
| L7 (permissions, 6 actions) | §9 full permission section |
| L8 (no auto-color) | §12.1 row content; no color logic |
| L9 (controlled + uncontrolled) | §11 three-defenses wiring |
| L10 (object-args events) | §2.2 event arg interfaces |
| L11 (F-cross-13 pre-emption) | §7.2 Select widening, §14.3 tooltip no delayDuration |
| L12 (Editor wrapper in same package) | §13, §14.2 dependencies.internal |
| L13 (multi-select) | §8 full multi-select section |
| L14 (toolbar sort/filter/search) | §7 full toolbar section |
| L15 (8 slot props) | §12 slot implementation + §12.2 priority rule |
| L16 (useTodoTreeState hook) | §2.2 TodoTreeStateValue, §5 state model, §18 C3 |
| L17 (Dual DnD = Q8 a) | §3.3 + §6 full DnD architecture |
| L18 (virtualization @≥200) | §10 full virtualization section |
| L19 (Delete/Backspace) | §16.3 keyboard map, §9 canRemoveItem gate |
| L20 (26-method handle) | §2.2 TodoTreeHandle, §3.1 reducer-as-engine |
| L21 (copy semantics cross-procomp) | §6.4 effectAllowed:"copy" |
| L22 (drop visual affordance) | §6.2 drop indicators, §12 drop-indicator part |
| L23 (circular-drop ban) | §6.3, lib/circular-drop.ts |
| L24 (single feature-complete v0.1) | §1 paragraph |

---

## Appendix B — File-LOC budget estimate (sanity check on R6 50+ files)

| Folder | Files | Avg LOC | Total LOC |
|---|---|---|---|
| Top-level | 8 | 200 | 1600 |
| parts/ | 20 | 80 | 1600 |
| hooks/ | 11 | 100 | 1100 |
| lib/ | 14 | 50 | 700 |
| **Total** | **53** | — | **~5000 LOC shipped** |

Larger than todo-rich-card (~4000 LOC). Comparable to code-block (~4500 LOC) and json-form (~5500 LOC). Within the project's authoring norm.
