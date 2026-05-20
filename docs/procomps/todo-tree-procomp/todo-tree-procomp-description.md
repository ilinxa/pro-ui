# `todo-tree` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** ✅ Signed off (GATE 1 closed 2026-05-20)
> **Slug:** `todo-tree` · **Category:** `data`
> **Release model:** **single feature-complete v0.1.** No phased v0.2 / v0.3 deferrals — every capability that belongs in this component ships on day one.
> **Conceptual lineage:** lightweight tree-row task lists (Things 3 outline, Linear sub-issue list, OmniFocus rows). **Sibling-of-[`todo-rich-card`](../todo-rich-card-procomp/)** — same `TodoItem` schema, but renders each item as a thin two-line row instead of the time-aware rich card chrome.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code.

---

## 1. Problem

`todo-rich-card@v0.1.1` ships a feature-rich task card with time-driven OKLCH urgency coloring, two edit modes, multi-images, multi-links, permission predicates, granular events. That richness is the point — for agent queues, content schedules, and SLA dashboards.

But many consumers want the **same `TodoItem` data shape** in a **lighter visual** — an outline of tasks, sub-tasks, and assignees with nothing more. Today they would:

- **Fork the rich card** — too much surface to maintain.
- **Use a generic tree component** (`file-tree`) — schema mismatch; FsNode is built for files.
- **Roll their own row component** — ergonomic, but they lose the cross-procomp DnD payload + the shared schema for upgrades-in-place.

`todo-tree` is the lightweight cousin. Same fixed `TodoItem` schema (cross-procomp dep on `@ilinxa/todo-rich-card`'s exported types), thin two-line row, recursive nesting with per-row collapsibility, shared DnD payload so a consumer can drag from a tree row into a `todo-rich-card`'s children-group and vice-versa. Clicking a row opens **the existing `todo-rich-card` popup-edit dialog** so we don't duplicate the edit surface.

### Release strategy — single feature-complete ship

User direction: **no v0.2 / v0.3 deferrals.** Every capability that belongs in this component ships in **v0.1.0**. The only items left out of v0.1 are the ones that *don't* belong in todo-tree (auto-color engine, rich-card-style image/link rendering, undo/redo) — those are deliberate design exclusions, not scheduled additions.

---

## 2. In scope / Out of scope

### v0.1 — in scope (FULL feature set)

**Data + schema**
- **Shared schema** with `todo-rich-card`. Cross-procomp dep on `@ilinxa/todo-rich-card` for the `TodoItem` type + `TodoStatusOption` + `TodoPermissions` types. Per F-S1 lock: import via **relative paths** in shipped source — `../todo-rich-card/types` from top-level files, `../../todo-rich-card/types` from `parts/`/`hooks/`/`lib/` subdirs. NEVER via the `@ilinxa/` package alias in shipped source.
- `defaultValue: TodoItem[]` (uncontrolled) AND `value: TodoItem[]` (controlled with `onChange`) — both modes ship.
- Controlled mode applies the three-defenses pattern (microtask-defer + structural resync guard + suppress mid-drag onChange) per the controlled-mode memory.

**Row composition (the 2-line layout)**
- **Top line, left-to-right:** chevron (collapsibility toggle) · status indicator (slottable; dot default + strip variant + custom render) · checkbox (toggles `active`, fires `onActiveToggled`) · name in **bold** (primary text).
- **Top line, right edge:** target-person label (just the `name` field as inline text; no avatar in v0.1). Hidden if no `targetPerson`.
- **Bottom line:** description preview — thin, muted, single-line, ellipsis-truncated. Hidden if no description.
- Hover state: row gets a subtle `bg-accent/30` lift. Focus-visible: ring + slight indent shift.
- Selected state (when in multi-select): `bg-accent/50` + check-mark indicator at row start.

**Collapsibility**
- Per-row chevron toggles that row's `children` visibility. UI-only state — `collapsedIds: ReadonlySet<string>`, not part of `TodoItem`, doesn't persist via JSON I/O. Mirrors todo-rich-card v0.1.0's collapsibility scope-expansion lock.
- Default: all expanded. `defaultCollapsedIds?: ReadonlyArray<string>` prop available for opening to a specific collapsed snapshot.
- `expandAll()` / `collapseAll()` on the imperative handle.

**Multi-select + bulk ops**
- Selection model: per-row click selects (single); Shift-click extends contiguous range; Cmd/Ctrl-click toggles individual rows in/out of the selection.
- Selected items highlighted; `selectedIds: ReadonlySet<string>` UI-only state. State ownership: bare `<TodoTree>` holds selection internally; consumers who need to LIFT the selection (e.g., to drive a header counter elsewhere on the page) use `useTodoTreeState` + pass the hook's state via the `state` prop. `onSelectionChanged` fires either way.
- **Bulk actions** via dedicated callbacks: `onBulkToggleActive`, `onBulkRemove`, `onBulkEdit`. Default toolbar exposes these as buttons when ≥1 row selected. Consumers using the headless hook wire their own UI.
- Imperative handle: `selectItem(id)` / `deselectItem(id)` / `selectRange(idA, idB)` / `selectAll()` / `clearSelection()` / `getSelectedIds()`.

**Sort / filter / search default toolbar**
- Optional `toolbar` prop (`"default" | "none" | ReactNode`). Default = rendered above the tree with: search input (debounced 200ms), sort dropdown (by name / by setAt / by expireAt / by status / custom function), filter dropdown (by status — multi-select chips + by-active toggle + by-person multi-select).
- Search/filter applied as a non-destructive overlay (items don't move in the tree; non-matching rows fade to 30% opacity OR are hidden depending on `filterMode: "fade" | "hide"`).
- Toolbar mounts above the tree; consumer can hide via `toolbar="none"` and use the headless hook for BYO UI.

**Headless state hook**
- `useTodoTreeState(initialValue, options)` returns the **`TodoTreeStateValue`** object — a superset of `TodoTreeHandle`'s surface plus the live state values that the toolbar needs. Shape:
  - Data: `items`, `setItems`, `visibleItems` (flattened + filtered + sorted snapshot)
  - Item ops (same as handle): `addItem`, `removeItem`, `addChild`, `removeItems`, `toggleActive`, `toggleActiveBulk`
  - Collapse state + ops: `collapsedIds`, `toggleCollapse`, `expandItem`, `collapseItem`, `expandAll`, `collapseAll`, `isCollapsed`
  - Selection state + ops: `selectedIds`, `selectItem`, `deselectItem`, `selectRange`, `selectAll`, `clearSelection`
  - Query/sort/filter state + ops: `query`, `sort`, `filter`, `setQuery`, `setSort`, `setFilter`, `clearAllFilters`
  - Lookup: `getItemById`
  - Escape hatch: `dispatch(action)` for advanced reducer customization
- Consumers who want to host their own toolbar / row layout / list virtualization import the hook and render their own UI; `<TodoTree>` itself uses the same hook internally.

**Click-to-edit (REUSED dialog)**
- Tree itself does NOT mount a popup edit form. Click a row → fires `onItemClick(args)` callback. Consumer wires this to mount **`<TodoRichCard editable defaultValue={item} />` inside their own `<Dialog>`** — same renderer-convention pattern as rich-card-in-flow's `onEditRequest`.
- v0.1 ships a `<TodoTreeWithEditor>` convenience export that does the wiring automatically using todo-rich-card's edit popup. Consumers who want full control use `<TodoTree>` directly + their own dialog wiring.

**DnD — shared payload, internal + cross-procomp**
- Drag source: every row is draggable via a **hover-revealed grip strip** on the left edge (invisible at rest; fades in on row hover). On touch, long-press (300ms) starts the drag without the visual grip — same UX as kanban-board-01.
- Payload MIME: `application/x-ilinxa-todo+json` (shared with todo-rich-card; cross-procomp drag works in both directions).
- **State on drop:** in uncontrolled mode, every successful drop mutates internal state directly + fires `onChange` with the new tree + reason. In controlled mode, drops fire `onChange` only — consumer applies the mutation + feeds it back via `value`. Controlled mode MUST use the three-defenses pattern; GATE 2 plan enforcement requirement.
- Drop zones, per-row, via edge-detection:
  - **Top edge (top 25%, capped at 8px)** → insert as previous sibling of this row.
  - **Bottom edge (bottom 25%, capped at 8px)** → insert as next sibling of this row.
  - **Middle 50%** → reparent: drop appends as the **last** child of this row. Row auto-expands if collapsed so the user sees the result.
- Visual dragover affordances: top/bottom zones show a horizontal accent-colored line between rows; middle zone shows a subtle inner-glow ring on the target row.
- Default drag overlay (the visual that follows the cursor): a simplified one-line view of the dragged row (name only, bold, no description / no checkbox / no person) inside a thin bordered card. Override via `renderDragOverlay` slot.
- Circular-drop prevention: hit-test bans drops where source `id` is an ancestor of target. Fires `onPermissionDenied` with reason `"circular-drop"`.
- Cross-procomp drag semantics: **copy by default** — source row stays in the tree when dragged out. Consumer can listen to `onItemDropped` with `from: "external"` and remove the source themselves for move semantics.

**Permissions**
- Reuses todo-rich-card's `TodoPermissions` shape. Same `{default, byLevel, byItem, inherit}` matrix with predicate functions. Tree gates:
  - **canEditItem** — gates click-to-open-edit (row stays selectable but the click is a no-op + fires `onPermissionDenied`).
  - **canToggleActive** — gates the checkbox (rendered but `aria-disabled` + no interaction).
  - **canDragItem** — gates drag-source for that row (grip strip not rendered).
  - **canDropIntoChildren** — gates middle-zone drop into that row.
  - **canDropAsSibling** — gates top/bottom-edge drop next to that row.
  - **canRemoveItem** — gates Delete/Backspace key + bulk-remove for that row.
- Reuses the same `onPermissionDenied(args: { action, itemId, reason })` callback signature.

**Imperative handle (full surface)**
- Tree state: `getValue(): TodoItem[]` / `setValue(next: TodoItem[]): void`
- Item ops: `addItem(item, opts?: { parentId?: string; index?: number }): void` / `removeItem(id: string): void` / `addChild(parentId: string, item: TodoItem, index?: number): void`
- Active toggle: `toggleActive(id: string, nextActive: boolean): void` (single) / `toggleActiveBulk(ids: string[], nextActive: boolean): void` (bulk)
- Bulk remove: `removeItems(ids: string[]): void`
- Focus / nav: `focusItem(id: string): void` / `getItemById(id: string): TodoItem | undefined`
- Collapse: `expandItem(id)` / `collapseItem(id)` / `toggleCollapse(id)` / `expandAll()` / `collapseAll()` / `isCollapsed(id): boolean`
- Selection: `selectItem(id)` / `deselectItem(id)` / `selectRange(idA, idB)` / `selectAll()` / `clearSelection()` / `getSelectedIds(): ReadonlySet<string>`
- Query / sort / filter: `setQuery(query: string)` / `setSort(sort: TodoTreeSort)` / `setFilter(filter: TodoTreeFilter)` / `clearAllFilters()`

**Events — object-args throughout (post-F-cross-12 convention)**
- `onChange(args: { items: TodoItem[]; reason: TodoTreeChangeReason })` — fires on any tree mutation. `reason` is one of `"reorder" | "reparent" | "toggle-active" | "imperative-set" | "drop-from-external" | "add-item" | "remove-item" | "add-child" | "bulk-toggle-active" | "bulk-remove"`.
- `onItemClick(args: { item: TodoItem; level: number; event: React.MouseEvent })` — fires on row click; consumer typically routes to a popup edit.
- `onItemContextMenu(args: { item: TodoItem; level: number; event: React.MouseEvent })` — fires on right-click; consumer wires their own menu.
- `onActiveToggled(args: { item: TodoItem; nextActive: boolean })`.
- `onCollapseToggled(args: { item: TodoItem; collapsed: boolean })`.
- `onItemMoved(args: { item: TodoItem; from: { parentId: string \| null; index: number }; to: { parentId: string \| null; index: number }; via: "drag" \| "imperative" })`.
- `onItemDropped(args: { item: TodoItem; from: "internal" \| "external"; targetParentId: string \| null; targetIndex: number })`.
- `onItemAdded(args: { item: TodoItem; parentId: string \| null; index: number; via: "imperative" \| "drop-from-external" })`.
- `onItemRemoved(args: { item: TodoItem; via: "imperative" \| "keyboard" \| "bulk" })`.
- `onBulkToggleActive(args: { ids: ReadonlyArray<string>; nextActive: boolean })`.
- `onBulkRemove(args: { ids: ReadonlyArray<string> })`.
- `onBulkEdit(args: { ids: ReadonlyArray<string> })` — fires when bulk-edit button in default toolbar clicked; consumer routes to a bulk-edit dialog.
- `onSelectionChanged(args: { selectedIds: ReadonlySet<string> })`.
- `onSearchChanged(args: { query: string })` · `onSortChanged(args: { sort: TodoTreeSort })` · `onFilterChanged(args: { filter: TodoTreeFilter })`.
- `onPermissionDenied(args: { action: TodoTreePermissionAction; itemId: string; reason: TodoTreePermissionDenialReason })`.

**Slot props — full slotting on day one**
- `renderRow?: (args: { item; level; isSelected; isCollapsed; isExpanded; defaultRender; }) => ReactNode` — replace the whole row paint.
- `renderName?: (args: { item; level }) => ReactNode` — replace just the name span.
- `renderDescription?: (args: { item; level }) => ReactNode` — replace the description preview.
- `renderPerson?: (args: { item; level }) => ReactNode` — replace the person label.
- `renderStatusIndicator?: (args: { item; level; statusOption }) => ReactNode` — replace the status dot. Built-in alternatives `"dot" | "strip" | "none"` selectable via `statusIndicator` prop without slot.
- `renderToolbar?: (args: { defaultToolbar; state }) => ReactNode` — replace the default toolbar.
- `renderEmptyState?: (args: { hasFilter: boolean }) => ReactNode` — replace the "No tasks." placeholder.
- `renderDragOverlay?: (args: { item; level }) => ReactNode` — replace the drag preview.
- **Priority rule:** when both a render-prop slot AND a prop variant are provided for the same surface (`renderStatusIndicator` + `statusIndicator`, `renderToolbar` + `toolbar`), the **slot wins**. Toolbar fallback chain: `renderToolbar` → `toolbar` as `ReactNode` → `toolbar === "default"` (built-in) → `toolbar === "none"` (no toolbar).

**Optional virtualization**
- `virtualize?: boolean | { threshold?: number }` prop. Default = auto-enable when **flattened visible items** ≥ 200 rows. Uses `@tanstack/react-virtual` under the hood (already a peer dep via other procomps).
- Virtualized mode keeps the same DOM structure; only the row body is virtual-windowed. Drag preview + drop zones remain pixel-accurate.

**Accessibility (full WAI-ARIA tree pattern)**
- Root: `role="tree"`. Each row: `role="treeitem"` with `aria-level`, `aria-expanded` (when has children), `aria-selected` (when in multi-select).
- Checkbox: native `<input type="checkbox">` with proper `<label>` association.
- Keyboard:
  - `Arrow Down` / `Arrow Up` — move focus between visible rows (skipping collapsed children).
  - `Arrow Right` — expand collapsed row, OR move into first child if already expanded.
  - `Arrow Left` — collapse expanded row, OR move to parent if already collapsed.
  - `Home` / `End` — first / last visible row.
  - `Space` — toggle the checkbox.
  - `Enter` — fire `onItemClick`.
  - `Delete` / `Backspace` — remove focused row (gated on `canRemoveItem`).
  - `Cmd/Ctrl + A` — select all visible rows.
  - `Cmd/Ctrl + Click` — toggle row in/out of selection.
  - `Shift + Click` — extend contiguous selection.
  - `Escape` — clear selection + close any open menus.

**Touch DnD — DUAL DnD system (Q8 = a, locked)**
- Long-press (300ms) on a row starts a drag — same UX as kanban-board-01. Visual affordance (row lifts + casts a shadow) signals the drag-ready state.
- Internal tree drag (within todo-tree) uses `@dnd-kit` with `PointerSensor` — full touch support, edge-zone detection, custom drop indicator, no native dataTransfer.
- Cross-procomp drag (out of tree into todo-rich-card, or in from todo-rich-card) uses native HTML5 `dataTransfer` with the shared `application/x-ilinxa-todo+json` MIME — required for compat with todo-rich-card's HTML5 DnD.
- Every tree row carries BOTH event subscriptions; only one fires at a time depending on what the user grabs. GATE 2 plan locks the activation rules.

**Visual / theming**
- Holds the design tokens (Onest sans, JetBrains mono, signal-lime accent, OKLCH colors per [`src/app/globals.css`](../../src/app/globals.css)).
- **No auto-color engine** — tree rows are deliberately monochrome. The status-indicator dot is the one color expression, sourced from consumer-defined `statusOptions`.
- Indent step: configurable via `indentSize?: number` (pixels per level; default 20).

### v0.1 — out of scope (deliberate design exclusions; NOT future deferrals)

- **Auto-color engine.** Removed deliberately — the lightweight framing IS the whole point. Consumers needing time-driven urgency on tasks use `todo-rich-card`.
- **Images / links / nested fields rendering.** Tree row is intentionally just 2 lines; consumers needing richer paint use `todo-rich-card` instead.
- **Undo / redo.** Same posture as todo-rich-card v0.1. Consumers wire optimistic-undo at the data layer.
- **SSR-frozen-now.** Tree has no time-driven visual state; pure SSR-clean — nothing to defer.
- **Direct edit-in-row.** Inline editing IS the rich card's job; here, click → popup.

---

## 3. Target consumers

| Consumer | Why this and not `todo-rich-card`? |
|---|---|
| Admin dashboards with a side-panel todo outline | Compact rows fit the cramped space; popup edit is the rare interaction, not the default. |
| Sub-issue / sub-task lists embedded in a parent detail page | Header is owned by the parent; tree just renders the children. |
| Hierarchical task pickers (drag a task from this side, drop into a board on the other) | The cross-procomp DnD payload is the entire value prop here. |
| Markdown-style todo outlines (`- [ ] x`) | Two-line row + indent + checkbox is exactly the mental model. |
| Bulk-management of long task lists (project audits, backlog triage) | Multi-select + bulk ops + search/filter on by-default. |

---

## 4. Rough API sketch (NOT final — that's the plan stage)

```tsx
import type {
  TodoItem,
  TodoStatusOption,
  TodoPermissions,
} from "@ilinxa/todo-rich-card";  // type-only cross-procomp import

export type TodoTreeChangeReason =
  | "reorder" | "reparent" | "toggle-active" | "imperative-set"
  | "drop-from-external" | "add-item" | "remove-item" | "add-child"
  | "bulk-toggle-active" | "bulk-remove";

export type TodoTreeSort =
  | { kind: "name" | "setAt" | "expireAt" | "status"; direction: "asc" | "desc" }
  | { kind: "custom"; compare: (a: TodoItem, b: TodoItem) => number };

export interface TodoTreeFilter {
  statuses?: ReadonlyArray<string>;
  personIds?: ReadonlyArray<string>;
  active?: "all" | "active" | "inactive";
}

export interface TreeLocation {
  parentId: string | null;          // null = top-level
  index: number;                    // position in parent.children[] (or top-level items[])
}

// Returned by useTodoTreeState; consumers can also pass via the `state` prop.
// Superset of TodoTreeHandle plus live state values.
export interface TodoTreeStateValue extends TodoTreeHandle {
  items: TodoItem[];
  visibleItems: TodoItem[];         // flattened + filtered + sorted snapshot
  collapsedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  dispatch: (action: TodoTreeAction) => void;  // escape hatch
}

export interface TodoTreeProps {
  // Data
  defaultValue?: TodoItem[];
  value?: TodoItem[];                    // controlled
  onChange?: (args: { items: TodoItem[]; reason: TodoTreeChangeReason }) => void;
  state?: TodoTreeStateValue;            // lifted from useTodoTreeState(); supersedes value/defaultValue

  // Consumer-defined enum + colors for the status indicator
  statusOptions?: TodoStatusOption[];

  // Permissions
  permissions?: TodoPermissions;
  onPermissionDenied?: (args: { action: TodoTreePermissionAction; itemId: string; reason: TodoTreePermissionDenialReason }) => void;

  // Behavior
  readOnly?: boolean;
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  indentSize?: number;                   // default 20
  filterMode?: "fade" | "hide";          // default "fade"
  statusIndicator?: "dot" | "strip" | "none";   // default "dot"
  virtualize?: boolean | { threshold?: number }; // default auto (≥200 rows)
  toolbar?: "default" | "none" | ReactNode;     // default "default"

  // Slots
  renderRow?: (args: { item: TodoItem; level: number; isSelected: boolean; isCollapsed: boolean; isExpanded: boolean; defaultRender: ReactNode }) => ReactNode;
  renderName?: (args: { item: TodoItem; level: number }) => ReactNode;
  renderDescription?: (args: { item: TodoItem; level: number }) => ReactNode;
  renderPerson?: (args: { item: TodoItem; level: number }) => ReactNode;
  renderStatusIndicator?: (args: { item: TodoItem; level: number; statusOption?: TodoStatusOption }) => ReactNode;
  renderToolbar?: (args: { defaultToolbar: ReactNode; state: TodoTreeStateValue }) => ReactNode;
  renderEmptyState?: (args: { hasFilter: boolean }) => ReactNode;
  renderDragOverlay?: (args: { item: TodoItem; level: number }) => ReactNode;

  // Events (subset — full list in §2)
  onItemClick?: (args: { item: TodoItem; level: number; event: React.MouseEvent }) => void;
  onItemContextMenu?: (args: { item: TodoItem; level: number; event: React.MouseEvent }) => void;
  onActiveToggled?: (args: { item: TodoItem; nextActive: boolean }) => void;
  onCollapseToggled?: (args: { item: TodoItem; collapsed: boolean }) => void;
  onItemMoved?: (args: { item: TodoItem; from: TreeLocation; to: TreeLocation; via: "drag" | "imperative" }) => void;
  onItemDropped?: (args: { item: TodoItem; from: "internal" | "external"; targetParentId: string | null; targetIndex: number }) => void;
  onItemAdded?: (args: { item: TodoItem; parentId: string | null; index: number; via: "imperative" | "drop-from-external" }) => void;
  onItemRemoved?: (args: { item: TodoItem; via: "imperative" | "keyboard" | "bulk" }) => void;
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

export interface TodoTreeHandle {
  // Tree state
  getValue(): TodoItem[];
  setValue(next: TodoItem[]): void;

  // Item ops
  addItem(item: TodoItem, opts?: { parentId?: string; index?: number }): void;
  removeItem(id: string): void;
  addChild(parentId: string, item: TodoItem, index?: number): void;
  removeItems(ids: string[]): void;
  toggleActive(id: string, nextActive: boolean): void;
  toggleActiveBulk(ids: string[], nextActive: boolean): void;

  // Focus / nav
  focusItem(id: string): void;
  getItemById(id: string): TodoItem | undefined;

  // Collapse
  expandItem(id: string): void;
  collapseItem(id: string): void;
  toggleCollapse(id: string): void;
  expandAll(): void;
  collapseAll(): void;
  isCollapsed(id: string): boolean;

  // Selection
  selectItem(id: string): void;
  deselectItem(id: string): void;
  selectRange(idA: string, idB: string): void;
  selectAll(): void;
  clearSelection(): void;
  getSelectedIds(): ReadonlySet<string>;

  // Query / sort / filter
  setQuery(query: string): void;
  setSort(sort: TodoTreeSort): void;
  setFilter(filter: TodoTreeFilter): void;
  clearAllFilters(): void;
}

// Convenience export — bare <TodoTree> + todo-rich-card's edit popup wired
// inside a Dialog for the common "I just want a tree with edit" case.
export function TodoTreeWithEditor(props: TodoTreeProps): JSX.Element;

// Headless state hook — consumers using slots heavily or building their own
// UI lift the state out via this and render `<TodoTree state={state} />`.
export function useTodoTreeState(
  initialValue?: TodoItem[],
  options?: { defaultSort?: TodoTreeSort; defaultFilter?: TodoTreeFilter },
): TodoTreeStateValue;
```

---

## 5. Example usages

### 5.1 — Minimal standalone

```tsx
import { TodoTree } from "@ilinxa/todo-tree";
import type { TodoItem } from "@ilinxa/todo-rich-card";

const items: TodoItem[] = [
  {
    id: "task-1",
    name: "Ship Q3 plan",
    status: "todo",
    active: true,
    setAt: "2026-05-20T09:00:00Z",
    description: "Outline goals, OKRs, and risks for the team review.",
    targetPerson: { id: "u-1", name: "Ada" },
    children: [
      { id: "task-1a", name: "Draft outline", status: "todo", active: true, setAt: "2026-05-20T09:00:00Z" },
      { id: "task-1b", name: "Review with leads", status: "todo", active: false, setAt: "2026-05-20T09:00:00Z" },
    ],
  },
];

export function Example() {
  return <TodoTree defaultValue={items} aria-label="Q3 planning tasks" />;
}
```

### 5.2 — With consumer-owned popup edit (the canonical wiring)

```tsx
import { useState } from "react";
import { TodoTree } from "@ilinxa/todo-tree";
import { TodoRichCard } from "@ilinxa/todo-rich-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function Example() {
  const [editTarget, setEditTarget] = useState<TodoItem | null>(null);

  return (
    <>
      <TodoTree
        defaultValue={items}
        onItemClick={({ item }) => setEditTarget(item)}
        onBulkEdit={({ ids }) => {/* open bulk edit dialog */}}
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

### 5.3 — Or simpler with the convenience wrapper

```tsx
import { TodoTreeWithEditor } from "@ilinxa/todo-tree";

export function Example() {
  return <TodoTreeWithEditor defaultValue={items} />;
}
```

### 5.4 — Fully headless via the hook

```tsx
import { TodoTree, useTodoTreeState } from "@ilinxa/todo-tree";

export function Example() {
  const state = useTodoTreeState(items, { defaultSort: { kind: "setAt", direction: "asc" } });
  return (
    <>
      <MyCustomToolbar
        query={state.query}
        onQueryChange={state.setQuery}
        sort={state.sort}
        onSortChange={state.setSort}
        selectedCount={state.selectedIds.size}
        onBulkRemove={() => state.removeItems([...state.selectedIds])}
      />
      <TodoTree state={state} toolbar="none" />
    </>
  );
}
```

### 5.5 — Slot the row paint

```tsx
<TodoTree
  defaultValue={items}
  renderRow={({ item, level, defaultRender }) => (
    <div className="my-custom-row" data-level={level}>
      {defaultRender}
      <button onClick={() => doSomething(item)}>Custom action</button>
    </div>
  )}
/>
```

### 5.6 — Cross-procomp drag (tree ↔ rich card)

No consumer code change beyond mounting both components on the page. The shared `application/x-ilinxa-todo+json` MIME makes drags between them automatic.

---

## 6. Success criteria

1. Render an array of `TodoItem`s as a two-line row tree with the locked layout (chevron + status-indicator + checkbox + bold name + person-label on top; description preview on bottom).
2. Recursive children with per-row collapsibility — toggle works, persists across re-renders, default-expanded.
3. Inline checkbox toggles `active`; fires `onActiveToggled` with the new boolean.
4. Click-to-open-edit fires `onItemClick`; convenience wrapper `<TodoTreeWithEditor>` mounts a TodoRichCard inside a Dialog without further wiring.
5. Drag from any tree row to (a) another tree row's top/bottom/middle zone (internal reorder + reparent) AND (b) a `todo-rich-card`'s children-group (cross-procomp).
6. Receive drags from todo-rich-card (cross-procomp, same payload MIME). Cross-procomp drags work in BOTH directions on the live demo.
7. Permission matrix gates the six tree-side actions correctly; `onPermissionDenied` fires with typed args on denial. Circular-drop prevention works.
8. Multi-select via Shift-click + Cmd/Ctrl-click works; selection visible in row paint; bulk-toggle-active / bulk-remove / bulk-edit callbacks fire with correct ids.
9. Default toolbar shows search + sort + filter when `toolbar="default"`; search debounces 200ms; filter applies as non-destructive overlay per `filterMode`.
10. Headless hook (`useTodoTreeState`) round-trips state correctly when consumer hosts the toolbar themselves.
11. All eight slot props render correctly when provided; defaults work when omitted.
12. Virtualization auto-enables at ≥200 rows; drag + drop zones still pixel-accurate while virtualized.
13. Imperative handle methods all work (add / remove (single + bulk) / addChild / toggleActive (single + bulk) / focus / expand/collapse / select / setQuery/Sort/Filter).
14. Keyboard navigation matches the WAI-ARIA tree pattern + Delete/Backspace remove + Cmd-A select all + Shift-click range.
15. Touch DnD works on a touch device (or DevTools touch emulation): long-press lifts a row, edge-zones still detected. **(Q8 locked = option (a) Dual DnD — must verify both pointer + touch on internal drag, and HTML5 cross-procomp drag on pointer.)**
16. Live demo on `/components/todo-tree` shows: a flat list, a nested list, a permissions-locked subtree, drag-to-reparent in action, the toolbar with search + sort + filter, multi-select + bulk actions, slot prop demonstration, virtualization at scale (≥500 rows), and cross-procomp drag with a `todo-rich-card` mounted alongside.

---

## 7. Locked decisions (recorded here pre-sign-off)

| # | Lock | Notes |
|---|---|---|
| L1 | Slug = `todo-tree`, category = `data` | Consistent with todo-rich-card's category. |
| L2 | Shared `TodoItem` schema via cross-procomp dep on `@ilinxa/todo-rich-card` | Relative-path import in shipped source per F-S1 lock. |
| L3 | Two-line row layout: top = chevron + status-indicator + checkbox + bold name + person-label-right; bottom = thin truncated description | Pixel-level layout details (line height, gap, font sizes) deferred to GATE 2 plan. |
| L4 | Per-row collapsibility via chevron; UI-only state (`collapsedIds`), not in `TodoItem`; default expanded | Mirrors todo-rich-card v0.1.0's collapsibility lock. |
| L5 | Click row → fires `onItemClick` (consumer owns popup); ship `<TodoTreeWithEditor>` convenience wrapper that mounts a shared `<TodoRichCard editable>` in a `<Dialog>` | NO duplicate edit-form maintenance. |
| L6 | DnD payload MIME = `application/x-ilinxa-todo+json` (shared with todo-rich-card); edge-zones: top 25% (cap 8px) = sibling-prev, bottom 25% (cap 8px) = sibling-next, middle 50% = reparent-as-last-child | Cross-procomp drags work both directions; copy semantics by default. |
| L7 | Permissions matrix reuses `TodoPermissions` type from todo-rich-card; gates 6 tree-side actions | `canEditItem`, `canToggleActive`, `canDragItem`, `canDropIntoChildren`, `canDropAsSibling`, `canRemoveItem`. |
| L8 | No auto-color engine; tree rows monochrome; status indicator is the one color expression | Lighter-weight framing is the entire point. |
| L9 | Both uncontrolled (`defaultValue`) and controlled (`value` + `onChange`) modes ship | Controlled mode triggers three-defenses pattern per [`project_controlled_mode_two_defenses.md`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_controlled_mode_two_defenses.md). |
| L10 | All events use object-args (post-F-cross-12) | Consistent with todo-rich-card. |
| L11 | **F-cross-13 pre-emption locked.** GATE 2 plan must widen any `Select.onValueChange` callbacks to `(v: string \| null) => ...` and drop `delayDuration` from `TooltipProvider` — applies pre-emptively to any primitive used. Toolbar Sort + Filter dropdowns are the largest surface. | Pre-emption saves the same-day patch cycle we just shipped on todo-rich-card v0.1.1 (`431da34`). |
| L12 | `<TodoTreeWithEditor>` ships in the same package; carries a hard runtime dep on `@ilinxa/todo-rich-card` declared in `dependencies.internal` | Bare `<TodoTree>` carries only the type-import dep, no runtime dep — sub-path import in usage.tsx documents the lighter-weight path for consumers who don't want todo-rich-card mounted. |
| L13 | Multi-select shipped in v0.1 | Shift-click range + Cmd/Ctrl-click toggle + Cmd-A select all + Escape clear; bulk callbacks ship; default toolbar surfaces bulk buttons. |
| L14 | Sort/filter/search default toolbar shipped in v0.1 | `toolbar="default"` (default) renders it; `"none"` hides; ReactNode replaces. Search debounce 200ms. Filter mode `"fade" \| "hide"`, default `"fade"`. |
| L15 | Full slot-prop surface shipped in v0.1 — 8 slots covering row, name, description, person, status-indicator, toolbar, empty-state, drag-overlay | Dynamic-and-reusable primacy per the memory feedback; "add it later" is a breaking change. |
| L16 | Headless `useTodoTreeState` hook shipped in v0.1 | Consumers using slots heavily OR building their own UI lift state via this. |
| L17 | **Touch DnD shipped in v0.1 via DUAL DnD system (Q8 = option a, locked 2026-05-20).** Every tree row is BOTH an `@dnd-kit` Draggable (drives internal reorder + reparent with full touch support via `PointerSensor` + activationConstraint) AND a native HTML5 drag source/target (drives cross-procomp drag with todo-rich-card via shared `application/x-ilinxa-todo+json` MIME). The two systems run in parallel; tree-internal drag uses @dnd-kit, cross-procomp drag uses HTML5. New peer deps: `@dnd-kit/core` (already in `kanban-board-01`). | GATE 2 plan must lock the row-level event ordering (which system claims drag-start when both are armed) + the @dnd-kit → HTML5 handoff strategy if the user drags out of the tree mid-@dnd-kit-drag. |
| L18 | Virtualization shipped in v0.1; auto-enables at ≥200 visible rows | Uses `@tanstack/react-virtual` (existing peer dep). DOM structure unchanged when virtualized. |
| L19 | Keyboard delete (`Delete` / `Backspace`) shipped in v0.1, gated on `canRemoveItem` | Paired with imperative `removeItem(id)` for programmatic remove. |
| L20 | Full imperative handle shipped in v0.1 (no future-deferred methods) | 26 methods covering tree state, item ops, single + bulk active-toggle + remove, focus, collapse, selection, query/sort/filter. |
| L21 | Cross-procomp drag semantics = copy by default | Consumer wires move semantics via `onItemDropped` + their own state. Mirrors todo-rich-card. |
| L22 | Drop visual affordance: horizontal accent line for sibling zones; inner-glow ring for middle/reparent zone | Plan-stage will lock the exact pixel/timing values. |
| L23 | Circular-drop prevention: hit-test bans drops where source `id` is an ancestor of target | Fires `onPermissionDenied` with reason `"circular-drop"`. |
| L24 | Single feature-complete v0.1 — no scheduled v0.2 / v0.3 | The only follow-up bumps would be (a) bug-fix patches and (b) responsive additions if real consumers surface needs we didn't anticipate. |

---

## 8. Open questions to lock during sign-off

Pre-answered where the answer is obvious; only genuinely open items remain as Qs:

| # | Question | Suggested answer |
|---|---|---|
| Q1 | **Drag handle visual:** grip strip on hover (invisible at rest) OR a permanent thin grip strip on the left edge? | **Suggest**: grip-on-hover. Cleaner at rest; affordance still discoverable. |
| Q2 | **Description preview source:** existing `description` field directly OR a separate `summary?` field on `TodoItem`? | **Suggest**: existing `description` field with CSS ellipsis. Adding `summary?` to TodoItem mutates todo-rich-card's schema — avoid the cross-procomp ripple. |
| Q3 | **Status indicator default visual:** dot vs left-edge strip vs none? | **Suggest**: `"dot"` default; `"strip"` and `"none"` selectable via prop. `renderStatusIndicator` slot for fully custom. |
| Q4 | **Bulk edit popup:** does `<TodoTreeWithEditor>` ship a built-in bulk-edit dialog or just expose `onBulkEdit`? | **Suggest**: just expose `onBulkEdit`. Bulk-edit UX is too consumer-specific (which fields to bulk-set?) to bake a default. Single-edit popup IS baked because the single TodoRichCard handles it cleanly. |
| Q5 | **Search algorithm:** plain `.includes()` on `name` + `description` (case-insensitive) OR fuzzy (e.g., fuse.js)? | **Suggest**: plain case-insensitive `.includes()`. Fuzzy adds 8KB peer dep for marginal gain; consumers wanting fuzzy slot a custom toolbar via `renderToolbar`. |
| Q6 | **Filter `"hide"` mode behavior:** when a parent matches but a child doesn't (or vice versa), what shows? | **Suggest**: ancestor-of-match always renders (even if it doesn't match itself); match descendants render; non-match siblings disappear. Mirrors VSCode's file-tree filter. |
| Q7 | **Persisted selection across data changes:** if a selected row's `id` no longer exists in the new `value`, do we drop it from selection silently or fire an event? | **Suggest**: drop silently. `onSelectionChanged` will fire reflecting the new state — consumer can detect via diff if they care. |
| Q8 | **Touch DnD implementation strategy** | ✅ **LOCKED: option (a) — Dual DnD system.** `@dnd-kit` for internal tree drag (touch-supported via PointerSensor + activationConstraint) + native HTML5 `dataTransfer` for cross-procomp source/target. Each row carries both event subscriptions. New peer dep: `@dnd-kit/core` (already used by kanban-board-01, so verified). GATE 2 plan locks the activation rules + handoff strategy. |

---

## 9. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | The "convenience wrapper mounts todo-rich-card" model means todo-tree carries a hard runtime dep on todo-rich-card (not just types). | Locked at L12 — bundled in the same package; bare `<TodoTree>` is the lighter path. Documented loudly in usage.tsx. |
| R2 | Edge-zone drop math can feel sticky if rows are short. | L6 caps edge zones at 8px to keep middle-zone reachable even on small rows. |
| R3 | Reparenting via middle-zone drop is unintuitive without affordance. | L22 locks the visual affordance (line vs glow). |
| R4 | Cross-procomp drags can create circular trees if a parent is dragged into its own child. | L23 — hit-test ban + `onPermissionDenied`. |
| R5 | Imperative `setValue` bypassing `onChange` is a documented escape hatch but consumers may misuse it as the primary mutation path. | Document loudly in guide.md and usage.tsx: `setValue` is for replace-all, not for incremental edits. |
| R6 | Component complexity: 24 locks, 8 slot props, 17 events, 26-method handle + extended state hook, virtualization, multi-select, toolbar — this is the largest single procomp surface in the project. | GATE 2 plan must enforce strict folder organization (parts/ split per UI subsystem, hooks/ split per concern, lib/ for pure ops) to keep this navigable. Likely 50+ files in the sealed folder. |
| R7 | Virtualization + DnD interaction is a known footgun (the dragged item can scroll out of the windowed range mid-drag). | GATE 2 plan reviews kanban-board-01's virtualization + DnD patterns (if any) or evaluates `@tanstack/react-virtual`'s known interactions. If unresolvable, virtualization auto-suspends during drag. |
| R8 | Bulk-edit callback shape is intentionally minimal (`onBulkEdit({ids})`) — consumers may want partial-snapshot of common fields. | Consumer can compute the snapshot themselves from `getItemById` on each id. Avoids baking a half-baked common-edit pre-form. |
| R9 | Search/filter interplay with virtualization: filtered-out rows can shrink the visible list below the virtualization threshold, defeating the purpose. | Threshold check uses TOTAL items, not visible items, to decide whether to virtualize. (Locked here.) |
| R10 | Touch DnD long-press conflicts with checkbox tap if user lingers. | 300ms long-press threshold; checkbox tap is instant. If user holds, the checkbox tap is canceled and drag starts. |
| R11 | **Touch DnD vs cross-procomp DnD architectural tension** (see Q8). Native HTML5 `dataTransfer` (used by todo-rich-card for cross-procomp) does not work on touch devices. Resolving requires either dual DnD systems running in parallel (highest complexity, full feature parity), a polyfill peer dep, or scoping out touch DnD. | Q8 picks the path at sign-off. GATE 2 plan must then verify the chosen path doesn't break either internal DnD or cross-procomp DnD on either input modality. Validation requires manual touch testing (DevTools touch emulation is incomplete). |

---

## 10. Definition of "done" for THIS document (stage gate)

- [x] All 24 locks in §7 understood and accepted by user.
- [x] All 8 Qs in §8 answered with explicit picks (Q1–Q7 = author's suggested defaults; Q8 = option (a) Dual DnD).
- [x] No scheduled v0.2 / v0.3 work — explicit single-version ship lock (L24).
- [x] No new top-level scope additions during plan-stage (loud deviations only — fold in §7 of THIS doc on next update).
- [x] User explicitly closed GATE 1 — 2026-05-20.

---

## Appendix A — Original concept brief (verbatim from chat)

> "create the todo tree version"
>
> "tree is totaly the seperate component and kanbann+rich todo item are a seperate set of components!"
>
> Lock answers to architecture Qs:
> 1. Slug confirmed (`todo-tree`)
> 2. "less information at the 3 detail on popup dialogue" → row paints minimal info; full detail via reused popup
> 3. Shared DnD payload — yes
>
> Tree-row composition: "name / shortendd description / check box / simple lable of target pperson" — refined to two-line layout: top = bold name + person; bottom = thin description.
>
> Sub-items collapsible.
>
> **Scope direction:** "no v2 just make every thing complete" — single feature-complete v0.1 ship; no scheduled v0.2 / v0.3 deferrals. Every capability that belongs in this component ships on day one.
>
> **Q8 lock (touch DnD):** "a" — Dual DnD system (@dnd-kit internal + HTML5 cross-procomp).
