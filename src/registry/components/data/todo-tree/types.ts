import type { ReactNode, MouseEvent } from "react";
import type { TodoItem, TodoStatusOption, TodoPermissions } from "../todo-rich-card/types";

/**
 * Tree-position pointer used by onItemMoved.from / .to.
 * parentId === null indicates top-level (sibling of root items).
 */
export interface TreeLocation {
  parentId: string | null;
  index: number;
}

/**
 * Mutation reason tag — fires with every onChange. One code per
 * public mutation pathway so consumers can route post-change effects.
 */
export type TodoTreeChangeReason =
  | "reorder"
  | "reparent"
  | "toggle-active"
  | "imperative-set"
  | "drop-from-external"
  | "add-item"
  | "remove-item"
  | "add-child"
  | "bulk-toggle-active"
  | "bulk-remove";

/** Sort specification. */
export type TodoTreeSort =
  | { kind: "name" | "setAt" | "expireAt" | "status"; direction: "asc" | "desc" }
  | { kind: "custom"; compare: (a: TodoItem, b: TodoItem) => number };

/** Filter specification (combined with the search query). */
export interface TodoTreeFilter {
  statuses?: ReadonlyArray<string>;
  personIds?: ReadonlyArray<string>;
  active?: "all" | "active" | "inactive";
}

/** Permission action codes (tree-specific; distinct from todo-rich-card's set). */
export type TodoTreePermissionAction =
  | "edit"
  | "toggleActive"
  | "drag"
  | "dropAsSibling"
  | "dropIntoChildren"
  | "remove";

/** Denial reasons fired with onPermissionDenied. */
export type TodoTreePermissionDenialReason =
  | "denied-by-rule"
  | "denied-by-readOnly"
  | "denied-by-lock"
  | "circular-drop";

/**
 * Reducer action union. Private engine; surfaced via the `dispatch`
 * escape hatch on TodoTreeStateValue for advanced consumers.
 */
export type TodoTreeAction =
  | { type: "SET_ITEMS"; items: TodoItem[]; reason: TodoTreeChangeReason }
  | {
      type: "ADD_ITEM";
      item: TodoItem;
      parentId: string | null;
      index?: number;
      via: "imperative" | "drop-from-external";
    }
  | { type: "REMOVE_ITEM"; id: string; via: "imperative" | "keyboard" | "bulk" }
  | { type: "REMOVE_ITEMS"; ids: ReadonlyArray<string> }
  | { type: "ADD_CHILD"; parentId: string; item: TodoItem; index?: number }
  | {
      type: "MOVE_ITEM";
      itemId: string;
      to: TreeLocation;
      reason: "reorder" | "reparent";
    }
  | { type: "TOGGLE_ACTIVE"; id: string; nextActive: boolean }
  | {
      type: "TOGGLE_ACTIVE_BULK";
      ids: ReadonlyArray<string>;
      nextActive: boolean;
    }
  | { type: "TOGGLE_COLLAPSE"; id: string }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" }
  | { type: "SET_COLLAPSED"; ids: ReadonlyArray<string> }
  | {
      type: "SELECT_ONE";
      id: string;
      mode: "replace" | "toggle" | "range";
    }
  | { type: "SELECT_ALL" }
  | {
      type: "SELECT_REPLACE";
      ids: ReadonlyArray<string>;
      anchorId?: string | null;
    }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_QUERY"; query: string }
  | { type: "SET_SORT"; sort: TodoTreeSort }
  | { type: "SET_FILTER"; filter: TodoTreeFilter }
  | { type: "CLEAR_FILTERS" };

/* ---------------------------------- Event arg shapes ---------------------------------- */

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

/* ---------------------------------- Visible item snapshot ---------------------------------- */

/**
 * Renderer-ready flat row produced by the filter → sort → flatten pipeline.
 * level + parentId + index are needed for indent, ARIA, and reparent target
 * detection without re-walking the tree per render.
 */
export interface TodoTreeVisibleRow {
  item: TodoItem;
  level: number;
  parentId: string | null;
  index: number;
  /**
   * Set by the filter pipeline in `filterMode: "fade"` when this row's item
   * doesn't match the active query/filter. Renderers apply reduced opacity
   * while keeping interactive affordances reachable. Absent in "hide" mode
   * because non-matching rows aren't emitted at all.
   */
  dimmed?: boolean;
}

/* ---------------------------------- Imperative handle ---------------------------------- */

/**
 * The full imperative handle exposed via ref. 26 methods covering tree
 * state, item ops, single + bulk active-toggle + remove, focus, collapse,
 * selection, and query/sort/filter.
 */
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

/**
 * Headless state value returned by useTodoTreeState. Superset of
 * TodoTreeHandle plus the live state values + reducer escape hatch.
 * Consumers can pass this to <TodoTree state={state} /> to host their
 * own toolbar / row layout / virtualization.
 */
export interface TodoTreeStateValue extends TodoTreeHandle {
  items: TodoItem[];
  visibleItems: ReadonlyArray<TodoTreeVisibleRow>;
  collapsedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  dispatch: (action: TodoTreeAction) => void;
  /**
   * Click handler that owns selection-mode resolution (plain / cmd / shift),
   * range resolution over `visibleItems`, and `onItemClick` firing. The
   * default `<TodoTreeRow>` wires it; custom rows / slot consumers call it
   * from their own row click target.
   */
  handleRowClick: (item: TodoItem, level: number, event: MouseEvent) => void;
}

/* ---------------------------------- Slot render-prop args ---------------------------------- */

export interface TodoTreeRowRenderArgs {
  item: TodoItem;
  level: number;
  isSelected: boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
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

/* ---------------------------------- Public props ---------------------------------- */

export interface TodoTreeProps {
  // Data
  defaultValue?: TodoItem[];
  value?: TodoItem[];
  onChange?: (args: TodoTreeChangeArgs) => void;
  /** Lifted state from useTodoTreeState(); supersedes value/defaultValue when provided. */
  state?: TodoTreeStateValue;

  // Status enum
  statusOptions?: TodoStatusOption[];

  // Permissions
  permissions?: TodoPermissions;
  onPermissionDenied?: (args: TodoTreePermissionDeniedEvent) => void;

  // Behavior
  readOnly?: boolean;
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  /** Pixels per nesting level (default 20). */
  indentSize?: number;
  /** Default "fade" (non-matching rows shown dimmed); "hide" omits non-matching + non-ancestor rows. */
  filterMode?: "fade" | "hide";
  /** Default "dot"; "strip" renders a left-edge color strip; "none" hides the indicator. */
  statusIndicator?: "dot" | "strip" | "none";
  /** Default auto-enable when total tree size ≥ 200 rows. */
  virtualize?: boolean | { threshold?: number };
  /** Default "default" mounts the built-in toolbar; "none" hides; ReactNode replaces. */
  toolbar?: "default" | "none" | ReactNode;
  /**
   * "internal" (default) mounts a <DndContext> wrapping the tree.
   * "external" skips internal mounting — use when the consumer already
   * provides a <DndContext> higher up (e.g., nested inside kanban-board-01).
   * Note: when external, the consumer is responsible for matching the
   * MouseSensor (distance:5) + TouchSensor (delay:300) sensor config or
   * accepting whatever activation rules their outer context provides.
   */
  dndContext?: "internal" | "external";

  // Slot props (priority rule: slot wins over prop variant)
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
  onBulkToggleActive?: (args: {
    ids: ReadonlyArray<string>;
    nextActive: boolean;
  }) => void;
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
