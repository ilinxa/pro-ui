/**
 * Public + internal types for the task-card pro-component.
 *
 * v0.1.0 surface — fixed-schema task card with time-driven auto-color, dual
 * edit modes (popup default + inline-toggle), JSON I/O, clipboard, DnD payload,
 * granular events, permission predicates.
 *
 * Architectural lineage: mirrors card-tree's patterns (uncontrolled +
 * imperative handle, granular events, permission predicates, JSON I/O) without
 * sharing code. See docs/procomps/task-card-procomp/.
 */

import type { Dispatch, ReactNode } from "react";

/* ───────── ramp presets + clipboard MIME ───────── */

export const TASK_RAMPS = ["default", "muted", "vivid", "monochrome"] as const;
export type TaskColorRampPreset = (typeof TASK_RAMPS)[number];

/** MIME for clipboard + DnD payloads — lets us fast-path verified todo JSON. */
export const TASK_CLIPBOARD_MIME = "application/x-ilinxa-task+json" as const;

/* ───────── data shape ───────── */

export type TaskPerson = {
  id: string;
  name: string;
  avatar?: string;
};

export type TaskImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export type TaskLink = {
  url: string;
  label?: string;
  icon?: string;
};

export type TaskItem = {
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
  /**
   * Milliseconds; used only if expireAt is absent. NOTE: stored in ms, but the
   * popup editor displays + edits this in WHOLE MINUTES (rounded), so sub-minute
   * values are lossy on edit round-trips.
   */
  duration?: number;
  targetPerson?: TaskPerson;
  creatorPerson?: TaskPerson;
  images?: TaskImage[];
  links?: TaskLink[];
  /** Per-item override; skips the time engine for this node. Any CSS color string. */
  borderColor?: string;
  /** When true, edit + drag are blocked for this item. */
  locked?: boolean;
  /** Priority/urgency bucket key. Single-valued; consumer supplies display metadata via `priorityOptions`. */
  priority?: string;
  /** Label/tag keys (many-to-many). Consumer supplies display metadata via `labelOptions`. */
  labels?: string[];
  /** Infinite recursive nesting. */
  children?: TaskItem[];
};

/* ───────── color ramp ───────── */

export type TaskColorRamp =
  | TaskColorRampPreset
  | ((elapsed: number) => string);

/* ───────── status rendering ───────── */

/** Plan refinement (Q-P4): enables `<Select>` in edit modes + variant-colored badges. */
export type TaskStatusOption = {
  value: string;
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  /**
   * Semantic treatment of a card in this status (v0.3):
   *  - `active` (default): the time-driven border color applies; normal card.
   *  - `done`: gray border + a dimmed green overlay; the card auto-collapses.
   *  - `blocked`: gray border + a reddish overlay; the card auto-collapses.
   * Decouples the *status* signal from the time-driven *urgency* border.
   */
  tone?: "active" | "done" | "blocked";
  /** Emoji/glyph shown above the tag in the done/blocked overlay. */
  icon?: string;
};

/** Display metadata for a priority bucket; pair with `TaskItem.priority` (v0.3). */
export type TaskPriorityOption = {
  value: string;
  label: string;
  /** Any CSS color string — applied to border + text only (never a filled background). */
  color?: string;
};

/** Display metadata for a label/tag; pair with `TaskItem.labels` (v0.3). */
export type TaskLabelOption = {
  value: string;
  label: string;
  /** Any CSS color string — applied to border + text only (never a filled background). */
  color?: string;
};

/* ───────── editable-field union ─────────
 *
 * Field union for the GENERIC `onFieldEdited` event — limited to the scalar
 * fields the built-in editors actually edit. Excludes fields with dedicated
 * events:
 *   - borderColor → fires `onColorOverridden`
 *   - locked      → fires `onLockedToggled`
 *   - active      → ALSO fires `onActiveToggled` in addition to `onFieldEdited`
 *
 * Structural keys (id, children) are excluded entirely — those are tree
 * operations covered by onItemAdded / onItemRemoved / onItemMoved.
 *
 * `targetPerson` / `creatorPerson` / `images` / `links` are intentionally NOT
 * here: the schema carries them but no built-in editor edits them, so they are
 * render-only (a future `renderPersonEditor` slot would add them back).
 */
export type TaskEditableField =
  | "name"
  | "description"
  | "status"
  | "active"
  | "setAt"
  | "startAt"
  | "expireAt"
  | "duration";

/* ───────── permissions ───────── */

export type TaskPermissionRule = {
  edit?: boolean;
  remove?: boolean;
  addChildren?: boolean;
  drag?: boolean;
  toggleActive?: boolean;
  overrideColor?: boolean;
};

export type TaskPermissionReason =
  | "locked"
  | "by-item"
  | "by-level"
  | "default"
  | "predicate";

export type TaskPermissions = {
  default?: TaskPermissionRule;
  byLevel?: Record<number, TaskPermissionRule>;
  byItem?: Record<string, TaskPermissionRule>;
  /** Default true — child rules cascade from parent's effective rule. */
  inherit?: boolean;
};

/* ───────── event types ───────── */

export type TaskFieldEditedEvent = {
  itemId: string;
  key: TaskEditableField;
  oldValue: unknown;
  newValue: unknown;
};

export type TaskStatusChangedEvent = {
  itemId: string;
  oldStatus: string;
  newStatus: string;
};

export type TaskItemAddedEvent = {
  parentId: string;
  item: TaskItem;
};

export type TaskItemRemovedEvent = {
  itemId: string;
  removed: TaskItem;
  parentId: string;
};

export type TaskItemMovedEvent = {
  itemId: string;
  oldParentId: string;
  newParentId: string;
  oldIndex: number;
  newIndex: number;
};

export type TaskColorOverriddenEvent = {
  itemId: string;
  oldColor: string | undefined;
  newColor: string | undefined;
};

export type TaskActiveToggledEvent = {
  itemId: string;
  oldActive: boolean;
  newActive: boolean;
};

export type TaskLockedToggledEvent = {
  itemId: string;
  oldLocked: boolean;
  newLocked: boolean;
};

export type TaskCopyEvent = {
  itemId: string;
  payload: TaskItem;
};

export type TaskPasteEvent = {
  parentId: string;
  payload: TaskItem;
};

export type TaskEditRequestEvent = {
  itemId: string;
  mode: "popup" | "inline";
};

/* ───────── component props ───────── */

export type TaskCardProps = {
  /**
   * Initial tree for UNCONTROLLED mode (seeds once; later changes ignored).
   * Provide either `defaultValue` (uncontrolled) or `value` (controlled).
   */
  defaultValue?: TaskItem;
  /**
   * Controlled tree. When provided, `value` is the source of truth: the card
   * reconciles to it and `onChange` reports edits for you to echo back. Falls
   * back to `defaultValue` when omitted.
   */
  value?: TaskItem;

  // Auto-color
  colorRamp?: TaskColorRamp;
  colorRefreshIntervalMs?: number;
  /** Frozen clock for testing or SSR determinism. */
  now?: Date | (() => Date);

  // Edit modes
  editable?: boolean;
  showEditButton?: boolean;
  statusOptions?: TaskStatusOption[];
  /**
   * Render the status badge as a dropdown that changes the item's status
   * (default true). The dropdown only appears when `editable`, the item's
   * `edit` permission is granted, and `statusOptions` is non-empty; otherwise
   * the badge stays read-only. Set false where status is changed another way —
   * e.g. inside a kanban column, where moving the card between columns sets the
   * status.
   */
  statusEditable?: boolean;
  /** Display metadata for `TaskItem.priority`; enables the priority badge in the meta row. */
  priorityOptions?: TaskPriorityOption[];
  /** Display metadata for `TaskItem.labels`; chips fall back to the raw key when unmatched. */
  labelOptions?: TaskLabelOption[];

  // Permissions
  permissions?: TaskPermissions;
  canEditItem?: (id: string) => boolean;
  canRemoveItem?: (id: string) => boolean;
  canAddChildren?: (id: string) => boolean;
  canDragItem?: (id: string) => boolean;
  canToggleActive?: (id: string) => boolean;
  canOverrideColor?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TaskPermissionRule,
    itemId: string,
    reason: TaskPermissionReason,
  ) => void;

  // Events
  onChange?: (tree: TaskItem) => void;
  /** Fires before edit opens; return false to veto. */
  onEditRequest?: (event: TaskEditRequestEvent) => boolean | void;
  onFieldEdited?: (event: TaskFieldEditedEvent) => void;
  onStatusChanged?: (event: TaskStatusChangedEvent) => void;
  onItemAdded?: (event: TaskItemAddedEvent) => void;
  onItemRemoved?: (event: TaskItemRemovedEvent) => void;
  onItemMoved?: (event: TaskItemMovedEvent) => void;
  onColorOverridden?: (event: TaskColorOverriddenEvent) => void;
  onActiveToggled?: (event: TaskActiveToggledEvent) => void;
  onLockedToggled?: (event: TaskLockedToggledEvent) => void;
  onCopy?: (event: TaskCopyEvent) => void;
  onPaste?: (event: TaskPasteEvent) => void;

  // Container
  className?: string;
  "aria-label"?: string;
};

/* ───────── imperative ref handle ───────── */

export type TaskCardHandle = {
  /** Canonical pretty-printed JSON string. */
  getValue(): string;
  /** Object form of the current tree. */
  getTree(): TaskItem;
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
export type TaskNode = {
  item: TaskItem;
  /** 1 = root. */
  level: number;
  parentId: string | null;
  /** Sibling position (0-based). */
  index: number;
  childNodes: TaskNode[];
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
  reason: TaskPermissionReason;
};

export type State = {
  root: TaskNode;
  edit: EditState;
  focusedId: string | null;
  dirty: boolean;
  /** UI-only collapse state — not part of the TaskItem schema. */
  collapsedIds: ReadonlySet<string>;
};

export type Action =
  | { type: "replace-tree"; tree: TaskItem }
  | { type: "sync-tree"; tree: TaskItem }
  | { type: "open-edit"; itemId: string; mode: "popup" | "inline" }
  | { type: "close-edit" }
  | {
      type: "edit-field";
      itemId: string;
      key: TaskEditableField;
      value: unknown;
    }
  | { type: "add-child"; parentId: string; item: TaskItem; index?: number }
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

/** Internal — constructed in task-card.tsx, consumed by parts/*. */
export type TaskCardContextValue = {
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
  resolvePermissions: (node: TaskNode) => ResolvedPermissions;

  // Display config
  statusOptions?: TaskStatusOption[];
  /** Whether the status badge becomes a status-change dropdown (B3). */
  statusEditable: boolean;
  priorityOptions?: TaskPriorityOption[];
  labelOptions?: TaskLabelOption[];
  editable: boolean;
  showEditButton: boolean;

  /** Closure that dispatches AND fires the matching on* callback. */
  fireEvent: <K extends keyof TaskEventMap>(name: K, event: TaskEventMap[K]) => void;

  /**
   * Consult `onEditRequest` (veto) BEFORE opening the editor, then dispatch
   * `open-edit` only if not vetoed. The single edit entry point shared by the
   * header, keyboard, and imperative handle — prevents the flash-open-then-close
   * a retroactive veto caused.
   */
  requestEdit: (itemId: string, mode: "popup" | "inline") => void;

  /** For permission predicates that can't be cleanly closed-over. */
  reportPermissionDenied: (
    action: keyof TaskPermissionRule,
    itemId: string,
    reason: TaskPermissionReason,
  ) => void;
};

/** Event-name → event-payload map; powers fireEvent's typed dispatch. */
export type TaskEventMap = {
  change: TaskItem;
  editRequest: TaskEditRequestEvent;
  fieldEdited: TaskFieldEditedEvent;
  statusChanged: TaskStatusChangedEvent;
  itemAdded: TaskItemAddedEvent;
  itemRemoved: TaskItemRemovedEvent;
  itemMoved: TaskItemMovedEvent;
  colorOverridden: TaskColorOverriddenEvent;
  activeToggled: TaskActiveToggledEvent;
  lockedToggled: TaskLockedToggledEvent;
  copy: TaskCopyEvent;
  paste: TaskPasteEvent;
};

/** Slot prop for the (private) error-card fallback. */
export type TaskErrorCardProps = {
  message: string;
  children?: ReactNode;
};
