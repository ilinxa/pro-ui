/**
 * Public + internal types for the todo-rich-card pro-component.
 *
 * v0.1.0 surface — fixed-schema task card with time-driven auto-color, dual
 * edit modes (popup default + inline-toggle), JSON I/O, clipboard, DnD payload,
 * granular events, permission predicates.
 *
 * Architectural lineage: mirrors rich-card's patterns (uncontrolled +
 * imperative handle, granular events, permission predicates, JSON I/O) without
 * sharing code. See docs/procomps/todo-rich-card-procomp/.
 */

import type { Dispatch, ReactNode } from "react";

/* ───────── ramp presets + clipboard MIME ───────── */

export const TODO_RAMPS = ["default", "muted", "vivid", "monochrome"] as const;
export type TodoColorRampPreset = (typeof TODO_RAMPS)[number];

/** MIME for clipboard + DnD payloads — lets us fast-path verified todo JSON. */
export const TODO_CLIPBOARD_MIME = "application/x-ilinxa-todo+json" as const;

/* ───────── data shape ───────── */

export type TodoPerson = {
  id: string;
  name: string;
  avatar?: string;
};

export type TodoImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export type TodoLink = {
  url: string;
  label?: string;
  icon?: string;
};

export type TodoItem = {
  id: string;
  name: string;
  description?: string;
  status: string;
  active: boolean;
  /** ISO-8601 timestamp; required. */
  setAt: string;
  /** ISO-8601; defaults to setAt at render time if absent. */
  startAt?: string;
  /** ISO-8601; wins over duration when both are set. */
  expireAt?: string;
  /** Milliseconds; used only if expireAt is absent. */
  duration?: number;
  targetPerson?: TodoPerson;
  creatorPerson?: TodoPerson;
  images?: TodoImage[];
  links?: TodoLink[];
  /** Per-item override; skips the time engine for this node. Any CSS color string. */
  borderColor?: string;
  /** When true, edit + drag are blocked for this item. */
  locked?: boolean;
  /** Infinite recursive nesting. */
  children?: TodoItem[];
};

/* ───────── color ramp ───────── */

export type TodoColorRamp =
  | TodoColorRampPreset
  | ((elapsed: number) => string);

/* ───────── status rendering ───────── */

/** Plan refinement (Q-P4): enables `<Select>` in edit modes + variant-colored badges. */
export type TodoStatusOption = {
  value: string;
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
};

/* ───────── editable-field union ─────────
 *
 * Field union for the GENERIC `onFieldEdited` event. Excludes fields with
 * dedicated events:
 *   - borderColor → fires `onColorOverridden`
 *   - locked      → fires `onLockedToggled`
 *   - active      → ALSO fires `onActiveToggled` in addition to `onFieldEdited`
 *
 * Structural keys (id, children) are excluded entirely — those are tree
 * operations covered by onItemAdded / onItemRemoved / onItemMoved.
 */
export type TodoEditableField =
  | "name"
  | "description"
  | "status"
  | "active"
  | "setAt"
  | "startAt"
  | "expireAt"
  | "duration"
  | "targetPerson"
  | "creatorPerson"
  | "images"
  | "links";

/* ───────── permissions ───────── */

export type TodoPermissionRule = {
  edit?: boolean;
  remove?: boolean;
  addChildren?: boolean;
  drag?: boolean;
  toggleActive?: boolean;
  overrideColor?: boolean;
};

export type TodoPermissionReason =
  | "locked"
  | "by-item"
  | "by-level"
  | "default"
  | "predicate";

export type TodoPermissions = {
  default?: TodoPermissionRule;
  byLevel?: Record<number, TodoPermissionRule>;
  byItem?: Record<string, TodoPermissionRule>;
  /** Default true — child rules cascade from parent's effective rule. */
  inherit?: boolean;
};

/* ───────── event types ───────── */

export type TodoFieldEditedEvent = {
  itemId: string;
  key: TodoEditableField;
  oldValue: unknown;
  newValue: unknown;
};

export type TodoStatusChangedEvent = {
  itemId: string;
  oldStatus: string;
  newStatus: string;
};

export type TodoItemAddedEvent = {
  parentId: string;
  item: TodoItem;
};

export type TodoItemRemovedEvent = {
  itemId: string;
  removed: TodoItem;
  parentId: string;
};

export type TodoItemMovedEvent = {
  itemId: string;
  oldParentId: string;
  newParentId: string;
  oldIndex: number;
  newIndex: number;
};

export type TodoColorOverriddenEvent = {
  itemId: string;
  oldColor: string | undefined;
  newColor: string | undefined;
};

export type TodoActiveToggledEvent = {
  itemId: string;
  oldActive: boolean;
  newActive: boolean;
};

export type TodoLockedToggledEvent = {
  itemId: string;
  oldLocked: boolean;
  newLocked: boolean;
};

export type TodoCopyEvent = {
  itemId: string;
  payload: TodoItem;
};

export type TodoPasteEvent = {
  parentId: string;
  payload: TodoItem;
};

export type TodoEditRequestEvent = {
  itemId: string;
  mode: "popup" | "inline";
};

/* ───────── component props ───────── */

export type TodoRichCardProps = {
  defaultValue: TodoItem;

  // Auto-color
  colorRamp?: TodoColorRamp;
  colorRefreshIntervalMs?: number;
  /** Frozen clock for testing or SSR determinism. */
  now?: Date | (() => Date);

  // Edit modes
  editable?: boolean;
  showEditButton?: boolean;
  statusOptions?: TodoStatusOption[];

  // Permissions
  permissions?: TodoPermissions;
  canEditItem?: (id: string) => boolean;
  canRemoveItem?: (id: string) => boolean;
  canAddChildren?: (id: string) => boolean;
  canDragItem?: (id: string) => boolean;
  canToggleActive?: (id: string) => boolean;
  canOverrideColor?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;

  // Events
  onChange?: (tree: TodoItem) => void;
  /** Fires before edit opens; return false to veto. */
  onEditRequest?: (event: TodoEditRequestEvent) => boolean | void;
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onColorOverridden?: (event: TodoColorOverriddenEvent) => void;
  onActiveToggled?: (event: TodoActiveToggledEvent) => void;
  onLockedToggled?: (event: TodoLockedToggledEvent) => void;
  onCopy?: (event: TodoCopyEvent) => void;
  onPaste?: (event: TodoPasteEvent) => void;

  // Container
  className?: string;
  "aria-label"?: string;
};

/* ───────── imperative ref handle ───────── */

export type TodoRichCardHandle = {
  /** Canonical pretty-printed JSON string. */
  getValue(): string;
  /** Object form of the current tree. */
  getTree(): TodoItem;
  isDirty(): boolean;
  markClean(): void;
  focusItem(id: string): void;
  /** Copies item (or root if id omitted) to clipboard with our MIME + text/plain. */
  copy(itemId?: string): Promise<void>;
  /** Pastes from clipboard as child of parent (or root if id omitted). */
  paste(parentId?: string): Promise<void>;
  setBorderColor(itemId: string, color: string | null): void;
  toggleActive(itemId: string): void;
  setLocked(itemId: string, locked: boolean): void;
  openEdit(itemId: string, mode?: "popup" | "inline"): void;
  closeEdit(): void;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Internal types — NOT exported from index.ts. Kept here so the reducer +
 * context implementation can share them.
 * ───────────────────────────────────────────────────────────────────────── */

/** Normalized internal tree with derived data. */
export type TodoNode = {
  item: TodoItem;
  /** 1 = root. */
  level: number;
  parentId: string | null;
  /** Sibling position (0-based). */
  index: number;
  childNodes: TodoNode[];
};

export type EditState =
  | { kind: "view" }
  | { kind: "popup"; itemId: string }
  | { kind: "inline"; itemId: string };

export type ResolvedPermissions = {
  edit: boolean;
  remove: boolean;
  addChildren: boolean;
  drag: boolean;
  toggleActive: boolean;
  overrideColor: boolean;
  reason: TodoPermissionReason;
};

export type State = {
  root: TodoNode;
  edit: EditState;
  focusedId: string | null;
  dirty: boolean;
  /** UI-only collapse state — not part of the TodoItem schema. */
  collapsedIds: ReadonlySet<string>;
};

export type Action =
  | { type: "replace-tree"; tree: TodoItem }
  | { type: "open-edit"; itemId: string; mode: "popup" | "inline" }
  | { type: "close-edit" }
  | {
      type: "edit-field";
      itemId: string;
      key: TodoEditableField;
      value: unknown;
    }
  | { type: "add-child"; parentId: string; item: TodoItem; index?: number }
  | { type: "remove-item"; itemId: string }
  | {
      type: "move-item";
      itemId: string;
      newParentId: string;
      newIndex: number;
    }
  | { type: "set-border-color"; itemId: string; color: string | null }
  | { type: "toggle-active"; itemId: string }
  | { type: "set-locked"; itemId: string; locked: boolean }
  | { type: "set-focus"; itemId: string | null }
  | { type: "toggle-collapse"; itemId: string }
  | { type: "mark-clean" };

/* ───────── context value ───────── */

/** Internal — constructed in todo-rich-card.tsx, consumed by parts/*. */
export type TodoCardContextValue = {
  // Time + color
  now: () => Date;
  /** Bumped by useColorEngine on each interval; included in context memo dep. */
  tick: number;
  ramp: (elapsed: number) => string;

  // State machine
  dispatch: Dispatch<Action>;
  editState: EditState;
  focusedId: string | null;
  dirty: boolean;
  /** Check whether a given item is collapsed (UI-only state). */
  isCollapsed: (itemId: string) => boolean;

  /** Memoized closure over props.permissions + per-action predicates. */
  resolvePermissions: (node: TodoNode) => ResolvedPermissions;

  // Display config
  statusOptions?: TodoStatusOption[];
  editable: boolean;
  showEditButton: boolean;

  /** Closure that dispatches AND fires the matching on* callback. */
  fireEvent: <K extends keyof TodoEventMap>(name: K, event: TodoEventMap[K]) => void;

  /** For permission predicates that can't be cleanly closed-over. */
  reportPermissionDenied: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;
};

/** Event-name → event-payload map; powers fireEvent's typed dispatch. */
export type TodoEventMap = {
  change: TodoItem;
  editRequest: TodoEditRequestEvent;
  fieldEdited: TodoFieldEditedEvent;
  statusChanged: TodoStatusChangedEvent;
  itemAdded: TodoItemAddedEvent;
  itemRemoved: TodoItemRemovedEvent;
  itemMoved: TodoItemMovedEvent;
  colorOverridden: TodoColorOverriddenEvent;
  activeToggled: TodoActiveToggledEvent;
  lockedToggled: TodoLockedToggledEvent;
  copy: TodoCopyEvent;
  paste: TodoPasteEvent;
};

/** Slot prop for the (private) error-card fallback. */
export type TodoErrorCardProps = {
  message: string;
  children?: ReactNode;
};
